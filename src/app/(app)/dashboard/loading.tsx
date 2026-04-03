export default function DashboardLoading() {
  return (
    <div className="p-5 md:p-8 animate-pulse">
      {/* Header */}
      <div className="mb-7">
        <div className="h-7 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-36 bg-slate-100 rounded mt-2" />
      </div>

      {/* 6 metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-7">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
            <div className="h-3 w-24 bg-slate-100 rounded mb-3" />
            <div className="h-6 w-32 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Chart + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="h-4 w-36 bg-slate-200 rounded mb-5" />
          <div className="h-48 bg-slate-100 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="h-4 w-28 bg-slate-200 rounded mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between py-3 border-b border-slate-100">
              <div className="space-y-1.5">
                <div className="h-3.5 w-24 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
              <div className="h-3.5 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
            <div className="h-3.5 w-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
