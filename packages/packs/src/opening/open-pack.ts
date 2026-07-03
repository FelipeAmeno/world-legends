import { RNG } from '@world-legends/engine';
/**
 * `openPack` — função pura e determinística para abrir um pack em memória.
 *
 * Algoritmo (doc 07 §2, `openPack`):
 * 1. Derivar stream de RNG do seed via `deriveStream` (doc 09 §21).
 * 2. Para cada slot da DropTable:
 *    a. Se pity está ativado para este pack, forçar a garantia de raridade.
 *    b. Se o slot tem `guaranteedMinRarity`, usar `rollRarityWithGuarantee`.
 *    c. Sortear edição via `rollEdition`.
 *    d. Resolver CardId via `CardResolver`.
 * 3. Calcular `highestRarity` para atualizar pity.
 * 4. Retornar `PackResult` imutável.
 *
 * `CardResolver` é injetado — mantém `packs` desacoplado de `cards`.
 * Retorna null se não há carta disponível para (rarityCode, editionCode).
 *
 * DETERMINISMO: Mesmo seed → mesmo resultado sempre.
 */
import { createSeed, deriveStream } from '@world-legends/shared';
import type { EditionCode, RarityCode } from '@world-legends/types';
import {
  RARITY_ORDER,
  rollEdition,
  rollRarity,
  rollRarityWithGuarantee,
} from '../drop-table/drop-table';
import type { Pack } from '../pack/pack-definitions';
import { getForcedMinRarity, isForced, isSatisfiedBy } from '../pity/pity-counter';
import type { UserPityState } from '../pity/pity-counter';
import { openingId } from './types';
import type { PackResult, SlotResult } from './types';

// ─── CardResolver ─────────────────────────────────────────────────────────────
/**
 * Injetado pelo chamador. Seleciona um CardId do catálogo para a
 * (rarityCode, editionCode) sorteada. Retorna null se pool vazio.
 *
 * A seleção específica dentro do pool é responsabilidade do resolver —
 * `openPack` não conhece o catálogo.
 */
export type CardResolver = (rarityCode: RarityCode, editionCode: EditionCode) => string | null;

// ─── openPack ─────────────────────────────────────────────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: pack opening must handle rarity tiers, guaranteed slots, and pool selection
export function openPack(input: {
  packOpeningId: string;
  pack: Pack;
  seed: string;
  pityState: UserPityState;
  cardResolver: CardResolver;
}): PackResult {
  // Derivar stream de RNG dedicado a esta abertura (doc 09 §21 / doc 07 §2)
  const seedResult = createSeed(input.seed);
  if (!seedResult.ok) throw new Error(`Seed inválido: ${input.seed}`);
  const packStream = deriveStream(seedResult.value, `pack_opening:${input.packOpeningId}`);
  const rng = RNG(packStream);

  const slots: SlotResult[] = [];
  let highestRarityOrder = -1;

  // Verifica se o pity está ativado ANTES desta abertura
  const legendaryPityForced = isForced(input.pityState.legendaryPlus);
  const ultraPityForced = isForced(input.pityState.ultraPlus);

  // Qual é o primeiro slot que pode "ser forçado" pelo pity?
  // Doc 17 §8: "a PRÓXIMA abertura é forçada" — aplica ao slot 0 desta abertura.
  // Se ambos estiverem forçados, ultra+ prevalece (é mais restritivo).
  let pityforcedApplied = false;

  for (let slotIndex = 0; slotIndex < input.pack.dropTable.slots.length; slotIndex++) {
    const slotDef = input.pack.dropTable.slots[slotIndex];
    if (slotDef === undefined) continue;
    let wasForced = false;
    let rarity: RarityCode;

    // Aplicar pity no primeiro slot elegível (slot sem garantia própria superior)
    if (!pityforcedApplied && (legendaryPityForced || ultraPityForced)) {
      const pitMin: RarityCode = ultraPityForced ? 'ultra' : 'legendary';
      // Só aplica se o pity pede mais do que a garantia já existente do slot
      const slotMin = slotDef.guaranteedMinRarity ?? 'common';
      const pitIsStronger = RARITY_ORDER[pitMin] > RARITY_ORDER[slotMin];

      if (pitIsStronger) {
        rarity = rollRarityWithGuarantee(slotDef.rarityWeights, rng, pitMin);
        wasForced = true;
        pityforcedApplied = true;
      } else {
        // A garantia do slot já é ≥ pity — slot normal, pity satisfeito implicitamente
        rarity =
          slotDef.guaranteedMinRarity !== undefined
            ? rollRarityWithGuarantee(slotDef.rarityWeights, rng, slotDef.guaranteedMinRarity)
            : rollRarity(slotDef.rarityWeights, rng);
        // Se esta raridade satisfaz o pity, marcamos como aplicado
        if (
          (legendaryPityForced && isSatisfiedBy(input.pityState.legendaryPlus, rarity)) ||
          (ultraPityForced && isSatisfiedBy(input.pityState.ultraPlus, rarity))
        ) {
          pityforcedApplied = true;
        }
      }
    } else if (slotDef.guaranteedMinRarity !== undefined) {
      rarity = rollRarityWithGuarantee(slotDef.rarityWeights, rng, slotDef.guaranteedMinRarity);
    } else {
      rarity = rollRarity(slotDef.rarityWeights, rng);
    }

    const editionCode: EditionCode = rollEdition(slotDef.editionWeights, rng);
    const cardId = input.cardResolver(rarity, editionCode);

    const order = RARITY_ORDER[rarity];
    if (order > highestRarityOrder) highestRarityOrder = order;

    slots.push(
      Object.freeze({
        slotIndex,
        rarityCode: rarity,
        editionCode,
        cardId,
        wasForced,
      }),
    );
  }

  // Determinar highestRarity a partir do order registrado
  const rarityByOrder = Object.entries(RARITY_ORDER) as [RarityCode, number][];
  const highestRarity: RarityCode =
    rarityByOrder.find(([, order]) => order === highestRarityOrder)?.[0] ?? 'common';

  return Object.freeze({
    openingId: openingId(input.packOpeningId),
    packId: input.pack.id,
    seed: input.seed,
    slots: Object.freeze(slots),
    highestRarity,
  });
}
