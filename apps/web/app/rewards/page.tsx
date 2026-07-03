'use client';

/**
 * app/rewards/page.tsx — T056
 *
 * Demo da tela de recompensas com level-up.
 * Na produção, esta tela é ativada pela GameContext após:
 *   - Fim de partida
 *   - Pack aberto
 *   - Evento completado
 */

import { RewardScreen } from '@/components/rewards/RewardScreen';
import { buildDemoReward, buildLevelUpDemo } from '@/lib/rewards-data';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function RewardsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demo = searchParams.get('demo');

  const data = demo === 'levelup' ? buildLevelUpDemo() : buildDemoReward();

  return <RewardScreen data={data} onContinue={() => router.push('/')} />;
}

export default function RewardsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian" />}>
      <RewardsContent />
    </Suspense>
  );
}
