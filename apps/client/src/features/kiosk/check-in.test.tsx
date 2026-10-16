import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KioskProvider } from "./kiosk-context.js";
import { useKiosk } from "./use-kiosk.js";
import { CheckInComponent } from "./check-in.js";

vi.mock("./kiosk-feedback", () => ({
  playKioskErrorSound: vi.fn(),
  playKioskSuccessSound: vi.fn(),
}));

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const text = JSON.stringify(body);
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: async () => text,
    json: async () => body,
  };
}

/** The kiosk shell renders success/error screens; expose the session state instead. */
function SessionProbe() {
  const { session } = useKiosk();
  return (
    <div data-testid="session">
      {session.currentStep}|{session.successMessage ?? ""}|{session.error ?? ""}
    </div>
  );
}

describe("Kiosk Check-In Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    globalThis.fetch = vi.fn();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <KioskProvider>
          {component}
          <SessionProbe />
        </KioskProvider>
      </QueryClientProvider>
    );
  };

  function openVisitorForm() {
    fireEvent.click(screen.getByRole("button", { name: /visitor/i }));
  }

  async function fillVisitorForm() {
    fireEvent.change(await screen.findByLabelText(/name/i), { target: { value: "Jane Smith" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "+234801234567" } });
  }

  describe("Type Selection", () => {
    it("should display staff and visitor type buttons", () => {
      renderWithProviders(<CheckInComponent />);

      expect(screen.getByRole("button", { name: /staff/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /visitor/i })).toBeInTheDocument();
    });

    it("should transition to staff lookup on staff button click", async () => {
      renderWithProviders(<CheckInComponent />);

      fireEvent.click(screen.getByRole("button", { name: /staff/i }));

      expect(await screen.findByPlaceholderText(/search staff/i)).toBeInTheDocument();
    });

    it("should transition to visitor form on visitor button click", async () => {
      renderWithProviders(<CheckInComponent />);

      openVisitorForm();

      expect(await screen.findByLabelText(/name/i)).toBeInTheDocument();
    });
  });

  describe("Staff Search", () => {
    it("should search staff by name", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        jsonResponse({
          data: [{ _id: "staff-1", firstName: "John", lastName: "Doe", email: "john@example.com" }],
        }),
      );

      renderWithProviders(<CheckInComponent />);
      fireEvent.click(screen.getByRole("button", { name: /staff/i }));

      const searchInput = await screen.findByPlaceholderText(/search staff/i);
      fireEvent.change(searchInput, { target: { value: "John" } });

      expect(await screen.findByText(/John Doe/)).toBeInTheDocument();
    });

    it("should query the kiosk staff search endpoint with the typed text", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));

      renderWithProviders(<CheckInComponent />);
      fireEvent.click(screen.getByRole("button", { name: /staff/i }));

      const searchInput = await screen.findByPlaceholderText(/search staff/i);
      fireEvent.change(searchInput, { target: { value: "John" } });

      await waitFor(() =>
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/attendance/kiosk/staff-search?q=John"),
          expect.anything(),
        ),
      );
    });
  });

  describe("Visitor Form", () => {
    it("should collect visitor information", async () => {
      renderWithProviders(<CheckInComponent />);
      openVisitorForm();
      await fillVisitorForm();

      expect(screen.getByLabelText(/name/i)).toHaveValue("Jane Smith");
      expect(screen.getByLabelText(/email/i)).toHaveValue("jane@example.com");
      expect(screen.getByLabelText(/phone/i)).toHaveValue("+234801234567");
    });

    it("should require a name before continuing", async () => {
      renderWithProviders(<CheckInComponent />);
      openVisitorForm();

      const continueButton = await screen.findByRole("button", { name: /continue/i });
      expect(continueButton).toBeDisabled();

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Jane Smith" } });
      expect(continueButton).toBeEnabled();
    });
  });

  describe("Check-In Submission", () => {
    async function reviewAndConfirm() {
      openVisitorForm();
      await fillVisitorForm();
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));
      expect(await screen.findByText(/Jane Smith/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /confirm check in/i }));
    }

    it("should submit check-in and show success", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        jsonResponse({
          success: true,
          data: { _id: "log-123", type: "visitor", checkInTime: new Date().toISOString() },
        }),
      );

      renderWithProviders(<CheckInComponent />);
      await reviewAndConfirm();

      await waitFor(() => expect(screen.getByTestId("session")).toHaveTextContent(/success\|Checked in successfully!/));
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/attendance/kiosk/check-in"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should handle check-in errors", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(jsonResponse({ message: "Staff member not found" }, { ok: false, status: 404 }));

      renderWithProviders(<CheckInComponent />);
      await reviewAndConfirm();

      await waitFor(() => expect(screen.getByTestId("session")).toHaveTextContent(/error\|.*Staff member not found/));
    });
  });
});
