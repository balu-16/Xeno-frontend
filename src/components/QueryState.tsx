import { AlertCircle, Inbox, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="min-h-64 grid place-items-center rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        {label}
      </div>
    </div>
  );
}

export function ErrorState({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  return (
    <div className="min-h-64 grid place-items-center rounded-xl border border-rose-200 bg-rose-50/40 p-6 text-center">
      <div>
        <AlertCircle className="h-6 w-6 text-rose-500 mx-auto" />
        <p className="mt-3 text-sm font-medium text-rose-800">
          {error.message}
        </p>
        {retry && (
          <button
            onClick={retry}
            className="mt-4 h-9 px-4 rounded-lg bg-white border border-rose-200 text-sm text-rose-700"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  illustration,
  action,
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  illustration?: "customers" | "campaigns" | "segments" | "analytics";
  action?: React.ReactNode;
}) {
  const illustrations: Record<string, React.ReactNode> = {
    customers: (
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        className="mx-auto"
      >
        <circle
          cx="32"
          cy="24"
          r="10"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        <path
          d="M16 52c0-8.837 7.163-16 16-16s16 7.163 16 16"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        <circle cx="46" cy="20" r="6" stroke="#6366f1" strokeWidth="1.5" />
        <path
          d="M42 44c0-4.418 3.582-8 8-8"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="48" cy="14" r="2" fill="#6366f1" opacity="0.5" />
      </svg>
    ),
    campaigns: (
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        className="mx-auto"
      >
        <rect
          x="14"
          y="20"
          width="36"
          height="24"
          rx="4"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        <path
          d="M32 14v6M24 16l8-2 8 2"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M20 32h24M20 38h16"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="3 3"
        />
        <circle cx="48" cy="16" r="3" fill="#6366f1" opacity="0.3" />
        <circle cx="50" cy="20" r="2" fill="#6366f1" opacity="0.2" />
      </svg>
    ),
    segments: (
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        className="mx-auto"
      >
        <circle
          cx="32"
          cy="32"
          r="18"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        <circle cx="32" cy="32" r="10" stroke="#6366f1" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="3" fill="#6366f1" opacity="0.3" />
        <line
          x1="32"
          y1="14"
          x2="32"
          y2="22"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="42"
          x2="32"
          y2="50"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="14"
          y1="32"
          x2="22"
          y2="32"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="42"
          y1="32"
          x2="50"
          y2="32"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    analytics: (
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        className="mx-auto"
      >
        <rect
          x="12"
          y="36"
          width="8"
          height="16"
          rx="2"
          fill="#94a3b8"
          opacity="0.3"
        />
        <rect
          x="24"
          y="28"
          width="8"
          height="24"
          rx="2"
          fill="#6366f1"
          opacity="0.4"
        />
        <rect
          x="36"
          y="20"
          width="8"
          height="32"
          rx="2"
          fill="#6366f1"
          opacity="0.6"
        />
        <rect
          x="48"
          y="12"
          width="8"
          height="40"
          rx="2"
          fill="#6366f1"
          opacity="0.8"
        />
        <path
          d="M12 52h44"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  return (
    <div className="min-h-48 grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <div>
        {illustration && illustrations[illustration] ? (
          <div className="mb-4">{illustrations[illustration]}</div>
        ) : (
          <div className="h-12 w-12 rounded-xl bg-slate-100 grid place-items-center mx-auto">
            <Icon className="h-6 w-6 text-slate-400" />
          </div>
        )}
        <div className="mt-4 font-medium text-slate-700">{title}</div>
        <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
          {description}
        </p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
