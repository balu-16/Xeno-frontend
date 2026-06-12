import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock router — createFileRoute returns a curried factory
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: vi.fn(
    () => (config: Record<string, unknown>) => ({
      ...config,
      useSearch: vi.fn(() => ({ segmentId: undefined })),
    }),
  ),
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: vi.fn(() => vi.fn()),
}));

// Mock API
vi.mock("@/lib/api", () => ({
  api: {
    me: vi.fn(),
    campaigns: vi.fn(),
    segments: vi.fn(),
    createCampaign: vi.fn(),
    previewCampaign: vi.fn(),
    launchCampaign: vi.fn(),
    createConversation: vi.fn(),
    sendAIMessage: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock complex child component
vi.mock("@/components/CampaignDetailDialog", () => ({
  CampaignDetailDialog: () => null,
}));

import { Route } from "./_app.campaigns";
import { api } from "@/lib/api";

const mockMe = vi.mocked(api.me);
const mockCampaigns = vi.mocked(api.campaigns);
const mockSegments = vi.mocked(api.segments);

function makeCampaign(
  id = "1",
  name = "Test Campaign",
  status: "DRAFT" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "SCHEDULED" = "COMPLETED",
) {
  return {
    id,
    name,
    segmentId: "seg-1",
    channel: "EMAIL" as const,
    status: status as "DRAFT" | "SCHEDULED" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED",
    subject: "Test Subject",
    message: "Test message",
    audienceSizeSnapshot: 100,
    launchedAt: "2024-01-01T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    segment: { id: "seg-1", name: "Test Segment" },
    analytics: {
      totalSent: 100,
      totalDelivered: 90,
      totalOpened: 50,
      totalClicked: 20,
      totalConverted: 10,
      totalFailed: 10,
      deliveryRate: 90,
      openRate: 55.6,
      clickRate: 22.2,
      conversionRate: 11.1,
      revenueAccrued: "500.00",
    },
  };
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

// @ts-expect-error — mock route doesn't fully match TanStack types
const CampaignsComponent = Route.component as React.ComponentType;

describe("Campaigns page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMe.mockResolvedValue({
      user: {
        id: "1",
        name: "Admin",
        email: "admin@test.com",
        role: "ADMIN",
      },
    });
    mockSegments.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
    });
  });

  it("renders campaign list", async () => {
    mockCampaigns.mockResolvedValue({
      data: [makeCampaign("1", "Spring Sale")],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });
    renderWithProviders(<CampaignsComponent />);
    await waitFor(() => {
      expect(screen.getByText("Spring Sale")).toBeInTheDocument();
    });
    expect(screen.getByText("Test Segment")).toBeInTheDocument();
  });

  it("shows empty state when no campaigns", async () => {
    mockCampaigns.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
    });
    renderWithProviders(<CampaignsComponent />);
    await waitFor(() => {
      expect(screen.getByText("No campaigns yet")).toBeInTheDocument();
    });
  });

  it("search input triggers debounced query", async () => {
    mockCampaigns.mockResolvedValue({
      data: [makeCampaign("1", "Test Campaign")],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });
    renderWithProviders(<CampaignsComponent />);
    await waitFor(() => {
      expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Search campaigns by name");
    fireEvent.change(input, { target: { value: "spring" } });

    await waitFor(
      () => {
        expect(mockCampaigns).toHaveBeenCalledWith(1, "spring", "");
      },
      { timeout: 1000 },
    );
  });

  it("status filter dropdown works", async () => {
    mockCampaigns.mockResolvedValue({
      data: [makeCampaign("1", "Test Campaign", "RUNNING")],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });
    renderWithProviders(<CampaignsComponent />);
    await waitFor(() => {
      expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue("All statuses");
    fireEvent.change(select, { target: { value: "RUNNING" } });

    await waitFor(() => {
      expect(mockCampaigns).toHaveBeenCalledWith(1, "", "RUNNING");
    });
  });
});
