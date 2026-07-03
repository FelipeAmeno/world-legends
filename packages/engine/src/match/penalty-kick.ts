/**
 * `resolvePenaltyKick` — doc 09 §18, `cobrarPenalti`, sem desvios.
 * Compartilhada entre uma eventual cobrança em jogo (pênalti durante os
 * 90/120 minutos) e a disputa de pênaltis (doc 09 §20) — é a MESMA
 * fórmula nos dois contextos, doc 09 confirma isso explicitamente
 * (`shootout.ts` chama esta função).
 *
 * O pênalti EM JOGO (`resolverFaltaNaArea`, doc 09 §18) não está
 * implementado nesta primeira versão de `match` — depende de duas
 * constantes (`baseFalta`, `fatorPosicaoNoCampo`) que doc nenhum
 * define numericamente. Inventar esses números teria sido inventar uma
 * probabilidade de pênalti do nada; preferi deixar essa via fechada
 * (nenhuma falta em jogo nunca se torna pênalti nesta versão) e deixar
 * a fórmula de cobrança em si — que É totalmente especificada — pronta
 * para quando essa lacuna for resolvida.
 */
import type { RNGInstance } from '../rng/rng';

export type PenaltyKickOutcome = 'scored' | 'saved' | 'missed';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function resolvePenaltyKick(input: {
  takerPenaltyKicks: number;
  takerComposure: number;
  goalkeeperGkPenaltySave: number;
  goalkeeperGkReflexes: number;
  rng: RNGInstance;
  /** doc 10 §5, trait "Gelo nas Veias" (T006) — bônus aditivo em pontos percentuais, teto 10. */
  geloNasVeiasBonusPercent?: number;
}): PenaltyKickOutcome {
  const kickQuality = (input.takerPenaltyKicks * 0.6 + input.takerComposure * 0.4) / 99;
  const saveQuality = (input.goalkeeperGkPenaltySave * 0.7 + input.goalkeeperGkReflexes * 0.3) / 99;
  let conversionChance = clamp(0.68 + kickQuality * 0.25 - saveQuality * 0.2, 0.45, 0.93);
  if (input.geloNasVeiasBonusPercent !== undefined) {
    conversionChance = clamp(conversionChance + input.geloNasVeiasBonusPercent / 100, 0.45, 0.93);
  }

  if (input.rng.nextFloat() < conversionChance) {
    return 'scored';
  }
  return input.rng.nextFloat() < 0.5 ? 'saved' : 'missed';
}

/** "Qualidade de cobrança" isolada — usada para RANQUEAR cobradores (doc 09 §18/§20 não dão fórmula própria de ranking; reuso a mesma fórmula da conversão, é a métrica mais direta de "quão bom é nos pênaltis"). */
export function calculatePenaltyKickQuality(penaltyKicks: number, composure: number): number {
  return penaltyKicks * 0.6 + composure * 0.4;
}
