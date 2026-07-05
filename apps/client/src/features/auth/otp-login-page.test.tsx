import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { OtpLoginPage } from "./otp-login-page";

const mockRequestOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../lib/auth-context", () => ({
  useAuth: () => ({ requestOtp: mockRequestOtp, verifyOtp: mockVerifyOtp }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <OtpLoginPage />
    </MemoryRouter>,
  );
}

describe("OtpLoginPage", () => {
  beforeEach(() => {
    mockRequestOtp.mockReset();
    mockVerifyOtp.mockReset();
    mockNavigate.mockReset();
  });

  it("shows a validation error when requesting a code with an invalid email", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /send code/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(mockRequestOtp).not.toHaveBeenCalled();
  });

  it("requests a code, then verifies it and navigates to the dashboard", async () => {
    mockRequestOtp.mockResolvedValue(undefined);
    mockVerifyOtp.mockResolvedValue(undefined);
    renderPage();

    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send code/i }));

    await waitFor(() => expect(mockRequestOtp).toHaveBeenCalledWith("jane@example.com"));
    expect(await screen.findByText(/enter your code/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/verification code/i), "123456");
    await userEvent.click(screen.getByRole("button", { name: /verify & continue/i }));

    await waitFor(() =>
      expect(mockVerifyOtp).toHaveBeenCalledWith({ email: "jane@example.com", code: "123456" }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a server error when verification fails", async () => {
    mockRequestOtp.mockResolvedValue(undefined);
    mockVerifyOtp.mockRejectedValue(new Error("Incorrect or expired code"));
    renderPage();

    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send code/i }));
    await screen.findByText(/enter your code/i);

    await userEvent.type(screen.getByLabelText(/verification code/i), "000000");
    await userEvent.click(screen.getByRole("button", { name: /verify & continue/i }));

    expect(await screen.findByText(/incorrect or expired code/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
