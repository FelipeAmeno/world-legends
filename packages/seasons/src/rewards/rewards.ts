/**
 * Recompensas por posição final na temporada (T040).
 *
 * Posição 1 (Campeão):  10.000c + 3 Legend Packs + troféu cosmético
 * Posição 2:             5.000c + 2 Legend Packs
 * Posição 3:             3.000c + 1 Legend Pack + 1 Elite Pack
 * Posição 4–5:           2.000c + 2 Elite Packs
 * Posição 6–7:           1.000c + 1 Elite Pack
 * Posição 8 (último):      500c + 1 Classic Pack
 */
import type { SeasonReward } from '../types/types';

// ─── Tabela de recompensas ────────────────────────────────────────────────────

const REWARD_TABLE: ReadonlyMap<number, SeasonReward> = new Map<number, SeasonReward>([
  [
    1,
    Object.freeze({
      position: 1,
      credits: 10_000,
      packs: Object.freeze([{ packId: 'legend', quantity: 3 }]),
      cosmetics: Object.freeze(['champion_trophy', 'golden_badge', 'season_winner_frame']),
      title: '🏆 CAMPEÃO DA TEMPORADA',
    }),
  ],
  [
    2,
    Object.freeze({
      position: 2,
      credits: 5_000,
      packs: Object.freeze([{ packId: 'legend', quantity: 2 }]),
      cosmetics: Object.freeze(['silver_badge']),
      title: '🥈 Vice-Campeão',
    }),
  ],
  [
    3,
    Object.freeze({
      position: 3,
      credits: 3_000,
      packs: Object.freeze([
        { packId: 'legend', quantity: 1 },
        { packId: 'elite', quantity: 1 },
      ]),
      cosmetics: Object.freeze(['bronze_badge']),
      title: '🥉 3º Lugar',
    }),
  ],
  [
    4,
    Object.freeze({
      position: 4,
      credits: 2_000,
      packs: Object.freeze([{ packId: 'elite', quantity: 2 }]),
      cosmetics: Object.freeze([]),
      title: '4º Lugar',
    }),
  ],
  [
    5,
    Object.freeze({
      position: 5,
      credits: 2_000,
      packs: Object.freeze([{ packId: 'elite', quantity: 2 }]),
      cosmetics: Object.freeze([]),
      title: '5º Lugar',
    }),
  ],
  [
    6,
    Object.freeze({
      position: 6,
      credits: 1_000,
      packs: Object.freeze([{ packId: 'elite', quantity: 1 }]),
      cosmetics: Object.freeze([]),
      title: '6º Lugar',
    }),
  ],
  [
    7,
    Object.freeze({
      position: 7,
      credits: 1_000,
      packs: Object.freeze([{ packId: 'elite', quantity: 1 }]),
      cosmetics: Object.freeze([]),
      title: '7º Lugar',
    }),
  ],
  [
    8,
    Object.freeze({
      position: 8,
      credits: 500,
      packs: Object.freeze([{ packId: 'classic', quantity: 1 }]),
      cosmetics: Object.freeze([]),
      title: '8º Lugar',
    }),
  ],
]);

// ─── getRewardsForPosition ────────────────────────────────────────────────────

export function getRewardsForPosition(position: number): SeasonReward {
  return (
    REWARD_TABLE.get(position) ??
    Object.freeze({
      position,
      credits: 0,
      packs: Object.freeze([]),
      cosmetics: Object.freeze([]),
      title: `${position}º Lugar`,
    })
  );
}

export { REWARD_TABLE };
