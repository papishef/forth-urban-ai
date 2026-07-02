import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./login-page";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../lib/auth-context", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it("shows validation errors when submitted empty", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("submits valid credentials and navigates to the dashboard", async () => {
    mockLogin.mockResolvedValue(undefined);
    renderPage();

    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({ email: "jane@example.com", password: "supersecret" }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a server error message when login fails", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid email or password"));
    renderPage();

    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
