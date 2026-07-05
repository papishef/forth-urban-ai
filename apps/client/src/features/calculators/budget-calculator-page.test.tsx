import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { BudgetCalculatorResultDTO } from "@forth-urban/shared-types";
import { BudgetCalculatorPage } from "./budget-calculator-page";

const mockMutateAsync = vi.fn();
const mockNavigate = vi.fn();
let mockMutationState: { data: BudgetCalculatorResultDTO | undefined; isPending: boolean; isError: boolean } = {
  data: undefined,
  isPending: false,
  isError: false,
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../properties/properties-api", () => ({
  usePropertyDetail: () => ({
    data: { property: { name: "Sunset Gardens", pricePerPlot: 5_000_000 } },
  }),
}));

vi.mock("./calculators-api", () => ({
  useBudgetCalculator: () => ({
    mutateAsync: mockMutateAsync,
    ...mockMutationState,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/calculators/budget/prop-1"]}>
      <Routes>
        <Route path="/calculators/budget/:propertyId" element={<BudgetCalculatorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BudgetCalculatorPage", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockNavigate.mockReset();
    mockMutationState = { data: undefined, isPending: false, isError: false };
  });

  it("shows a validation error for an invalid installment duration", async () => {
    renderPage();

    const durationInput = screen.getByLabelText(/installment duration/i);
    // jsdom's type="number" inputs don't reliably support keyboard
    // select-all + retype for clearing existing text, so set the value
    // directly to force an out-of-range (non-positive) value.
    fireEvent.change(durationInput, { target: { value: "-1" } });
    await userEvent.click(screen.getByRole("button", { name: /calculate/i }));

    await waitFor(() => expect(mockMutateAsync).not.toHaveBeenCalled());
    expect(await screen.findByText(/installment duration must be at least 1 month/i)).toBeInTheDocument();
  });

  it("submits valid input to the calculator", async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    renderPage();

    await userEvent.type(screen.getByLabelText(/down payment/i), "1000000");
    await userEvent.type(screen.getByLabelText(/monthly income/i), "300000");
    await userEvent.click(screen.getByRole("button", { name: /calculate/i }));

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: "prop-1",
          downPayment: 1_000_000,
          installmentDurationMonths: 12,
          monthlyIncome: 300_000,
        }),
      ),
    );
  });

  it("renders the calculator result and next action, and continues to the next calculator", async () => {
    mockMutationState = {
      isPending: false,
      isError: false,
      data: {
        propertyId: "prop-1",
        propertyPrice: 5_000_000,
        downPayment: 1_000_000,
        balance: 4_000_000,
        installmentDurationMonths: 12,
        monthlyInstallment: 333_333,
        monthlyIncome: 300_000,
        affordabilityRatio: 1.11,
        affordabilityBand: "risky",
        affordabilityBandLabel: "Risky",
        advice: "This plan may stretch your budget.",
        includeHiddenCosts: false,
        hiddenCostTotal: 0,
        nextAction: {
          trigger: "budgetCalculatorUsed",
          action: "Review hidden costs",
          reason: "Understand the full cost before committing.",
        },
      },
    };
    renderPage();

    expect(screen.getByText(/review hidden costs/i)).toBeInTheDocument();
    expect(screen.getByText(/risky/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/calculators/hidden-cost/prop-1");
  });
});
