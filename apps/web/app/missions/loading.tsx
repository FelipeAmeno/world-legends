import { Shimmer } from '@/components/ui/Skeleton';

export default function MissionsLoading() {
  return (
    <div className="min-h-screen bg-obsidian px-4 py-6">
      <Shimmer className="h-7 w-32 rounded mb-1" />
      <Shimmer className="h-2 w-48 rounded mb-6" />

      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Shimmer key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
