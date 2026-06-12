import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock API
vi.mock("@/lib/api", () => {
  class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  }
  return {
    api: {
      me: vi.fn(),
      logout: vi.fn(),
    },
    ApiError,
  };
});

// Mock router
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    title,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    title?: string;
    className?: string;
  }) => (
    <a href={to} title={title} className={className}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet" />,
  useNavigate: vi.fn(() => vi.fn()),
  useRouterState: vi.fn(() => "/dashboard"),
}));

// Mock child components
vi.mock("@/components/AIPanel", () => ({ AIPanel: () => null }));
vi.mock("@/components/CommandPalette", () => ({
  CommandPalette: () => null,
  CommandPaletteButton: () => null,
}));
vi.mock("@/components/NotificationCenter", () => ({
  NotificationCenter: () => null,
}));

import { AppShell } from "./AppShell";
import { api } from "@/lib/api";

const mockMe = vi.mocked(api.me);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockMe.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AppShell />);
    expect(screen.getByText("Loading Xeno workspace")).toBeInTheDocument();
  });

  it("shows navigation items when auth succeeds", async () => {
    mockMe.mockResolvedValue({
      user: {
        id: "1",
        name: "Test User",
        email: "test@test.com",
        role: "ADMIN",
      },
    });
    renderWithProviders(<AppShell />);
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("Segments")).toBeInTheDocument();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("AI History")).toBeInTheDocument();
  });

  it("shows user name and email in sidebar", async () => {
    mockMe.mockResolvedValue({
      user: {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        role: "ADMIN",
      },
    });
    renderWithProviders(<AppShell />);
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it.each(["ADMIN", "MANAGER", "MEMBER"] as const)(
    "shows role badge for %s",
    async (role) => {
      mockMe.mockResolvedValue({
        user: {
          id: "1",
          name: "Test User",
          email: "test@test.com",
          role,
          },
      });
      renderWithProviders(<AppShell />);
      await waitFor(() => {
        expect(screen.getByText(role)).toBeInTheDocument();
      });
    },
  );
});
