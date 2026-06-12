import { useQuery } from "@tanstack/react-query";
import { Bell, Megaphone, ShoppingCart, Bot, Target, X } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { useNotificationState } from "@/hooks/use-notification-state";

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
  const { readIds, markAllAsRead, isRead } = useNotificationState();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: api.dashboard,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Mark all notifications as read when the panel is opened
  useEffect(() => {
    if (open && query.data?.activity) {
      const allIds = query.data.activity.map((item) => item.id);
      markAllAsRead(allIds);
    }
  }, [open, query.data?.activity, markAllAsRead]);

  const activities = useMemo(
    () => query.data?.activity ?? [],
    [query.data?.activity],
  );
  const count = Math.min(activities.length, 9);

  // Split activities into unread and read
  const { unreadActivities, readActivities } = useMemo(() => {
    const unread: typeof activities = [];
    const read: typeof activities = [];

    activities.forEach((item) => {
      if (isRead(item.id)) {
        read.push(item);
      } else {
        unread.push(item);
      }
    });

    return { unreadActivities: unread, readActivities: read };
  }, [activities, isRead]);

  const unreadCount = unreadActivities.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-lg grid place-items-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-[9px] font-bold text-white grid place-items-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-50 w-80 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <button
              onClick={() => setOpen(false)}
              className="h-6 w-6 rounded grid place-items-center text-slate-400 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No notifications
              </div>
            ) : (
              <>
                {/* Unread Section */}
                {unreadActivities.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Unread ({unreadActivities.length})
                      </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {unreadActivities.slice(0, 9).map((item) => {
                        const Icon = iconMap[item.kind] ?? Bell;
                        const colors =
                          colorMap[item.kind] ?? "bg-slate-50 text-slate-600";
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 px-4 py-3 bg-blue-50/30"
                          >
                            <div
                              className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${colors}`}
                            >
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
                      })}
                    </div>
                  </div>
                )}

                {/* Read Section */}
                {readActivities.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Read ({readActivities.length})
                      </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {readActivities.slice(0, 9).map((item) => {
                        const Icon = iconMap[item.kind] ?? Bell;
                        const colors =
                          colorMap[item.kind] ?? "bg-slate-50 text-slate-600";
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 px-4 py-3 opacity-70"
                          >
                            <div
                              className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${colors}`}
                            >
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
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
