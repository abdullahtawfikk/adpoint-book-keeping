export default function ProfileSettingsLoading() {
  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8 max-w-2xl animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-64 bg-slate-100 rounded mt-2" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-slate-200" />
          <div className="h-9 w-32 bg-slate-100 rounded-lg" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-3.5 w-24 bg-slate-100 rounded mb-2" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>
        ))}
        <div className="h-10 w-28 bg-slate-200 rounded-lg" />
      </div>
    </div>
  )
}
