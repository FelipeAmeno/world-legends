import { MissionsPage } from '@/components/missions/MissionsPage';

export default function MissionsRoute() {
  return (
    <div
      className="animate-[fadeIn_0.4s_ease-out] min-h-full"
      style={{
        background: [
          'radial-gradient(ellipse 85% 45% at 50% 0%, rgba(139,92,246,0.14) 0%, transparent 55%)',
          'radial-gradient(ellipse 40% 30% at 0% 50%, rgba(168,85,247,0.07) 0%, transparent 50%)',
          '#050508',
        ].join(', '),
      }}
    >
      <MissionsPage />
    </div>
  );
}
