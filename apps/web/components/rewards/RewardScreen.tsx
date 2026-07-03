'use client';

/**
 * RewardScreen — T056
 *
 * Tela de recompensas extremamente satisfatória.
 *
 * Sequência de fases:
 *   INTRO   → título + source badge
 *   XP      → partículas voando + barra enchendo
 *   CREDITS → moedas voando + contador subindo
 *   PACKS   → packs recebidos com glow
 *   LEVELUP → badge dourado + confetes (se subiu de nível)
 *   DONE    → botão continuar
 *
 * Toda fase tem:
 *   - Entrada com Framer Motion
 *   - Duração automática (onComplete callback)
 *   - Pode ser pulada com tap
 */

import type { PackReward, RewardData } from '@/lib/rewards-data';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { CreditsSection } from './CreditsSection';
import { LevelUpCelebration } from './LevelUpCelebration';
import { XpSection } from './XpSection';

type Phase = 'INTRO' | 'XP' | 'CREDITS' | 'PACKS' | 'LEVELUP' | 'DONE';

type Props = {
  data: RewardData;
  onContinue: () => void;
};

const SOURCE_LABEL: Record<string, { icon: string; label: string }> = {
  match: { icon: '🏟', label: 'Partida' },
  pack: { icon: '📦', label: 'Pack Aberto' },
  daily: { icon: '📅', label: 'Recompensa Diária' },
  event: { icon: '⚡', label: 'Evento' },
  achievement: { icon: '🏆', label: 'Conquista' },
};

export function RewardScreen({ data, onContinue }: Props) {
  const [phase, setPhase] = useState<Phase>('INTRO');

  const advance = useCallback(() => {
    setPhase((prev) => {
      switch (prev) {
        case 'INTRO':
          return 'XP';
        case 'XP':
          return 'CREDITS';
        case 'CREDITS':
          return data.packs.length > 0 ? 'PACKS' : data.leveledUp ? 'LEVELUP' : 'DONE';
        case 'PACKS':
          return data.leveledUp ? 'LEVELUP' : 'DONE';
        case 'LEVELUP':
          return 'DONE';
        default:
          return 'DONE';
      }
    });
  }, [data.packs.length, data.leveledUp]);

  // Auto-advance INTRO after 1.5s
  const handleIntroComplete = useCallback(() => {
    setTimeout(advance, 1500);
  }, [advance]);

  const src = SOURCE_LABEL[data.source] ?? SOURCE_LABEL.match!;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.12), transparent 60%), #050508',
      }}
      onClick={phase !== 'DONE' ? advance : undefined}
    >
      {/* Background aura */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: '#3b82f6' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: '#a855f7' }}
        />
      </div>

      {/* Phase transitions */}
      <AnimatePresence mode="wait">
        {/* INTRO */}
        {phase === 'INTRO' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="text-center px-8"
            onAnimationComplete={handleIntroComplete}
          >
            <motion.div
              className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <span>{src.icon}</span>
              <span className="text-white/50 text-xs">{src.label}</span>
            </motion.div>

            <motion.h1
              className="font-display text-6xl sm:text-7xl text-white tracking-wider"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 150, damping: 12 }}
              style={{ textShadow: '0 0 60px rgba(59,130,246,0.5)' }}
            >
              {data.title.toUpperCase()}
            </motion.h1>

            <motion.p
              className="text-white/30 text-sm mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Toque para continuar
            </motion.p>
          </motion.div>
        )}

        {/* XP */}
        {phase === 'XP' && (
          <motion.div
            key="xp"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-sm px-6"
          >
            <SectionHeader title="XP Ganho" icon="⭐" color="text-blue-400" />
            <XpSection data={data} onComplete={advance} />
          </motion.div>
        )}

        {/* CREDITS */}
        {phase === 'CREDITS' && (
          <motion.div
            key="credits"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="w-full max-w-sm px-6"
          >
            <SectionHeader title="Créditos" icon="💰" color="text-gold" />
            <CreditsSection
              prevCredits={data.prevCredits}
              creditsGained={data.creditsGained}
              newCredits={data.newCredits}
              bonuses={data.bonuses}
              onComplete={advance}
            />
          </motion.div>
        )}

        {/* PACKS */}
        {phase === 'PACKS' && (
          <motion.div
            key="packs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm px-6"
          >
            <SectionHeader title="Packs Recebidos" icon="📦" color="text-purple-400" />
            <PacksDisplay packs={data.packs} onComplete={advance} />
          </motion.div>
        )}

        {/* LEVELUP */}
        {phase === 'LEVELUP' && data.leveledUp && (
          <motion.div
            key="levelup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm px-6"
          >
            <LevelUpCelebration
              prevLevel={data.prevLevel}
              newLevel={data.newLevel}
              onComplete={advance}
            />
          </motion.div>
        )}

        {/* DONE */}
        {phase === 'DONE' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center px-8 space-y-6"
          >
            {/* Summary */}
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-4">Resumo</p>
              <div className="grid grid-cols-2 gap-3">
                <SumBox icon="⭐" label="XP" value={`+${data.xpGained}`} color="text-blue-400" />
                <SumBox
                  icon="💰"
                  label="Créditos"
                  value={`+${data.creditsGained.toLocaleString('pt-BR')}c`}
                  color="text-gold"
                />
                {data.leveledUp && (
                  <SumBox
                    icon="🏆"
                    label="Nível"
                    value={`${data.prevLevel} → ${data.newLevel}`}
                    color="text-gold"
                  />
                )}
                {data.packs.length > 0 && (
                  <SumBox
                    icon="📦"
                    label="Packs"
                    value={`×${data.packs.reduce((s, p) => s + p.count, 0)}`}
                    color="text-purple-400"
                  />
                )}
              </div>
            </div>

            {/* Continue button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onContinue();
              }}
              className="px-10 py-4 rounded-2xl font-display text-xl tracking-widest text-obsidian transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a)',
                boxShadow: '0 0 30px rgba(201,168,76,0.5), 0 4px 20px rgba(0,0,0,0.4)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              CONTINUAR
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase indicators */}
      {phase !== 'DONE' && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {(
            [
              'INTRO',
              'XP',
              'CREDITS',
              ...(data.packs.length > 0 ? ['PACKS'] : []),
              ...(data.leveledUp ? ['LEVELUP'] : []),
            ] as Phase[]
          ).map((p) => (
            <div
              key={p}
              className="rounded-full transition-all duration-300"
              style={{
                width: phase === p ? 16 : 6,
                height: 6,
                background: phase === p ? '#c9a84c' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function SectionHeader({ title, icon, color }: { title: string; icon: string; color: string }) {
  return (
    <motion.div
      className="flex items-center gap-2 mb-6"
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <span className="text-xl">{icon}</span>
      <h2 className={`font-display text-xl tracking-wider ${color}`}>{title.toUpperCase()}</h2>
    </motion.div>
  );
}

function SumBox({
  icon,
  label,
  value,
  color,
}: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="glass border border-white/8 rounded-xl p-3 text-center">
      <span className="text-xl">{icon}</span>
      <p className={`font-display text-xl mt-1 ${color}`}>{value}</p>
      <p className="text-white/30 text-[9px] mt-0.5">{label}</p>
    </div>
  );
}

function PacksDisplay({ packs, onComplete }: { packs: PackReward[]; onComplete: () => void }) {
  // Auto-complete
  useState(() => {
    setTimeout(onComplete, 2500);
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {packs.map((pack, i) => (
        <motion.div
          key={pack.id}
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: i * 0.15 }}
          className="relative flex items-center gap-4 px-5 py-4 rounded-2xl glass border border-white/10"
          style={{ boxShadow: `0 0 24px ${pack.color}` }}
        >
          <motion.span
            className="text-4xl"
            animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
          >
            {pack.icon}
          </motion.span>
          <div>
            <p className="text-parchment font-bold">{pack.name}</p>
            <p className="text-white/40 text-xs">
              ×{pack.count} recebido{pack.count > 1 ? 's' : ''}
            </p>
          </div>
          <motion.div
            className="ml-auto w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
            style={{ background: pack.color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}
          >
            ×{pack.count}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
