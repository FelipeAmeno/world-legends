/**
 * `tier.ts` — as 6 divisões do sistema de ranking (T019).
 *
 * Os nomes são definidos pelo enunciado da T019. As faixas de rating (ELO)
 * que definem cada divisão NÃO estão documentadas com números precisos
 * nos docs — são decisão de calibração própria baseada nas âncoras do sistema:
 *
 * - ELO_INITIAL = 1000 (novos jogadores entram em Prata)
 * - K_FACTOR = 24 (ganho por partida é pequeno → progressão lenta)
 * - 6 divisões equidistantes a partir de 0
 *
 * Decisão de calibração (D-RANK-01):
 *   Bronze      [0,    999]   — jogadores novos/iniciantes
 *   Prata       [1000, 1499]  — entram aqui todos os novos (ELO_INITIAL = 1000)
 *   Ouro        [1500, 1999]  — intermediário
 *   Elite       [2000, 2499]  — avançado
 *   Lenda       [2500, 2999]  — topo da pirâmide acessível
 *   World Legend[3000, ∞]     — exclusivo; top < 1% dos jogadores
 *
 * Promoção/rebaixamento (doc 06 §3.2):
 *   Top 20% da divisão sobe; Bottom 20% desce (exceto Bronze/World Legend).
 *   Percentuais são decisão própria (doc 06 §3.2 menciona "Top X%/Bottom Y%" sem números).
 */

// ─── Tier ─────────────────────────────────────────────────────────────────────

export type TierName = 'Bronze' | 'Prata' | 'Ouro' | 'Elite' | 'Lenda' | 'World Legend';

export type Tier = Readonly<{
  readonly name: TierName;
  readonly minRating: number;
  readonly maxRating: number | null; // null = sem teto (World Legend)
  readonly rank: number; // 1=Bronze, 6=World Legend
}>;

// ─── Tabela de divisões (D-RANK-01) ──────────────────────────────────────────

export const TIERS: readonly Tier[] = Object.freeze([
  Object.freeze({ name: 'Bronze' as TierName, minRating: 0, maxRating: 999, rank: 1 }),
  Object.freeze({ name: 'Prata' as TierName, minRating: 1000, maxRating: 1499, rank: 2 }),
  Object.freeze({ name: 'Ouro' as TierName, minRating: 1500, maxRating: 1999, rank: 3 }),
  Object.freeze({ name: 'Elite' as TierName, minRating: 2000, maxRating: 2499, rank: 4 }),
  Object.freeze({ name: 'Lenda' as TierName, minRating: 2500, maxRating: 2999, rank: 5 }),
  Object.freeze({ name: 'World Legend' as TierName, minRating: 3000, maxRating: null, rank: 6 }),
]);

/** rank → Tier lookup — O(1) instead of TIERS.find() inside loops. */
const TIER_BY_RANK: ReadonlyMap<number, Tier> = new Map(TIERS.map((t) => [t.rank, t]));

/** Rating mínimo de cada tier — lookup rápido. */
export const TIER_THRESHOLDS: Readonly<Record<TierName, number>> = Object.freeze({
  Bronze: 0,
  Prata: 1000,
  Ouro: 1500,
  Elite: 2000,
  Lenda: 2500,
  'World Legend': 3000,
});

// ─── tierFromRating ───────────────────────────────────────────────────────────

/**
 * Retorna o Tier correspondente a um rating Elo.
 * Nunca retorna null — todo rating pertence a algum tier.
 */
export function tierFromRating(rating: number): Tier {
  // Percorre de maior para menor para achar o tier correto
  for (let i = TIERS.length - 1; i >= 0; i--) {
    // biome-ignore lint/style/noNonNullAssertion: i is bounded by TIERS.length
    const tier = TIERS[i]!;
    if (rating >= tier.minRating) return tier;
  }
  // biome-ignore lint/style/noNonNullAssertion: TIERS always has at least one element (Bronze)
  return TIERS[0]!; // Bronze (rating < 0 seria piso)
}

// ─── tierFromName ─────────────────────────────────────────────────────────────

export function tierFromName(name: TierName): Tier {
  // biome-ignore lint/style/noNonNullAssertion: TIERS always has at least one element (Bronze)
  return TIERS.find((t) => t.name === name) ?? TIERS[0]!;
}

// ─── Promoção e Rebaixamento (doc 06 §3.2) ────────────────────────────────────

/**
 * Percentuais de promoção/rebaixamento por temporada.
 * "Top X% sobe, Bottom Y% desce" (doc 06 §3.2 — sem números exatos).
 * Decisão própria: 20%/20% — padrão competitivo razoável.
 */
export const PROMOTION_PERCENT = 0.2; // top 20% sobe
export const RELEGATION_PERCENT = 0.2; // bottom 20% desce

export type PromotionResult = Readonly<{
  readonly profileId: string;
  readonly currentTier: TierName;
  readonly newTier: TierName;
  readonly moved: boolean;
  readonly direction: 'promoted' | 'relegated' | 'unchanged';
}>;

/**
 * Calcula promoções e rebaixamentos para uma lista de jogadores ordenada por rating.
 *
 * @param rankings - Array de { profileId, rating } ordenado por rating DESC dentro do tier
 * @param tierName - Tier para o qual calcular promoção/rebaixamento
 */
export function calculateTierMovements(
  rankings: readonly { profileId: string; rating: number }[],
  tierName: TierName,
): readonly PromotionResult[] {
  if (rankings.length === 0) return [];

  const tier = tierFromName(tierName);
  const n = rankings.length;

  const promotionCutoff = Math.floor(n * PROMOTION_PERCENT);
  const relegationStart = n - Math.floor(n * RELEGATION_PERCENT);

  return rankings.map((player, idx): PromotionResult => {
    let direction: PromotionResult['direction'] = 'unchanged';
    let newTierName = tierName;

    // Promoção: top 20% sobe (exceto World Legend — não há tier acima)
    if (idx < promotionCutoff && tier.rank < 6) {
      const nextTier = TIER_BY_RANK.get(tier.rank + 1);
      if (nextTier !== undefined) {
        direction = 'promoted';
        newTierName = nextTier.name;
      }
    }
    // Rebaixamento: bottom 20% desce (exceto Bronze — não há tier abaixo)
    else if (idx >= relegationStart && tier.rank > 1) {
      const prevTier = TIER_BY_RANK.get(tier.rank - 1);
      if (prevTier !== undefined) {
        direction = 'relegated';
        newTierName = prevTier.name;
      }
    }

    return Object.freeze({
      profileId: player.profileId,
      currentTier: tierName,
      newTier: newTierName,
      moved: direction !== 'unchanged',
      direction,
    });
  });
}

/** Verifica se dois ratings estão na mesma divisão. */
export function sameTier(ratingA: number, ratingB: number): boolean {
  return tierFromRating(ratingA).name === tierFromRating(ratingB).name;
}
