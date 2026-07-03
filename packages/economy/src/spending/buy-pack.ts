/**
 * `calculatePackCost` — custo de abertura de um pack.
 *
 * Fonte: doc 07 §1 (tabela de packs com custos), doc 10 §18 (economia).
 *
 * | Pack                | Custo           | Moeda    |
 * |---------------------|-----------------|----------|
 * | Inicial Gratuito    | —               | —        |
 * | Bronze              | 300 créditos    | credits  |
 * | Prata               | 800 créditos    | credits  |
 * | Ouro                | 2.000 créditos  | credits  |
 * | Copa Especial       | moeda premium   | premium  |
 *
 * Doc 10 §18: moeda premium NUNCA paga por uma carta diretamente —
 * apenas por packs e cosméticos. A verificação de "premium → pack, não carta"
 * é estrutural: o custo de pack retorna `currency: 'premium'`, e a camada
 * de aplicação chama `spendPremium` (que aceita `premium_pack_purchase`).
 *
 * Packs da T013 (`packages/packs`): ClassicPack, ElitePack, LegendPack,
 * PrimePack, CopaHeroPack. O mapeamento abaixo usa os mesmos IDs de pack.
 *
 * Funções puras — sem efeito colateral.
 */
import type { CurrencyCode } from '@world-legends/shared';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PackPurchaseResult = Readonly<{
  readonly packId: string;
  readonly cost: number;
  readonly currency: CurrencyCode;
  readonly isFree: boolean;
  /** Reason a usar em `depositCredits`/`spendPremium` ao comprar o pack. */
  readonly spendReason: 'pack_purchase' | 'premium_pack_purchase';
}>;

// ─── Tabela de custos por packId ──────────────────────────────────────────────

type PackSpec = Readonly<{
  cost: number;
  currency: CurrencyCode;
  isFree: boolean;
}>;

/**
 * Mapeamento de packId → spec de custo.
 * IDs espelham os definidos em `packages/packs/src/pack/pack-definitions.ts`.
 *
 * AVISO: os IDs dos packs do doc 07 §1 (Bronze/Prata/Ouro) diferem dos IDs
 * de T013 (Classic/Elite/Legend). Mantenho AMBOS para cobrir as duas
 * nomenclaturas documentadas:
 *   - doc 07 = nomenclatura de negócio (Bronze/Prata/Ouro)
 *   - T013   = nomenclatura técnica de implementação (classic/elite/legend)
 */
export const PACK_COSTS: Readonly<Record<string, PackSpec>> = Object.freeze({
  // doc 07 §1 — nomenclatura de negócio
  starter: Object.freeze({ cost: 0, currency: 'credits' as const, isFree: true }),
  bronze: Object.freeze({ cost: 300, currency: 'credits' as const, isFree: false }),
  silver: Object.freeze({ cost: 800, currency: 'credits' as const, isFree: false }),
  gold: Object.freeze({ cost: 2_000, currency: 'credits' as const, isFree: false }),
  'copa-especial': Object.freeze({ cost: 1, currency: 'premium' as const, isFree: false }),
  // T013 — nomenclatura técnica (doc 07 §1 mapeado para os packs de T013)
  classic: Object.freeze({ cost: 300, currency: 'credits' as const, isFree: false }),
  elite: Object.freeze({ cost: 800, currency: 'credits' as const, isFree: false }),
  legend: Object.freeze({ cost: 2_000, currency: 'credits' as const, isFree: false }),
  prime: Object.freeze({ cost: 1_200, currency: 'credits' as const, isFree: false }),
  'copa-hero': Object.freeze({ cost: 1, currency: 'premium' as const, isFree: false }),
});

/**
 * Calcula o custo de compra de um pack.
 * Retorna `null` se o packId não for reconhecido.
 */
export function calculatePackCost(packId: string): PackPurchaseResult | null {
  const spec = PACK_COSTS[packId];
  if (spec === undefined) return null;

  return Object.freeze({
    packId,
    cost: spec.cost,
    currency: spec.currency,
    isFree: spec.isFree,
    spendReason: (spec.currency === 'premium' ? 'premium_pack_purchase' : 'pack_purchase') as
      | 'pack_purchase'
      | 'premium_pack_purchase',
  });
}

/**
 * Verifica se o saldo disponível cobre o custo do pack.
 * Função auxiliar pura — o débito real é via `spendCredits`/`spendPremium`.
 */
export function canAffordPack(
  packId: string,
  creditBalance: number,
  premiumBalance: number,
): { affordable: boolean; shortfall: number; currency: CurrencyCode | null } {
  const packCost = calculatePackCost(packId);
  if (packCost === null) return { affordable: false, shortfall: 0, currency: null };
  if (packCost.isFree) return { affordable: true, shortfall: 0, currency: null };

  const balance = packCost.currency === 'premium' ? premiumBalance : creditBalance;
  const shortfall = Math.max(0, packCost.cost - balance);
  return { affordable: shortfall === 0, shortfall, currency: packCost.currency };
}
