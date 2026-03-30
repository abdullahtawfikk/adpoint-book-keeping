export default function ClientsLoading() {
  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-24 bg-slate-200 rounded-lg" />
          <div className="h-4 w-32 bg-slate-100 rounded mt-2" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>

      {/* Search */}
      <div className="h-10 w-full bg-slate-100 rounded-lg mb-5" />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="hidden md:block">
          <div className="flex px-6 py-3 border-b border-slate-100 gap-4">
            {['flex-1', 'w-40', 'w-28', 'w-28', 'w-28'].map((w, i) => (
              <div key={i} className={`h-3 bg-slate-100 rounded ${w}`} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center px-6 py-4 border-b border-slate-100 gap-4">
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-36 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
              <div className="h-3.5 w-40 bg-slate-100 rounded" />
              <div className="h-5 w-20 bg-slate-100 rounded-full" />
              <div className="h-3.5 w-24 bg-slate-100 rounded" />
              <div className="h-3.5 w-24 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-4">
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
              <div className="h-4 w-20 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
