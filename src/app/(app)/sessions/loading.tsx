export default function SessionsLoading() {
  return (
    <div className="space-y-4 pb-6">
      <div className="h-8 w-32 bg-slate-700 rounded-lg animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-slate-700 rounded animate-pulse w-1/3" />
              <div className="h-5 bg-slate-700 rounded animate-pulse w-16" />
            </div>
            <div className="h-3 bg-slate-700 rounded animate-pulse w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
