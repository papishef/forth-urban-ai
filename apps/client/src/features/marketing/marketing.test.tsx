import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "./pages/home-page";
import { ServicesPage } from "./pages/services-page";
import { ContactPage } from "./pages/contact-page";
import { MarketingHeader } from "./components/marketing-header";
import { MarketingFooter } from "./components/marketing-footer";
import { AuthProvider } from "../../lib/auth-context";

// Framer motion mock for tests
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => "0%",
  motion: new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        const Component = ({
          children,
          initial: _initial,
          animate: _animate,
          exit: _exit,
          transition: _transition,
          whileHover: _whileHover,
          whileTap: _whileTap,
          ...rest
        }: React.ComponentPropsWithoutRef<"div"> & Record<string, unknown>) => {
          const Tag = (prop || "div") as any;
          return <Tag {...rest}>{children}</Tag>;
        };
        return Component;
      },
    },
  ),
}));

// Mock marketing API hooks
vi.mock("./marketing-api", () => ({
  useBlogPosts: () => ({
    data: { items: [], total: 0, page: 1, limit: 10 },
    isLoading: false,
  }),
  useSubmitContact: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "msg-123" }),
    isPending: false,
  }),
  useSubscribeNewsletter: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ email: "test@example.com", status: "pending" }),
    isPending: false,
    isError: false,
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Marketing Website Layer", () => {
  it("renders the HomePage with hero headline and trust cards", () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /own real estate that grows in value/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/100% Genuine Titles/i)).toBeInTheDocument();
    expect(screen.getByText(/Flexible Financing/i)).toBeInTheDocument();
  });

  it("renders the ServicesPage with all 6 Forth Urban services", () => {
    renderWithProviders(<ServicesPage />);

    expect(screen.getByRole("heading", { name: /our comprehensive services/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Land Sales & Acquisition")).toBeInTheDocument();
    expect(screen.getByText("Legal Documentation & Due Diligence")).toBeInTheDocument();
    expect(screen.getByText("Flexible Financing & Installment Plans")).toBeInTheDocument();
    expect(screen.getByText("Property & Residential Estate Development")).toBeInTheDocument();
    expect(screen.getByText("AI Real Estate Advisory & Consultation")).toBeInTheDocument();
    expect(screen.getByText("Property Valuation & ROI Analytics")).toBeInTheDocument();
  });

  it("renders the ContactPage with direct channels, message form, and FAQs", () => {
    renderWithProviders(<ContactPage />);

    expect(screen.getByRole("heading", { name: /let’s talk real estate/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText("+234 911 165 8936")).toBeInTheDocument();
    expect(screen.getByText("info@forthurban.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
    expect(screen.getByText("Got Questions? We Have Answers.")).toBeInTheDocument();
  });

  it("renders MarketingHeader with brand navigation", () => {
    renderWithProviders(<MarketingHeader />);

    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /services/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /insights & news/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contact/i })).toBeInTheDocument();
  });

  it("renders MarketingFooter with contact address and newsletter input", () => {
    renderWithProviders(<MarketingFooter />);

    expect(screen.getByText(/19 Ali Baba Cres, Jabi, Abuja/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /subscribe to newsletter/i })).toBeInTheDocument();
  });
});
