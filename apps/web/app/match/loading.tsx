import { Shimmer } from '@/components/ui/Skeleton';

export default function MatchLoading() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Shimmer className="h-8 w-28 rounded" />
        <Shimmer className="h-8 w-20 rounded-xl" />
      </div>

      {/* Opponent cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Shimmer key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
