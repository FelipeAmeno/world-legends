import { Shimmer } from '@/components/ui/Skeleton';

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-obsidian">
      {/* PlayerHeader skeleton */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shimmer className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Shimmer className="h-3.5 w-28 rounded" />
            <Shimmer className="h-2 w-16 rounded" />
          </div>
        </div>
        <Shimmer className="h-8 w-24 rounded-xl" />
      </div>

      {/* NextBestAction skeleton */}
      <div className="mx-4 mb-4">
        <Shimmer className="h-2 w-24 rounded mb-2" />
        <Shimmer className="h-28 rounded-2xl" />
      </div>

      {/* GameGrid skeleton */}
      <div className="px-4 grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Shimmer key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
