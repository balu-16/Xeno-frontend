import type { CampaignPerformance } from "../lib/contracts";

export function Funnel({ performance }: { performance: CampaignPerformance }) {
  const stages = [
    ["Sent", performance.funnel.sent],
    ["Delivered", performance.funnel.delivered],
    ["Opened", performance.funnel.opened],
    ["Clicked", performance.funnel.clicked],
    ["Converted", performance.funnel.converted],
  ] as const;
  const maximum = Math.max(1, performance.funnel.sent);
  return (
    <div className="space-y-3">
      {stages.map(([label, value], index) => {
        const previous = index === 0 ? value : stages[index - 1]![1];
        const retention = previous === 0 ? 0 : (value / previous) * 100;
        return (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">{label}</span>
              <span className="text-xs text-slate-500">
                {value.toLocaleString()} · {retention.toFixed(1)}% retained
              </span>
            </div>
            <div className="h-9 rounded-lg bg-slate-100 overflow-hidden">
              <div
                className="h-full min-w-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700"
                style={{ width: `${Math.max(0.5, (value / maximum) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
