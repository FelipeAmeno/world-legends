'use client';

/**
 * HalftimeScreen — Sprint 26 (Gameplay Foundation)
 *
 * Intervalo JOGÁVEL de verdade: placar parcial, posse, finalizações,
 * cartões, melhor/pior em campo, e três ações reais — Fazer
 * Substituições, Alterar Tática, Continuar — em vez do antigo pause
 * cosmético de 3.5s sem nenhuma decisão do usuário.
 */

import { TACTIC_DEFS } from '@/lib/match-data';
import type { HalftimeDisplay } from '@/lib/match-session';
import { SPRING } from '@/lib/motion-tokens';
import type { TacticalIntensity } from '@world-legends/engine';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

type View = 'stats' | 'subs' | 'tactics';

type Props = {
  halftime: HalftimeDisplay;
  busy: boolean;
  error: string | null;
  onSubstitute: (outgoingUserCardId: string, incomingUserCardId: string) => void;
  onChangeTactic: (intensity: TacticalIntensity) => void;
  onContinue: () => void;
};

export function HalftimeScreen({
  halftime,
  busy,
  error,
  onSubstitute,
  onChangeTactic,
  onContinue,
}: Props) {
  const [view, setView] = useState<View>('stats');
  const [outgoing, setOutgoing] = useState<string | null>(null);

  const subsLeft = halftime.maxSubs - halftime.homeSubsUsed;

  return (
    <div className="flex flex-col h-screen overflow-hidden px-4 py-6">
      {/* Header */}
      <div className="text-center mb-4">
        <p
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
          }}
        >
          Intervalo
        </p>
        <p className="font-display text-4xl gold-text mt-1">
          {halftime.homeScore} — {halftime.awayScore}
        </p>
        <p className="text-muted text-[10px] mt-1">
          {halftime.weather} · {halftime.referee}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {view === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 min-h-0 overflow-y-auto"
          >
            <StatsView halftime={halftime} />
          </motion.div>
        )}
        {view === 'subs' && (
          <motion.div
            key="subs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 min-h-0 overflow-y-auto"
          >
            <SubsView
              halftime={halftime}
              outgoing={outgoing}
              onPickOutgoing={setOutgoing}
              onSubstitute={(inId) => {
                if (!outgoing) return;
                onSubstitute(outgoing, inId);
                setOutgoing(null);
              }}
              busy={busy}
            />
          </motion.div>
        )}
        {view === 'tactics' && (
          <motion.div
            key="tactics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 min-h-0 overflow-y-auto"
          >
            <TacticsView onChangeTactic={onChangeTactic} busy={busy} />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-xs text-center mt-2 glass rounded-lg px-3 py-2"
        >
          ⚠️ {error}
        </motion.p>
      )}

      {/* Ações */}
      <div className="shrink-0 mt-4 space-y-2">
        {view !== 'stats' && (
          <button
            type="button"
            onClick={() => {
              setView('stats');
              setOutgoing(null);
            }}
            className="w-full py-2 rounded-xl text-xs text-white/50 border border-white/10"
          >
            ← Voltar
          </button>
        )}
        {view === 'stats' && (
          <>
            <button
              type="button"
              onClick={() => setView('subs')}
              disabled={subsLeft <= 0 || halftime.homeBench.length === 0}
              className="w-full py-3 rounded-xl font-bold text-sm glass border border-white/10 disabled:opacity-40"
            >
              🔄 Fazer Substituições {subsLeft > 0 ? `(${subsLeft} restantes)` : '(esgotadas)'}
            </button>
            <button
              type="button"
              onClick={() => setView('tactics')}
              className="w-full py-3 rounded-xl font-bold text-sm glass border border-white/10"
            >
              🎯 Alterar Tática
            </button>
            <motion.button
              type="button"
              onClick={onContinue}
              disabled={busy}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg,#8c6f27,#c9a84c,#e6c85a)',
                color: '#07080f',
                boxShadow: '0 0 16px rgba(201,168,76,0.3)',
              }}
            >
              {busy ? 'Preparando 2º tempo…' : '▶ Continuar pro 2º Tempo'}
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stats ─────────────────────────────────────────────────────────────────

function StatRow({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] text-muted mb-1">
        <span>{home}</span>
        <span>{label}</span>
        <span>{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px bg-white/5">
        <div
          className="bg-emerald-500 rounded-l-full"
          style={{ width: `${(home / total) * 100}%` }}
        />
        <div className="bg-red-500 rounded-r-full" style={{ width: `${(away / total) * 100}%` }} />
      </div>
    </div>
  );
}

function StatsView({ halftime }: { halftime: HalftimeDisplay }) {
  const s = halftime.stats;
  return (
    <div className="glass rounded-2xl p-4">
      <StatRow
        label="Posse"
        home={Math.round(s.possession[0])}
        away={Math.round(s.possession[1])}
      />
      <StatRow label="Finalizações" home={s.shots[0]} away={s.shots[1]} />
      <StatRow label="No alvo" home={s.shotsOnTarget[0]} away={s.shotsOnTarget[1]} />
      <StatRow label="Cartões amarelos" home={s.yellowCards[0]} away={s.yellowCards[1]} />
      <StatRow label="Cartões vermelhos" home={s.redCards[0]} away={s.redCards[1]} />

      <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
        <p className="text-[10px] text-muted">
          ⭐ Melhor em campo:{' '}
          <span className="text-emerald-400 font-bold">{halftime.bestPlayerName ?? '—'}</span>
        </p>
        <p className="text-[10px] text-muted">
          📉 Pior em campo:{' '}
          <span className="text-red-400 font-bold">{halftime.worstPlayerName ?? '—'}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Substituições ────────────────────────────────────────────────────────

function SubsView({
  halftime,
  outgoing,
  onPickOutgoing,
  onSubstitute,
  busy,
}: {
  halftime: HalftimeDisplay;
  outgoing: string | null;
  onPickOutgoing: (id: string) => void;
  onSubstitute: (incomingUserCardId: string) => void;
  busy: boolean;
}) {
  if (!outgoing) {
    return (
      <div>
        <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Quem sai?</p>
        <div className="space-y-1.5">
          {halftime.homeFieldPlayers.map((p) => (
            <button
              key={p.userCardId}
              type="button"
              onClick={() => p.userCardId && onPickOutgoing(p.userCardId)}
              className="w-full flex items-center gap-2 glass rounded-xl px-3 py-2 text-left hover:bg-white/[0.06] transition-colors"
            >
              <span className="w-8 text-[9px] text-muted">{p.position}</span>
              <span className="flex-1 text-sm text-parchment">{p.name}</span>
              <span className="font-display text-gold text-sm">{p.ovr}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const outPlayer = halftime.homeFieldPlayers.find((p) => p.userCardId === outgoing);

  return (
    <div>
      <p className="text-[10px] text-muted uppercase tracking-wider mb-2">
        Quem entra no lugar de <span className="text-parchment">{outPlayer?.name}</span>?
      </p>
      <div className="space-y-1.5">
        {halftime.homeBench.map((p) => (
          <button
            key={p.userCardId}
            type="button"
            disabled={busy}
            onClick={() => p.userCardId && onSubstitute(p.userCardId)}
            className="w-full flex items-center gap-2 glass rounded-xl px-3 py-2 text-left hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            <span className="w-8 text-[9px] text-muted">{p.position}</span>
            <span className="flex-1 text-sm text-parchment">{p.name}</span>
            <span className="font-display text-gold text-sm">{p.ovr}</span>
          </button>
        ))}
        {halftime.homeBench.length === 0 && (
          <p className="text-muted text-xs text-center py-4">Banco vazio.</p>
        )}
      </div>
    </div>
  );
}

// ─── Táticas ──────────────────────────────────────────────────────────────

function TacticsView({
  onChangeTactic,
  busy,
}: {
  onChangeTactic: (intensity: TacticalIntensity) => void;
  busy: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Nova mentalidade</p>
      <div className="space-y-1.5">
        {TACTIC_DEFS.map((t) => (
          <motion.button
            key={t.value}
            type="button"
            disabled={busy}
            onClick={() => onChangeTactic(t.value)}
            whileTap={{ scale: 0.98 }}
            transition={SPRING.snappy}
            className="w-full glass rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            <p className="text-sm font-bold text-parchment">{t.label}</p>
            <p className="text-[10px] text-muted mt-0.5">{t.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
