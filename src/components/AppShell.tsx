import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  LogOut,
  Megaphone,
  Menu,
  Sparkles,
  Target,
  TrendingUp,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, ApiError, type User } from "@/lib/api";
import { AIPanel } from "./AIPanel";
import { CommandPalette, CommandPaletteButton } from "./CommandPalette";
import { NotificationCenter } from "./NotificationCenter";

const allNavigation = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/segments", label: "Segments", icon: Target },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/analytics", label: "Analytics", icon: TrendingUp },
  { to: "/insights", label: "AI Insights", icon: Lightbulb },
  { to: "/ai", label: "AI Copilot", icon: Bot },
] as const;

const adminOnlyNavigation = [
  { to: "/managers", label: "Managers", icon: UserCog },
] as const;

function getNavigation(role: User["role"]) {
  if (role === "ADMIN") {
    return [...allNavigation, ...adminOnlyNavigation];
  }
  return allNavigation;
}

const roleBadgeStyles: Record<User["role"], string> = {
  ADMIN: "bg-rose-100 text-rose-700",
  MANAGER: "bg-amber-100 text-amber-700",
};

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes — auth status rarely changes mid-session
  });
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      queryClient.clear();
      window.history.replaceState(null, "", "/auth");
      await navigate({ to: "/auth", replace: true });
    },
  });
  // Redirect to /auth on any auth error (401, network, etc.)
  useEffect(() => {
    if (auth.error instanceof ApiError && auth.error.status === 401) {
      queryClient.clear();
      void navigate({ to: "/auth", replace: true });
    }
  }, [auth.error, navigate, queryClient]);

  // Protect against browser Back button after logout
  useEffect(() => {
    const handlePopState = () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [queryClient]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        void navigate({ to: "/campaigns", search: { segmentId: undefined } });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate]);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 grid place-items-center animate-pulse">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm text-slate-500">Loading Xeno workspace</span>
        </div>
      </div>
    );
  }

  if (auth.error || !auth.data) {
    // Redirect is handled by the useEffect above — just show loading state
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Sparkles className="h-5 w-5 animate-pulse text-indigo-600" />
          Redirecting to login...
        </div>
      </div>
    );
  }

  const userRole = auth.data.user.role;
  const navigation = getNavigation(userRole);

  return (
    <div className="h-screen w-screen flex bg-slate-50/60 text-slate-900 overflow-hidden">
      <CommandPalette />

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className="fixed top-3 left-3 z-40 md:hidden h-9 w-9 rounded-lg bg-white border border-slate-200 shadow-sm grid place-items-center text-slate-500"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`h-screen border-r border-slate-200/80 bg-white flex flex-col shrink-0 transition-all duration-300 ease-in-out
          max-md:fixed max-md:z-50 max-md:shadow-2xl
          ${mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}
          ${collapsed ? "w-17" : "w-60"}
        `}
      >
        <div
          className={`h-16 flex items-center border-b border-slate-100 ${
            collapsed ? "justify-center px-2" : "px-5 gap-2"
          }`}
        >
          <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 grid place-items-center shadow-sm shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold tracking-tight whitespace-nowrap">
              Xeno Mini
            </span>
          )}
          <div
            className={`${collapsed ? "" : "ml-auto"} flex items-center gap-1`}
          >
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="h-7 w-7 rounded-md grid place-items-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
            {!collapsed && (
              <>
                <NotificationCenter />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="md:hidden h-9 w-9 rounded-lg grid place-items-center text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
        <div
          className={`border-b border-slate-100 ${collapsed ? "px-2 py-2" : "px-3 py-2"}`}
        >
          <CommandPaletteButton collapsed={collapsed} />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {!collapsed && (
            <div className="px-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-2">
              Marketing lifecycle
            </div>
          )}
          <ul className="space-y-0.5">
            {navigation.map(({ to, label, icon: Icon }) => {
              const active =
                to === "/dashboard"
                  ? pathname === "/dashboard" || pathname === "/"
                  : pathname.startsWith(to);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    title={collapsed ? label : undefined}
                    className={`relative flex items-center gap-3 rounded-lg text-sm transition-all duration-200 ${
                      collapsed ? "justify-center h-10 w-full" : "px-3 py-2"
                    } ${
                      active
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 rounded-r-full bg-indigo-600" />
                    )}
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-indigo-600" : ""
                      }`}
                    />
                    {!collapsed && label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div
          className={`border-t border-slate-100 ${collapsed ? "p-2" : "p-3"}`}
        >
          <div
            className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-3 p-2"}`}
          >
            {!collapsed && (
              <>
                <div className="h-9 w-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 grid place-items-center text-white text-sm font-semibold shrink-0">
                  {auth.data.user.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {auth.data.user.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${roleBadgeStyles[userRole]}`}
                    >
                      {userRole}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {auth.data.user.email}
                  </div>
                </div>
              </>
            )}
            <button
              onClick={() => logout.mutate()}
              aria-label="Sign out"
              className={`grid place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors ${
                collapsed ? "h-9 w-9" : "h-8 w-8"
              }`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-h-0 relative overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <Outlet />
          </div>
        </div>
        <AIPanel />
      </main>
    </div>
  );
}
