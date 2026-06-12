import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  Radio,
  RefreshCw,
} from "lucide-react";
import { useEffect } from "react";
import { Funnel } from "@/components/Funnel";
import { ErrorState, LoadingState } from "@/components/QueryState";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/campaigns/$id")({
  head: () => ({ meta: [{ title: "Campaign Details · Xeno Mini" }] }),
  component: CampaignDetails,
});

function CampaignDetails() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const campaign = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api.campaign(id),
    refetchInterval: 10_000,
  });
  const performance = useQuery({
    queryKey: ["campaign-performance", id],
    queryFn: () => api.campaignPerformance(id),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const stream = new EventSource(api.analyticsStreamUrl, {
      withCredentials: true,
    });
    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { campaignId?: string };
        if (payload.campaignId === id) {
          void queryClient.invalidateQueries({ queryKey: ["campaign", id] });
          void queryClient.invalidateQueries({
            queryKey: ["campaign-performance", id],
          });
        }
      } catch {
        // Ignore malformed SSE events (e.g., during deployment)
      }
    };
    return () => stream.close();
  }, [id, queryClient]);

  if (campaign.isLoading || performance.isLoading) {
    return (
      <Page>
        <LoadingState label="Loading campaign lifecycle" />
      </Page>
    );
  }
  if (campaign.error || performance.error) {
    return (
      <Page>
        <ErrorState
          error={(campaign.error ?? performance.error)!}
          retry={() => {
            void campaign.refetch();
            void performance.refetch();
          }}
        />
      </Page>
    );
  }
  const item = campaign.data!;
  const metrics = performance.data!;
  return (
    <Page>
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
        <Link
          to="/dashboard"
          className="hover:text-indigo-600 transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to="/campaigns"
          search={{ segmentId: undefined }}
          className="hover:text-indigo-600 transition-colors"
        >
          Campaigns
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 font-medium">{item.name}</span>
      </nav>
      <Link
        to="/campaigns"
        search={{ segmentId: undefined }}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to campaigns
      </Link>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {item.name}
            </h1>
            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
              {item.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {item.channel} · {item.segment.name} ·{" "}
            {item.audienceSizeSnapshot.toLocaleString()} recipients
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <Radio className="h-4 w-4 animate-pulse" /> Live SSE updates
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ["Sent", metrics.funnel.sent],
          ["Delivered", metrics.funnel.delivered],
          ["Opened", metrics.funnel.opened],
          ["Clicked", metrics.funnel.clicked],
          ["Converted", metrics.funnel.converted],
        ].map(([label, value]) => (
          <div
            key={label}
            className="bg-white border border-slate-200 rounded-xl p-4"
          >
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold">
              {Number(value).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold">Campaign Lifecycle Funnel</h2>
              <p className="text-xs text-slate-500 mt-1">
                Derived from immutable campaign events
              </p>
            </div>
            <button
              onClick={() => void performance.refetch()}
              className="h-8 px-3 rounded-lg border border-slate-200 text-xs flex items-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
          <Funnel performance={metrics} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold">Marketing Rates</h2>
          <div className="mt-5 space-y-4">
            {Object.entries(metrics.rates).map(([label, value]) => (
              <div key={label}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-slate-600">{label}</span>
                  <span className="font-semibold">{value.toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${Math.min(100, value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-emerald-50 p-4">
            <div className="text-xs text-emerald-700">Attributed revenue</div>
            <div className="mt-1 text-xl font-semibold text-emerald-900">
              ₹{metrics.revenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      {metrics.failures.length > 0 && (
        <div className="mt-4 bg-white border border-rose-200 rounded-xl p-6">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500" /> Failure
            diagnostics
          </h2>
          <div className="mt-4 space-y-2">
            {metrics.failures.map((failure) => (
              <div
                key={failure.reason}
                className="flex justify-between rounded-lg bg-rose-50 px-4 py-3 text-sm"
              >
                <span className="text-rose-800">{failure.reason}</span>
                <span className="font-semibold text-rose-900">
                  {failure.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <div className="px-8 py-8 max-w-[1400px] mx-auto">{children}</div>;
}
