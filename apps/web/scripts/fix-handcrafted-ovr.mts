import {
  type BaseAttributeSet,
  cardId,
  createCard,
  createPlayer,
  playerId,
} from '@world-legends/cards';
import type { RarityCode } from '@world-legends/types';
import { CARD_SEEDS, PLAYER_SEEDS } from '../lib/collection-data.ts';

type PlayerSeed = (typeof PLAYER_SEEDS)[number];
type CardSeed = (typeof CARD_SEEDS)[number];

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
function tryCard(
  player: ReturnType<typeof createPlayer>,
  seed: CardSeed,
  fullBaseAttrs: BaseAttributeSet,
) {
  if (!player.ok)
    return { ok: false as const, error: 'player-invalid' as unknown as { message: string } };
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

const corrections: {
  id: string;
  rarity: RarityCode;
  before: Partial<BaseAttributeSet>;
  after: Partial<BaseAttributeSet>;
  k: number;
  overall: number;
}[] = [];
const unresolved: { id: string; rarity: RarityCode; reason: string }[] = [];
let alreadyOk = 0;
const playerById = new Map(PLAYER_SEEDS.map((p) => [p.id, p]));

for (const cardSeed of CARD_SEEDS) {
  if (cardSeed.rarity === 'world_cup_hero') continue;
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
      reason: initial.ok ? 'unknown' : (initial.error as { message: string }).message,
    });
  }
}

console.log(JSON.stringify({ alreadyOk, corrections, unresolved }, null, 0));
