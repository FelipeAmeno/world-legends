'use client';

import { useGame } from '@/lib/game-context';
import { FLOW_HREF, FLOW_ICONS, FLOW_LABELS, FLOW_STEPS, type FlowStep } from '@/lib/game-state';
import Link from 'next/link';

// Passos visíveis (excluir 'enter' e 'free' da barra)
const VISIBLE_STEPS: FlowStep[] = [
  'collection',
  'squad',
  'packs',
  'add_card',
  'match',
  'rewards',
  'levelup',
];

export function FlowProgress() {
  const { state, gotoFree } = useGame();
  const { flowActive, flowStep, isOnboarded } = state;

  // Não mostrar na tela de entrada ou quando em modo livre
  if (!isOnboarded || !flowActive || flowStep === 'enter' || flowStep === 'free') {
    return null;
  }

  const currentIdx = VISIBLE_STEPS.indexOf(flowStep);

  return (
    <div className="bg-midnight/95 border-b border-border/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-1 px-3 py-2 scroll-x-hide">
        {/* Label */}
        <span className="text-[9px] text-muted uppercase tracking-wider mr-2 shrink-0">Fluxo</span>

        {/* Passos */}
        {VISIBLE_STEPS.map((step, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const href = FLOW_HREF[step];

          const cls = [
            'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium shrink-0',
            'transition-all duration-200',
            isCurrent
              ? 'bg-gold/15 text-gold border border-gold/40'
              : isDone
                ? 'text-emerald-400 opacity-80'
                : 'text-muted opacity-50',
          ].join(' ');

          const content = (
            <>
              <span>{FLOW_ICONS[step]}</span>
              <span className="hidden sm:inline">{FLOW_LABELS[step]}</span>
              {isDone && <span className="text-emerald-400 text-[8px]">✓</span>}
              {isCurrent && (
                <span className="w-1 h-1 rounded-full bg-gold animate-pulse shrink-0" />
              )}
            </>
          );

          return (
            <div key={step} className="flex items-center gap-1">
              {href && !isCurrent ? (
                <Link href={href} className={cls}>
                  {content}
                </Link>
              ) : (
                <div className={cls}>{content}</div>
              )}

              {/* Conector */}
              {i < VISIBLE_STEPS.length - 1 && (
                <span
                  className={`text-[10px] shrink-0 ${isDone ? 'text-emerald-400/60' : 'text-border'}`}
                >
                  →
                </span>
              )}
            </div>
          );
        })}

        {/* Pular fluxo */}
        <button
          onClick={gotoFree}
          className="ml-auto shrink-0 text-[9px] text-muted hover:text-parchment transition-colors px-2"
        >
          pular ×
        </button>
      </div>
    </div>
  );
}
