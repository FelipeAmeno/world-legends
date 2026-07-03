import { AchievementsPage } from '@/components/achievements/AchievementsPage';

export default function AchievementsRoute() {
  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{
        background: `
          radial-gradient(ellipse 100% 40% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 30% at 90% 50%, rgba(251,191,36,0.04) 0%, transparent 50%),
          #050508
        `,
      }}
    >
      <AchievementsPage />
    </div>
  );
}
