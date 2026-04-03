export default function InvoicesLoading() {
  return (
    <div className="p-6 md:p-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-28 bg-slate-200 rounded-lg" />
          <div className="h-4 w-20 bg-slate-100 rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-lg" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-slate-100 rounded-lg" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="hidden md:block">
          <div className="flex px-6 py-3 border-b border-slate-100 gap-6">
            {['w-32', 'flex-1', 'w-24', 'w-28', 'w-28'].map((w, i) => (
              <div key={i} className={`h-3 bg-slate-100 rounded ${w}`} />
            ))}
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center px-6 py-4 border-b border-slate-100 gap-6">
              <div className="w-32 space-y-1.5">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
              <div className="flex-1 h-3.5 bg-slate-100 rounded" />
              <div className="h-5 w-16 bg-slate-100 rounded-full" />
              <div className="w-28 h-3.5 bg-slate-200 rounded" />
              <div className="w-28 h-3.5 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="md:hidden divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-4">
              <div className="space-y-1.5">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-5 w-16 bg-slate-100 rounded-full mt-1" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
