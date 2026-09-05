import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegisterPage } from "./register-page";
import { getPendingHomeReadinessQuiz, savePendingHomeReadinessQuiz } from "../quiz/pending-home-readiness";
import type { HomeReadinessAnswers } from "@forth-urban/validation";

const mockRegister = vi.fn();
const mockNavigate = vi.fn();
const mockSubmitPendingQuiz = vi.fn();
const pendingAnswers: HomeReadinessAnswers = {
  buyerGoal: "investment",
  budgetRange: { min: 1_000_000, max: 5_000_000 },
  monthlyIncome: 300_000,
  paymentStyle: "oneTime",
  timeline: "now",
  preferredArea: "Kuje",
  lifestylePreference: "familyFriendly",
  biggestFear: "affordability",
  inspectionPreference: "physical",
};
const mockUser = { id: "user-1", role: "user" };

vi.mock("../../lib/auth-context", () => ({
  useAuth: () => ({ register: mockRegister }),
}));

vi.mock("../quiz/quiz-api", () => ({
  useSubmitHomeReadinessQuiz: () => ({ mutateAsync: mockSubmitPendingQuiz }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage(initialEntry = "/register") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
    mockSubmitPendingQuiz.mockReset();
    sessionStorage.clear();
  });

  it("shows validation errors when submitted empty", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/last name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("submits valid details and navigates to the dashboard", async () => {
    mockRegister.mockResolvedValue(mockUser);
    renderPage();

    await userEvent.type(screen.getByLabelText(/first name/i), "Jane");
    await userEvent.type(screen.getByLabelText(/last name/i), "Doe");
    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "supersecret",
      }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true }));
  });

  it("submits the pending readiness quiz after registration", async () => {
    savePendingHomeReadinessQuiz(pendingAnswers);
    mockRegister.mockResolvedValue(mockUser);
    mockSubmitPendingQuiz.mockResolvedValue({ score: 72 });
    renderPage("/register?next=%2Fquiz%2Fhome-readiness%2Fresult");

    await userEvent.type(screen.getByLabelText(/first name/i), "Jane");
    await userEvent.type(screen.getByLabelText(/last name/i), "Doe");
    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(mockSubmitPendingQuiz).toHaveBeenCalledWith(pendingAnswers));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/quiz/home-readiness/result", {
        replace: true,
        state: { score: 72 },
      }),
    );
    expect(getPendingHomeReadinessQuiz()).toBeNull();
  });

  it("keeps the account and offers a retry when saving the readiness result fails", async () => {
    savePendingHomeReadinessQuiz(pendingAnswers);
    mockRegister.mockResolvedValue(mockUser);
    mockSubmitPendingQuiz.mockRejectedValueOnce(new Error("Temporary quiz service error"));
    renderPage("/register?next=%2Fquiz%2Fhome-readiness%2Fresult");

    await userEvent.type(screen.getByLabelText(/first name/i), "Jane");
    await userEvent.type(screen.getByLabelText(/last name/i), "Doe");
    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/temporary quiz service error/i)).toBeInTheDocument();
    expect(mockRegister).toHaveBeenCalledTimes(1);
    mockSubmitPendingQuiz.mockResolvedValue({ score: 72 });
    await userEvent.click(screen.getByRole("button", { name: /retry saving my result/i }));

    await waitFor(() => expect(mockSubmitPendingQuiz).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/quiz/home-readiness/result", {
      replace: true,
      state: { score: 72 },
    }));
  });

  it("shows a server error message when registration fails", async () => {
    mockRegister.mockRejectedValue(new Error("Email already registered"));
    renderPage();

    await userEvent.type(screen.getByLabelText(/first name/i), "Jane");
    await userEvent.type(screen.getByLabelText(/last name/i), "Doe");
    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
