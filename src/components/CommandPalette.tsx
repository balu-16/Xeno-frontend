import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bot,
  Megaphone,
  Search,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const commands = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: BarChart3,
    keywords: "home overview",
  },
  {
    to: "/customers",
    label: "Customers",
    icon: Users,
    keywords: "users people",
  },
  {
    to: "/segments",
    label: "Segments",
    icon: Target,
    keywords: "audience filter",
  },
  {
    to: "/campaigns",
    label: "Campaigns",
    icon: Megaphone,
    keywords: "marketing messages",
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: TrendingUp,
    keywords: "stats charts",
  },
  { to: "/ai", label: "AI History", icon: Bot, keywords: "copilot chat" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <Command
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className={`fixed top-[20%] left-1/2 -translate-x-1/2 z-[70] w-[520px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden transition-all duration-200 ${
          open
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <Search className="h-4 w-4 text-slate-400" />
          <Command.Input
            placeholder="Jump to a page..."
            className="h-12 flex-1 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center rounded bg-slate-100 text-[10px] text-slate-500 font-medium">
            ESC
          </kbd>
        </div>
        <Command.List className="p-2 max-h-[300px] overflow-y-auto">
          <Command.Empty className="py-6 text-center text-sm text-slate-400">
            No results found.
          </Command.Empty>
          <Command.Group heading="Pages" className="px-2">
            {commands.map(({ to, label, icon: Icon, keywords }) => (
              <Command.Item
                key={to}
                value={`${label} ${keywords}`}
                onSelect={() => {
                  void navigate({ to });
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer text-slate-700 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700 transition-colors"
              >
                <Icon className="h-4 w-4 text-slate-400" />
                {label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
              ↵
            </kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
              esc
            </kbd>
            Close
          </span>
        </div>
      </Command>
    </>
  );
}

export function CommandPaletteButton({
  collapsed,
}: { collapsed?: boolean } = {}) {
  return (
    <button
      onClick={() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true }),
        );
      }}
      className={`flex items-center rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ${
        collapsed ? "justify-center h-9 w-full" : "gap-2 px-3 py-1.5"
      }`}
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      {!collapsed && (
        <>
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-flex h-4 px-1 items-center rounded bg-slate-100 text-[10px] text-slate-500 font-medium">
            ⌘K
          </kbd>
        </>
      )}
    </button>
  );
}
