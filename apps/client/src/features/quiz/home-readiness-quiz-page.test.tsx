import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HomeReadinessQuizPage } from "./home-readiness-quiz-page";

const mockNavigate = vi.fn();
const mockStartMutate = vi.fn();
const mockSubmitMutateAsync = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("./quiz-api", () => ({
  useStartHomeReadinessQuiz: () => ({ mutate: mockStartMutate }),
  useSubmitHomeReadinessQuiz: () => ({ mutateAsync: mockSubmitMutateAsync, isPending: false }),
}));

// framer-motion's AnimatePresence/motion.div rely on real animation-frame
// timing (mode="wait" exit-then-enter) that doesn't resolve deterministically
// under jsdom, which leaves the previous step's content visible in tests.
// Render children directly, stripping motion-only props.
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...rest
    }: React.ComponentPropsWithoutRef<"div"> & Record<string, unknown>) => <div {...rest}>{children}</div>,
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <HomeReadinessQuizPage />
    </MemoryRouter>,
  );
}

async function selectRadio(label: string | RegExp) {
  await userEvent.click(screen.getByRole("radio", { name: label }));
}

describe("HomeReadinessQuizPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockStartMutate.mockReset();
    mockSubmitMutateAsync.mockReset();
  });

  it("starts the quiz on mount", () => {
    renderPage();
    expect(mockStartMutate).toHaveBeenCalled();
  });

  it("blocks advancing past a step until it is answered", async () => {
    renderPage();
    expect(screen.getByText(/step 1 of 9/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText(/step 1 of 9/i)).toBeInTheDocument();
  });

  it("walks through every step and submits the answers", async () => {
    mockSubmitMutateAsync.mockResolvedValue({ score: 72 });
    renderPage();

    await selectRadio(/investment/i);
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByText(/step 2 of 9/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/minimum/i), "1000000");
    await userEvent.type(screen.getByLabelText(/maximum/i), "5000000");
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByText(/step 3 of 9/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/monthly income/i), "300000");
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByText(/step 4 of 9/i)).toBeInTheDocument();
    await selectRadio(/one-time payment/i);
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByText(/step 5 of 9/i)).toBeInTheDocument();
    await selectRadio(/right now/i);
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByText(/step 6 of 9/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/area you're considering/i), "Kuje");
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByText(/step 7 of 9/i)).toBeInTheDocument();
    await selectRadio(/family-friendly/i);
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByText(/step 8 of 9/i)).toBeInTheDocument();
    await selectRadio(/affordability/i);
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findByText(/step 9 of 9/i)).toBeInTheDocument();
    await selectRadio(/physical site inspection/i);
    await userEvent.click(screen.getByRole("button", { name: /see my result/i }));

    await screen.findByText(/step 9 of 9/i);
    expect(mockSubmitMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        buyerGoal: "investment",
        budgetRange: { min: 1_000_000, max: 5_000_000 },
        monthlyIncome: 300_000,
        paymentStyle: "oneTime",
        timeline: "now",
        preferredArea: "Kuje",
        lifestylePreference: "familyFriendly",
        biggestFear: "affordability",
        inspectionPreference: "physical",
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/quiz/home-readiness/result", { state: { score: 72 } });
  });
});
