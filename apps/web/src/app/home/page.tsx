import { GameHeader } from '../../components/layout/nav';
import { HomeDashboard } from '../../components/layout/home-dashboard';

export default function HomePage() {
  return (
    <>
      <GameHeader />
      <main className="mx-auto max-w-lg space-y-4 px-4 pb-24 pt-4">
        <HomeDashboard />
      </main>
    </>
  );
}
