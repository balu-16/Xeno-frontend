import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Download,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Radio,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Channel } from "../lib/contracts";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { TableSkeleton } from "@/components/Skeleton";
import { api, type User } from "@/lib/api";
import { downloadCSV } from "@/lib/utils";

export const Route = createFileRoute("/_app/campaigns")({
  validateSearch: (search: Record<string, unknown>) => ({
    segmentId:
      typeof search.segmentId === "string" ? search.segmentId : undefined,
  }),
  head: () => ({ meta: [{ title: "Campaigns · Xeno Mini" }] }),
  component: Campaigns,
});

const channels: Array<{
  value: Channel;
  label: string;
  icon: typeof Mail;
}> = [
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "SMS", label: "SMS", icon: Phone },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
  { value: "RCS", label: "RCS", icon: Radio },
];

function Campaigns() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(Boolean(search.segmentId));

  // Simple form state
  const [name, setName] = useState("New Campaign");
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [message, setMessage] = useState("");
  const [segmentId, setSegmentId] = useState(search.segmentId ?? "");

  // Search and filter state
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 350);
  };

  const auth = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me,
    staleTime: 5 * 60 * 1000,
  });
  const userRole: User["role"] = auth.data?.user.role ?? "MEMBER";
  const isMember = userRole === "MEMBER";

  const campaigns = useQuery({
    queryKey: ["campaigns", searchQuery, statusFilter],
    queryFn: () => api.campaigns(1, searchQuery, statusFilter),
  });
  const segments = useQuery({
    queryKey: ["segments"],
    queryFn: () => api.segments(),
  });

  const create = useMutation({
    mutationFn: () =>
      api.createCampaign({
        name,
        segmentId,
        channel,
        subject: channel === "EMAIL" ? message.slice(0, 80) : undefined,
        message,
      }),
    onSuccess: async (campaign) => {
      toast.success(`Campaign "${name}" created`);
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setOpen(false);
      resetForm();
      void navigate({
        to: "/campaigns/$id",
        params: { id: campaign.id },
        search: { segmentId: undefined },
      });
    },
  });

  const generateMessage = useMutation({
    mutationFn: async () => {
      const conv = await api.createConversation(`Copy for ${name}`);
      return api.sendAIMessage(
        conv.id,
        `Write a short, compelling ${channel} marketing message for a campaign called "${name}". Keep it under 160 characters for SMS, or a brief paragraph for email. Use {{first_name}} for personalization.`,
      );
    },
    onSuccess: (result) => {
      setMessage(result.response);
      toast.success("AI generated message");
    },
  });

  const resetForm = () => {
    setName("New Campaign");
    setChannel("EMAIL");
    setMessage("");
    setSegmentId(search.segmentId ?? "");
  };

  useEffect(() => {
    if (search.segmentId) {
      setSegmentId(search.segmentId);
      setOpen(true);
    }
  }, [search.segmentId]);

  const canSubmit = name.trim() && segmentId && message.trim();

  return (
    <div className="px-8 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Campaigns"
        subtitle="Select an audience, compose a message, launch, and monitor the full lifecycle."
        action={
          <div className="flex items-center gap-2">
            {campaigns.data && campaigns.data.data.length > 0 && (
              <button
                onClick={() =>
                  downloadCSV(
                    "campaigns.csv",
                    campaigns.data!.data.map((c) => ({
                      Name: c.name,
                      Segment: c.segment.name,
                      Channel: c.channel,
                      Status: c.status,
                      Audience: c.audienceSizeSnapshot,
                      "Open Rate": c.analytics
                        ? `${c.analytics.openRate.toFixed(1)}%`
                        : "—",
                    })),
                  )
                }
                className="h-9 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-2 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            )}
            {!isMember && (
              <button
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
                className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Create campaign
              </button>
            )}
          </div>
        }
      />
      {/* Search and filter bar */}
      <div className="mt-4 bg-white border border-slate-200/70 rounded-xl p-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search campaigns by name"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-indigo-400 cursor-text"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-400 cursor-pointer appearance-auto"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="QUEUED">Queued</option>
          <option value="RUNNING">Running</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
        <div className="text-xs text-slate-500">
          {campaigns.data?.meta.total.toLocaleString() ?? "—"} campaigns
        </div>
      </div>

      {campaigns.isLoading ? (
        <TableSkeleton rows={5} />
      ) : campaigns.error ? (
        <ErrorState
          error={campaigns.error}
          retry={() => void campaigns.refetch()}
        />
      ) : campaigns.data!.data.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Click 'Create campaign' above to launch your first campaign."
          illustration="campaigns"
        />
      ) : (
        <div className="bg-white border border-slate-200/70 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Channel</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Audience</th>
                <th className="px-5 py-3 font-medium text-right">Open Rate</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.data!.data.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: "/campaigns/$id",
                      params: { id: campaign.id },
                      search: { segmentId: undefined },
                    })
                  }
                >
                  <td className="px-5 py-4">
                    <span className="font-medium hover:text-indigo-600">
                      {campaign.name}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {campaign.segment.name}
                  </td>
                  <td className="px-5 py-4">{campaign.channel}</td>
                  <td className="px-5 py-4">
                    <Status value={campaign.status} />
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {campaign.audienceSizeSnapshot.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {campaign.analytics
                      ? `${campaign.analytics.openRate.toFixed(1)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Campaign Drawer ─────────────────────────────────── */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/30 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-[520px] max-w-full bg-white shadow-2xl transition-transform duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Create campaign</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in the details and launch
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Campaign Name */}
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Campaign name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Sale 2026"
              className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400"
            />
          </label>

          {/* Channel Dropdown */}
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Channel
            </span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
              className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400 cursor-pointer appearance-auto bg-white"
            >
              {channels.map((ch) => (
                <option key={ch.value} value={ch.value}>
                  {ch.label}
                </option>
              ))}
            </select>
          </label>

          {/* Segment Dropdown */}
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Target segment
            </span>
            <select
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
              className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400 cursor-pointer appearance-auto bg-white"
            >
              <option value="">Select a segment</option>
              {segments.data?.data.map((seg) => (
                <option key={seg.id} value={seg.id}>
                  {seg.name} ({seg.audienceSize.toLocaleString()} customers)
                </option>
              ))}
            </select>
          </label>

          {/* Message with AI */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-600">
                Message
              </span>
              <button
                onClick={() => generateMessage.mutate()}
                disabled={generateMessage.isPending || !name.trim()}
                className="h-7 px-2.5 rounded-md border border-indigo-200 text-indigo-700 text-[11px] flex items-center gap-1.5 hover:bg-indigo-50 disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" />
                {generateMessage.isPending ? "Generating..." : "AI Generate"}
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={
                channel === "SMS"
                  ? "Keep it short — under 160 characters. Use {{first_name}} to personalize."
                  : "Write your message here. Use {{first_name}} to personalize."
              }
              className="w-full p-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400 resize-none"
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Use {"{{first_name}}"} for personalization
              </span>
              {channel === "SMS" && (
                <span
                  className={`text-[11px] ${message.length > 160 ? "text-rose-500" : "text-slate-400"}`}
                >
                  {message.length}/160
                </span>
              )}
            </div>
            {generateMessage.error && (
              <p className="mt-1 text-xs text-rose-600">
                {generateMessage.error.message}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100">
          <button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {create.isPending ? "Creating..." : "Create campaign"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    SCHEDULED: "bg-violet-100 text-violet-700",
    QUEUED: "bg-amber-100 text-amber-700",
    RUNNING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-1 rounded-full ${styles[value] ?? styles.DRAFT}`}
    >
      {value}
    </span>
  );
}
