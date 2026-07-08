'use client';

/**
 * components/dev/CardPreviewPanel.tsx — Sprint 18.6.5 (Asset Production Pipeline)
 * + Sprint 19 (Visual Debug mode)
 *
 * Preview ao vivo do PlayerCard real (import direto, zero alteração no
 * componente) para qualquer combinação de raridade × seleção × arte de
 * jogador. Mostra, por camada, se está usando asset real ou o fallback
 * procedural — útil pra confirmar visualmente o efeito de soltar um
 * arquivo novo antes de ele entrar no jogo de verdade. Modo Visual Debug:
 * liga/desliga cada camada individualmente via a prop `hiddenLayers` do
 * próprio PlayerCard (nenhuma mudança na API pública — a prop é opcional).
 */

import { PlayerCard, type PlayerCardData } from '@/components/cards/PlayerCard';
import type { CardLayerName } from '@/components/cards/card-types';
import {
  resolveBackground,
  resolveFrame,
  resolveGlow,
  resolveKit,
  resolvePlayerArt,
  resolveRarityEffect,
  resolveShine,
} from '@/lib/card-asset-loader';
import { getFlagEmoji } from '@/lib/collection-data';
import type { RarityCode } from '@world-legends/types';
import { useMemo, useState } from 'react';

const ALL_LAYERS: Array<{ id: CardLayerName; label: string }> = [
  { id: 'background', label: 'Background' },
  { id: 'material', label: 'Material' },
  { id: 'ambientLight', label: 'Ambient Light' },
  { id: 'rarityEffect', label: 'Efeito de raridade' },
  { id: 'frame', label: 'Frame' },
  { id: 'reflection', label: 'Reflection' },
  { id: 'glow', label: 'Glow' },
  { id: 'kit', label: 'Kit (camisa)' },
  { id: 'pattern', label: 'Pattern' },
  { id: 'playerArt', label: 'Player Art' },
  { id: 'pose', label: 'Pose' },
  { id: 'particles', label: 'Partículas' },
  { id: 'hud', label: 'HUD' },
  { id: 'shine', label: 'Shine' },
];

type Props = {
  rarityCodes: readonly RarityCode[];
  nationalities: readonly string[];
  players: ReadonlyArray<{ id: string; knownAs: string; nationality: string }>;
};

const RARITY_LABEL: Record<RarityCode, string> = {
  common: 'Common',
  rare: 'Rare',
  elite: 'Elite',
  legendary: 'Legendary',
  ultra: 'Ultra (GOAT)',
  world_cup_hero: 'World Cup Hero',
};

export function CardPreviewPanel({ rarityCodes, nationalities, players }: Props) {
  const [rarityCode, setRarityCode] = useState<RarityCode>(rarityCodes[0] ?? 'common');
  const [nationality, setNationality] = useState<string>(nationalities[0] ?? 'BR');
  const [playerId, setPlayerId] = useState<string>(players[0]?.id ?? '');
  const [hiddenLayers, setHiddenLayers] = useState<ReadonlySet<CardLayerName>>(() => new Set());

  const toggleLayer = (id: CardLayerName) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const player = players.find((p) => p.id === playerId);

  const card: PlayerCardData = useMemo(
    () => ({
      cardId: 'preview',
      playerId: playerId || 'preview',
      displayName: player?.knownAs ?? 'PREVIEW',
      nationality,
      position: 'ST',
      rarityCode,
      rarityLabel: RARITY_LABEL[rarityCode],
      overall: 90,
      flagEmoji: getFlagEmoji(nationality),
      era: '2020s',
    }),
    [playerId, player, nationality, rarityCode],
  );

  const layerStatus: Array<{ label: string; hasAsset: boolean }> = [
    { label: 'Frame', hasAsset: resolveFrame(rarityCode) !== null },
    { label: 'Background', hasAsset: resolveBackground(rarityCode) !== null },
    { label: 'Efeito de raridade', hasAsset: resolveRarityEffect(rarityCode) !== null },
    { label: 'Glow', hasAsset: resolveGlow(rarityCode) !== null },
    { label: 'Camisa (kit)', hasAsset: resolveKit(nationality, rarityCode) !== null },
    { label: 'Arte do jogador', hasAsset: resolvePlayerArt(playerId) !== null },
    { label: 'Shine', hasAsset: resolveShine(rarityCode) !== null },
  ];

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="font-display text-lg text-parchment mb-4">Preview ao vivo</h2>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="shrink-0 flex justify-center sm:justify-start">
          <PlayerCard card={card} size="lg" glow hiddenLayers={hiddenLayers} />
        </div>

        <div className="flex-1 space-y-4 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Raridade" htmlFor="preview-rarity">
              <select
                id="preview-rarity"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm"
                value={rarityCode}
                onChange={(e) => setRarityCode(e.target.value as RarityCode)}
              >
                {rarityCodes.map((r) => (
                  <option key={r} value={r}>
                    {RARITY_LABEL[r]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Seleção (kit)" htmlFor="preview-nationality">
              <select
                id="preview-nationality"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              >
                {nationalities.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Arte do jogador" htmlFor="preview-player">
              <select
                id="preview-player"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.knownAs} ({p.nationality})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">
              Camadas — asset real vs. fallback procedural
            </p>
            <div className="flex flex-wrap gap-1.5">
              {layerStatus.map((l) => (
                <span
                  key={l.label}
                  className={`px-2.5 py-1 rounded-full text-[11px] border ${
                    l.hasAsset
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  {l.label}: {l.hasAsset ? 'asset real' : 'fallback'}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">
              Visual Debug — ligar/desligar camadas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_LAYERS.map((l) => {
                const isHidden = hiddenLayers.has(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggleLayer(l.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                      isHidden
                        ? 'bg-red-500/10 border-red-500/30 text-red-300/70 line-through'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
            {hiddenLayers.size > 0 && (
              <button
                type="button"
                onClick={() => setHiddenLayers(new Set())}
                className="mt-2 text-white/40 text-[10px] underline hover:text-white/70"
              >
                Religar todas
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <label
        htmlFor={htmlFor}
        className="text-white/40 text-[10px] uppercase tracking-wider block mb-1"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
