import { Shimmer } from '@/components/ui/Skeleton';

export default function CollectionLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="page-header shrink-0">
        <Shimmer className="h-2 w-20 rounded mb-3" />
        <div className="flex items-end justify-between">
          <Shimmer className="h-8 w-44 rounded" />
          <div className="text-right space-y-1">
            <Shimmer className="h-6 w-16 rounded ml-auto" />
            <Shimmer className="h-2 w-20 rounded ml-auto" />
          </div>
        </div>
        <Shimmer className="mt-3 h-1.5 rounded-full" />
      </div>

      {/* Rarity pills skeleton */}
      <div className="px-4 py-3 flex gap-2 shrink-0">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Shimmer key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>

      {/* Country sections skeleton */}
      <div className="flex-1 overflow-hidden px-4 space-y-3 pt-2">
        {Array.from({ length: 3 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="bg-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shimmer className="h-8 w-8 rounded-full" />
              <Shimmer className="flex-1 h-4 rounded w-24" />
              <Shimmer className="h-4 w-12 rounded" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }, (_, j) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                <Shimmer key={j} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
