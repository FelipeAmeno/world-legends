'use client';

/**
 * components/dev/FullArtworkCardPage.tsx — Sprint 35D (Full Card Artwork
 * Pipeline Reset) + Sprint 35D.3 (Unique Player Artwork and Card
 * Identity System) + Sprint 35D.4/35D.5 (Neymar and Mbappé Integration)
 *
 * Ferramenta interna (`/dev/full-artwork-card`) — não é uma tela de
 * jogo. Seletor de 10 identidades (item 8 do brief); cada uma passa
 * por `resolvePlayerCardRenderer` — Pelé, Ronaldinho, Neymar e Mbappé
 * têm preset real hoje (`productionEligible: true` + artwork gerado);
 * os demais 6 usam um ID que ainda não existe no manifesto de
 * propósito — pra provar que o resolver cai no fallback procedural sem
 * quebrar nada, exatamente como pedido ("não inventar arte", "artwork
 * preset pending").
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { CARD_STATIC_MANIFEST } from '../../lib/card-static/manifest.generated';
import { resolvePlayerCardRenderer } from '../../lib/card-static/resolve-player-card-renderer';
import { PlayerCard } from '../cards/PlayerCard';
import type { PlayerCardData, PlayerNicknameType } from '../cards/card-types';
import {
  type FullArtworkDensity,
  type FullArtworkStats,
  FullArtworkWorldLegendsCard,
} from './FullArtworkWorldLegendsCard';

type Identity = {
  displayName: string;
  shortName?: string;
  nickname: string;
  nicknameType: PlayerNicknameType;
  artworkPresetId: string;
  rarity: 'common' | 'rare' | 'elite' | 'legendary' | 'ultra' | 'world_cup_hero';
  overall: number;
  position: string;
  nationality: string;
  era: string;
  stats: FullArtworkStats;
};

// Item 8/9 do brief — os textos (nickname, nicknameType) são EXATAMENTE
// os do brief, não alterados. Só Pelé e Ronaldinho têm artworkPresetId
// apontando pra um preset REAL hoje (ver seção "Piloto" e "Integrate
// Ronaldinho"); os outros 8 usam um ID que ainda não existe no
// manifesto de propósito — pra provar que o resolver cai no fallback
// procedural sem quebrar nada, exatamente como pedido ("não inventar
// arte", "artwork preset pending").
const IDENTITIES: Identity[] = [
  {
    displayName: 'PELÉ',
    nickname: 'O REI',
    nicknameType: 'legend',
    artworkPresetId: 'wl-goat-brazil-001',
    rarity: 'ultra',
    overall: 99,
    position: 'CAM',
    nationality: 'BR',
    era: '1970s',
    stats: { pace: 91, finishing: 96, passing: 93, dribbling: 97, defending: 40, physical: 82 },
  },
  {
    displayName: 'RONALDINHO GAÚCHO',
    shortName: 'RONALDINHO',
    nickname: 'O BRUXO',
    nicknameType: 'legend',
    artworkPresetId: 'wl-legendary-ronaldinho-001',
    rarity: 'legendary',
    overall: 96,
    position: 'CAM',
    nationality: 'BR',
    era: '2000s',
    stats: { pace: 88, finishing: 89, passing: 92, dribbling: 97, defending: 35, physical: 74 },
  },
  {
    displayName: 'MESSI',
    nickname: 'GOAT',
    nicknameType: 'legend',
    artworkPresetId: 'wl-goat-messi-001',
    rarity: 'ultra',
    overall: 98,
    position: 'RW',
    nationality: 'AR',
    era: '2010s',
    stats: { pace: 85, finishing: 92, passing: 91, dribbling: 96, defending: 34, physical: 68 },
  },
  {
    displayName: 'CRISTIANO RONALDO',
    nickname: 'PAPAI CRIS SIIIIU',
    nicknameType: 'event',
    artworkPresetId: 'wl-goat-cristiano-001',
    rarity: 'ultra',
    overall: 98,
    position: 'ST',
    nationality: 'PT',
    era: '2010s',
    stats: { pace: 87, finishing: 95, passing: 82, dribbling: 88, defending: 35, physical: 87 },
  },
  {
    displayName: 'KYLIAN MBAPPÉ',
    shortName: 'MBAPPÉ',
    nickname: 'O DITADOR',
    nicknameType: 'event',
    artworkPresetId: 'wl-elite-mbappe-001',
    rarity: 'elite',
    overall: 91,
    position: 'ST',
    nationality: 'FR',
    era: '2020s',
    stats: { pace: 97, finishing: 91, passing: 80, dribbling: 92, defending: 36, physical: 78 },
  },
  {
    displayName: 'ZIDANE',
    nickname: 'O MAESTRO',
    nicknameType: 'legend',
    artworkPresetId: 'wl-legendary-zidane-001',
    rarity: 'legendary',
    overall: 95,
    position: 'CAM',
    nationality: 'FR',
    era: '1990s',
    stats: { pace: 76, finishing: 85, passing: 90, dribbling: 93, defending: 47, physical: 78 },
  },
  {
    displayName: 'RONALDO',
    nickname: 'O FENÔMENO',
    nicknameType: 'legend',
    artworkPresetId: 'wl-goat-ronaldo-001',
    rarity: 'ultra',
    overall: 97,
    position: 'ST',
    nationality: 'BR',
    era: '1990s',
    stats: { pace: 94, finishing: 94, passing: 76, dribbling: 92, defending: 30, physical: 82 },
  },
  {
    displayName: 'BECKENBAUER',
    nickname: 'O KAISER',
    nicknameType: 'legend',
    artworkPresetId: 'wl-legendary-beckenbauer-001',
    rarity: 'legendary',
    overall: 94,
    position: 'CB',
    nationality: 'DE',
    era: '1970s',
    stats: { pace: 74, finishing: 68, passing: 85, dribbling: 78, defending: 92, physical: 80 },
  },
  {
    displayName: 'MARADONA',
    nickname: 'ESCOBAR CHEIRADOR',
    nicknameType: 'meme',
    artworkPresetId: 'wl-goat-maradona-001',
    rarity: 'ultra',
    overall: 97,
    position: 'CAM',
    nationality: 'AR',
    era: '1980s',
    stats: { pace: 85, finishing: 90, passing: 91, dribbling: 97, defending: 35, physical: 70 },
  },
  {
    displayName: 'NEYMAR',
    shortName: 'NEYMAR',
    nickname: 'O PRÍNCIPE',
    nicknameType: 'legend',
    artworkPresetId: 'wl-legendary-neymar-001',
    rarity: 'legendary',
    overall: 94,
    position: 'LW',
    nationality: 'BR',
    era: '2010s',
    stats: { pace: 91, finishing: 85, passing: 86, dribbling: 95, defending: 32, physical: 62 },
  },
];

const NICKNAME_TYPE_LABEL: Record<PlayerNicknameType, string> = {
  legend: 'lenda',
  official: 'oficial',
  event: 'evento',
  meme: 'meme',
};

function toPlayerCardData(identity: Identity): PlayerCardData {
  return {
    cardId: `identity-${identity.artworkPresetId}`,
    playerId: `identity-${identity.artworkPresetId}`,
    displayName: identity.displayName,
    nationality: identity.nationality,
    position: identity.position,
    rarityCode: identity.rarity,
    rarityLabel: identity.rarity,
    overall: identity.overall,
    flagEmoji: '🏳️',
    era: identity.era,
    nickname: identity.nickname,
    nicknameType: identity.nicknameType,
    ...(identity.shortName ? { shortName: identity.shortName } : {}),
    // Sprint 35D.3 propositalmente NÃO seta `artworkPresetId` aqui — o
    // fallback do PlayerCard real tem que continuar 100% procedural
    // mesmo pra identidades com preset elegível, porque esta seção da
    // página é especificamente o "fallback de produção" (ver mais
    // abaixo), não o roteamento pelo resolver.
  };
}

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
        Stress test — FullArtworkWorldLegendsCard (Compact, sempre GOAT/Pelé pra métrica estável)
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
        <span style={{ fontSize: 12 }}>· {domNodes ?? '…'} nós DOM (grade inteira)</span>
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

export function FullArtworkCardPage() {
  const [density, setDensity] = useState<FullArtworkDensity>('standard');
  const [identityIndex, setIdentityIndex] = useState(0);
  const identity = IDENTITIES[identityIndex] as Identity;

  const resolution = useMemo(
    () =>
      resolvePlayerCardRenderer(
        {
          artworkPresetId: identity.artworkPresetId,
          cardId: identity.artworkPresetId,
          playerId: identity.artworkPresetId,
          rarity: identity.rarity,
        },
        CARD_STATIC_MANIFEST,
      ),
    [identity],
  );

  return (
    <div style={{ padding: 24, color: '#e5e7eb', background: '#0a0b10', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Full Card Artwork</h1>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20, maxWidth: 680 }}>
        Ferramenta interna (Sprint 35D/35D.3) — não é uma tela de jogo. Cada identidade passa por{' '}
        <code>resolvePlayerCardRenderer</code>: com preset real + <code>productionEligible</code>,
        usa o artwork exclusivo (<code>FullArtworkWorldLegendsCard</code>); sem preset, cai no Card
        Engine procedural com um aviso — nunca reaproveita a arte de outro jogador, nunca inventa
        arte nova.
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
        <fieldset
          style={{
            border: '1px solid #27272a',
            borderRadius: 8,
            padding: 12,
            display: 'inline-block',
          }}
        >
          <legend style={{ fontSize: 11, color: '#9ca3af', padding: '0 6px' }}>Identidade</legend>
          <select
            value={identityIndex}
            onChange={(e) => setIdentityIndex(Number(e.target.value))}
            style={{
              background: '#18181b',
              color: '#e5e7eb',
              border: '1px solid #3f3f46',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 13,
            }}
          >
            {IDENTITIES.map((id, i) => (
              <option key={id.artworkPresetId} value={i}>
                {id.displayName} — {id.nickname}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset
          style={{
            border: '1px solid #27272a',
            borderRadius: 8,
            padding: 12,
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
      </div>

      <p style={{ fontSize: 12, marginBottom: 16 }}>
        resolver:{' '}
        <strong style={{ color: resolution.renderer === 'full-artwork' ? '#4ade80' : '#fbbf24' }}>
          {resolution.renderer}
        </strong>
        {resolution.renderer === 'procedural' && (
          <span style={{ color: '#9ca3af' }}>
            {' '}
            — artwork preset pending ({resolution.fallbackReason})
          </span>
        )}
        {' · nicknameType: '}
        <em>{NICKNAME_TYPE_LABEL[identity.nicknameType]}</em>
      </p>

      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', marginBottom: 40 }}>
        <div style={{ textAlign: 'center' }}>
          {resolution.renderer === 'full-artwork' ? (
            <FullArtworkWorldLegendsCard
              presetId={identity.artworkPresetId}
              density={density}
              displayName={identity.shortName ?? identity.displayName}
              overall={identity.overall}
              position={identity.position}
              countryFlag="🏳️"
              era={identity.era}
              stats={identity.stats}
              nickname={identity.nickname}
              hideHud
            />
          ) : (
            <div
              style={{
                width: 116,
                height: 156,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #3f3f46',
                borderRadius: 8,
                fontSize: 10,
                color: '#6b7280',
                textAlign: 'center',
                padding: 8,
              }}
            >
              sem artwork (só HUD não se aplica)
            </div>
          )}
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
            Artwork sem HUD ({density})
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          {resolution.renderer === 'full-artwork' ? (
            <FullArtworkWorldLegendsCard
              presetId={identity.artworkPresetId}
              density={density}
              displayName={identity.shortName ?? identity.displayName}
              overall={identity.overall}
              position={identity.position}
              countryFlag="🏳️"
              era={identity.era}
              stats={identity.stats}
              nickname={identity.nickname}
            />
          ) : (
            <PlayerCard
              card={toPlayerCardData(identity)}
              size={density === 'compact' ? 'sm' : density === 'standard' ? 'md' : 'lg'}
              glow
            />
          )}
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
            {resolution.renderer === 'full-artwork'
              ? 'Artwork com HUD'
              : 'Fallback procedural (artwork preset pending)'}{' '}
            ({density})
          </p>
        </div>
      </div>

      {resolution.renderer === 'full-artwork' && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            As 3 densidades lado a lado
          </h2>
          <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
            {(['compact', 'standard', 'showcase'] as FullArtworkDensity[]).map((d) => (
              <div key={d} style={{ textAlign: 'center' }}>
                <FullArtworkWorldLegendsCard
                  presetId={identity.artworkPresetId}
                  density={d}
                  displayName={identity.shortName ?? identity.displayName}
                  overall={identity.overall}
                  position={identity.position}
                  countryFlag="🏳️"
                  era={identity.era}
                  stats={identity.stats}
                  nickname={identity.nickname}
                />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>{d}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
        Fallback — Card Engine procedural (produção)
      </h2>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12, maxWidth: 640 }}>
        A mesma identidade, sempre pelo <code>PlayerCard</code> real (Card Engine procedural, Sprint
        27/28) — é o que toda carta de produção usa hoje, e continua funcionando idêntico pra
        qualquer identidade, com ou sem preset elegível.
      </p>
      <PlayerCard
        card={toPlayerCardData(identity)}
        size={density === 'compact' ? 'sm' : density === 'standard' ? 'md' : 'lg'}
        glow
      />

      <StressTest stats={identity.stats} />
    </div>
  );
}
