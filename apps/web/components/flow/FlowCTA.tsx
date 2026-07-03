'use client';

import { useGame } from '@/lib/game-context';
import { FLOW_HREF, FLOW_ICONS, FLOW_LABELS, type FlowStep } from '@/lib/game-state';
import Link from 'next/link';

type Props = {
  currentPage: FlowStep; // qual página está sendo mostrada agora
};

const CTA_TEXT: Partial<Record<FlowStep, string>> = {
  collection: 'Montar Time →',
  squad: 'Abrir Pack →',
  packs: 'Ver Squad com Nova Carta →',
  add_card: 'Jogar Partida →',
  match: 'Ver Recompensas →',
  rewards: 'Ver Perfil Atualizado →',
};

export function FlowCTA({ currentPage }: Props) {
  const { state, advanceFlow } = useGame();
  const { flowActive, flowStep, isOnboarded } = state;

  if (!isOnboarded || !flowActive) return null;
  if (flowStep !== currentPage) return null;
  if (flowStep === 'free') return null;

  const nextIdx = Math.min(
    ['collection', 'squad', 'packs', 'add_card', 'match', 'rewards', 'levelup', 'free'].indexOf(
      flowStep,
    ) + 1,
    7,
  );
  const nextStep = (
    [
      'collection',
      'squad',
      'packs',
      'add_card',
      'match',
      'rewards',
      'levelup',
      'free',
    ] as FlowStep[]
  )[nextIdx];
  if (!nextStep) return null;

  const href = FLOW_HREF[nextStep];
  const label = CTA_TEXT[currentPage];
  if (!label || !href) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-[slideUp_0.4s_ease-out]">
      <Link
        href={href}
        onClick={advanceFlow}
        className="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm
                   text-obsidian shadow-gold hover:scale-105 transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a)',
          boxShadow: '0 0 24px rgba(201,168,76,0.5), 0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <span className="text-lg">{FLOW_ICONS[nextStep]}</span>
        <span>{label}</span>
      </Link>
    </div>
  );
}

// ─── Versão inline (usa dentro de componentes client) ─────────────────────────

export function InlineFlowCTA({ currentPage }: Props) {
  const { state, advanceFlow } = useGame();
  if (!state.isOnboarded || !state.flowActive || state.flowStep !== currentPage) return null;

  const nextStep = (() => {
    const steps = [
      'collection',
      'squad',
      'packs',
      'add_card',
      'match',
      'rewards',
      'free',
    ] as FlowStep[];
    const idx = steps.indexOf(currentPage);
    return steps[idx + 1] ?? null;
  })();
  if (!nextStep) return null;

  const href = FLOW_HREF[nextStep];
  if (!href) return null;

  return (
    <Link
      href={href}
      onClick={advanceFlow}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm
                 text-obsidian transition-all hover:scale-105"
      style={{ background: 'linear-gradient(135deg, #8c6f27, #c9a84c)' }}
    >
      <span>{FLOW_ICONS[nextStep]}</span>
      <span>Próximo: {FLOW_LABELS[nextStep]} →</span>
    </Link>
  );
}
