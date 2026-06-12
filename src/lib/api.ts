import type {
  ApiResponse,
  CampaignPerformance,
  Channel,
  DashboardMetrics,
  SegmentRuleGroup,
} from "./contracts";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  (import.meta.env.PROD ? "/api/v1" : "http://localhost:3000/api/v1");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    const error = payload.success
      ? { message: `Request failed with HTTP ${response.status}` }
      : payload.error;
    throw new ApiError(
      error.message,
      response.status,
      "code" in error ? error.code : undefined,
    );
  }
  // The API interceptor unwraps { data, meta } from service responses,
  // so payload.data is the inner data and payload.meta is pagination info.
  // Combine them so callers get { data, meta } when the service returns it.
  if (payload.meta !== undefined) {
    return { data: payload.data, meta: payload.meta } as T;
  }
  return payload.data;
}

function queryString(
  values: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  metadata: Record<string, unknown>;
  orders: number;
  lifetimeValue: number;
  lastActivity: string;
};

export type CustomerDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  orders: Array<{
    id: string;
    amount: string;
    items: unknown;
    createdAt: string;
  }>;
  campaignEvents: Array<{
    id: string;
    type: string;
    campaignId: string;
    campaign: { name: string };
    occurredAt: string;
  }>;
};

export type LoginLog = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  loggedInAt: string;
};

export type Segment = {
  id: string;
  name: string;
  description: string | null;
  rules: SegmentRuleGroup;
  audienceSize: number;
  createdAt: string;
};

export type Campaign = {
  id: string;
  name: string;
  segmentId: string;
  channel: Channel;
  status: "DRAFT" | "SCHEDULED" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  subject: string | null;
  message: string;
  audienceSizeSnapshot: number;
  launchedAt: string | null;
  createdAt: string;
  segment: { id: string; name: string };
  analytics: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalConverted: number;
    totalFailed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenueAccrued: string;
  } | null;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AIMessage[];
};

export type AIMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  grounding: {
    tool?: string;
    sources?: string[];
  } | null;
  createdAt: string;
};

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    request<{ loggedOut: true }>("/auth/logout", { method: "POST" }),
  me: () => request<{ user: User }>("/auth/me"),
  dashboard: () => request<DashboardMetrics>("/dashboard"),
  customers: (page: number, search: string, tag?: string) =>
    request<{ data: Customer[]; meta: PageMeta }>(
      `/customers${queryString({ page, pageSize: 20, search, tag })}`,
    ),
  customer: (id: string) => request<CustomerDetail>(`/customers/${id}`),
  customerLoginLogs: (id: string) =>
    request<LoginLog[]>(`/customers/${id}/login-logs`),
  customerCommunications: (id: string) =>
    request<Array<{
      campaignId: string;
      campaignName: string;
      events: Array<{
        type: string;
        occurredAt: string;
        payload: unknown;
      }>;
    }>>(`/customers/${id}/communications`),
  customerTags: () => request<string[]>("/customers/tags"),
  segments: (page = 1, search = "") =>
    request<{ data: Segment[]; meta: PageMeta }>(
      `/segments${queryString({ page, pageSize: 50, search })}`,
    ),
  previewSegment: (rules: SegmentRuleGroup) =>
    request<{
      rules: SegmentRuleGroup;
      customers: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
      }>;
      audienceSize: number;
    }>("/segments/preview", {
      method: "POST",
      body: JSON.stringify({ rules }),
    }),
  createSegment: (input: {
    name: string;
    description?: string;
    rules: SegmentRuleGroup;
  }) =>
    request<Segment>("/segments", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateSegmentName: (id: string, name: string) =>
    request<Segment>(`/segments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  campaigns: (page = 1, search = "", status = "") =>
    request<{ data: Campaign[]; meta: PageMeta }>(
      `/campaigns${queryString({ page, pageSize: 50, search, status })}`,
    ),
  createCampaign: (input: {
    name: string;
    segmentId: string;
    channel: Channel;
    subject?: string;
    message: string;
    scheduledAt?: string;
  }) =>
    request<Campaign>("/campaigns", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  campaign: (id: string) =>
    request<Campaign & { failures: Array<{ reason: string; count: number }> }>(
      `/campaigns/${id}`,
    ),
  campaignPerformance: (id: string) =>
    request<CampaignPerformance>(`/analytics/campaigns/${id}`),
  previewCampaign: (id: string) =>
    request<{ campaignId: string; audienceSize: number }>(
      `/campaigns/${id}/audience-preview`,
    ),
  launchCampaign: (id: string) =>
    request<{
      campaignId: string;
      status: string;
      audienceSize: number;
      correlationId: string;
    }>(`/campaigns/${id}/launch`, { method: "POST" }),
  analytics: () =>
    request<{ dashboard: DashboardMetrics; campaigns: Campaign[] }>(
      "/analytics",
    ),
  conversations: () => request<Conversation[]>("/ai/conversations"),
  conversation: (id: string) =>
    request<Conversation>(`/ai/conversations/${id}`),
  createConversation: (title?: string) =>
    request<Conversation>("/ai/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  sendAIMessage: (id: string, content: string) =>
    request<{
      conversationId: string;
      response: string;
      toolResult: unknown;
      grounding: { tool: string; sources: string[]; executionId: string };
    }>(`/ai/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  analyticsStreamUrl: `${API_URL}/analytics/stream`,
};
