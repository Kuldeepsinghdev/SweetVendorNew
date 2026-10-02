export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div>
        <div className="h-7 w-52 bg-amber-200/60 rounded-md"></div>
        <div className="h-3.5 w-36 bg-amber-200/40 rounded-md mt-2"></div>
      </div>

      {/* Tabs Navigation Bar Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-amber-200/70">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-9 w-28 bg-white/80 rounded-xl shrink-0 border border-amber-200/70"
          ></div>
        ))}
      </div>

      {/* Tab Content Panel Skeleton */}
      <div className="bg-white border border-amber-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="h-6 w-40 bg-amber-200/60 rounded"></div>
        <div className="space-y-3 pt-2">
          <div className="h-4 bg-amber-100/70 rounded w-full"></div>
          <div className="h-4 bg-amber-100/60 rounded w-5/6"></div>
          <div className="h-4 bg-amber-100/50 rounded w-4/6"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="h-24 bg-amber-50/70 rounded-xl border border-amber-200/60"></div>
          <div className="h-24 bg-amber-50/70 rounded-xl border border-amber-200/60"></div>
          <div className="h-24 bg-amber-50/70 rounded-xl border border-amber-200/60"></div>
        </div>
      </div>
    </div>
  );
}
