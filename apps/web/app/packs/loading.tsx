import { Shimmer } from '@/components/ui/Skeleton';

export default function PacksLoading() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Shimmer className="h-7 w-32 rounded" />
          <Shimmer className="h-2 w-44 rounded" />
        </div>
        <Shimmer className="h-14 w-20 rounded-xl" />
      </div>

      {/* Pack cards */}
      <Shimmer className="h-2 w-20 rounded mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Shimmer key={i} className="h-64 rounded-2xl" />
        ))}
      </div>

      {/* Em breve section */}
      <div className="h-px bg-white/5 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Shimmer key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
