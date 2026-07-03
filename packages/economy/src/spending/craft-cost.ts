/**
 * `calculateCraftCost` — custo de fragmentos para craftar uma carta.
 *
 * Fonte: doc 10 §17, tabela completa e definitiva:
 *
 * | Raridade       | Custo (Fragmentos) |
 * |----------------|--------------------|
 * | Common         |                 50 |
 * | Rare           |                200 |
 * | Elite          |                600 |
 * | Legendary      |              1.500 |
 * | Ultra          |              4.000 |
 * | World Cup Hero | NÃO CRAFTÁVEL      |
 * | GOAT           | NÃO CRAFTÁVEL      |
 *
 * Funções puras — sem efeitos colaterais.
 * A validação de "carta já possuída" é responsabilidade do chamador
 * (pertence ao bounded context de Collection, não de Economy).
 */
import type { RarityCode } from '@world-legends/types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CraftCostResult = Readonly<{
  readonly rarityCode: RarityCode;
  readonly fragmentCost: number;
  readonly isCraftable: boolean;
  /**
   * Razão de não-craftabilidade, presente quando `isCraftable = false`.
   * doc 10 §17: WCH é "exclusiva de evento/pack — preserva seu prestígio";
   * GOAT é "exclusiva de conquista".
   */
  readonly notCraftableReason?: 'exclusive_event_drop' | 'exclusive_achievement';
}>;

// ─── Tabela de custos — doc 10 §17 ───────────────────────────────────────────

/** Custo em fragmentos por raridade (doc 10 §17, valores exatos documentados). */
export const CRAFT_COSTS: Readonly<Partial<Record<RarityCode, number>>> = Object.freeze({
  common: 50,
  rare: 200,
  elite: 600,
  legendary: 1_500,
  ultra: 4_000,
  // world_cup_hero e goat: não craftáveis (doc 10 §17)
});

/** Raridades que nunca são craftáveis, com suas razões (doc 10 §11/§17). */
export const NON_CRAFTABLE_REASONS: Readonly<
  Partial<Record<RarityCode, CraftCostResult['notCraftableReason']>>
> = Object.freeze({
  world_cup_hero: 'exclusive_event_drop',
  // goat não é uma RarityCode no sistema (é uma EditionCode) — tratado
  // na camada de aplicação; aqui só cobrimos as raridades do catálogo.
});

/**
 * Calcula o custo de craft de uma carta pela sua raridade.
 *
 * Retorna `isCraftable = false` para World Cup Hero (e qualquer raridade
 * sem custo definido). O chamador usa `fragmentCost = 0` como sentinel
 * quando `isCraftable = false`.
 */
export function calculateCraftCost(rarityCode: RarityCode): CraftCostResult {
  const cost = CRAFT_COSTS[rarityCode];

  if (cost === undefined) {
    return Object.freeze({
      rarityCode,
      fragmentCost: 0,
      isCraftable: false,
      notCraftableReason: NON_CRAFTABLE_REASONS[rarityCode] ?? 'exclusive_event_drop',
    });
  }

  return Object.freeze({
    rarityCode,
    fragmentCost: cost,
    isCraftable: true,
  });
}

/**
 * Verifica se o saldo de fragmentos é suficiente para o craft.
 * Função auxiliar pura — o débito real é feito via `spendFragments` de use-cases/.
 */
export function canAffordCraft(
  fragmentBalance: number,
  rarityCode: RarityCode,
): { affordable: boolean; shortfall: number } {
  const { isCraftable, fragmentCost } = calculateCraftCost(rarityCode);
  if (!isCraftable) {
    return { affordable: false, shortfall: 0 };
  }
  const shortfall = Math.max(0, fragmentCost - fragmentBalance);
  return { affordable: shortfall === 0, shortfall };
}
