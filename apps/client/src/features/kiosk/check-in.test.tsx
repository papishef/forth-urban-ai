import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KioskProvider } from "./kiosk-context.js";
import { CheckInComponent } from "./check-in.js";

describe("Kiosk Check-In Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <KioskProvider>{component}</KioskProvider>
      </QueryClientProvider>
    );
  };

  describe("Type Selection", () => {
    it("should display staff and visitor type buttons", () => {
      renderWithProviders(<CheckInComponent />);

      expect(screen.getByRole("button", { name: /staff/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /visitor/i })
      ).toBeInTheDocument();
    });

    it("should transition to staff lookup on staff button click", async () => {
      renderWithProviders(<CheckInComponent />);

      const staffButton = screen.getByRole("button", { name: /staff/i });
      fireEvent.click(staffButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search staff/i)).toBeInTheDocument();
      });
    });

    it("should transition to visitor form on visitor button click", async () => {
      renderWithProviders(<CheckInComponent />);

      const visitorButton = screen.getByRole("button", { name: /visitor/i });
      fireEvent.click(visitorButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });
    });
  });

  describe("Staff Search", () => {
    it("should search staff by name", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              _id: "staff-1",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
            },
          ],
        }),
      });

      renderWithProviders(<CheckInComponent />);

      const staffButton = screen.getByRole("button", { name: /staff/i });
      fireEvent.click(staffButton);

      const searchInput = await screen.findByPlaceholderText(/search staff/i);
      fireEvent.change(searchInput, { target: { value: "John" } });

      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      });
    });

    it("should handle debounced search", async () => {
      vi.useFakeTimers();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      renderWithProviders(<CheckInComponent />);

      const staffButton = screen.getByRole("button", { name: /staff/i });
      fireEvent.click(staffButton);

      const searchInput = await screen.findByPlaceholderText(/search staff/i);

      fireEvent.change(searchInput, { target: { value: "J" } });
      fireEvent.change(searchInput, { target: { value: "Jo" } });
      fireEvent.change(searchInput, { target: { value: "John" } });

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      vi.useRealTimers();
    });
  });

  describe("Visitor Form", () => {
    it("should collect visitor information", async () => {
      renderWithProviders(<CheckInComponent />);

      const visitorButton = screen.getByRole("button", { name: /visitor/i });
      fireEvent.click(visitorButton);

      const nameInput = await screen.findByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      fireEvent.change(nameInput, { target: { value: "Jane Smith" } });
      fireEvent.change(emailInput, {
        target: { value: "jane@example.com" },
      });
      fireEvent.change(phoneInput, { target: { value: "+234801234567" } });

      expect((nameInput as HTMLInputElement).value).toBe("Jane Smith");
      expect((emailInput as HTMLInputElement).value).toBe("jane@example.com");
      expect((phoneInput as HTMLInputElement).value).toBe("+234801234567");
    });

    it("should validate required fields", async () => {
      renderWithProviders(<CheckInComponent />);

      const visitorButton = screen.getByRole("button", { name: /visitor/i });
      fireEvent.click(visitorButton);

      const submitButton = await screen.findByRole("button", {
        name: /check in/i,
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/name is required/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Check-In Submission", () => {
    it("should submit check-in and show success", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            _id: "log-123",
            type: "visitor",
            checkInTime: new Date().toISOString(),
          },
        }),
      });

      renderWithProviders(<CheckInComponent />);

      const visitorButton = screen.getByRole("button", { name: /visitor/i });
      fireEvent.click(visitorButton);

      const nameInput = await screen.findByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      fireEvent.change(nameInput, { target: { value: "Jane Smith" } });
      fireEvent.change(emailInput, {
        target: { value: "jane@example.com" },
      });
      fireEvent.change(phoneInput, { target: { value: "+234801234567" } });

      const submitButton = screen.getByRole("button", { name: /check in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/successfully checked in/i)).toBeInTheDocument();
      });
    });

    it("should handle check-in errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "Staff member not found",
        }),
      });

      renderWithProviders(<CheckInComponent />);

      const visitorButton = screen.getByRole("button", { name: /visitor/i });
      fireEvent.click(visitorButton);

      const nameInput = await screen.findByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      fireEvent.change(nameInput, { target: { value: "Jane Smith" } });
      fireEvent.change(emailInput, {
        target: { value: "jane@example.com" },
      });
      fireEvent.change(phoneInput, { target: { value: "+234801234567" } });

      const submitButton = screen.getByRole("button", { name: /check in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/staff member not found/i)
        ).toBeInTheDocument();
      });
    });
  });
});
