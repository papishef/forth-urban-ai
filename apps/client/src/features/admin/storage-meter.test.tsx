import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { StorageMeter } from "@forth-urban/ui";
import type { StorageStatusDTO } from "@forth-urban/shared-types";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: { children?: ReactNode; className?: string }) => <div className={className}>{children}</div>,
  },
}));

const status: StorageStatusDTO = {
  usedBytes: 25 * 1024 * 1024,
  totalBytes: 50 * 1024 * 1024,
  availableBytes: 25 * 1024 * 1024,
  usagePercent: 50,
  planId: "free",
  planLabel: "Free",
  planPriceNaira: 0,
  status: "active",
  autoRenew: true,
  currentPeriodEnd: null,
  lastPaymentAt: null,
  isOverQuota: false,
};

describe("StorageMeter", () => {
  it("shows used space, total allowance, available space, and progress", () => {
    render(<StorageMeter status={status} />);

    expect(screen.getByRole("progressbar").parentElement?.parentElement).toHaveTextContent("25 MB");
    expect(screen.getByRole("progressbar").parentElement?.parentElement).toHaveTextContent("50 MB");
    expect(screen.getByText("25 MB available")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });

  it("shows an action-needed state near or beyond the limit", () => {
    render(
      <StorageMeter
        status={{
          ...status,
          usedBytes: 51 * 1024 * 1024,
          availableBytes: 0,
          usagePercent: 102,
          isOverQuota: true,
        }}
      />,
    );

    expect(screen.getByText("Action needed")).toBeInTheDocument();
  });
});