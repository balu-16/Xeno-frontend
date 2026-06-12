export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between mb-7">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/70 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-28 mt-3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/70 rounded-xl p-4"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-16 mt-3" />
            <Skeleton className="h-1.5 w-full mt-3 rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/70 rounded-xl p-5"
          >
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-36 mt-1" />
            <Skeleton className="h-64 w-full mt-4 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <div className="flex gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-5 py-4 border-b border-slate-50 flex gap-6 items-center"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/70 rounded-xl p-5">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-56 mt-1" />
      <Skeleton className="h-64 w-full mt-4 rounded-lg" />
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between mb-7">
        <div>
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl p-5"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16 mt-2" />
          </div>
        ))}
      </div>
      <CardSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}
