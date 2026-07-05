import { SkeletonProfile } from '@/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10 animate-pulse">
      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <SkeletonProfile />
      </div>

      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="px-5 py-5 glass rounded-3xl border border-white/5 space-y-3">
          <div className="h-4 w-32 bg-white/8 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }, (_, j) => (
              <div key={j} className="h-16 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
