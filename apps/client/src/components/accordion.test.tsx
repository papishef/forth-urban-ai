import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Accordion, type AccordionItemData } from "./accordion";

// Mock framer-motion for deterministic jsdom test execution per react memory notes
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: PropsWithChildren<{ className?: string }>) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
}));

const mockItems: AccordionItemData[] = [
  {
    id: "item-1",
    question: "Do you offer payment plans?",
    answer: "Yes, we offer 6 to 12 month installment options.",
  },
  {
    id: "item-2",
    question: "Are titles verified?",
    answer: "All titles are 100% verified with FCDA R-of-O or C-of-O.",
  },
];

describe("Accordion Component", () => {
  it("renders questions and starts with default open item", () => {
    render(<Accordion items={mockItems} defaultOpenId="item-1" />);

    expect(screen.getByText("Do you offer payment plans?")).toBeInTheDocument();
    expect(screen.getByText("Are titles verified?")).toBeInTheDocument();

    expect(screen.getByText("Yes, we offer 6 to 12 month installment options.")).toBeInTheDocument();
  });

  it("toggles item open and closed upon click", () => {
    render(<Accordion items={mockItems} defaultOpenId="item-1" />);

    const item2Button = screen.getByRole("button", { name: /Are titles verified\?/i });
    fireEvent.click(item2Button);

    expect(screen.getByText("All titles are 100% verified with FCDA R-of-O or C-of-O.")).toBeInTheDocument();
  });
});
