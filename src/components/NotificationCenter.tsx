import { useQuery } from "@tanstack/react-query";
import { Bell, Megaphone, ShoppingCart, Bot, Target, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  campaign: Megaphone,
  conversion: ShoppingCart,
  ai: Bot,
  segment: Target,
};

const colorMap: Record<string, string> = {
  campaign: "bg-blue-50 text-blue-600",
  conversion: "bg-emerald-50 text-emerald-600",
  ai: "bg-violet-50 text-violet-600",
  segment: "bg-amber-50 text-amber-600",
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: api.dashboard,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activities = query.data?.activity ?? [];
  const count = Math.min(activities.length, 9);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-lg grid place-items-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-[9px] font-bold text-white grid place-items-center">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
            <button
              onClick={() => setOpen(false)}
              className="h-6 w-6 rounded grid place-items-center text-slate-400 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No recent activity
              </div>
            ) : (
              activities.slice(0, 9).map((item) => {
                const Icon = iconMap[item.kind] ?? Bell;
                const colors = colorMap[item.kind] ?? "bg-slate-50 text-slate-600";
                return (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <div className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${colors}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-700 leading-snug line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(item.occurredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
