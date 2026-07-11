'use client';

/**
 * components/dev/StaticCardPipelineComparison.tsx — Sprint 35B (Static
 * Card Pipeline Foundation)
 *
 * Ferramenta interna (`/dev/static-card-pipeline`) — não é uma tela de
 * jogo. Compara o `PlayerCard` atual (Card Engine v3, procedural +
 * arte real por canal) contra o `StaticWorldLegendsCard` experimental
 * (artwork pré-composto via Sharp) lado a lado, nas 3 densidades, com
 * medição real de DOM nodes e tempo de render.
 */

import { useEffect, useRef, useState } from 'react';
import { PlayerCard } from '../cards/PlayerCard';
import type { PlayerCardData } from '../cards/card-types';
import { type StaticCardDensity, StaticWorldLegendsCard } from './StaticWorldLegendsCard';

const DENSITY_TO_SIZE = { compact: 'sm', standard: 'md', showcase: 'lg' } as const;

const GOAT_CARD: PlayerCardData = {
  cardId: 'static-pipeline-goat',
  playerId: 'static-pipeline-goat',
  displayName: 'Validação GOAT',
  nationality: 'BR',
  position: 'ST',
  rarityCode: 'ultra',
  rarityLabel: 'GOAT',
  overall: 97,
  flagEmoji: '🇧🇷',
  era: '1970s',
  v3CompositionId: 'ultra-validation-01',
};

function useDomNodeCount<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [renderMs, setRenderMs] = useState<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const raf = requestAnimationFrame(() => {
      setRenderMs(Math.round((performance.now() - start) * 100) / 100);
      setCount(ref.current?.querySelectorAll('*').length ?? 0);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return { ref, count, renderMs };
}

function MeasuredBlock({ label, children }: { label: string; children: React.ReactNode }) {
  const { ref, count, renderMs } = useDomNodeCount<HTMLDivElement>();
  return (
    <div style={{ textAlign: 'center' }}>
      <div ref={ref}>{children}</div>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>{label}</p>
      <p style={{ fontSize: 10, color: '#6b7280' }}>
        {count ?? '…'} nós DOM · {renderMs ?? '…'}ms até 1º paint
      </p>
    </div>
  );
}

// ─── Stress test — mesma técnica de CardStressTestGrid.tsx (Sprint
// 18.9/34), aplicada ao StaticWorldLegendsCard pra comparar FPS na
// mesma escala (1/10/50/200) já medida pro PlayerCard. ───────────────

const TIERS = [1, 10, 50, 200] as const;
type Tier = (typeof TIERS)[number];
const MEASURE_DURATION_MS = 4000;

function StaticStressTest() {
  const [tier, setTier] = useState<Tier>(1);
  const [liveFps, setLiveFps] = useState(0);
  const [measuring, setMeasuring] = useState(false);
  const [results, setResults] = useState<Record<Tier, { avg: number; min: number } | undefined>>({
    1: undefined,
    10: undefined,
    50: undefined,
    200: undefined,
  });
  const liveWindow = useRef<number[]>([]);
  const measureBuffer = useRef<number[] | null>(null);

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
        setLiveFps(
          Math.round(liveWindow.current.reduce((a, b) => a + b, 0) / liveWindow.current.length),
        );
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
      setResults((prev) => ({ ...prev, [tier]: { avg: Math.round(avg), min: Math.round(min) } }));
      measureBuffer.current = null;
      setMeasuring(false);
    }, MEASURE_DURATION_MS);
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
        Stress test — StaticWorldLegendsCard (Compact)
      </h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        {TIERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTier(t)}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${tier === t ? '#4ade80' : '#3f3f46'}`,
              background: tier === t ? 'rgba(74,222,128,0.1)' : '#18181b',
              color: '#e5e7eb',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
        <span style={{ fontSize: 12, marginLeft: 12 }}>FPS ao vivo: {liveFps}</span>
        <button
          type="button"
          onClick={runMeasurement}
          disabled={measuring}
          style={{
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #d97706',
            background: 'rgba(217,119,6,0.1)',
            color: '#fbbf24',
            cursor: 'pointer',
          }}
        >
          {measuring ? `Medindo (${MEASURE_DURATION_MS / 1000}s)…` : 'Medir 4s'}
        </button>
      </div>
      <table style={{ fontSize: 12, marginBottom: 16, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#9ca3af' }}>
            <th style={{ textAlign: 'left', paddingRight: 16 }}>Cartas</th>
            <th style={{ textAlign: 'left', paddingRight: 16 }}>FPS médio</th>
            <th style={{ textAlign: 'left' }}>FPS mínimo</th>
          </tr>
        </thead>
        <tbody>
          {TIERS.map((t) => (
            <tr key={t}>
              <td style={{ paddingRight: 16 }}>{t}</td>
              <td style={{ paddingRight: 16 }}>{results[t]?.avg ?? '—'}</td>
              <td>{results[t]?.min ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {Array.from({ length: tier }, (_, i) => (
          <StaticWorldLegendsCard
            key={i}
            presetId="goat-validation-001"
            density="compact"
            displayName="GOAT"
            overall={97}
            position="ST"
          />
        ))}
      </div>
    </div>
  );
}

export function StaticCardPipelineComparison() {
  const [density, setDensity] = useState<StaticCardDensity>('standard');

  return (
    <div style={{ padding: 24, color: '#e5e7eb', background: '#0a0b10', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Static Card Pipeline</h1>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20, maxWidth: 640 }}>
        Ferramenta interna (Sprint 35B) — não é uma tela de jogo. Compara o <code>PlayerCard</code>{' '}
        atual (Card Engine v3) contra o <code>StaticWorldLegendsCard</code> experimental (artwork
        pré-composto via Sharp, build-time) usando a mesma carta GOAT de validação (
        <code>ultra-validation-01</code> / <code>goat-validation-001</code>). O renderer atual NÃO
        foi substituído — os dois coexistem.
      </p>

      <fieldset
        style={{
          border: '1px solid #27272a',
          borderRadius: 8,
          padding: 12,
          marginBottom: 24,
          display: 'inline-block',
        }}
      >
        <legend style={{ fontSize: 11, color: '#9ca3af', padding: '0 6px' }}>Densidade</legend>
        {(['compact', 'standard', 'showcase'] as StaticCardDensity[]).map((d) => (
          <label key={d} style={{ marginRight: 12, fontSize: 13 }}>
            <input
              type="radio"
              name="density"
              checked={density === d}
              onChange={() => setDensity(d)}
            />{' '}
            {d}
          </label>
        ))}
      </fieldset>

      <div style={{ display: 'flex', gap: 48 }}>
        <MeasuredBlock label={`PlayerCard (Card Engine v3) — ${density}`}>
          <PlayerCard card={GOAT_CARD} size={DENSITY_TO_SIZE[density]} glow />
        </MeasuredBlock>

        <MeasuredBlock label={`StaticWorldLegendsCard (experimental) — ${density}`}>
          <StaticWorldLegendsCard
            presetId="goat-validation-001"
            density={density}
            displayName={GOAT_CARD.displayName}
            overall={GOAT_CARD.overall}
            position={GOAT_CARD.position}
          />
        </MeasuredBlock>
      </div>

      <StaticStressTest />
    </div>
  );
}
