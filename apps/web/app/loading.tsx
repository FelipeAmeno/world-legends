export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-obsidian">
      {/* PlayerHeader skeleton */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/8" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 bg-white/8 rounded" />
            <div className="h-2 w-16 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-8 w-24 bg-white/5 rounded-xl" />
      </div>

      {/* NextBestAction skeleton */}
      <div className="mx-4 mb-4 animate-pulse">
        <div className="h-2 w-24 bg-white/5 rounded mb-2" />
        <div className="h-28 rounded-2xl bg-white/5" />
      </div>

      {/* GameGrid skeleton */}
      <div className="px-4 grid grid-cols-3 gap-3 animate-pulse">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="h-20 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
