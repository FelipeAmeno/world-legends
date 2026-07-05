'use client';

import { UI_HAPTIC } from '@/lib/haptics';
import type { MissionReward, MissionView } from '@/lib/mission-system';
import { markTodayAction } from '@/lib/retention-store';
import { REWARD_SFX } from '@/lib/sound-manager';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

type Props = {
  view: MissionView;
  onClaim: (missionId: string, stage: number) => void;
  disabled?: boolean;
};

// Gradientes por tier de estágio
const TIER_BG: Record<string, string> = {
  Bronze: 'from-amber-900/60 to-amber-800/30',
  Prata: 'from-slate-700/60 to-slate-600/30',
  Ouro: 'from-yellow-800/60 to-amber-700/30',
  Platina: 'from-cyan-900/60 to-cyan-700/30',
  Diamante: 'from-purple-900/60 to-blue-800/30',
  Iniciante: 'from-surface to-surface',
  Colecionador: 'from-blue-900/40 to-blue-800/20',
  Curador: 'from-indigo-900/40 to-indigo-800/20',
  Mestre: 'from-purple-900/60 to-purple-800/30',
  Lenda: 'from-amber-900/60 to-amber-700/30',
  '': 'from-surface to-surface',
};

const REWARD_COLORS: Record<string, string> = {
  xp: 'bg-blue-900/40 border-blue-700/50 text-blue-300',
  credits: 'bg-amber-900/40 border-amber-700/50 text-amber-300',
  pack: 'bg-purple-900/40 border-purple-700/50 text-purple-300',
  fragments: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-300',
};

export function MissionCard({ view, onClaim, disabled = false }: Props) {
  const { def, progress, currentStage, pct, claimable, allDone } = view;
  const [claiming, setClaiming] = useState(false);

  const isMultiStage = def.stages.length > 1;
  const stageBg = TIER_BG[currentStage.label] ?? TIER_BG[''];

  const handleClaim = async () => {
    if (!claimable || claiming || disabled) return;
    setClaiming(true);
    UI_HAPTIC.missionDone();
    REWARD_SFX.missionDone();
    markTodayAction('mission');
    onClaim(def.id, currentStage.stage);
    await new Promise((r) => setTimeout(r, 600));
    setClaiming(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        'relative rounded-2xl border overflow-hidden transition-all duration-200',
        allDone
          ? 'border-white/5 bg-surface/50 opacity-60'
          : claimable
            ? 'border-gold/40 shadow-gold'
            : 'border-border bg-surface',
      ].join(' ')}
    >
      {/* Gradiente de fundo se claimable */}
      {claimable && !allDone && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${stageBg}`}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      )}

      <div className="relative z-10 p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <motion.div
            className="w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-2xl shrink-0"
            animate={claimable ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          >
            {def.icon}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-parchment text-sm font-bold leading-tight">{def.title}</p>
                <p className="text-muted text-[10px] mt-0.5">{def.desc}</p>
              </div>

              {/* Stage badge (multi-stage) */}
              {isMultiStage && (
                <div className="shrink-0">
                  <StageBadges total={def.stages.length} current={view.progress.stageClaimed} />
                </div>
              )}
            </div>

            {/* Progress bar */}
            {!allDone && (
              <div className="mt-2.5">
                <div className="flex justify-between text-[9px] text-muted mb-1">
                  <span>{progress.current.toLocaleString('pt-BR')}</span>
                  <span>/{currentStage.target.toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className={`h-full rounded-full ${claimable ? 'bg-gold' : 'bg-steel'}`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    {...(claimable ? { style: { boxShadow: '0 0 8px rgba(201,168,76,0.6)' } } : {})}
                  />
                </div>
              </div>
            )}

            {/* Rewards */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentStage.rewards.map((r, i) => (
                <RewardChip key={i} reward={r} />
              ))}
            </div>
          </div>
        </div>

        {/* Claim button */}
        <AnimatePresence>
          {(claimable || allDone) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              {allDone ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <span>✓</span>
                  <span>Completada</span>
                </div>
              ) : (
                <motion.button
                  onClick={handleClaim}
                  disabled={claiming || disabled}
                  className={[
                    'w-full py-2.5 rounded-xl font-display text-sm tracking-wider transition-all',
                    claiming || disabled
                      ? 'opacity-60 cursor-wait'
                      : 'hover:scale-[1.02] active:scale-[0.98]',
                  ].join(' ')}
                  style={{
                    background: 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a)',
                    boxShadow: '0 0 16px rgba(201,168,76,0.4)',
                    color: '#07080f',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {claiming ? '✨ Coletando…' : '🎁 COLETAR RECOMPENSA'}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Próximo stage hint */}
        {isMultiStage && !claimable && !allDone && view.nextStage && (
          <p className="text-muted/50 text-[8px] mt-2">
            Próximo: {view.nextStage.label} em {view.nextStage.target.toLocaleString('pt-BR')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function RewardChip({ reward }: { reward: MissionReward }) {
  const cls = REWARD_COLORS[reward.kind] ?? REWARD_COLORS.credits!;
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {reward.icon} {reward.label}
    </span>
  );
}

function StageBadges({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: i < current ? '#c9a84c' : 'rgba(255,255,255,0.12)' }}
        />
      ))}
    </div>
  );
}
