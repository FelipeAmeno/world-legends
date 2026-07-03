/**
 * PackService — T030 Pack Opening Engine.
 *
 * Camada de orquestração que envolve `openPack` (T013) com:
 *   1. Detecção de duplicatas → conversão em fragmentos.
 *   2. Atualização de pity após cada abertura.
 *   3. Custo em créditos (validação injetada via port).
 *   4. Resultado enriquecido com dados de serviço.
 *
 * Puro em memória — sem banco, sem API.
 * O chamador (apps/*) aplica débitos de crédito via @world-legends/economy
 * e persiste cartas via @world-legends/collection.
 *
 * Doc 18 §3: este módulo vive em packages/packs e pode importar apenas
 * packages que já fazem parte do grafo de deps de packs.
 */
import type { RarityCode } from '@world-legends/types';
import { fragmentsForDuplicate } from '../fragments/fragment-rewards';
import { openPack } from '../opening/open-pack';
import type { CardResolver } from '../opening/open-pack';
import type { PackResult, SlotResult } from '../opening/types';
import type { Pack } from '../pack/pack-definitions';
import type { UserPityState } from '../pity/pity-counter';
import { updatePityAfterOpening } from '../pity/pity-counter';

// ─── Tipos do serviço ─────────────────────────────────────────────────────────

/** Slot enriquecido com info de duplicata e fragmentos. */
export type ServiceSlot = Readonly<
  SlotResult & {
    /** true se o usuário já possuía esta carta antes da abertura. */
    readonly isDuplicate: boolean;
    /** Fragmentos concedidos se for duplicata (0 se não for). */
    readonly fragmentsAwarded: number;
  }
>;

export type PackServiceResult = Readonly<{
  readonly packResult: PackResult;
  /** Slots enriquecidos com info de duplicata/fragmentos. */
  readonly slots: readonly ServiceSlot[];
  /** Total de fragmentos ganhos nesta abertura (soma dos duplicatas). */
  readonly totalFragmentsEarned: number;
  /** Número de cartas novas (não duplicatas). */
  readonly newCardsCount: number;
  /** Número de duplicatas convertidas. */
  readonly duplicatesCount: number;
  /** Pity state atualizado para persistir. */
  readonly updatedPityState: UserPityState;
}>;

// ─── Port: verificação de posse de carta ─────────────────────────────────────

/**
 * Porta: verifica se o usuário já possui uma carta.
 * Injetada pelo chamador — desacopla PackService de @world-legends/collection.
 */
export type CardOwnershipChecker = (cardId: string) => boolean;

// ─── openPackWithService ──────────────────────────────────────────────────────

export type PackServiceInput = Readonly<{
  /** ID único desta abertura (idempotência). */
  readonly packOpeningId: string;
  /** Definição do pacote. */
  readonly pack: Pack;
  /** Seed determinístico. */
  readonly seed: string;
  /** Estado atual de pity do usuário (antes desta abertura). */
  readonly pityState: UserPityState;
  /**
   * Resolve CardId a partir de (raridade, edição).
   * Retorna null se o pool está vazio para essa combinação.
   */
  readonly cardResolver: CardResolver;
  /**
   * Verifica se o usuário já possui um cardId específico.
   * Retorna false se cardId for null (slot não resolvido).
   */
  readonly ownershipChecker: CardOwnershipChecker;
}>;

/**
 * Abre um pack completo com detecção de duplicatas e atualização de pity.
 *
 * Pipeline:
 *   1. Chamar `openPack()` para sortear raridades/edições.
 *   2. Para cada slot: verificar se é duplicata via `ownershipChecker`.
 *   3. Calcular fragmentos para cada slot duplicata.
 *   4. Atualizar pity via `updatePityAfterOpening()`.
 *   5. Retornar `PackServiceResult` completo.
 */
export function openPackWithService(input: PackServiceInput): PackServiceResult {
  // ── 1. Abrir pack base ────────────────────────────────────────────────────
  const packResult = openPack({
    packOpeningId: input.packOpeningId,
    pack: input.pack,
    seed: input.seed,
    pityState: input.pityState,
    cardResolver: input.cardResolver,
  });

  // ── 2. Enriquecer slots com info de duplicata ─────────────────────────────
  const slots: ServiceSlot[] = packResult.slots.map((slot) => {
    const isDuplicate = slot.cardId !== null && input.ownershipChecker(slot.cardId);

    const fragmentsAwarded = isDuplicate ? fragmentsForDuplicate(slot.rarityCode) : 0;

    return Object.freeze({
      ...slot,
      isDuplicate,
      fragmentsAwarded,
    });
  });

  // ── 3. Totais ─────────────────────────────────────────────────────────────
  const totalFragmentsEarned = slots.reduce((s, sl) => s + sl.fragmentsAwarded, 0);
  const duplicatesCount = slots.filter((sl) => sl.isDuplicate).length;
  const newCardsCount = slots.length - duplicatesCount;

  // ── 4. Atualizar pity ─────────────────────────────────────────────────────
  const updatedPityState = updatePityAfterOpening(input.pityState, packResult.highestRarity);

  return Object.freeze({
    packResult,
    slots: Object.freeze(slots),
    totalFragmentsEarned,
    newCardsCount,
    duplicatesCount,
    updatedPityState,
  });
}
