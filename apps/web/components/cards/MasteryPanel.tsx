'use client';

import { motion } from 'framer-motion';
import { MASTERY_LEVELS } from '@world-legends/card-mastery';
import type { CardMasteryView } from '@/lib/actions/card-mastery';

type Props = {
  mastery: CardMasteryView;
};

export function MasteryPanel({ mastery }: Props) {
  const { state, levelConfig, nextLevelConfig } = mastery;

  return (
    <div className="rounded-2xl border border-white/5 bg-surface/60 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border"
          style={{
            background: `radial-gradient(circle, ${levelConfig.glowColor}25 0%, transparent 70%)`,
            borderColor: `${levelConfig.glowColor}50`,
            boxShadow: `0 0 12px ${levelConfig.glowColor}30`,
          }}
        >
          {levelConfig.icon}
        </div>
        <div>
          <p className="text-parchment text-sm font-bold">Maestria de Carta</p>
          <p style={{ color: levelConfig.glowColor }} className="text-xs font-bold">
            {levelConfig.name} — Nível {state.level}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-muted text-[9px] uppercase tracking-wider">XP Total</p>
          <p className="text-parchment font-display text-sm">{state.xp.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Progress bar */}
      {state.level < 5 && nextLevelConfig && (
        <div className="mb-4">
          <div className="flex justify-between text-[9px] text-muted mb-1">
            <span>{levelConfig.name}</span>
            <span>{state.xpToNextLevel} XP para {nextLevelConfig.name}</span>
          </div>
          <div className="h-2 rounded-full bg-black/30 border border-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${levelConfig.glowColor}90, ${levelConfig.glowColor})`,
                boxShadow: `0 0 8px ${levelConfig.glowColor}60`,
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${state.progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-end mt-0.5">
            <span className="text-[8px] text-muted">{state.progressPct}%</span>
          </div>
        </div>
      )}

      {/* Max level banner */}
      {state.level === 5 && (
        <div
          className="mb-4 py-2 px-3 rounded-xl border text-center"
          style={{
            background: `radial-gradient(circle, ${levelConfig.glowColor}15 0%, transparent 70%)`,
            borderColor: `${levelConfig.glowColor}40`,
          }}
        >
          <p style={{ color: levelConfig.glowColor }} className="text-xs font-bold tracking-wider">
            ⭐ MAESTRIA MÁXIMA ALCANÇADA
          </p>
        </div>
      )}

      {/* Level track */}
      <div className="flex items-center gap-1">
        {MASTERY_LEVELS.map((lvl) => {
          const isReached = state.level >= lvl.level;
          const isCurrent = state.level === lvl.level;
          return (
            <motion.div
              key={lvl.level}
              className="flex-1 flex flex-col items-center gap-1"
              animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <div
                className="w-full h-1.5 rounded-full"
                style={{
                  background: isReached ? lvl.glowColor : 'rgba(255,255,255,0.07)',
                  boxShadow: isCurrent ? `0 0 8px ${lvl.glowColor}80` : undefined,
                }}
              />
              <span
                className="text-[6px] font-bold"
                style={{ color: isReached ? lvl.glowColor : '#3a3f5c' }}
              >
                {lvl.icon}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Unlocked effects */}
      {(levelConfig.titleUnlock ?? levelConfig.effectUnlock) && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {levelConfig.titleUnlock && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-900/30 border border-amber-400/30 text-amber-300">
              🏷️ Título: {levelConfig.titleUnlock}
            </span>
          )}
          {levelConfig.effectUnlock && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-900/30 border border-purple-400/30 text-purple-300">
              ✨ Efeito: {levelConfig.effectUnlock}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
