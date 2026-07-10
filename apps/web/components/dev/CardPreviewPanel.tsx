'use client';

/**
 * components/dev/CardPreviewPanel.tsx — Sprint 18.6.5 (Asset Production Pipeline)
 * + Sprint 19 (Visual Debug mode) + Sprint 18.9 (Final Assembly — controles
 * de Diretor de Arte)
 *
 * Preview ao vivo do PlayerCard real (import direto, zero alteração no
 * componente) para qualquer combinação de raridade × seleção × arte de
 * jogador. Mostra, por camada, se está usando asset real ou o fallback
 * procedural — útil pra confirmar visualmente o efeito de soltar um
 * arquivo novo antes de ele entrar no jogo de verdade.
 *
 * Sprint 18.9 adiciona: Preview isolado (solo por camada), sliders de
 * intensidade/velocidade e seletor de blend mode (aplicados via
 * `debugOverride`, prop opt-in do PlayerCard que só este Dev Tool usa),
 * ordem real de composição (referência), e exportar screenshot.
 */

import { PlayerCard, type PlayerCardData } from '@/components/cards/PlayerCard';
import type { CardDebugOverride, CardLayerName } from '@/components/cards/card-types';
import {
  ALL_BLEND_MODES,
  type BlendMode,
  resolveBackground,
  resolveFrame,
  resolveGlow,
  resolvePose,
  resolveRarityEffect,
  resolveScene,
  resolveShine,
} from '@/lib/card-asset-loader';
import { getFlagEmoji } from '@/lib/collection-data';
import { exportCardScreenshot } from '@/lib/dev/card-screenshot';
import { candidatePoses } from '@/lib/pose-engine/poseResolver';
import { generateProceduralScene } from '@/lib/procedural-scene/SceneGenerator';
import type { Position, RarityCode } from '@world-legends/types';
import { useMemo, useRef, useState } from 'react';
import { PoseFigure } from '../cards/pose/PoseFigure';

/**
 * Ordem real de composição (Sprint 24 — Card Composition Refactor), de
 * trás pra frente — espelha exatamente as 9 camadas de `PlayerCard.tsx`.
 * "Ambient" agrupa Material + Ambient Light + Efeito de raridade (mesma
 * camada conceitual). `kit`/`pattern`/`playerArt` não existem mais em
 * lugar nenhum (removidos na Sprint 26 — Card Engine 2.0); `pose` não é
 * uma camada independente — está absorvida por `scene` (ver
 * CardSceneLayer.tsx: scene real > pose real > Scene procedural,
 * cadeia de fallback única que nunca mais renderiza camisa).
 */
const ALL_LAYERS: Array<{ id: CardLayerName; label: string }> = [
  { id: 'background', label: '1. Background' },
  { id: 'material', label: '2. Ambient — Material' },
  { id: 'ambientLight', label: '2. Ambient — Luz' },
  { id: 'rarityEffect', label: '2. Ambient — Efeito de raridade' },
  { id: 'particles', label: '3. Partículas' },
  { id: 'scene', label: '4. Scene' },
  { id: 'frame', label: '5. Frame' },
  { id: 'reflection', label: '6. Reflection' },
  { id: 'shine', label: '7. Shine' },
  { id: 'hud', label: '8. HUD' },
  { id: 'glow', label: '9. Glow' },
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

/**
 * Sprint 26/27 — Scene é uma cadeia de fallback única (scene real > pose
 * real > Scene procedural), mesma ordem de prioridade de
 * CardSceneLayer.tsx. Legado (kit/player-art/camisa) removido de vez —
 * a Scene procedural NUNCA retorna nulo, então não existe mais um
 * "fallback SVG de camisa" no fim da cadeia. Helper de módulo (fora do
 * componente) pra não contar pra complexidade dele — mesmo padrão já
 * usado nas Sprints 22/23.
 */
function resolveActiveSceneSource(playerId: string): string {
  if (resolveScene(playerId)) return 'scene real';
  if (resolvePose(playerId)) return 'pose (asset real)';
  return 'scene procedural';
}

export function CardPreviewPanel({ rarityCodes, nationalities, players }: Props) {
  const [rarityCode, setRarityCode] = useState<RarityCode>(rarityCodes[0] ?? 'common');
  const [nationality, setNationality] = useState<string>(nationalities[0] ?? 'BR');
  const [playerId, setPlayerId] = useState<string>(players[0]?.id ?? '');
  const [hiddenLayers, setHiddenLayers] = useState<ReadonlySet<CardLayerName>>(() => new Set());
  const [soloLayer, setSoloLayer] = useState<CardLayerName | null>(null);

  const [reflectionIntensity, setReflectionIntensity] = useState<number | null>(null);
  const [ambientIntensity, setAmbientIntensity] = useState<number | null>(null);
  const [blendMode, setBlendMode] = useState<BlendMode | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState<number | null>(null);

  const cardWrapperRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const toggleLayer = (id: CardLayerName) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSolo = (id: CardLayerName) => {
    setSoloLayer((prev) => (prev === id ? null : id));
  };

  const effectiveHiddenLayers: ReadonlySet<CardLayerName> = soloLayer
    ? new Set(ALL_LAYERS.map((l) => l.id).filter((id) => id !== soloLayer))
    : hiddenLayers;

  const debugOverride: CardDebugOverride = {
    ...(reflectionIntensity !== null ? { reflectionIntensity } : {}),
    ...(ambientIntensity !== null ? { ambientIntensity } : {}),
    ...(blendMode !== null ? { blendMode } : {}),
    ...(animationSpeed !== null ? { animationSpeedMultiplier: animationSpeed } : {}),
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

  const sceneSource = resolveActiveSceneSource(playerId);

  const layerStatus: Array<{ label: string; hasAsset: boolean }> = [
    { label: 'Frame', hasAsset: resolveFrame(rarityCode) !== null },
    { label: 'Background', hasAsset: resolveBackground(rarityCode) !== null },
    { label: 'Efeito de raridade', hasAsset: resolveRarityEffect(rarityCode) !== null },
    { label: 'Glow', hasAsset: resolveGlow(rarityCode) !== null },
    {
      label: `Scene (fonte ativa: ${sceneSource})`,
      hasAsset: sceneSource !== 'scene procedural',
    },
    { label: 'Shine', hasAsset: resolveShine(rarityCode) !== null },
  ];

  // Sprint 27/28 — breakdown da Scene procedural (só é o que renderiza de
  // fato quando `sceneSource === 'scene procedural'`, mas exibido sempre
  // pra facilitar comparação/debug independente da fonte ativa).
  const proceduralScene = useMemo(
    () =>
      generateProceduralScene({
        playerId: playerId || 'preview',
        nationality,
        rarityCode,
        position: 'ST' as Position,
      }),
    [playerId, nationality, rarityCode],
  );

  const handleExport = async () => {
    const cardEl = cardWrapperRef.current?.firstElementChild as HTMLElement | undefined;
    if (!cardEl) return;
    setExporting(true);
    try {
      await exportCardScreenshot(cardEl, `card-${rarityCode}-${nationality}-${Date.now()}.png`);
    } catch (err) {
      console.error('[card-screenshot]', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="font-display text-lg text-parchment mb-4">Preview ao vivo</h2>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="shrink-0 flex flex-col items-center sm:items-start gap-2">
          <div ref={cardWrapperRef} style={{ display: 'inline-block' }}>
            <PlayerCard
              card={card}
              size="lg"
              glow
              hiddenLayers={effectiveHiddenLayers}
              debugOverride={debugOverride}
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-40 transition-colors"
          >
            {exporting ? 'Exportando…' : '📷 Exportar screenshot'}
          </button>
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

            <Field label="Seleção (país)" htmlFor="preview-nationality">
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
              Scene Procedural (Sprint 27/28) — seed {proceduralScene.seed}
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border border-white/10 p-2">
                <p className="text-white/40 mb-1">Background</p>
                <div
                  className="h-6 rounded mb-1"
                  style={{
                    background: `linear-gradient(90deg, ${proceduralScene.background.gradientFrom}, ${proceduralScene.background.gradientMid}, ${proceduralScene.background.gradientTo})`,
                  }}
                />
                <p className="text-white/60">{proceduralScene.background.stadiumName}</p>
              </div>
              <div className="rounded-lg border border-white/10 p-2">
                <p className="text-white/40 mb-1">Lighting</p>
                <div
                  className="h-6 rounded mb-1"
                  style={{ background: proceduralScene.lighting.color }}
                />
                <p className="text-white/60">
                  {proceduralScene.lighting.rayCount} raios ·{' '}
                  {proceduralScene.lighting.spinDurationS.toFixed(1)}s
                </p>
              </div>
              <div className="rounded-lg border border-white/10 p-2">
                <p className="text-white/40 mb-1">Particles</p>
                <div
                  className="h-6 rounded mb-1"
                  style={{ background: proceduralScene.particles.color }}
                />
                <p className="text-white/60">
                  {proceduralScene.particles.particles.length} partículas
                </p>
              </div>
              <div className="rounded-lg border border-white/10 p-2">
                <p className="text-white/40 mb-1">Country Pattern</p>
                <div
                  className="h-6 rounded mb-1"
                  style={{
                    background: `repeating-linear-gradient(${proceduralScene.countryPattern.angleDeg}deg, ${proceduralScene.countryPattern.colorA} 0 6px, ${proceduralScene.countryPattern.colorB} 6px 12px)`,
                  }}
                />
                <p className="text-white/60">{proceduralScene.countryPattern.kind}</p>
              </div>
              <div className="rounded-lg border border-white/10 p-2 col-span-2">
                <p className="text-white/40 mb-1">Pose (Pose Engine, Sprint 28)</p>
                <p className="text-white/60">
                  {proceduralScene.pose.label} · categoria: {proceduralScene.pose.category} · id:{' '}
                  {proceduralScene.pose.id}
                </p>
              </div>
            </div>

            {/* Pose Preview/Debug — todas as poses candidatas pra esta posição+raridade, a ativa em destaque */}
            <p className="text-white/40 text-[10px] uppercase tracking-wider mt-3 mb-2">
              Pose Gallery — candidatas pra ST · {RARITY_LABEL[rarityCode]}
            </p>
            <div className="flex flex-wrap gap-2">
              {candidatePoses('ST' as Position, rarityCode).map((p) => (
                <div
                  key={p.id}
                  className={`w-16 rounded-lg border p-1 text-center ${
                    p.id === proceduralScene.pose.id
                      ? 'border-emerald-500/60 bg-emerald-500/10'
                      : 'border-white/10'
                  }`}
                >
                  <PoseFigure pose={p} width="100%" height={56} accentColor="#c9a84c" />
                  <p className="text-[9px] text-white/50 mt-0.5 truncate">{p.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">
              Visual Debug — ligar/desligar camadas (⭐ = preview isolado, só essa camada)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_LAYERS.map((l) => {
                const isHidden = effectiveHiddenLayers.has(l.id);
                const isSolo = soloLayer === l.id;
                return (
                  <span
                    key={l.id}
                    className={`inline-flex items-center rounded-full border text-[11px] transition-colors overflow-hidden ${
                      isSolo
                        ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                        : isHidden
                          ? 'bg-red-500/10 border-red-500/30 text-red-300/70'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleLayer(l.id)}
                      disabled={soloLayer !== null}
                      className={`px-2.5 py-1 disabled:opacity-50 ${isHidden && !isSolo ? 'line-through' : ''}`}
                    >
                      {l.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSolo(l.id)}
                      title="Preview isolado — mostrar só essa camada"
                      className="px-1.5 py-1 border-l border-white/10 hover:bg-white/10"
                    >
                      ⭐
                    </button>
                  </span>
                );
              })}
            </div>
            {(hiddenLayers.size > 0 || soloLayer) && (
              <button
                type="button"
                onClick={() => {
                  setHiddenLayers(new Set());
                  setSoloLayer(null);
                }}
                className="mt-2 text-white/40 text-[10px] underline hover:text-white/70"
              >
                Religar todas
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SliderField
              label={`Reflection intensity${reflectionIntensity === null ? ' (material)' : ''}`}
              value={reflectionIntensity}
              onChange={setReflectionIntensity}
              min={0}
              max={1}
              step={0.05}
            />
            <SliderField
              label={`Ambient intensity${ambientIntensity === null ? ' (material)' : ''}`}
              value={ambientIntensity}
              onChange={setAmbientIntensity}
              min={0}
              max={1}
              step={0.05}
            />
            <SliderField
              label={`Animation speed${animationSpeed === null ? ' (preset da raridade)' : ''}`}
              value={animationSpeed}
              onChange={setAnimationSpeed}
              min={0.2}
              max={3}
              step={0.1}
            />
            <Field label="Blend mode (Reflection)" htmlFor="preview-blend">
              <select
                id="preview-blend"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm"
                value={blendMode ?? ''}
                onChange={(e) =>
                  setBlendMode(e.target.value ? (e.target.value as BlendMode) : null)
                }
              >
                <option value="">padrão (normal)</option>
                {ALL_BLEND_MODES.filter((b) => b !== 'normal').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">
              Layer order — z-order real de composição (de trás pra frente)
            </p>
            <ol className="flex flex-wrap gap-1.5 text-[11px] text-white/50">
              {ALL_LAYERS.map((l) => (
                <li key={l.id} className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  {l.label}
                </li>
              ))}
            </ol>
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

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min: number;
  max: number;
  step: number;
}) {
  const id = `slider-${label.replace(/\s+/g, '-')}`;
  return (
    <div className="block">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="text-white/40 text-[10px] uppercase tracking-wider">
          {label}
        </label>
        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-white/30 text-[10px] underline hover:text-white/60"
          >
            resetar
          </button>
        )}
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
