export default function MatchLoading() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-28 rounded bg-white/8" />
        <div className="h-8 w-20 rounded-xl bg-white/5" />
      </div>

      {/* Opponent cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="h-20 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
