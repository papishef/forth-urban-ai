import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./login-page";
import { getPendingHomeReadinessQuiz, savePendingHomeReadinessQuiz } from "../quiz/pending-home-readiness";
import type { HomeReadinessAnswers } from "@forth-urban/validation";

const mockLogin = vi.fn();
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
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock("../quiz/quiz-api", () => ({
  useSubmitHomeReadinessQuiz: () => ({ mutateAsync: mockSubmitPendingQuiz }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
    mockSubmitPendingQuiz.mockReset();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("shows validation errors when submitted empty", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("submits valid credentials and navigates to the dashboard", async () => {
    mockLogin.mockResolvedValue(mockUser);
    renderPage();

    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({ email: "jane@example.com", password: "supersecret" }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true }));
  });

  it("resumes a pending readiness result after login", async () => {
    savePendingHomeReadinessQuiz(pendingAnswers);
    mockLogin.mockResolvedValue(mockUser);
    mockSubmitPendingQuiz.mockResolvedValue({ score: 72 });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={["/login?next=%2Fquiz%2Fhome-readiness%2Fresult"]}>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(mockSubmitPendingQuiz).toHaveBeenCalledWith(pendingAnswers));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/quiz/home-readiness/result", {
      replace: true,
      state: { score: 72 },
    }));
    expect(getPendingHomeReadinessQuiz()).toBeNull();
  });

  it("shows a server error message when login fails", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid email or password"));
    renderPage();

    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("offers email confirmation when the account has not been verified", async () => {
    mockLogin.mockRejectedValue(new Error("Please confirm your email before logging in"));
    renderPage();

    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByRole("link", { name: /resend confirmation email/i })).toHaveAttribute(
      "href",
      "/verify-email?email=jane%40example.com",
    );
  });
});
