import { positionFitScore } from '../positions/compatibility';
/**
 * Cálculo de química do squad (doc 11 §4.2).
 *
 * Fórmula por jogador (0–10):
 *
 *   positionFit (0–4)
 *     4 = posição natural (ou diretamente equivalente)
 *     2 = posição compatível (adjacente)
 *     0 = fora de posição (não deveria acontecer em squad válido)
 *
 *   nationalityBonus (0–4)
 *     Conta companheiros de mesma nação nos 11 titulares.
 *     +1 por 3–4 companheiros da mesma nação
 *     +2 por 5–6 companheiros
 *     +3 por 7–8 companheiros
 *     +4 por 9–10 companheiros (seleção nacional completa)
 *
 *   formationBonus (0–2)
 *     +2 se squad tem 11 titulares preenchidos (time completo)
 *     +0 se squad incompleto
 *
 * Score total = average(11 scores) normalizado para 0–100.
 * Em squads incompletos, slots vazios contribuem 0 para a média.
 */
import type { ChemistryScore, PlayerInfo, Squad } from '../types/types';

// ─── Portas ───────────────────────────────────────────────────────────────────

/** Resolve PlayerInfo a partir de um userCardId. null = não encontrado. */
export type PlayerInfoResolver = (userCardId: string) => PlayerInfo | null;

// ─── nationalityBonus ────────────────────────────────────────────────────────

function nationalityBonus(nationality: string, allPlayers: readonly PlayerInfo[]): number {
  const sameNation = allPlayers.filter((p) => p.nationality === nationality).length - 1;
  // -1 para excluir o próprio jogador
  if (sameNation >= 9) return 4;
  if (sameNation >= 7) return 3;
  if (sameNation >= 5) return 2;
  if (sameNation >= 3) return 1;
  return 0;
}

// ─── calculateChemistry ───────────────────────────────────────────────────────

/**
 * Calcula a química completa do squad.
 * Slots vazios (userCardId === null) são ignorados na pontuação.
 * O squad deve ter resolvePlayer disponível para cada userCardId preenchido.
 */
export function calculateChemistry(
  squad: Squad,
  resolvePlayer: PlayerInfoResolver,
): ChemistryScore {
  const filledSlots = squad.starters.filter((s) => s.userCardId !== null);
  const isComplete = filledSlots.length === 11;

  // Resolver todos os PlayerInfo dos titulares
  const playerInfos: Array<{ slotId: string; info: PlayerInfo; slotPosition: string }> = [];
  for (const slot of filledSlots) {
    // biome-ignore lint/style/noNonNullAssertion: filledSlots already filtered null userCardId
    const info = resolvePlayer(slot.userCardId!);
    if (info) playerInfos.push({ slotId: slot.slotId, info, slotPosition: slot.requiredPosition });
  }

  const allInfos = playerInfos.map((p) => p.info);

  // Calcular score por jogador
  const perPlayer: Record<string, number> = {};
  let totalPositionFit = 0;
  let totalNationalityBonus = 0;
  let totalFormationBonus = 0;

  for (const { info, slotPosition } of playerInfos) {
    const pf = positionFitScore(
      info.naturalPosition,
      slotPosition as import('@world-legends/types').Position,
    );
    const nb = nationalityBonus(info.nationality, allInfos);
    const fb = isComplete ? 2 : 0;

    const score = Math.min(10, pf + nb + fb);
    perPlayer[info.userCardId] = score;

    totalPositionFit += pf;
    totalNationalityBonus += nb;
    totalFormationBonus += fb;
  }

  // Média: se squad incompleto, denominador = 11 (slots vazios = 0)
  const sum = Object.values(perPlayer).reduce((a, b) => a + b, 0);
  const average = playerInfos.length > 0 ? sum / 11 : 0;
  const total = Math.round(average * 10); // 0-100

  return Object.freeze({
    total,
    average: Math.round(average * 10) / 10,
    perPlayer: Object.freeze(perPlayer),
    breakdown: Object.freeze({
      positionFit: totalPositionFit,
      nationalityBonus: totalNationalityBonus,
      formationBonus: totalFormationBonus,
    }),
  });
}
