import { Shimmer } from '@/components/ui/Skeleton';

export default function SquadLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Pitch skeleton */}
      <div
        className="flex-1 min-h-0 rounded-2xl m-2 flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="text-center space-y-3">
          <Shimmer className="w-16 h-16 rounded-full mx-auto" />
          <Shimmer className="h-3 w-28 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}
