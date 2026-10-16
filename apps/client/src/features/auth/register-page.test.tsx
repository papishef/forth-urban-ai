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
const mockEnsureQuizSession = vi.fn();
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
const mockPendingRegistration = { email: "jane@example.com", requiresEmailVerification: true as const };

vi.mock("../../lib/auth-context", () => ({
  useAuth: () => ({ register: mockRegister }),
}));

vi.mock("../quiz/quiz-api", () => ({
  useSubmitHomeReadinessQuiz: () => ({ mutateAsync: mockSubmitPendingQuiz }),
  ensureRegistrationQuizSession: () => mockEnsureQuizSession(),
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
    mockEnsureQuizSession.mockReset();
    mockEnsureQuizSession.mockResolvedValue("quiz-session-token");
    sessionStorage.clear();
    localStorage.clear();
    savePendingHomeReadinessQuiz(pendingAnswers);
  });

  it("requires the readiness quiz before showing the registration form", async () => {
    localStorage.clear();
    sessionStorage.clear();
    renderPage("/register?error=quiz_required");

    expect(screen.queryByRole("button", { name: /create account/i })).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/complete the home-readiness quiz/i);
    await userEvent.click(screen.getByRole("button", { name: /take the home-readiness quiz/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/quiz/home-readiness");
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("does not submit when the quiz session cannot be issued", async () => {
    mockEnsureQuizSession.mockResolvedValue(null);
    renderPage();

    await userEvent.type(screen.getByLabelText(/first name/i), "Jane");
    await userEvent.type(screen.getByLabelText(/last name/i), "Doe");
    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/could not verify your quiz session/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
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
    mockRegister.mockResolvedValue(mockPendingRegistration);
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
        website: "",
        homeReadiness: pendingAnswers,
        quizSessionToken: "quiz-session-token",
      }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/verify-email?email=jane%40example.com", { replace: true }));
  });

  it("preserves the pending readiness destination until email verification", async () => {
    mockRegister.mockResolvedValue(mockPendingRegistration);
    renderPage("/register?next=%2Fquiz%2Fhome-readiness%2Fresult");

    await userEvent.type(screen.getByLabelText(/first name/i), "Jane");
    await userEvent.type(screen.getByLabelText(/last name/i), "Doe");
    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        "/verify-email?email=jane%40example.com&next=%2Fquiz%2Fhome-readiness%2Fresult",
        { replace: true },
      ),
    );
    expect(mockSubmitPendingQuiz).not.toHaveBeenCalled();
    expect(getPendingHomeReadinessQuiz()).toEqual(pendingAnswers);
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
