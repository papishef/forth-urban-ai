import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VerifyEmailPage } from "./verify-email-page";
import { markPendingHomeReadinessAuthHandoff, savePendingHomeReadinessQuiz } from "../quiz/pending-home-readiness";
import type { HomeReadinessAnswers } from "@forth-urban/validation";

const mockVerifyEmail = vi.fn();
const mockResendEmailVerification = vi.fn();
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

vi.mock("../../lib/auth-context", () => ({
  useAuth: () => ({
    verifyEmail: mockVerifyEmail,
    resendEmailVerification: mockResendEmailVerification,
  }),
}));

vi.mock("../quiz/quiz-api", () => ({
  useSubmitHomeReadinessQuiz: () => ({ mutateAsync: mockSubmitPendingQuiz }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage(initialEntry = "/verify-email?email=jane%40example.com&token=verification-token") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <VerifyEmailPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    mockVerifyEmail.mockReset();
    mockResendEmailVerification.mockReset();
    mockNavigate.mockReset();
    mockSubmitPendingQuiz.mockReset();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("verifies the email and completes the normal auth destination", async () => {
    mockVerifyEmail.mockResolvedValue({ id: "user-1", role: "user" });
    renderPage("/verify-email?email=jane%40example.com&token=verification-token&next=%2Fdashboard");

    await userEvent.click(screen.getByRole("button", { name: /confirm email/i }));

    await waitFor(() =>
      expect(mockVerifyEmail).toHaveBeenCalledWith({ email: "jane@example.com", token: "verification-token" }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true }));
  });

  it("resends a confirmation email without revealing account existence", async () => {
    mockResendEmailVerification.mockResolvedValue(undefined);
    renderPage("/verify-email?email=jane%40example.com");

    await userEvent.click(screen.getByRole("button", { name: /resend confirmation email/i }));

    await waitFor(() => expect(mockResendEmailVerification).toHaveBeenCalledWith("jane@example.com"));
    expect(await screen.findByRole("status")).toHaveTextContent(/if an unverified account exists/i);
  });

  it("submits the preserved quiz after confirmation in a new tab", async () => {
    savePendingHomeReadinessQuiz(pendingAnswers);
    markPendingHomeReadinessAuthHandoff();
    sessionStorage.clear();
    mockVerifyEmail.mockResolvedValue({ id: "user-1", role: "user" });
    mockSubmitPendingQuiz.mockResolvedValue({ score: 72 });
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /confirm email/i }));

    await waitFor(() => expect(mockSubmitPendingQuiz).toHaveBeenCalledWith(pendingAnswers));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/quiz/home-readiness/result", {
        replace: true,
        state: { score: 72 },
      }),
    );
  });
});
