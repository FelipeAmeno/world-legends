export default function MissionsLoading() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-6 animate-pulse">
      <div className="h-7 w-32 bg-white/8 rounded mb-1" />
      <div className="h-2 w-48 bg-white/5 rounded mb-6" />

      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="h-24 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
