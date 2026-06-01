export default function GamesLoading() {
  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-9 w-24 bg-slate-700 rounded-lg animate-pulse" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-200">
            <div className="w-12 h-12 rounded-lg bg-slate-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
