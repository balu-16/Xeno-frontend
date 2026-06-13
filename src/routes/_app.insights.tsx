import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Filter,
  Lightbulb,
  Loader2,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/QueryState";
import { Skeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import type {
  AIInsightView,
  ExecutiveSummaryView,
  InsightPriority,
  InsightType,
} from "@/lib/contracts";

export const Route = createFileRoute("/_app/insights")({
  head: () => ({ meta: [{ title: "AI Insights · Xeno Mini" }] }),
  component: Insights,
});

const INSIGHT_TYPES: Array<{ value: string; label: string }> = [
  { value: "", label: "All types" },
  { value: "REVENUE", label: "Revenue" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "CAMPAIGN", label: "Campaign" },
  { value: "SEGMENT", label: "Segment" },
  { value: "CHURN", label: "Churn" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "ANOMALY", label: "Anomaly" },
  { value: "OPPORTUNITY", label: "Opportunity" },
  { value: "PREDICTION", label: "Prediction" },
  { value: "CONVERSION", label: "Conversion" },
];

const PRIORITIES: Array<{ value: string; label: string }> = [
  { value: "", label: "All priorities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const STATUSES: Array<{ value: string; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISMISSED", label: "Dismissed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "", label: "All statuses" },
];

const priorityColors: Record<InsightPriority, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  LOW: "bg-slate-100 text-slate-600",
};

function Insights() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  // Poll status every 5s while generating, every 60s otherwise
  const status = useQuery({
    queryKey: ["insights", "status"],
    queryFn: api.insightStatus,
    refetchInterval: (query) => {
      // Poll faster while generating
      if (query.state.data?.isGenerating) return 5_000;
      return 60_000;
    },
  });

  const isGenerating = status.data?.isGenerating ?? false;

  const summary = useQuery({
    queryKey: ["insights", "summary"],
    queryFn: api.insightSummary,
  });

  const insights = useQuery({
    queryKey: ["insights", typeFilter, priorityFilter, statusFilter],
    queryFn: () =>
      api.insights({
        type: typeFilter || undefined,
        priority: priorityFilter || undefined,
        status: statusFilter || undefined,
      }),
    // Keep showing old data while refetching
    placeholderData: (prev) => prev,
  });

  const dismiss = useMutation({
    mutationFn: (id: string) => api.dismissInsight(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });

  const complete = useMutation({
    mutationFn: (id: string) => api.completeInsight(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });

  const refresh = useMutation({
    mutationFn: api.refreshInsights,
    onSuccess: async () => {
      // Invalidate status to pick up isGenerating=true
      await queryClient.invalidateQueries({ queryKey: ["insights", "status"] });
    },
  });

  // Show full skeleton only on first load with no data at all
  if (insights.isLoading && !insights.data) {
    return (
      <Page>
        <InsightsSkeleton />
      </Page>
    );
  }

  if (insights.error && !insights.data) {
    return (
      <Page>
        <ErrorState
          error={insights.error}
          retry={() => void insights.refetch()}
        />
      </Page>
    );
  }

  const items = insights.data?.data ?? [];
  const meta = insights.data?.meta;
  const summaryData = summary.data;

  return (
    <Page>
      <PageHeader
        title="AI Insights"
        subtitle="Proactive business intelligence"
        action={
          <button
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending || isGenerating}
            className="h-9 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refresh.isPending || isGenerating ? "animate-spin" : ""}`}
            />
            {isGenerating ? "Analyzing..." : "Refresh"}
          </button>
        }
      />

      {/* Analyzing Banner */}
      {isGenerating && (
        <div className="mb-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/60 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-100 grid place-items-center shrink-0">
            <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
          </div>
          <div>
            <div className="text-sm font-medium text-indigo-900">
              AI is analyzing your database
            </div>
            <div className="text-xs text-indigo-600 mt-0.5">
              Scanning revenue, customers, campaigns, segments, churn risk, and
              anomalies. Insights will appear as each analysis completes.
            </div>
          </div>
        </div>
      )}

      {/* Last run info */}
      {status.data?.lastRunAt && !isGenerating && (
        <div className="mb-4 text-xs text-slate-400 flex items-center gap-2">
          <Clock className="h-3 w-3" />
          Last analyzed {formatRelativeTime(status.data.lastRunAt)}
          {status.data.lastRunGenerated > 0 &&
            ` · ${status.data.lastRunGenerated} insights generated`}
          {status.data.nextRunAt &&
            ` · Next run ${formatRelativeTime(status.data.nextRunAt)}`}
        </div>
      )}

      {/* Stats row */}
      <StatsBar summary={summaryData} isLoading={summary.isLoading} />

      {/* Filter bar */}
      <div className="mt-4 bg-white border border-slate-200/70 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-400 cursor-pointer appearance-auto"
        >
          {INSIGHT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-400 cursor-pointer appearance-auto"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-400 cursor-pointer appearance-auto"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {meta && (
          <div className="ml-auto text-xs text-slate-500">
            {meta.total.toLocaleString()} insights
          </div>
        )}
      </div>

      {/* Insights grid */}
      {items.length === 0 && !isGenerating ? (
        <div className="mt-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 grid place-items-center mx-auto mb-4">
            <Lightbulb className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-700">
            No insights yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            The AI is starting up and will analyze your database shortly. Insights
            will appear here automatically once the analysis completes.
          </p>
        </div>
      ) : items.length === 0 && isGenerating ? (
        <div className="mt-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 grid place-items-center mx-auto mb-4">
            <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
          </div>
          <h3 className="text-sm font-medium text-slate-700">
            Analyzing your data...
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            The AI is scanning your revenue, customers, campaigns, and more.
            Insights will appear here as each analysis completes.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={() => dismiss.mutate(insight.id)}
              onComplete={() => complete.mutate(insight.id)}
              isDismissing={dismiss.isPending}
              isCompleting={complete.isPending}
            />
          ))}
        </div>
      )}
    </Page>
  );
}

function StatsBar({
  summary,
  isLoading,
}: {
  summary: ExecutiveSummaryView | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/70 rounded-xl p-5"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20 mt-3" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Active Insights",
      value: summary?.activeInsights?.toLocaleString() ?? "0",
      icon: Lightbulb,
      color: "text-indigo-600",
    },
    {
      label: "Critical",
      value: summary?.criticalInsights?.toLocaleString() ?? "0",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      label: "Avg Confidence",
      value:
        summary?.avgConfidence != null
          ? `${(summary.avgConfidence * 100).toFixed(0)}%`
          : "0%",
      icon: Brain,
      color: "text-emerald-600",
    },
    {
      label: "Executive Score",
      value: summary?.executiveScore?.toLocaleString() ?? "0",
      icon: TrendingUp,
      color: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="bg-white border border-slate-200/70 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{label}</span>
            <div
              className={`h-8 w-8 rounded-lg bg-slate-50 grid place-items-center ${color}`}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightCard({
  insight,
  onDismiss,
  onComplete,
  isDismissing,
  isCompleting,
}: {
  insight: AIInsightView;
  onDismiss: () => void;
  onComplete: () => void;
  isDismissing: boolean;
  isCompleting: boolean;
}) {
  const priorityLabel: Record<InsightPriority, string> = {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  };

  const typeLabel: Record<InsightType, string> = {
    REVENUE: "Revenue",
    CUSTOMER: "Customer",
    CAMPAIGN: "Campaign",
    SEGMENT: "Segment",
    CHURN: "Churn",
    DELIVERY: "Delivery",
    CONVERSION: "Conversion",
    OPPORTUNITY: "Opportunity",
    ANOMALY: "Anomaly",
    PREDICTION: "Prediction",
  };

  return (
    <div className="bg-white border border-slate-200/70 rounded-xl p-5 flex flex-col gap-4">
      {/* Header: badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[10px] font-semibold px-2 py-1 rounded-full ${priorityColors[insight.priority]}`}
          >
            {priorityLabel[insight.priority]}
          </span>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
            {typeLabel[insight.type]}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(insight.generatedAt)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm leading-snug">{insight.title}</h3>

      {/* Summary */}
      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
        {insight.summary}
      </p>

      {/* Confidence & Impact bars */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Confidence</span>
            <span className="text-xs font-medium tabular-nums">
              {(insight.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${insight.confidence * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Impact</span>
            <span className="text-xs font-medium tabular-nums">
              {(insight.impact * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${insight.impact * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Estimated impact */}
      {insight.estimatedImpact && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
          <TrendingUp className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">{insight.estimatedImpact}</span>
        </div>
      )}

      {/* Recommendation */}
      <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
          Recommendation
        </div>
        {insight.recommendation}
      </div>

      {/* Action buttons */}
      {insight.status === "ACTIVE" && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={onDismiss}
            disabled={isDismissing}
            className="flex-1 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Dismiss
          </button>
          <button
            onClick={onComplete}
            disabled={isCompleting}
            className="flex-1 h-9 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark Complete
          </button>
        </div>
      )}

      {/* Status badge for non-active */}
      {insight.status !== "ACTIVE" && (
        <div className="pt-1 border-t border-slate-100">
          <span
            className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
              insight.status === "COMPLETED"
                ? "bg-emerald-100 text-emerald-700"
                : insight.status === "DISMISSED"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-amber-100 text-amber-700"
            }`}
          >
            {insight.status}
          </span>
        </div>
      )}
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between mb-7">
        <div>
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/70 rounded-xl p-5"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20 mt-3" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-200/70 rounded-xl p-4 flex gap-3">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/70 rounded-xl p-5"
          >
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3 mt-1" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Skeleton className="h-3 w-16 mb-1.5" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
              <div>
                <Skeleton className="h-3 w-12 mb-1.5" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
            <Skeleton className="h-16 w-full mt-4 rounded-lg" />
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-9 flex-1 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return new Date(isoDate).toLocaleDateString();
}

function Page({ children }: { children: React.ReactNode }) {
  return <div className="px-8 py-8 max-w-[1400px] mx-auto">{children}</div>;
}
