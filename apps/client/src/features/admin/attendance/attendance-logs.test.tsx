import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AttendanceLogsTab } from "./attendance-logs.js";

const mockDateRange = { start: new Date("2024-01-01"), end: new Date("2024-01-31") };

describe("Attendance Logs Tab", () => {
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
        {component}
      </QueryClientProvider>
    );
  };

  describe("Table Rendering", () => {
    it("should display attendance logs table", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: [
              {
                _id: "log-1",
                visitorName: "John Doe",
                type: "visitor",
                checkInTime: new Date("2024-01-15T09:00:00Z").toISOString(),
                checkOutTime: new Date("2024-01-15T10:00:00Z").toISOString(),
                durationMinutes: 60,
                purpose: "inspection",
                isNoShow: false,
                source: "kiosk",
                deviceId: "office-tablet-01",
                deviceIp: "192.168.1.20",
                deviceUserAgent: "OfficeTablet/1.0",
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              pages: 1,
            },
          },
        }),
      });

      renderWithProviders(<AttendanceLogsTab dateRange={mockDateRange} />);

      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        expect(screen.getByText(/Kiosk office-tablet-01/)).toBeInTheDocument();
      });
    });

    it("should display column headers", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              pages: 0,
            },
          },
        }),
      });

      renderWithProviders(<AttendanceLogsTab dateRange={mockDateRange} />);

      await waitFor(() => {
        expect(screen.getByText(/Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Check-In/i)).toBeInTheDocument();
        expect(screen.getByText(/Duration/i)).toBeInTheDocument();
      });
    });

    it("should display status badges correctly", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: [
              {
                _id: "log-1",
                visitorName: "John Doe",
                type: "staff",
                checkInTime: new Date("2024-01-15T09:00:00Z").toISOString(),
                checkOutTime: new Date("2024-01-15T10:00:00Z").toISOString(),
                durationMinutes: 60,
                purpose: "office",
                isNoShow: false,
              },
              {
                _id: "log-2",
                visitorName: "Jane Smith",
                type: "visitor",
                checkInTime: new Date("2024-01-15T11:00:00Z").toISOString(),
                checkOutTime: null,
                durationMinutes: null,
                purpose: "inspection",
                isNoShow: false,
              },
              {
                _id: "log-3",
                visitorName: "Bob Wilson",
                type: "visitor",
                checkInTime: new Date("2024-01-15T13:00:00Z").toISOString(),
                checkOutTime: null,
                durationMinutes: null,
                purpose: "inspection",
                isNoShow: true,
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 3,
              pages: 1,
            },
          },
        }),
      });

      renderWithProviders(<AttendanceLogsTab dateRange={mockDateRange} />);

      await waitFor(() => {
        expect(screen.getByText(/Checked Out/i)).toBeInTheDocument();
        expect(screen.getByText(/Pending/i)).toBeInTheDocument();
        expect(screen.getByText(/No-Show/i)).toBeInTheDocument();
      });
    });
  });

  describe("Filtering", () => {
    it("should filter by type", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              pages: 0,
            },
          },
        }),
      });

      renderWithProviders(<AttendanceLogsTab dateRange={mockDateRange} />);

      const typeFilter = await screen.findByDisplayValue(/all types/i);
      fireEvent.change(typeFilter, { target: { value: "staff" } });

      await waitFor(() => {
        expect(typeFilter).toHaveValue("staff");
      });
    });

    it("should filter by status", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              pages: 0,
            },
          },
        }),
      });

      renderWithProviders(<AttendanceLogsTab dateRange={mockDateRange} />);

      const statusFilter = await screen.findByDisplayValue(/all status/i);
      fireEvent.change(statusFilter, { target: { value: "pending" } });

      await waitFor(() => {
        expect(statusFilter).toHaveValue("pending");
      });
    });
  });

  describe("Pagination", () => {
    it("should display pagination controls", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: Array.from({ length: 20 }, (_, i) => ({
              _id: `log-${i}`,
              visitorName: `Visitor ${i}`,
              type: "visitor",
              checkInTime: new Date().toISOString(),
              checkOutTime: null,
              durationMinutes: null,
              purpose: "inspection",
              isNoShow: false,
            })),
            pagination: {
              page: 1,
              limit: 20,
              total: 50,
              pages: 3,
            },
          },
        }),
      });

      renderWithProviders(<AttendanceLogsTab dateRange={mockDateRange} />);

      await waitFor(() => {
        expect(screen.getByText(/Showing 20 of 50/i)).toBeInTheDocument();
      });
    });

    it("should allow changing page", async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              items: [
                {
                  _id: "log-1",
                  visitorName: "John Doe",
                  type: "visitor",
                  checkInTime: new Date().toISOString(),
                  checkOutTime: null,
                  durationMinutes: null,
                  purpose: "inspection",
                  isNoShow: false,
                },
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 50,
                pages: 3,
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              items: [
                {
                  _id: "log-21",
                  visitorName: "Jane Smith",
                  type: "visitor",
                  checkInTime: new Date().toISOString(),
                  checkOutTime: null,
                  durationMinutes: null,
                  purpose: "inspection",
                  isNoShow: false,
                },
              ],
              pagination: {
                page: 2,
                limit: 20,
                total: 50,
                pages: 3,
              },
            },
          }),
        });

      renderWithProviders(<AttendanceLogsTab dateRange={mockDateRange} />);

      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
      });
    });
  });

  describe("CSV Export", () => {
    it("should download CSV report", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              items: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 0,
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () =>
            "Date,Name,Type,CheckIn,CheckOut,Duration\n2024-01-15,John,Staff,09:00,10:00,60\n",
        });

      renderWithProviders(<AttendanceLogsTab dateRange={mockDateRange} />);

      const exportButton = await screen.findByRole("button", {
        name: /export csv/i,
      });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/admin/attendance/report"
        );
      });
    });
  });
});
