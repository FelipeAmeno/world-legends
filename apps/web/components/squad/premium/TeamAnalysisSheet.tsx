'use client';

import type { SBSnapshot, SquadSlots } from '@/lib/squad-builder';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

type Props = {
  open: boolean;
  snapshot: SBSnapshot;
  slots: SquadSlots;
  starterCount: number;
  onClose: () => void;
};

const RARITY_WEIGHT: Record<string, number> = {
  common: 40,
  rare: 55,
  elite: 70,
  legendary: 85,
  ultra: 92,
  world_cup_hero: 99,
};

type Axis = { key: string; label: string; value: number; color: string };

// ─── Radar chart (hand-rolled SVG, sem dependências externas) ─────────────────

function RadarChart({ axes }: { axes: Axis[] }) {
  const size = 220;
  const center = size / 2;
  const maxR = size / 2 - 28;
  const n = axes.length;

  const pointAt = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const ringLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = axes.map((a, i) => pointAt(i, (Math.max(a.value, 0) / 99) * maxR));
  const dataPath = `${dataPoints.map((p) => `${p.x},${p.y}`).join(' ')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Radar de atributos do time"
    >
      {/* Rings */}
      {ringLevels.map((lvl) => (
        <polygon
          key={lvl}
          points={Array.from({ length: n }, (_, i) => pointAt(i, maxR * lvl))
            .map((p) => `${p.x},${p.y}`)
            .join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}
      {/* Spokes */}
      {axes.map((a, i) => {
        const p = pointAt(i, maxR);
        return (
          <line
            key={a.key}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}
      {/* Data polygon */}
      <motion.polygon
        points={dataPath}
        fill="rgba(201,168,76,0.22)"
        stroke="#c9a84c"
        strokeWidth={1.5}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      />
      {axes.map((a, i) => {
        const p = dataPoints[i];
        if (!p) return null;
        return <circle key={a.key} cx={p.x} cy={p.y} r={2.5} fill="#e6c85a" />;
      })}
      {/* Labels */}
      {axes.map((a, i) => {
        const p = pointAt(i, maxR + 16);
        return (
          <text
            key={a.key}
            x={p.x}
            y={p.y}
            fill={a.color}
            fontSize={9}
            fontWeight={700}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Comentários automáticos ───────────────────────────────────────────────────

type AxisMap = { atk: number; mid: number; def: number; gk: number; chem: number; exp: number };

function buildComments(axes: AxisMap, starterCount: number): string[] {
  const out: string[] = [];

  if (starterCount < 11) {
    out.push(`⚠ Time incompleto — faltam ${11 - starterCount} jogador(es) para escalar 11.`);
  }
  if (axes.chem < 40) {
    out.push(
      '🔗 Química baixa. Priorize jogadores do mesmo país ou continente nos slots vizinhos.',
    );
  } else if (axes.chem >= 80) {
    out.push('🔗 Química excelente — o time joga como um bloco coeso.');
  }
  if (axes.def < 65 && starterCount >= 8) {
    out.push('🛡 Defesa frágil. Considere reforçar a linha de fundo antes de partidas difíceis.');
  }
  if (axes.atk >= 85) {
    out.push('⚔ Ataque devastador — pronto para decidir jogos no detalhe.');
  }
  if (axes.gk > 0 && axes.gk < 60) {
    out.push('🧤 Goleiro abaixo do nível do resto do elenco — pode custar gols evitáveis.');
  }
  if (axes.exp >= 80) {
    out.push('⭐ Elenco de peso — muitas cartas lendárias/ultra elevam o padrão do time.');
  }
  if (out.length === 0) {
    out.push('✓ Time equilibrado, sem pontos fracos evidentes.');
  }
  return out;
}

export function TeamAnalysisSheet({ open, snapshot, slots, starterCount, onClose }: Props) {
  const axesMap = useMemo<AxisMap>(() => {
    const gkCard = slots.GK ?? null;
    const cards = Object.values(slots).filter((c): c is NonNullable<typeof c> => c !== null);
    const exp =
      cards.length === 0
        ? 0
        : Math.round(
            cards.reduce((sum, c) => sum + (RARITY_WEIGHT[c.rarityCode] ?? 40), 0) / cards.length,
          );
    return {
      atk: snapshot.rating.attack,
      mid: snapshot.rating.midfield,
      def: snapshot.rating.defense,
      gk: gkCard?.overall ?? 0,
      chem: snapshot.chemistry.total,
      exp,
    };
  }, [snapshot, slots]);

  const axes = useMemo<Axis[]>(
    () => [
      { key: 'atk', label: 'ATK', value: axesMap.atk, color: '#ef4444' },
      { key: 'mid', label: 'MID', value: axesMap.mid, color: '#10b981' },
      { key: 'def', label: 'DEF', value: axesMap.def, color: '#3b82f6' },
      { key: 'gk', label: 'GK', value: axesMap.gk, color: '#f59e0b' },
      { key: 'chem', label: 'QUÍM', value: axesMap.chem, color: '#60a5fa' },
      { key: 'exp', label: 'EXP', value: axesMap.exp, color: '#c084fc' },
    ],
    [axesMap],
  );

  const comments = useMemo(() => buildComments(axesMap, starterCount), [axesMap, starterCount]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl overflow-hidden"
            style={{
              maxHeight: '85vh',
              background: '#0d0f18',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between px-4 pb-2 shrink-0">
              <div>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">
                  Análise do time
                </p>
                <p className="text-parchment font-bold text-sm">
                  {snapshot.rating.overall || '—'} OVR geral
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:bg-white/15 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <div className="flex justify-center py-2">
                <RadarChart axes={axes} />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                {comments.map((c, i) => (
                  <motion.div
                    key={c}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-lg bg-white/[0.03] border border-white/8 px-3 py-2 text-[11px] text-white/70 leading-snug"
                  >
                    {c}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
