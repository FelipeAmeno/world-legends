/**
 * `craft-cost.ts` — tabela de custos e funções auxiliares do módulo costs/.
 *
 * Os custos exatos (doc 10 §17) já foram implementados em
 * `packages/economy/src/spending/craft-cost.ts` (T015) como funções puras.
 * Esta fachada local:
 * 1. Reexporta as funções e constantes de economy para uso interno de craft.
 * 2. Adiciona `resolveCraftCost` — função de orquestração que combina
 *    elegibilidade + custo em um único passo, com CraftError tipado.
 *
 * TABELA DOCUMENTADA (doc 10 §17):
 *   Common         →   50 fragmentos
 *   Rare           →  200 fragmentos
 *   Elite          →  600 fragmentos
 *   Legendary      → 1500 fragmentos
 *   Ultra          → 4000 fragmentos
 *   World Cup Hero → não craftável
 *   GOAT (edition) → não craftável
 */
import {
  CRAFT_COSTS,
  calculateCraftCost as _calculateCraftCost,
  canAffordCraft as _canAffordCraft,
} from '@world-legends/economy';
import type { Result } from '@world-legends/shared';
import { Err, Ok } from '@world-legends/shared';
import type { EditionCode, RarityCode } from '@world-legends/types';
import { checkCraftEligibility } from '../catalog/craftable';
import type { CraftError } from '../types/types';

// Re-exporta para que os módulos internos de craft não precisem importar economy diretamente
export { CRAFT_COSTS };
export const calculateCraftCost = _calculateCraftCost;
export const canAffordCraft = _canAffordCraft;

/**
 * Resolve o custo de craft combinando elegibilidade + custo em um único passo.
 * Retorna `Result<number, CraftError>` onde o valor é o custo em fragmentos.
 *
 * Ordem de verificação (doc 17 §10, fluxo do doc 18 §18.3):
 *   1. Elegibilidade (WCH/GOAT → NotCraftable)
 *   2. Custo lookup (sempre > 0 para raridades craftáveis)
 */
export function resolveCraftCost(
  rarityCode: RarityCode,
  editionCode: EditionCode,
): Result<number, CraftError> {
  const eligibility = checkCraftEligibility(rarityCode, editionCode);
  if (!eligibility.eligible) {
    return Err(eligibility.error);
  }

  const costResult = _calculateCraftCost(rarityCode);
  if (!costResult.isCraftable) {
    // Fallback: não deveria chegar aqui após checkCraftEligibility, mas garante segurança
    return Err(
      Object.freeze({
        kind: 'NotCraftable' as const,
        rarityCode,
        reason: costResult.notCraftableReason ?? 'exclusive_event_drop',
      }),
    );
  }

  return Ok(costResult.fragmentCost);
}
