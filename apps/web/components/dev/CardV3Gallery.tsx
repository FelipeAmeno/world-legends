'use client';

/**
 * components/dev/CardV3Gallery.tsx — Sprint 34 (Official Art Pack
 * Integration)
 *
 * Ferramenta interna protegida (`/dev/card-v3-gallery`) — não é uma tela
 * de jogo. Renderiza as 5 cartas de validação (Common/Rare/Elite/
 * Legendary/World Cup Hero) lado a lado, nas 3 densidades (Compact/
 * Standard/Showcase), com toggle de camada e comparação com a referência
 * oficial (`docs/references/card-reference-v3.png`, copiada pra
 * `public/dev-reference/` só pra essa comparação interna — nunca vira
 * asset de carta).
 *
 * Nenhum arte real v3 existe ainda (ver `CARD_V3_ASSET_SPEC.md`) — as 5
 * cartas usam `v3CompositionId`, então o pipeline REAL de resolução v3
 * (`lib/card-v3/resolver.ts`) é exercitado a cada render; hoje ele sempre
 * cai no fallback procedural (Sprint 27/28) porque não há asset em disco
 * — o motor não fica sem conteúdo, e no dia em que arte real for
 * adicionada em `public/assets/cards/v3/`, essas mesmas 5 cartas passam
 * a usá-la sem nenhuma mudança de código aqui.
 */

import { PlayerCard } from '@/components/cards/PlayerCard';
import type { CardSize } from '@/components/cards/card-tokens';
import type { CardLayerName, PlayerCardData } from '@/components/cards/card-types';
import { useState } from 'react';

type Density = 'compact' | 'standard' | 'showcase';

const DENSITY_TO_SIZE: Record<Density, CardSize> = {
  compact: 'sm',
  standard: 'md',
  showcase: 'lg',
};

const LAYER_NAMES: CardLayerName[] = [
  'background',
  'material',
  'ambientLight',
  'rarityEffect',
  'particles',
  'scene',
  'frame',
  'reflection',
  'shine',
  'hud',
  'glow',
];

function buildValidationCard(
  rarityCode: PlayerCardData['rarityCode'],
  rarityLabel: string,
  overall: number,
  reroll: number,
): PlayerCardData {
  return {
    cardId: `v3-validation-${rarityCode}`,
    playerId: `validation-${rarityCode}-r${reroll}`,
    displayName: `Validação ${rarityLabel}`,
    nationality: 'BR',
    position: 'ST',
    rarityCode,
    rarityLabel,
    overall,
    flagEmoji: '🇧🇷',
    era: '2020s',
    v3CompositionId: `${rarityCode}-validation-01`,
  };
}

const VALIDATION_SPECS: Array<{
  rarityCode: PlayerCardData['rarityCode'];
  label: string;
  overall: number;
}> = [
  { rarityCode: 'common', label: 'Common', overall: 62 },
  { rarityCode: 'rare', label: 'Rare', overall: 74 },
  { rarityCode: 'elite', label: 'Elite', overall: 84 },
  { rarityCode: 'legendary', label: 'Legendary', overall: 91 },
  // Sprint 35 — GOAT (ultra) usa a composição v3 real (ultra-validation-01,
  // ver buildValidationCard abaixo), as outras 5 continuam procedurais.
  { rarityCode: 'ultra', label: 'GOAT', overall: 97 },
  { rarityCode: 'world_cup_hero', label: 'World Cup Hero', overall: 98 },
];

export function CardV3Gallery() {
  const [density, setDensity] = useState<Density>('standard');
  const [hiddenLayers, setHiddenLayers] = useState<Set<CardLayerName>>(new Set());
  const [reroll, setReroll] = useState(0);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [showReference, setShowReference] = useState(true);

  const toggleLayer = (layer: CardLayerName) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  const cards = VALIDATION_SPECS.map((spec) =>
    buildValidationCard(spec.rarityCode, spec.label, spec.overall, reroll),
  );

  return (
    <div style={{ padding: 24, color: '#e5e7eb', background: '#0a0b10', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Card V3 Gallery</h1>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
        Ferramenta interna (Sprint 34) — não é uma tela de jogo. 5 cartas de validação, pipeline v3
        real (cai no procedural até arte real ser adicionada em <code>public/assets/cards/v3/</code>
        ).
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
        <fieldset style={{ border: '1px solid #27272a', borderRadius: 8, padding: 12 }}>
          <legend style={{ fontSize: 11, color: '#9ca3af', padding: '0 6px' }}>Densidade</legend>
          {(['compact', 'standard', 'showcase'] as Density[]).map((d) => (
            <label key={d} style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
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

        <fieldset style={{ border: '1px solid #27272a', borderRadius: 8, padding: 12 }}>
          <legend style={{ fontSize: 11, color: '#9ca3af', padding: '0 6px' }}>Camadas</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
            {LAYER_NAMES.map((layer) => (
              <label key={layer} style={{ fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={!hiddenLayers.has(layer)}
                  onChange={() => toggleLayer(layer)}
                />{' '}
                {layer}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ border: '1px solid #27272a', borderRadius: 8, padding: 12 }}>
          <legend style={{ fontSize: 11, color: '#9ca3af', padding: '0 6px' }}>
            Background / Pose / Pattern
          </legend>
          <button
            type="button"
            onClick={() => setReroll((r) => r + 1)}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #3f3f46',
              background: '#18181b',
              color: '#e5e7eb',
              cursor: 'pointer',
            }}
          >
            🎲 Trocar (seed #{reroll})
          </button>
          <p style={{ fontSize: 10, color: '#71717a', marginTop: 6, maxWidth: 180 }}>
            Sem asset real v3 ainda — troca o seed procedural (background/luz/partículas/pose) pra
            comparar variações.
          </p>
        </fieldset>

        <fieldset style={{ border: '1px solid #27272a', borderRadius: 8, padding: 12 }}>
          <legend style={{ fontSize: 11, color: '#9ca3af', padding: '0 6px' }}>
            Scale/Offset temporário
          </legend>
          <label style={{ display: 'block', fontSize: 11 }}>
            scale {scale.toFixed(2)}
            <input
              type="range"
              min={0.8}
              max={1.2}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
          </label>
          <label style={{ display: 'block', fontSize: 11 }}>
            offsetX {offsetX}
            <input
              type="range"
              min={-20}
              max={20}
              value={offsetX}
              onChange={(e) => setOffsetX(Number(e.target.value))}
            />
          </label>
          <label style={{ display: 'block', fontSize: 11 }}>
            offsetY {offsetY}
            <input
              type="range"
              min={-20}
              max={20}
              value={offsetY}
              onChange={(e) => setOffsetY(Number(e.target.value))}
            />
          </label>
        </fieldset>

        <fieldset style={{ border: '1px solid #27272a', borderRadius: 8, padding: 12 }}>
          <legend style={{ fontSize: 11, color: '#9ca3af', padding: '0 6px' }}>Referência</legend>
          <label style={{ fontSize: 12 }}>
            <input
              type="checkbox"
              checked={showReference}
              onChange={() => setShowReference((v) => !v)}
            />{' '}
            mostrar card-reference-v3.png
          </label>
        </fieldset>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {cards.map((card) => (
            <div key={card.cardId} style={{ textAlign: 'center' }}>
              <div
                style={{
                  transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
                }}
              >
                <PlayerCard
                  card={card}
                  size={DENSITY_TO_SIZE[density]}
                  glow
                  hiddenLayers={hiddenLayers}
                />
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>{card.rarityLabel}</p>
            </div>
          ))}
        </div>

        {showReference && (
          <img
            src="/dev-reference/card-reference-v3.png"
            alt="Referência oficial (card-reference-v3.png) — só comparação, nunca asset de carta"
            style={{ maxWidth: 420, borderRadius: 8, border: '1px solid #27272a' }}
          />
        )}
      </div>
    </div>
  );
}
