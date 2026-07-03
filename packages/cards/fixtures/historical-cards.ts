import { createCard } from '../src/card/card';
import type { Card } from '../src/card/types';
import {
  type CardCatalog,
  type PlayerCatalog,
  createCardCatalog,
  createPlayerCatalog,
} from '../src/catalog';
/**
 * Fixtures de cartas históricas — catálogo de demonstração com todas as
 * raridades válidas para cada jogador.
 *
 * NOTA IMPORTANTE (doc 10 §4): cada jogador só tem cartas nas raridades
 * para as quais seus atributos-base produzem Overall dentro da faixa.
 * Pelé/Maradona/Zidane não têm carta Common/Rare — seus atributos são de
 * lendas absolutas. Carlos Alberto (lateral da Copa 70) cobre os níveis
 * Common e Rare para os testes dessas raridades.
 */
import { createPlayer } from '../src/player/player';
import type { Player } from '../src/player/types';
import {
  CARLOS_ALBERTO_INPUT,
  MARADONA_PLAYER_INPUT,
  PELE_PLAYER_INPUT,
  RONALDO_PLAYER_INPUT,
  WC_1970_CONTEXT,
  WC_1986_CONTEXT,
  WC_1998_CONTEXT,
  WC_2002_CONTEXT,
  ZIDANE_PLAYER_INPUT,
} from './historical-players';

function unwrap<T>(
  r: { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: unknown },
): T {
  if (!r.ok)
    throw new Error(`Fixture inválida: ${JSON.stringify((r as { error: unknown }).error)}`);
  return (r as { ok: true; value: T }).value;
}

// ─── Players ──────────────────────────────────────────────────────────────────
export const PELE = unwrap(createPlayer(PELE_PLAYER_INPUT));
export const MARADONA = unwrap(createPlayer(MARADONA_PLAYER_INPUT));
export const RONALDO = unwrap(createPlayer(RONALDO_PLAYER_INPUT));
export const ZIDANE = unwrap(createPlayer(ZIDANE_PLAYER_INPUT));
export const CARLOS_ALBERTO = unwrap(createPlayer(CARLOS_ALBERTO_INPUT));

// ─── Cartas de Carlos Alberto (RB) — cobre Common e Rare ─────────────────────
// RB: defending(25), pace(20), physical(15), passing(15), dribbling(10), heading(10), composure(5)
// common[55,72]: base*1.00 → overall ~67 ✓
export const CARLOS_ALBERTO_COMMON = unwrap(
  createCard({
    id: 'card-carlos-alberto-common',
    playerId: CARLOS_ALBERTO.id,
    playerPosition: 'RB',
    rarityCode: 'common',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: CARLOS_ALBERTO.baseAttributes,
    traits: [{ trait: 'Muralha', tier: 1 }],
  }),
);

// rare[73,81]: base*1.06 → overall ~71 ✗ — precisa calibrar
// Verificado: overall com RB e esses atributos é ~67, *1.06=71 ainda dentro de rare? Não.
// Solução: Carlos Alberto tem rare via atributos ligeiramente maiores — usamos input com +5 em defensivos
export const CARLOS_ALBERTO_RARE = unwrap(
  createCard({
    id: 'card-carlos-alberto-rare',
    playerId: CARLOS_ALBERTO.id,
    playerPosition: 'RB',
    rarityCode: 'rare',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: {
      ...CARLOS_ALBERTO.baseAttributes,
      pace: 72,
      defending: 73,
      physical: 71,
      passing: 68,
      composure: 67,
    },
    traits: [
      { trait: 'Muralha', tier: 1 },
      { trait: 'Leader', tier: 1 },
    ],
  }),
);

// ─── Cartas de Pelé (ST) — Legendary / Ultra / World Cup Hero + Prime ─────────
export const PELE_LEGENDARY = unwrap(
  createCard({
    id: 'card-pele-legendary',
    playerId: PELE.id,
    playerPosition: 'ST',
    rarityCode: 'legendary',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: PELE.baseAttributes,
    traits: [
      { trait: 'Matador', tier: 2 },
      { trait: 'Capitão', tier: 2 },
      { trait: 'Hero Moment', tier: 2 },
    ],
  }),
);

export const PELE_ULTRA = unwrap(
  createCard({
    id: 'card-pele-ultra',
    playerId: PELE.id,
    playerPosition: 'ST',
    rarityCode: 'ultra',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: PELE.baseAttributes,
    traits: [
      { trait: 'Matador', tier: 3 },
      { trait: 'Capitão', tier: 3 },
      { trait: 'Hero Moment', tier: 3 },
    ],
  }),
);

export const PELE_WORLD_CUP_HERO = unwrap(
  createCard({
    id: 'card-pele-wch',
    playerId: PELE.id,
    playerPosition: 'ST',
    rarityCode: 'world_cup_hero',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    tournamentContext: WC_1970_CONTEXT,
    baseAttributes: PELE.baseAttributes,
    traits: [
      { trait: 'Matador', tier: 3 },
      { trait: 'Capitão', tier: 3 },
      { trait: 'Hero Moment', tier: 3 },
    ],
  }),
);

// Prime de Pelé (Legendary) — período 1969-1971
export const PELE_PRIME = unwrap(
  createCard({
    id: 'card-pele-prime',
    playerId: PELE.id,
    playerPosition: 'ST',
    rarityCode: 'legendary',
    editionCode: 'prime',
    editionMetadata: { kind: 'prime', attributeBonus: 3, primePeriod: '1969-1971' },
    baseAttributes: PELE.baseAttributes,
    traits: [
      { trait: 'Matador', tier: 3 },
      { trait: 'Hero Moment', tier: 2 },
      { trait: 'Clutch Player', tier: 2 },
    ],
  }),
);

// ─── Cartas de Maradona (CAM) ─────────────────────────────────────────────────
export const MARADONA_LEGENDARY = unwrap(
  createCard({
    id: 'card-maradona-legendary',
    playerId: MARADONA.id,
    playerPosition: 'CAM',
    rarityCode: 'legendary',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: MARADONA.baseAttributes,
    traits: [
      { trait: 'Maestro', tier: 2 },
      { trait: 'Clutch Player', tier: 2 },
      { trait: 'Hero Moment', tier: 2 },
    ],
  }),
);

export const MARADONA_ULTRA = unwrap(
  createCard({
    id: 'card-maradona-ultra',
    playerId: MARADONA.id,
    playerPosition: 'CAM',
    rarityCode: 'ultra',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: MARADONA.baseAttributes,
    traits: [
      { trait: 'Maestro', tier: 3 },
      { trait: 'Clutch Player', tier: 3 },
      { trait: 'Hero Moment', tier: 3 },
    ],
  }),
);

export const MARADONA_WORLD_CUP_HERO = unwrap(
  createCard({
    id: 'card-maradona-wch',
    playerId: MARADONA.id,
    playerPosition: 'CAM',
    rarityCode: 'world_cup_hero',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    tournamentContext: WC_1986_CONTEXT,
    baseAttributes: MARADONA.baseAttributes,
    traits: [
      { trait: 'Maestro', tier: 3 },
      { trait: 'Clutch Player', tier: 3 },
      { trait: 'Hero Moment', tier: 3 },
    ],
  }),
);

// ─── Cartas de Ronaldo (ST) ───────────────────────────────────────────────────
export const RONALDO_ELITE = unwrap(
  createCard({
    id: 'card-ronaldo-elite',
    playerId: RONALDO.id,
    playerPosition: 'ST',
    rarityCode: 'elite',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: RONALDO.baseAttributes,
    traits: [
      { trait: 'Matador', tier: 2 },
      { trait: 'Big Game Player', tier: 1 },
    ],
  }),
);

export const RONALDO_LEGENDARY = unwrap(
  createCard({
    id: 'card-ronaldo-legendary',
    playerId: RONALDO.id,
    playerPosition: 'ST',
    rarityCode: 'legendary',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: RONALDO.baseAttributes,
    traits: [
      { trait: 'Matador', tier: 2 },
      { trait: 'Big Game Player', tier: 2 },
      { trait: 'Clutch Player', tier: 1 },
    ],
  }),
);

export const RONALDO_ULTRA = unwrap(
  createCard({
    id: 'card-ronaldo-ultra',
    playerId: RONALDO.id,
    playerPosition: 'ST',
    rarityCode: 'ultra',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: RONALDO.baseAttributes,
    traits: [
      { trait: 'Matador', tier: 3 },
      { trait: 'Big Game Player', tier: 2 },
      { trait: 'Clutch Player', tier: 2 },
    ],
  }),
);

export const RONALDO_WORLD_CUP_HERO = unwrap(
  createCard({
    id: 'card-ronaldo-wch',
    playerId: RONALDO.id,
    playerPosition: 'ST',
    rarityCode: 'world_cup_hero',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    tournamentContext: WC_2002_CONTEXT,
    baseAttributes: RONALDO.baseAttributes,
    traits: [
      { trait: 'Matador', tier: 3 },
      { trait: 'Clutch Player', tier: 3 },
      { trait: 'Gelo nas Veias', tier: 2 },
    ],
  }),
);

// Carta Event — Aniversário Copa 2002 (temática, sem fórmula de Momento — doc 10 §10)
export const RONALDO_EVENT_2002 = unwrap(
  createCard({
    id: 'card-ronaldo-event-2002',
    playerId: RONALDO.id,
    playerPosition: 'ST',
    rarityCode: 'elite',
    editionCode: 'event',
    editionMetadata: {
      kind: 'event',
      eventName: 'Aniversário Copa 2002',
      eventYear: 2027,
      casualModeBonus: 3,
      mayReturn: true,
    },
    // Sem tournamentContext: carta Event usa o tema historicamente, mas
    // os atributos são os de carreira base (não a fórmula de Momento de doc 10 §6).
    // A fórmula de Momento só se aplica quando a carta representa especificamente
    // um RECORTE de desempenho (Legendary/Ultra/WCH). Event é temático.
    baseAttributes: RONALDO.baseAttributes,
    traits: [
      { trait: 'Matador', tier: 2 },
      { trait: 'Gelo nas Veias', tier: 1 },
    ],
  }),
);

// ─── Cartas de Zidane (CM) ────────────────────────────────────────────────────
export const ZIDANE_LEGENDARY = unwrap(
  createCard({
    id: 'card-zidane-legendary',
    playerId: ZIDANE.id,
    playerPosition: 'CM',
    rarityCode: 'legendary',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: ZIDANE.baseAttributes,
    traits: [
      { trait: 'Maestro', tier: 2 },
      { trait: 'Dead Ball Specialist', tier: 2 },
    ],
  }),
);

export const ZIDANE_ULTRA = unwrap(
  createCard({
    id: 'card-zidane-ultra',
    playerId: ZIDANE.id,
    playerPosition: 'CM',
    rarityCode: 'ultra',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    baseAttributes: ZIDANE.baseAttributes,
    traits: [
      { trait: 'Maestro', tier: 3 },
      { trait: 'Dead Ball Specialist', tier: 3 },
    ],
  }),
);

export const ZIDANE_WORLD_CUP_HERO = unwrap(
  createCard({
    id: 'card-zidane-wch',
    playerId: ZIDANE.id,
    playerPosition: 'CM',
    rarityCode: 'world_cup_hero',
    editionCode: 'base',
    editionMetadata: { kind: 'base' },
    tournamentContext: WC_1998_CONTEXT,
    baseAttributes: ZIDANE.baseAttributes,
    traits: [
      { trait: 'Maestro', tier: 3 },
      { trait: 'Dead Ball Specialist', tier: 3 },
      { trait: 'Big Game Player', tier: 3 },
    ],
  }),
);

// ─── Catálogo completo de demonstração ────────────────────────────────────────
export type DemoCatalog = {
  players: PlayerCatalog;
  cards: CardCatalog;
  fixtures: {
    players: {
      pele: Player;
      maradona: Player;
      ronaldo: Player;
      zidane: Player;
      carlosAlberto: Player;
    };
    cards: readonly Card[];
  };
};

export function buildDemoCatalog(): DemoCatalog {
  const players = createPlayerCatalog();
  const cards = createCardCatalog();

  for (const p of [PELE, MARADONA, RONALDO, ZIDANE, CARLOS_ALBERTO]) {
    unwrap(players.register(p));
  }

  const allCards: Card[] = [
    CARLOS_ALBERTO_COMMON,
    CARLOS_ALBERTO_RARE,
    PELE_LEGENDARY,
    PELE_ULTRA,
    PELE_WORLD_CUP_HERO,
    PELE_PRIME,
    MARADONA_LEGENDARY,
    MARADONA_ULTRA,
    MARADONA_WORLD_CUP_HERO,
    RONALDO_ELITE,
    RONALDO_LEGENDARY,
    RONALDO_ULTRA,
    RONALDO_WORLD_CUP_HERO,
    RONALDO_EVENT_2002,
    ZIDANE_LEGENDARY,
    ZIDANE_ULTRA,
    ZIDANE_WORLD_CUP_HERO,
  ];

  for (const c of allCards) {
    unwrap(cards.register(c));
  }

  return {
    players,
    cards,
    fixtures: {
      players: {
        pele: PELE,
        maradona: MARADONA,
        ronaldo: RONALDO,
        zidane: ZIDANE,
        carlosAlberto: CARLOS_ALBERTO,
      },
      cards: allCards,
    },
  };
}
