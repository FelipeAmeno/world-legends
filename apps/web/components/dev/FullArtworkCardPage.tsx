'use client';

/**
 * components/dev/FullArtworkCardPage.tsx — Sprint 35D (Full Card Artwork
 * Pipeline Reset)
 *
 * Ferramenta interna (`/dev/full-artwork-card`) — não é uma tela de
 * jogo. Mostra: artwork sozinho (sem HUD), artwork com HUD, as 3
 * densidades, e o fallback procedural do Card Engine atual (que
 * continua sendo o fallback real de produção — item 12 do brief).
 */

import { useEffect, useRef, useState } from 'react';
import { PlayerCard } from '../cards/PlayerCard';
import type { PlayerCardData } from '../cards/card-types';
import {
  type FullArtworkDensity,
  type FullArtworkStats,
  FullArtworkWorldLegendsCard,
} from './FullArtworkWorldLegendsCard';

const TIERS = [1, 10, 50, 200] as const;
type Tier = (typeof TIERS)[number];
const MEASURE_DURATION_MS = 4000;

function StressTest({ stats }: { stats: FullArtworkStats }) {
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
  const domRef = useRef<HTMLDivElement | null>(null);
  const [domNodes, setDomNodes] = useState<number | null>(null);

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

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setDomNodes(domRef.current?.querySelectorAll('*').length ?? 0),
    );
    return () => cancelAnimationFrame(raf);
  }, [tier]);

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
        Stress test — FullArtworkWorldLegendsCard (Compact)
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
        <span style={{ fontSize: 12 }}>· {domNodes ?? '…'} nós DOM (1 carta)</span>
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
      <div ref={domRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {Array.from({ length: tier }, (_, i) => (
          <FullArtworkWorldLegendsCard
            key={i}
            presetId="wl-goat-brazil-001"
            density="compact"
            displayName="GOAT"
            overall={97}
            position="ST"
            countryFlag="🇧🇷"
            era="1970s"
            stats={stats}
          />
        ))}
      </div>
    </div>
  );
}

const GOAT_PRESET_ID = 'wl-goat-brazil-001';

const GOAT_STATS: FullArtworkStats = {
  pace: 88,
  finishing: 94,
  passing: 82,
  dribbling: 91,
  defending: 45,
  physical: 79,
};

// Fallback procedural — MESMA carta GOAT (Sprint 35), sem
// `v3CompositionId` apontando pra um asset real, então o Card Engine
// cai 100% no procedural (Sprint 27/28). Prova viva que o fallback
// continua funcionando mesmo depois do reset de estratégia.
const FALLBACK_CARD: PlayerCardData = {
  cardId: 'full-artwork-fallback-demo',
  playerId: 'full-artwork-fallback-demo',
  displayName: 'Fallback Procedural',
  nationality: 'BR',
  position: 'ST',
  rarityCode: 'ultra',
  rarityLabel: 'GOAT',
  overall: 96,
  flagEmoji: '🇧🇷',
  era: '1970s',
};

export function FullArtworkCardPage() {
  const [density, setDensity] = useState<FullArtworkDensity>('standard');

  return (
    <div style={{ padding: 24, color: '#e5e7eb', background: '#0a0b10', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Full Card Artwork</h1>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20, maxWidth: 680 }}>
        Ferramenta interna (Sprint 35D) — não é uma tela de jogo. A arte é uma composição ÚNICA (
        <code>{GOAT_PRESET_ID}</code>: jogador+frame+background+luz+material+efeitos já prontos na
        imagem) — o pipeline só redimensiona pras 3 densidades, nunca decompõe em layers. O HUD
        (OVR/posição/nome/país/era/stats) é 100% React, posicionado nas safe zones que o preset
        define. O Card Engine atual (procedural) continua como fallback de produção — última seção
        desta página.
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
        {(['compact', 'standard', 'showcase'] as FullArtworkDensity[]).map((d) => (
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

      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', marginBottom: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <FullArtworkWorldLegendsCard
            presetId={GOAT_PRESET_ID}
            density={density}
            displayName="Dinamite"
            overall={97}
            position="ST"
            countryFlag="🇧🇷"
            era="1970s"
            stats={GOAT_STATS}
            trait="Ícone"
            hideHud
          />
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
            Artwork sem HUD ({density})
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <FullArtworkWorldLegendsCard
            presetId={GOAT_PRESET_ID}
            density={density}
            displayName="Dinamite"
            overall={97}
            position="ST"
            countryFlag="🇧🇷"
            era="1970s"
            stats={GOAT_STATS}
            trait="Ícone"
          />
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
            Artwork com HUD ({density})
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
        As 3 densidades lado a lado
      </h2>
      <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
        {(['compact', 'standard', 'showcase'] as FullArtworkDensity[]).map((d) => (
          <div key={d} style={{ textAlign: 'center' }}>
            <FullArtworkWorldLegendsCard
              presetId={GOAT_PRESET_ID}
              density={d}
              displayName="Dinamite"
              overall={97}
              position="ST"
              countryFlag="🇧🇷"
              era="1970s"
              stats={GOAT_STATS}
              trait="Ícone"
            />
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>{d}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
        Fallback — Card Engine procedural (produção)
      </h2>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12, maxWidth: 640 }}>
        Mesma carta GOAT, sem <code>v3CompositionId</code> — o <code>PlayerCard</code> real cai 100%
        no motor procedural (Sprint 27/28). Isso é o que toda carta de produção usa hoje; o pipeline
        de full-card-artwork é aditivo, não substitui isso ainda (item 12 do brief).
      </p>
      <PlayerCard
        card={FALLBACK_CARD}
        size={density === 'compact' ? 'sm' : density === 'standard' ? 'md' : 'lg'}
        glow
      />

      <StressTest stats={GOAT_STATS} />
    </div>
  );
}
