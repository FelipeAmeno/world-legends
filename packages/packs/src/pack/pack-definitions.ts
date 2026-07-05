/**
 * Definições dos 5 tipos de Pack documentados em doc 10 §14:
 *
 * | Pack           | Slots | Garantia                              |
 * |----------------|-------|---------------------------------------|
 * | Clássico       |   5   | ≥ 1 Rare-ou-melhor                    |
 * | Elite          |   5   | ≥ 2 Elite-ou-melhor                   |
 * | Lenda          |   3   | ≥ 1 Legendary-ou-melhor (slot "hit")  |
 * | Prime          |   3   | ≥ 1 carta edição Prime                |
 * | Herói da Copa  |   2   | 1 World Cup Hero ou Event (evento)    |
 *
 * "Herói da Copa" (evento) está definido aqui para completude, mas sua
 * abertura em memória requer o contexto de um evento ativo — não há
 * nenhuma lógica de evento nesta tarefa. A DropTable está aqui; a
 * validação de "carta de evento específico" é responsabilidade da camada
 * de aplicação.
 *
 * SEM MOEDAS nesta tarefa (requisito explícito de T013).
 */
import type { RarityCode } from '@world-legends/types';
import { BASE_RARITY_WEIGHTS } from '../drop-table/drop-table';
import type { DropTable, RarityWeights, SlotDefinition } from '../drop-table/drop-table';

// ─── PackId ───────────────────────────────────────────────────────────────────
export type PackId = string & { readonly _brand: 'PackId' };
export function packId(v: string): PackId {
  if (!v.trim()) throw new Error('PackId vazio');
  return v as PackId;
}

// ─── Pack ─────────────────────────────────────────────────────────────────────
export type Pack = Readonly<{
  readonly id: PackId;
  readonly name: string;
  readonly description: string;
  readonly cardsPerPack: number;
  readonly dropTable: DropTable;
}>;

// ─── Helpers internos ─────────────────────────────────────────────────────────

function freeSlot(overrides?: Partial<Record<RarityCode, number>>): SlotDefinition {
  const weights: RarityWeights = {
    common: 58,
    rare: 25,
    elite: 11,
    legendary: 4.5,
    ultra: 1.3,
    world_cup_hero: 0.2,
    ...overrides,
  };
  return Object.freeze({ rarityWeights: Object.freeze(weights) });
}

function guaranteedSlot(
  minRarity: RarityCode,
  overrides?: Partial<Record<RarityCode, number>>,
): SlotDefinition {
  const weights: RarityWeights = {
    common: 58,
    rare: 25,
    elite: 11,
    legendary: 4.5,
    ultra: 1.3,
    world_cup_hero: 0.2,
    ...overrides,
  };
  return Object.freeze({
    rarityWeights: Object.freeze(weights),
    guaranteedMinRarity: minRarity,
  });
}

// ─── Pacote Clássico (doc 10 §14) ────────────────────────────────────────────
/**
 * 5 cartas. Slot 0 = garantido Rare-ou-melhor. Slots 1-4 = livres.
 * WCH tem peso zero nos slots livres — não cai em pack clássico.
 */
export const CLASSIC_PACK: Pack = Object.freeze({
  id: packId('classic'),
  name: 'Pacote Clássico',
  description: 'Pacote padrão. 5 cartas, com pelo menos 1 Rare garantida.',
  cardsPerPack: 5,
  dropTable: Object.freeze({
    slots: [
      guaranteedSlot('rare', { world_cup_hero: 0 }), // garantido rare+
      freeSlot({ world_cup_hero: 0 }),
      freeSlot({ world_cup_hero: 0 }),
      freeSlot({ world_cup_hero: 0 }),
      freeSlot({ world_cup_hero: 0 }),
    ],
  }),
});

// ─── Pacote Elite (doc 10 §14) ────────────────────────────────────────────────
/**
 * 5 cartas. Slots 0-1 = garantidos Elite-ou-melhor. Slots 2-4 = livres.
 * Pesos de Common e Rare reduzidos nos slots garantidos para concentrar
 * na faixa Elite+.
 */
const eliteGuaranteedWeights: Partial<RarityWeights> = {
  common: 0,
  rare: 0,
  world_cup_hero: 0,
};

export const ELITE_PACK: Pack = Object.freeze({
  id: packId('elite'),
  name: 'Pacote Elite',
  description: 'Pack avançado. 5 cartas, com pelo menos 2 Elite garantidas.',
  cardsPerPack: 5,
  dropTable: Object.freeze({
    slots: [
      guaranteedSlot('elite', eliteGuaranteedWeights),
      guaranteedSlot('elite', eliteGuaranteedWeights),
      freeSlot({ world_cup_hero: 0 }),
      freeSlot({ world_cup_hero: 0 }),
      freeSlot({ world_cup_hero: 0 }),
    ],
  }),
});

// ─── Pacote Lenda (doc 10 §14) ────────────────────────────────────────────────
/**
 * 3 cartas. Slot 0 = "hit" garantido Legendary-ou-melhor.
 * Slots 1-2 = livres (sem WCH).
 * WCH pode cair nos slots garantidos de Lenda? Doc não diz. Decisão: SIM,
 * WCH é ≥ Legendary, então é um "hit" válido — preserva a narrativa de
 * que o Lenda pack pode te surpreender com o melhor resultado possível.
 */
export const LEGEND_PACK: Pack = Object.freeze({
  id: packId('legend'),
  name: 'Pacote Lenda',
  description: 'Pack premium. 3 cartas, com 1 Legendary ou melhor garantida.',
  cardsPerPack: 3,
  dropTable: Object.freeze({
    slots: [
      // slot "hit": Legendary+ garantido. WCH permitido (é ≥ Legendary).
      Object.freeze({
        rarityWeights: Object.freeze({
          common: 0,
          rare: 0,
          elite: 0,
          legendary: 70,
          ultra: 25,
          world_cup_hero: 5,
        }),
        guaranteedMinRarity: 'legendary' as const,
      }),
      freeSlot({ world_cup_hero: 0 }),
      freeSlot({ world_cup_hero: 0 }),
    ],
  }),
});

// ─── Pacote Prime (doc 10 §14) ────────────────────────────────────────────────
/**
 * 3 cartas. Slot 0 = garantido edição Prime (raridade Rare, Elite ou
 * Legendary — doc 10 §9).
 * Slots 1-2 = livres base (sem WCH, sem Prime).
 *
 * A EditionCode "prime" é sorteada via `editionWeights` do slot garantido.
 * Doc 10 §9: Prime existe sobre Rare/Elite/Legendary — nunca Common/Ultra/WCH.
 * Raridades do slot prime: weights restritos a rare/elite/legendary.
 */
export const PRIME_PACK: Pack = Object.freeze({
  id: packId('prime'),
  name: 'Pacote Prime',
  description: 'Pack especial. 3 cartas, com 1 carta em edição Prime garantida.',
  cardsPerPack: 3,
  dropTable: Object.freeze({
    slots: [
      // Slot Prime: raridade restrita a rare/elite/legendary; edição sempre prime.
      Object.freeze({
        rarityWeights: Object.freeze({
          common: 0,
          rare: 55,
          elite: 35,
          legendary: 10,
          ultra: 0,
          world_cup_hero: 0,
        }),
        editionWeights: Object.freeze({ prime: 100 }),
        guaranteedMinRarity: 'rare' as const,
      }),
      freeSlot({ world_cup_hero: 0, ultra: 0 }),
      freeSlot({ world_cup_hero: 0, ultra: 0 }),
    ],
  }),
});

// ─── Pacote Herói da Copa (evento) (doc 10 §14) ───────────────────────────────
/**
 * 2 cartas. Slot 0 = garantido World Cup Hero ou carta Event.
 * Slot 1 = livre com pesos elevados (recompensa o contexto de evento).
 *
 * Decisão: como não há lógica de evento ativa nesta tarefa, o slot
 * garantido força WCH. A validação de "carta deste evento específico"
 * fica na camada de aplicação futura.
 */
export const COPA_HERO_PACK: Pack = Object.freeze({
  id: packId('copa-hero'),
  name: 'Pacote Herói da Copa',
  description: 'Pack de evento. 2 cartas, com 1 World Cup Hero garantida.',
  cardsPerPack: 2,
  dropTable: Object.freeze({
    slots: [
      // Slot garantido WCH — único contexto onde WCH é garantido (doc 17 §8)
      Object.freeze({
        rarityWeights: Object.freeze({
          common: 0,
          rare: 0,
          elite: 0,
          legendary: 0,
          ultra: 0,
          world_cup_hero: 100,
        }),
        guaranteedMinRarity: 'world_cup_hero' as const,
      }),
      // Slot livre com pesos premium
      Object.freeze({
        rarityWeights: Object.freeze({
          common: 20,
          rare: 35,
          elite: 30,
          legendary: 10,
          ultra: 5,
          world_cup_hero: 0,
        }),
      }),
    ],
  }),
});

// ─── Pacote Iniciante ─────────────────────────────────────────────────────────
/**
 * 5 cartas. Slot 0 = garantido Rare-ou-melhor (pesos levemente elevados).
 * Projetado para jogadores novos, preço acessível (75c).
 * Sem WCH — foco nas raridades básicas.
 */
export const STARTER_PACK: Pack = Object.freeze({
  id: packId('starter'),
  name: 'Pacote Iniciante',
  description: 'Pack de entrada. 5 cartas, com pelo menos 1 Rare garantida.',
  cardsPerPack: 5,
  dropTable: Object.freeze({
    slots: [
      guaranteedSlot('rare', { common: 30, rare: 45, elite: 20, legendary: 4, ultra: 1, world_cup_hero: 0 }),
      freeSlot({ common: 65, rare: 28, elite: 6, legendary: 1, ultra: 0, world_cup_hero: 0 }),
      freeSlot({ common: 65, rare: 28, elite: 6, legendary: 1, ultra: 0, world_cup_hero: 0 }),
      freeSlot({ common: 65, rare: 28, elite: 6, legendary: 1, ultra: 0, world_cup_hero: 0 }),
      freeSlot({ common: 65, rare: 28, elite: 6, legendary: 1, ultra: 0, world_cup_hero: 0 }),
    ],
  }),
});

// ─── Pacote Nacional ──────────────────────────────────────────────────────────
/**
 * 5 cartas. Slot 0 = garantido Elite-ou-melhor.
 * Filtro de seleção (ex: Brasil) aplicado pela camada de aplicação via cardResolver.
 * WCH sem peso — herói da copa não entra neste pool.
 */
export const NATIONAL_PACK: Pack = Object.freeze({
  id: packId('national'),
  name: 'Pacote Nacional',
  description: 'Pack temático de seleção. 5 cartas, com pelo menos 1 Elite garantida.',
  cardsPerPack: 5,
  dropTable: Object.freeze({
    slots: [
      guaranteedSlot('elite', { common: 0, rare: 0, elite: 70, legendary: 25, ultra: 5, world_cup_hero: 0 }),
      freeSlot({ common: 40, rare: 35, elite: 18, legendary: 6, ultra: 1, world_cup_hero: 0 }),
      freeSlot({ common: 40, rare: 35, elite: 18, legendary: 6, ultra: 1, world_cup_hero: 0 }),
      freeSlot({ common: 40, rare: 35, elite: 18, legendary: 6, ultra: 1, world_cup_hero: 0 }),
      freeSlot({ common: 40, rare: 35, elite: 18, legendary: 6, ultra: 1, world_cup_hero: 0 }),
    ],
  }),
});

// ─── Pacote Herói ─────────────────────────────────────────────────────────────
/**
 * 3 cartas. Slot 0 = garantido Legendary-ou-melhor (sem WCH nos slots livres).
 * Diferente do Lenda: pesos de slot 0 mais equilibrados (mais chance de Ultra).
 * Slots livres têm weights elevados de Elite+.
 */
export const HERO_PACK: Pack = Object.freeze({
  id: packId('hero'),
  name: 'Pacote Herói',
  description: 'Pack premium. 3 cartas, com 1 Legendary garantida e chances elevadas de Elite.',
  cardsPerPack: 3,
  dropTable: Object.freeze({
    slots: [
      Object.freeze({
        rarityWeights: Object.freeze({
          common: 0,
          rare: 0,
          elite: 0,
          legendary: 60,
          ultra: 35,
          world_cup_hero: 5,
        }),
        guaranteedMinRarity: 'legendary' as const,
      }),
      freeSlot({ common: 0, rare: 20, elite: 55, legendary: 20, ultra: 5, world_cup_hero: 0 }),
      freeSlot({ common: 20, rare: 40, elite: 30, legendary: 9, ultra: 1, world_cup_hero: 0 }),
    ],
  }),
});

// ─── Pacote GOAT ─────────────────────────────────────────────────────────────
/**
 * 2 cartas de altíssima raridade. Slot 0 = Ultra-ou-melhor garantido.
 * Slot 1 = Legendary-ou-melhor garantido.
 * O pack mais exclusivo e caro (2500c).
 */
export const GOAT_PACK: Pack = Object.freeze({
  id: packId('goat'),
  name: 'Pacote GOAT',
  description: 'Pack de lendas máximas. 2 cartas, ambas garantidas Legendary ou superior.',
  cardsPerPack: 2,
  dropTable: Object.freeze({
    slots: [
      Object.freeze({
        rarityWeights: Object.freeze({
          common: 0,
          rare: 0,
          elite: 0,
          legendary: 0,
          ultra: 60,
          world_cup_hero: 40,
        }),
        guaranteedMinRarity: 'ultra' as const,
      }),
      Object.freeze({
        rarityWeights: Object.freeze({
          common: 0,
          rare: 0,
          elite: 0,
          legendary: 75,
          ultra: 20,
          world_cup_hero: 5,
        }),
        guaranteedMinRarity: 'legendary' as const,
      }),
    ],
  }),
});

/** Mapa de todos os packs disponíveis por ID. */
export const ALL_PACKS: Readonly<Record<string, Pack>> = Object.freeze({
  classic: CLASSIC_PACK,
  elite: ELITE_PACK,
  legend: LEGEND_PACK,
  prime: PRIME_PACK,
  'copa-hero': COPA_HERO_PACK,
  starter: STARTER_PACK,
  national: NATIONAL_PACK,
  hero: HERO_PACK,
  goat: GOAT_PACK,
});
