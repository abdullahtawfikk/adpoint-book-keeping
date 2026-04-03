export default function ReportsLoading() {
  return (
    <div className="p-5 md:p-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-24 bg-slate-200 rounded-lg" />
          <div className="h-4 w-40 bg-slate-100 rounded mt-2" />
        </div>
        <div className="h-10 w-28 bg-slate-200 rounded-lg" />
      </div>

      {/* Date range */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="h-4 w-40 bg-slate-200 rounded" />
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between py-1.5">
              <div className="h-3.5 w-24 bg-slate-100 rounded" />
              <div className="h-3.5 w-20 bg-slate-100 rounded" />
            </div>
          ))}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between mb-3">
              <div className="h-5 w-24 bg-slate-200 rounded" />
              <div className="h-6 w-32 bg-slate-200 rounded" />
            </div>
            <div className="flex justify-between">
              <div className="h-3.5 w-28 bg-slate-100 rounded" />
              <div className="h-3.5 w-16 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="h-4 w-36 bg-slate-200 rounded mb-5" />
          <div className="h-48 bg-slate-100 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="h-4 w-40 bg-slate-200 rounded" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-4 w-5 bg-slate-100 rounded" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-24 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
