export default function CollectionLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="page-header shrink-0">
        <div className="h-2 w-20 bg-white/5 rounded mb-3" />
        <div className="flex items-end justify-between">
          <div className="h-8 w-44 bg-white/8 rounded" />
          <div className="text-right space-y-1">
            <div className="h-6 w-16 bg-white/8 rounded ml-auto" />
            <div className="h-2 w-20 bg-white/5 rounded ml-auto" />
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-white/5 rounded-full" />
      </div>

      {/* Rarity pills skeleton */}
      <div className="px-4 py-3 flex gap-2 shrink-0">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="h-7 w-16 bg-white/5 rounded-full" />
        ))}
      </div>

      {/* Country sections skeleton */}
      <div className="flex-1 overflow-hidden px-4 space-y-3 pt-2">
        {Array.from({ length: 3 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="bg-white/3 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-white/8 rounded-full" />
              <div className="flex-1 h-4 bg-white/8 rounded w-24" />
              <div className="h-4 w-12 bg-white/5 rounded" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }, (_, j) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                <div key={j} className="aspect-[3/4] bg-white/5 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
