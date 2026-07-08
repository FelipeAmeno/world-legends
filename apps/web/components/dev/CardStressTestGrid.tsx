'use client';

/**
 * components/dev/CardStressTestGrid.tsx — Sprint 18.9 (Premium Card Engine —
 * Final Assembly, item 6)
 *
 * Renderiza N `PlayerCard` reais (import direto, mesmo componente do jogo)
 * e mede FPS via `requestAnimationFrame`. Um único loop contínuo alimenta
 * dois buffers: uma janela curta (últimos 60 frames) pro contador ao vivo,
 * e um buffer que só acumula durante uma medição de N segundos disparada
 * pelo botão "Medir".
 */

import { PlayerCard, type PlayerCardData } from '@/components/cards/PlayerCard';
import { getFlagEmoji } from '@/lib/collection-data';
import type { RarityCode } from '@world-legends/types';
import { useEffect, useMemo, useRef, useState } from 'react';

const TIERS = [1, 10, 50, 200] as const;
type Tier = (typeof TIERS)[number];
const MEASURE_DURATION_MS = 4000;

type Props = {
  players: ReadonlyArray<{ id: string; knownAs: string; nationality: string }>;
  rarityCodes: readonly RarityCode[];
};

function buildCards(
  tier: Tier,
  players: Props['players'],
  rarityCodes: readonly RarityCode[],
): PlayerCardData[] {
  if (players.length === 0 || rarityCodes.length === 0) return [];
  const fallbackPlayer = players[0] as Props['players'][number];
  const fallbackRarity = rarityCodes[0] as RarityCode;
  return Array.from({ length: tier }, (_, i) => {
    const player = players[i % players.length] ?? fallbackPlayer;
    const rarityCode = rarityCodes[i % rarityCodes.length] ?? fallbackRarity;
    return {
      cardId: `stress-${i}`,
      playerId: player.id,
      displayName: player.knownAs,
      nationality: player.nationality,
      position: 'ST',
      rarityCode,
      rarityLabel: rarityCode,
      overall: 80 + (i % 20),
      flagEmoji: getFlagEmoji(player.nationality),
      era: '2020s',
    };
  });
}

export function CardStressTestGrid({ players, rarityCodes }: Props) {
  const [tier, setTier] = useState<Tier>(1);
  const [liveFps, setLiveFps] = useState(0);
  const [measuring, setMeasuring] = useState(false);
  const [results, setResults] = useState<
    Record<Tier, { avg: number; min: number; samples: number } | undefined>
  >({ 1: undefined, 10: undefined, 50: undefined, 200: undefined });

  const liveWindow = useRef<number[]>([]);
  const measureBuffer = useRef<number[] | null>(null);

  const cards = useMemo(() => buildCards(tier, players, rarityCodes), [tier, players, rarityCodes]);

  useEffect(() => {
    let last = performance.now();
    let frameCount = 0;
    let raf: number;

    const loop = (t: number) => {
      const delta = t - last;
      last = t;
      const instFps = delta > 0 ? 1000 / delta : 0;

      liveWindow.current.push(instFps);
      if (liveWindow.current.length > 60) liveWindow.current.shift();

      if (measureBuffer.current) measureBuffer.current.push(instFps);

      frameCount++;
      if (frameCount % 6 === 0) {
        const avg = liveWindow.current.reduce((a, b) => a + b, 0) / liveWindow.current.length;
        setLiveFps(Math.round(avg));
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const runMeasurement = () => {
    setMeasuring(true);
    measureBuffer.current = [];
    setTimeout(() => {
      const samples = measureBuffer.current ?? [];
      const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
      const min = samples.length ? Math.min(...samples) : 0;
      setResults((prev) => ({
        ...prev,
        [tier]: { avg: Math.round(avg), min: Math.round(min), samples: samples.length },
      }));
      measureBuffer.current = null;
      setMeasuring(false);
    }, MEASURE_DURATION_MS);
  };

  return (
    <div className="min-h-screen bg-[#07080f] text-white/90 px-4 py-8 sm:px-8">
      <header className="mb-6 max-w-5xl mx-auto">
        <h1 className="font-display text-2xl text-parchment mb-1">Card Asset Stress Test</h1>
        <p className="text-white/40 text-sm">
          Ferramenta interna (Sprint 18.9) — renderiza N cartas reais simultaneamente e mede FPS ao
          vivo. Não é uma tela de jogo.
        </p>
      </header>

      <div className="max-w-5xl mx-auto space-y-6">
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-wrap items-center gap-4">
          <div className="flex gap-1.5">
            {TIERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  tier === t
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                {t} carta{t > 1 ? 's' : ''}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-white/40 text-xs uppercase tracking-wider">FPS ao vivo</span>
            <span
              className={`font-display text-2xl ${
                liveFps >= 50
                  ? 'text-emerald-400'
                  : liveFps >= 30
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {liveFps}
            </span>
          </div>

          <button
            type="button"
            onClick={runMeasurement}
            disabled={measuring}
            className="px-3 py-1.5 rounded-lg text-sm border border-amber-400/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 transition-colors"
          >
            {measuring ? `Medindo (${MEASURE_DURATION_MS / 1000}s)…` : 'Medir 4s'}
          </button>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="font-display text-lg text-parchment mb-3">Resultados por tier</h2>
          <table className="w-full text-sm">
            <thead className="text-white/40 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left py-1.5 font-normal">Cartas</th>
                <th className="text-left py-1.5 font-normal">FPS médio</th>
                <th className="text-left py-1.5 font-normal">FPS mínimo</th>
                <th className="text-left py-1.5 font-normal">Amostras</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => {
                const r = results[t];
                return (
                  <tr key={t} className="border-t border-white/5">
                    <td className="py-1.5">{t}</td>
                    <td className="py-1.5">{r ? r.avg : '—'}</td>
                    <td className="py-1.5">{r ? r.min : '—'}</td>
                    <td className="py-1.5 text-white/40">{r ? r.samples : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-display text-lg text-parchment mb-3">
            Grid ({cards.length} carta{cards.length > 1 ? 's' : ''})
          </h2>
          <div className="flex flex-wrap gap-2">
            {cards.map((c) => (
              <PlayerCard key={c.cardId} card={c} size="sm" glow />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
