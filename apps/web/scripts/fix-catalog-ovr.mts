/**
 * Foundation Recovery — Sprint 16.1, Problema 3.
 *
 * Para cada jogador gerado (catalog-seeds.ts) cuja carta falha o invariante
 * de Overall (card.ts invariant 6), busca o MENOR fator de escala aplicado
 * aos atributos AUTORAIS (os campos presentes no Partial<BaseAttributeSet>
 * original) que faz o Overall real (via createCard() de produção) cair
 * dentro da faixa de rarity.ts. Não reimplementa a fórmula — usa a função
 * real do domínio para eliminar risco de divergência.
 *
 * Saída: JSON com { corrections: [{id, rarity, before, after, k, overall}],
 * unresolved: [...] } — nenhuma falha é descartada silenciosamente.
 */
import {
  type BaseAttributeSet,
  cardId,
  createCard,
  createPlayer,
  playerId,
} from '@world-legends/cards';
import type { RarityCode } from '@world-legends/types';
import {
  ALL_CARD_SEEDS,
  ALL_PLAYER_SEEDS,
  type CardSeed,
  type PlayerSeed,
} from '../lib/catalog-seeds.ts';

const DEFAULT_ATTRS: BaseAttributeSet = {
  pace: 70,
  stamina: 70,
  physical: 70,
  heading: 60,
  finishing: 60,
  shot_power: 60,
  passing: 65,
  vision: 65,
  dribbling: 65,
  penalty_kicks: 60,
  defending: 40,
  composure: 70,
  aggression: 60,
  leadership: 60,
  gk_reflexes: 20,
  gk_positioning: 20,
  gk_handling: 20,
  gk_kicking: 20,
  gk_penalty_save: 20,
};

function fullAttrs(partial: Partial<BaseAttributeSet>): BaseAttributeSet {
  return { ...DEFAULT_ATTRS, ...partial };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function tryCard(
  player: ReturnType<typeof createPlayer>,
  seed: CardSeed,
  fullBaseAttrs: BaseAttributeSet,
) {
  if (!player.ok) return { ok: false as const, error: 'player-invalid' };
  return createCard({
    id: cardId(`${seed.playerId}-${seed.rarity}`),
    playerId: player.value.id,
    rarityCode: seed.rarity,
    editionCode: 'base',
    baseAttributes: fullBaseAttrs,
    playerPosition: player.value.positions.primary,
    editionMetadata: { kind: 'base' },
    traits: seed.traits,
  });
}

function buildPlayer(seed: PlayerSeed) {
  return createPlayer({
    id: playerId(seed.id),
    fullName: seed.fullName,
    knownAs: seed.knownAs,
    birthYear: seed.birthYear,
    nationality: seed.nationality,
    primaryPosition: seed.primary,
    secondaryPositions: seed.secondary,
    preferredFoot: seed.foot,
    heightCm: seed.height,
    eraStart: seed.eraStart,
    eraEnd: seed.eraEnd,
    baseAttributes: fullAttrs(seed.baseAttrs),
    bioShort: seed.bio,
    sourceNotes: 'Dados históricos curados — fontes: Wikipedia, FIFA, RSSSF.',
  });
}

type Correction = {
  id: string;
  rarity: RarityCode;
  before: Partial<BaseAttributeSet>;
  after: Partial<BaseAttributeSet>;
  k: number;
  overall: number;
};
type Unresolved = { id: string; rarity: RarityCode; reason: string };

const corrections: Correction[] = [];
const unresolved: Unresolved[] = [];
let alreadyOk = 0;

const playerById = new Map(ALL_PLAYER_SEEDS.map((p) => [p.id, p]));

for (const cardSeed of ALL_CARD_SEEDS) {
  if (cardSeed.rarity === 'world_cup_hero') continue; // usa TournamentContext, não atributo puro — 100% ok hoje, fora de escopo

  const pseed = playerById.get(cardSeed.playerId);
  if (!pseed) {
    unresolved.push({
      id: cardSeed.playerId,
      rarity: cardSeed.rarity,
      reason: 'player-seed-not-found',
    });
    continue;
  }

  const player = buildPlayer(pseed);
  const baseFull = fullAttrs(pseed.baseAttrs);
  const initial = tryCard(player, cardSeed, baseFull);
  if (initial.ok) {
    alreadyOk++;
    continue;
  }

  // Busca expandindo a partir de k=1.0 em passos de 1%, priorizando menor distorção.
  let found: { k: number; overall: number; attrs: Partial<BaseAttributeSet> } | null = null;
  for (let step = 1; step <= 150 && !found; step++) {
    for (const dir of [1, -1]) {
      const k = 1 + dir * step * 0.01;
      if (k <= 0.2 || k >= 3) continue;
      const scaledPartial: Partial<BaseAttributeSet> = {};
      for (const [key, val] of Object.entries(pseed.baseAttrs)) {
        scaledPartial[key as keyof BaseAttributeSet] = clamp(
          Math.round((val as number) * k),
          1,
          99,
        );
      }
      const candidateFull = fullAttrs(scaledPartial);
      const result = tryCard(player, cardSeed, candidateFull);
      if (result.ok) {
        found = { k, overall: result.value.overall, attrs: scaledPartial };
        break;
      }
    }
  }

  if (found) {
    corrections.push({
      id: cardSeed.playerId,
      rarity: cardSeed.rarity,
      before: pseed.baseAttrs,
      after: found.attrs,
      k: found.k,
      overall: found.overall,
    });
  } else {
    unresolved.push({
      id: cardSeed.playerId,
      rarity: cardSeed.rarity,
      reason: initial.ok ? 'unknown' : initial.error.message,
    });
  }
}

console.log(JSON.stringify({ alreadyOk, corrections, unresolved }, null, 0));
