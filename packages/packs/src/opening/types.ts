/**
 * Tipos de PackResult e PackOpening.
 *
 * `openPack` — função pura e determinística que simula a abertura de um
 * pack em memória (doc 07 §2). Retorna um `PackResult` imutável.
 *
 * DESIGN: `openPack` não sabe quais cartas específicas existem no catálogo
 * — ela sorteia (rarityCode, editionCode) por slot. A resolução de "qual
 * CardId específico" é feita por um `CardResolver` injetado pelo chamador.
 * Isso desacopla `packs` de `cards` sem violar doc 18 §3.
 *
 * Por que não importar `@world-legends/cards` diretamente?
 * Doc 18 §3 define as fronteiras de dependência. `packs` não lista `cards`
 * como dependência — e não precisa: o sorteio de raridade/edição é
 * responsabilidade de `packs`; a resolução do CardId específico é do
 * contexto de aplicação que chama `openPack`.
 */
import type { EditionCode, RarityCode } from '@world-legends/types';
import type { PackId } from '../pack/pack-definitions';

// ─── OpeningId ────────────────────────────────────────────────────────────────
export type OpeningId = string & { readonly _brand: 'OpeningId' };
export function openingId(v: string): OpeningId {
  if (!v.trim()) throw new Error('OpeningId vazio');
  return v as OpeningId;
}

// ─── CardRef — referência a uma carta sorteada ────────────────────────────────
/**
 * O resultado de um slot: raridade e edição sorteadas + o CardId resolvido
 * pelo `CardResolver`. `cardId` pode ser null se o resolver não encontrou
 * carta disponível para essa combinação (pool vazio — caso de borda).
 */
export type SlotResult = Readonly<{
  readonly slotIndex: number;
  readonly rarityCode: RarityCode;
  readonly editionCode: EditionCode;
  /** CardId resolvido pelo chamador. String para não depender de @world-legends/cards. */
  readonly cardId: string | null;
  /** true se este slot foi sorteado via garantia de pity (não aleatório puro). */
  readonly wasForced: boolean;
}>;

// ─── PackResult ───────────────────────────────────────────────────────────────
/**
 * Resultado completo de uma abertura de pack.
 *
 * `slots` sempre tem exatamente `pack.cardsPerPack` itens.
 * `seed` é o valor usado — gravado para auditabilidade (doc 07 §2).
 * `highestRarity` = raridade mais alta obtida nesta abertura (para atualizar pity).
 */
export type PackResult = Readonly<{
  readonly openingId: OpeningId;
  readonly packId: PackId;
  readonly seed: string;
  readonly slots: readonly SlotResult[];
  readonly highestRarity: RarityCode;
}>;
