import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Megaphone,
  MousePointerClick,
  Eye,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/QueryState";
import { DashboardSkeleton } from "@/components/Skeleton";
import { useCountUp } from "@/lib/useCountUp";
import { api } from "@/lib/api";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Xeno Mini" }] }),
  component: Dashboard,
});

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  notation: "compact",
});

function Dashboard() {
  const queryClient = useQueryClient();
  const [isLive, setIsLive] = useState(false);
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
    staleTime: 10_000,
    refetchInterval: 30_000, // Refetch every 30 seconds as fallback
  });

  useEffect(() => {
    const stream = new EventSource(api.analyticsStreamUrl, {
      withCredentials: true,
    });
    stream.onopen = () => setIsLive(true);
    stream.onmessage = () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };
    stream.onerror = () => setIsLive(false);
    return () => {
      stream.close();
      setIsLive(false);
    };
  }, [queryClient]);

  if (query.isLoading)
    return (
      <Page>
        <DashboardSkeleton />
      </Page>
    );
  if (query.error) {
    return (
      <Page>
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      </Page>
    );
  }
  const dashboard = query.data!;
  const cards = [
    {
      label: "Total Customers",
      value: dashboard.totalCustomers.toLocaleString(),
      icon: Users,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      label: "Total Orders",
      value: dashboard.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Total Revenue",
      value: money.format(dashboard.totalRevenue),
      icon: Activity,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Active Campaigns",
      value: dashboard.activeCampaigns.toLocaleString(),
      icon: Megaphone,
      color: "text-violet-500",
      bg: "bg-violet-50",
    },
  ];
  const rates = [
    {
      label: "Delivery Rate",
      value: dashboard.deliveryRate,
      icon: Zap,
      color: "text-sky-600",
      bg: "bg-sky-50",
      barColor: "bg-sky-500",
    },
    {
      label: "Open Rate",
      value: dashboard.openRate,
      icon: Eye,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      barColor: "bg-indigo-500",
    },
    {
      label: "Click Rate",
      value: dashboard.clickRate,
      icon: MousePointerClick,
      color: "text-violet-600",
      bg: "bg-violet-50",
      barColor: "bg-violet-500",
    },
    {
      label: "Conversion Rate",
      value: dashboard.conversionRate,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      barColor: "bg-emerald-500",
    },
  ];
  const channelColors = ["#2563eb", "#4f46e5", "#0ea5e9", "#8b5cf6"];
  const activityIcons = {
    campaign: Megaphone,
    conversion: ShoppingCart,
    ai: Bot,
    segment: Target,
  };

  return (
    <Page>
      <PageHeader
        title="Dashboard"
        subtitle="Your command center for the complete marketing lifecycle."
        action={
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
            />
            <span className="text-xs text-slate-500">
              {isLive ? "Live" : "Connecting..."}
            </span>
          </div>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          rawValue={dashboard.totalCustomers}
          icon={Users}
          color="text-indigo-500"
          bg="bg-indigo-50"
          format="number"
        />
        <StatCard
          label="Total Orders"
          rawValue={dashboard.totalOrders}
          icon={ShoppingCart}
          color="text-blue-500"
          bg="bg-blue-50"
          format="number"
        />
        <StatCard
          label="Total Revenue"
          rawValue={dashboard.totalRevenue}
          icon={Activity}
          color="text-emerald-500"
          bg="bg-emerald-50"
          format="money"
        />
        <StatCard
          label="Active Campaigns"
          rawValue={dashboard.activeCampaigns}
          icon={Megaphone}
          color="text-violet-500"
          bg="bg-violet-50"
          format="number"
        />
      </div>
      <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-4">
        {rates.map(({ label, value, icon: Icon, color, bg, barColor }) => (
          <RateCard
            key={label}
            label={label}
            value={value}
            Icon={Icon}
            color={color}
            bg={bg}
            barColor={barColor}
          />
        ))}
      </div>
      <OnboardingChecklist />
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          title="Campaign Performance Over Time"
          subtitle="Sent and converted events"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboard.campaignPerformance}>
              <defs>
                <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="convertedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip labelFormatter={(v) => shortDate(String(v))} />} />
              <Area
                type="monotone"
                dataKey="sent"
                stroke="#2563eb"
                fill="url(#sentGradient)"
                strokeWidth={2}
                animationDuration={800}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="converted"
                stroke="#4f46e5"
                fill="url(#convertedGradient)"
                strokeWidth={2}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Revenue Attribution Trends"
          subtitle="Revenue tied to conversion events"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboard.revenueTrends}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => money.format(Number(value))}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(v) => money.format(Number(v))}
                    labelFormatter={(v) => shortDate(String(v))}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                fill="url(#revenueGradient)"
                strokeWidth={2}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Channel Performance Comparison"
          subtitle="Conversion rate by channel"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboard.channelPerformance}
                dataKey="rate"
                nameKey="channel"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={3}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {dashboard.channelPerformance.map((row, index) => (
                  <Cell
                    key={row.channel}
                    fill={channelColors[index % channelColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={
                  <ChartTooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Segment Performance Comparison"
          subtitle="Conversions by audience"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dashboard.segmentPerformance}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                horizontal={false}
              />
              <XAxis
                type="number"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="segment"
                width={120}
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="conversions"
                fill="#4f46e5"
                radius={[0, 6, 6, 0]}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="mt-4 bg-white border border-slate-200/70 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Recent Activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Campaigns, conversions, AI actions, and segments
            </p>
          </div>
          {query.isFetching && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Updating
            </div>
          )}
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {dashboard.activity.map((item) => {
            const Icon = activityIcons[item.kind];
            return (
              <div
                key={`${item.kind}-${item.id}`}
                className="py-3 flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 grid place-items-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 text-sm">{item.title}</div>
                <time className="text-xs text-slate-400">
                  {new Date(item.occurredAt).toLocaleString()}
                </time>
              </div>
            );
          })}
        </div>
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <div className="px-8 py-8 max-w-[1500px] mx-auto">{children}</div>;
}

function StatCard({
  label,
  rawValue,
  icon: Icon,
  color,
  bg,
  format,
}: {
  label: string;
  rawValue: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  format: "number" | "money";
}) {
  const animated = useCountUp(rawValue, 900, format === "money" ? 0 : 0);
  const display =
    format === "money" ? money.format(animated) : animated.toLocaleString();

  return (
    <div className="group bg-white border border-slate-200/70 rounded-xl p-5 transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div
          className={`h-8 w-8 rounded-lg ${bg} grid place-items-center transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {display}
      </div>
    </div>
  );
}

function RateCard({
  label,
  value,
  Icon,
  color,
  bg,
  barColor,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  barColor: string;
}) {
  const animated = useCountUp(value, 900, 1);

  return (
    <div className="group bg-white border border-slate-200/70 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-0.5">
      <div className="flex items-center gap-2">
        <div
          className={`h-7 w-7 rounded-lg ${bg} grid place-items-center transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className={`h-3.5 w-3.5 ${color}`} />
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-3 text-xl font-semibold tabular-nums">
        {animated.toFixed(1)}%
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(100, animated)}%` }}
        />
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-700">
      {label && (
        <div className="text-slate-400 mb-1.5">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-medium">
            {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("xeno-onboarding-dismissed") === "true";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem("xeno-onboarding-dismissed", "true");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const steps = [
    {
      to: "/segments",
      label: "Create your first segment",
      description: "Define an audience to target",
    },
    {
      to: "/campaigns",
      label: "Launch a campaign",
      description: "Send messages to your audience",
    },
    {
      to: "/ai",
      label: "Ask the AI copilot",
      description: "Get insights from your data",
    },
  ];

  return (
    <div className="mt-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-sky-50 border border-indigo-100 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-indigo-900">Getting Started</h3>
          <p className="text-xs text-indigo-700/60 mt-0.5">
            Complete these steps to get the most out of Xeno Mini
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors"
        >
          Dismiss
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step, i) => (
          <Link
            key={step.to}
            to={step.to}
            className="group flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-indigo-100/60 hover:bg-white hover:border-indigo-200 transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 grid place-items-center text-xs font-bold shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-indigo-900 truncate">
                {step.label}
              </div>
              <div className="text-[10px] text-indigo-600/50">
                {step.description}
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-indigo-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group bg-white border border-slate-200/70 rounded-xl p-5 transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 hover:border-slate-300/80">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      <div className="h-64 mt-4">{children}</div>
    </div>
  );
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
