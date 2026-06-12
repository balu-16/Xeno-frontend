import { useRouterState } from "@tanstack/react-router";
import { Megaphone, Plus, Sparkles, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function PageActions() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const auth = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const role = auth.data?.user?.role;
  const canManage = role === "ADMIN" || role === "MANAGER";

  if (!canManage) return null;

  const isSegments = pathname.startsWith("/segments");
  const isCampaigns = pathname.startsWith("/campaigns");

  if (!isSegments && !isCampaigns) return null;

  return (
    <div className="fixed top-4 right-[140px] z-40 flex items-center gap-2">
      {isSegments && (
        <button
          onClick={() => {
            // Dispatch custom event to trigger segment creation
            window.dispatchEvent(new CustomEvent("open-segment-creator"));
          }}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" />
          <span>Generate segment</span>
        </button>
      )}
      {isCampaigns && (
        <button
          onClick={() => {
            // Dispatch custom event to trigger campaign creation
            window.dispatchEvent(new CustomEvent("open-campaign-creator"));
          }}
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          <span>Create campaign</span>
        </button>
      )}
    </div>
  );
}
