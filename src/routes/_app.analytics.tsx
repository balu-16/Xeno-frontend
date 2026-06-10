import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { AnalyticsSkeleton } from "@/components/Skeleton";
import { useCountUp } from "@/lib/useCountUp";
import { api } from "@/lib/api";
import { downloadCSV } from "@/lib/utils";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Xeno Mini" }] }),
  component: Analytics,
});

function Analytics() {
  const query = useQuery({
    queryKey: ["analytics"],
    queryFn: api.analytics,
  });
  if (query.isLoading) {
    return (
      <Page>
        <AnalyticsSkeleton />
      </Page>
    );
  }
  if (query.error) {
    return (
      <Page>
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      </Page>
    );
  }
  const { dashboard, campaigns } = query.data!;
  const funnel = [
    {
      stage: "Sent",
      value: campaigns.reduce(
        (sum, campaign) => sum + (campaign.analytics?.totalSent ?? 0),
        0,
      ),
    },
    {
      stage: "Delivered",
      value: campaigns.reduce(
        (sum, campaign) => sum + (campaign.analytics?.totalDelivered ?? 0),
        0,
      ),
    },
    {
      stage: "Opened",
      value: campaigns.reduce(
        (sum, campaign) => sum + (campaign.analytics?.totalOpened ?? 0),
        0,
      ),
    },
    {
      stage: "Clicked",
      value: campaigns.reduce(
        (sum, campaign) => sum + (campaign.analytics?.totalClicked ?? 0),
        0,
      ),
    },
    {
      stage: "Converted",
      value: campaigns.reduce(
        (sum, campaign) => sum + (campaign.analytics?.totalConverted ?? 0),
        0,
      ),
    },
  ];
  return (
    <Page>
      <PageHeader
        title="Global Analytics"
        subtitle="Cross-campaign performance, attribution, channels, and segments."
        action={
          <button
            onClick={() =>
              downloadCSV(
                "analytics.csv",
                campaigns.map((c) => ({
                  Campaign: c.name,
                  Channel: c.channel,
                  "Delivery Rate": `${c.analytics?.deliveryRate.toFixed(1) ?? 0}%`,
                  "Open Rate": `${c.analytics?.openRate.toFixed(1) ?? 0}%`,
                  "Click Rate": `${c.analytics?.clickRate.toFixed(1) ?? 0}%`,
                  "Conversion Rate": `${c.analytics?.conversionRate.toFixed(1) ?? 0}%`,
                  Revenue: Number(c.analytics?.revenueAccrued ?? 0),
                })),
              )
            }
            className="h-9 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-2 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Delivery Rate", dashboard.deliveryRate],
          ["Open Rate", dashboard.openRate],
          ["Click Rate", dashboard.clickRate],
          ["Conversion Rate", dashboard.conversionRate],
        ].map(([label, value]) => (
          <AnalyticsStatCard key={String(label)} label={String(label)} value={Number(value)} />
        ))}
      </div>
      <FunnelChart funnel={funnel} />
      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaign data yet"
          description="Launch your first campaign to see performance analytics here."
          illustration="analytics"
        />
      ) : (
        <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold">Campaign comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-5 py-3 font-medium">Channel</th>
                  <th className="px-5 py-3 font-medium text-right">Delivery</th>
                  <th className="px-5 py-3 font-medium text-right">Open</th>
                  <th className="px-5 py-3 font-medium text-right">Click</th>
                  <th className="px-5 py-3 font-medium text-right">Conversion</th>
                  <th className="px-5 py-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-slate-50">
                    <td className="px-5 py-4">
                      <Link
                        to="/campaigns/$id"
                        params={{ id: campaign.id }}
                        search={{ segmentId: undefined }}
                        className="font-medium hover:text-indigo-600"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4">{campaign.channel}</td>
                    <td className="px-5 py-4 text-right">
                      {campaign.analytics?.deliveryRate.toFixed(1) ?? "0"}%
                    </td>
                    <td className="px-5 py-4 text-right">
                      {campaign.analytics?.openRate.toFixed(1) ?? "0"}%
                    </td>
                    <td className="px-5 py-4 text-right">
                      {campaign.analytics?.clickRate.toFixed(1) ?? "0"}%
                    </td>
                    <td className="px-5 py-4 text-right">
                      {campaign.analytics?.conversionRate.toFixed(1) ?? "0"}%
                    </td>
                    <td className="px-5 py-4 text-right">
                      ₹
                      {Number(
                        campaign.analytics?.revenueAccrued ?? 0,
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Page>
  );
}

function FunnelChart({ funnel }: { funnel: { stage: string; value: number }[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="font-semibold">Global Lifecycle Funnel</h2>
      <p className="text-xs text-slate-500 mt-1">
        Distinct recorded events across campaigns
      </p>
      <div className="h-72 mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={funnel}
            onMouseMove={(state) => {
              if (state?.activeTooltipIndex !== undefined) {
                setActiveIndex(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="stage"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
                    {payload[0].payload.stage}:{" "}
                    {Number(payload[0].value).toLocaleString()}
                  </div>
                );
              }}
            />
            {funnel.map((_, index) => (
              <Bar
                key={index}
                dataKey="value"
                fill={activeIndex === index ? "#3730a3" : "#4f46e5"}
                radius={[6, 6, 0, 0]}
                fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AnalyticsStatCard({ label, value }: { label: string; value: number }) {
  const animated = useCountUp(value, 900, 1);
  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-5 transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-0.5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">
        {animated.toFixed(1)}%
      </div>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <div className="px-8 py-8 max-w-[1400px] mx-auto">{children}</div>;
}
