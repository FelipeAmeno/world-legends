'use client';

import type { SBSnapshot, SBState } from '@/lib/squad-builder';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

type Props = {
  snapshot: SBSnapshot;
  state: SBState;
};

const SECTOR_GRAD = {
  attack: 'from-red-600 to-red-800',
  midfield: 'from-emerald-600 to-emerald-800',
  defense: 'from-blue-600 to-blue-800',
};

export function SquadOvrPanel({ snapshot, state }: Props) {
  const r = snapshot.rating;
  const c = snapshot.chemistry;

  const chemColor =
    c.total >= 80 ? 'text-emerald-400' : c.total >= 60 ? 'text-blue-400' : c.total >= 40 ? 'text-yellow-400' : 'text-muted';
  const chemBg =
    c.total >= 80 ? 'from-emerald-700 to-emerald-900'
    : c.total >= 60 ? 'from-blue-700 to-blue-900'
    : c.total >= 40 ? 'from-yellow-700 to-yellow-900'
    : 'from-gray-700 to-gray-900';

  // Collect active traits from starters
  const activeTraits = useMemo(() => {
    const map = new Map<string, { name: string; tier: 1 | 2 | 3; count: number }>();
    for (const card of Object.values(state.slots)) {
      if (!card) continue;
      for (const t of card.traits) {
        const existing = map.get(t.name);
        if (existing) map.set(t.name, { ...existing, count: existing.count + 1 });
        else map.set(t.name, { name: t.name, tier: t.tier, count: 1 });
      }
    }
    return [...map.values()].sort((a, b) => b.tier - a.tier || b.count - a.count);
  }, [state.slots]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* OVR principal */}
      <div className="text-center py-4 glass rounded-2xl">
        <p className="text-muted text-[9px] uppercase tracking-[0.3em] mb-1">OVR Geral</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={r.overall}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="font-display leading-none gold-text"
            style={{ fontSize: 72 }}
          >
            {r.overall || '—'}
          </motion.p>
        </AnimatePresence>
        <p className="text-muted text-[10px] mt-1">{snapshot.starterCount}/11 titulares</p>
      </div>

      {/* Setores */}
      {r.overall > 0 && (
        <div className="space-y-2">
          <SectorBar label="Ataque" value={r.attack} grad={SECTOR_GRAD.attack} />
          <SectorBar label="Meio" value={r.midfield} grad={SECTOR_GRAD.midfield} />
          <SectorBar label="Defesa" value={r.defense} grad={SECTOR_GRAD.defense} />
        </div>
      )}

      {/* Química */}
      <div className="glass rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-muted text-[9px] uppercase tracking-wider">Química</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={c.total}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`font-display text-2xl ${chemColor}`}
            >
              {c.total || '—'}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${chemBg}`}
            animate={{ width: `${c.total}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {c.total > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
            <ChemStat label="Nac" value={c.breakdown.nationalityLinks} color="text-amber-400" />
            <ChemStat label="Liga" value={c.breakdown.competitionLinks} color="text-blue-400" />
            <ChemStat label="Era" value={c.breakdown.eraLinks} color="text-purple-400" />
          </div>
        )}
        {c.breakdown.perfectLinks > 0 && (
          <motion.p
            className="text-gold text-[9px] text-center mt-1.5"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨ {c.breakdown.perfectLinks} links perfeitos
          </motion.p>
        )}
      </div>

      {/* Traits ativos */}
      {activeTraits.length > 0 && (
        <div className="glass rounded-xl p-3">
          <p className="text-muted text-[9px] uppercase tracking-wider mb-2">Traits Ativos</p>
          <div className="flex flex-wrap gap-1.5">
            {activeTraits.slice(0, 8).map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-gold/25 bg-gold/5"
              >
                <span className="text-parchment text-[8px] font-semibold">{t.name}</span>
                <span className="text-[7px] text-gold opacity-70">×{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legenda química */}
      <div className="glass rounded-xl p-3">
        <p className="text-muted text-[9px] uppercase tracking-wider mb-2">Legenda</p>
        <div className="space-y-1">
          <ChemLegend color="rgba(201,168,76,1)" label="Perfeito (4)" />
          <ChemLegend color="rgba(34,197,94,1)" label="Ótimo (3)" />
          <ChemLegend color="rgba(234,179,8,1)" label="OK (1-2)" />
          <ChemLegend color="rgba(239,68,68,0.8)" label="Fraco (0)" />
        </div>
        <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
          <p className="text-muted text-[9px] uppercase tracking-wider mb-1">Posição</p>
          <CompatLegend color="#22c55e" label="Natural" />
          <CompatLegend color="#eab308" label="OK" />
          <CompatLegend color="#ef4444" label="Forçado" />
        </div>
      </div>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function SectorBar({ label, value, grad }: { label: string; value: number; grad: string }) {
  const pct = Math.round((value / 99) * 100);
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-muted">{label}</span>
        <motion.span key={value} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-parchment font-semibold">
          {value || '—'}
        </motion.span>
      </div>
      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${grad}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function ChemStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className={`font-display text-base ${color}`}>{value}</p>
      <p className="text-muted text-[8px]">{label}</p>
    </div>
  );
}

function ChemLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-0.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-[9px] text-muted/60">{label}</span>
    </div>
  );
}

function CompatLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/40" style={{ background: color }} />
      <span className="text-[9px] text-muted/60">{label}</span>
    </div>
  );
}
