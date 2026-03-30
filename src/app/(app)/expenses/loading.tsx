export default function ExpensesLoading() {
  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-7 w-28 bg-slate-200 rounded-lg" />
              <div className="h-4 w-36 bg-slate-100 rounded mt-2" />
            </div>
            <div className="h-10 w-32 bg-slate-200 rounded-lg" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Category summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="h-4 w-36 bg-slate-200 rounded mb-4" />
          <div className="mb-4 pb-4 border-b border-slate-100">
            <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
            <div className="h-7 w-32 bg-slate-200 rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
              <div className="h-3 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
