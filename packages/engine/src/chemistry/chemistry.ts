/**
 * calculateChemistry — terceiro submódulo do Match Engine
 * (docs/19-implementation-strategy-master.md, §10 e §18 — Tarefa T014 no
 * roteiro mestre, chamada aqui de T005). NÃO inclui nenhuma lógica de
 * simulação de partida — apenas o cálculo de química do elenco em si.
 *
 * Esta função sintetiza TRÊS documentos, porque nenhum deles isolado dá
 * a fórmula completa:
 *
 * 1. `docs/09-match-engine-master.md`, §4 — modelo de links entre pares
 *    adjacentes na formação, e a agregação desses links em uma química
 *    de time 0–100:
 *    ```
 *    ALGORITMO calcularLink(jogadorA, jogadorB):
 *        pontos = 0
 *        SE jogadorA.nacionalidade == jogadorB.nacionalidade: pontos += 2
 *        SE eras_se_sobrepoem(jogadorA, jogadorB): pontos += 1
 *        SE jogadorA.posicao_natural == slot_da_formacao: pontos += 1
 *        SE jogadorB.posicao_natural == slot_da_formacao: pontos += 1
 *        RETORNA clamp(pontos, 0, 4)
 *
 *    ALGORITMO calcularQuimicaTime(squad):
 *        pares_adjacentes = obterParesAdjacentesNaFormacao(squad.formacao)
 *        total = Σ calcularLink(par.A, par.B)  para cada par em pares_adjacentes
 *        quimica = clamp(round(total / maximo_possivel * 100), 0, 100)
 *        RETORNA quimica
 *    ```
 *
 * 2. `docs/10-card-system-master.md`, §7 ("Química Histórica") — o
 *    próprio doc diz que EXPANDE o componente nacionalidade+era de (1)
 *    com uma tabela de 5 níveis mais granular:
 *
 *    | Relação | Pontos |
 *    |---|---|
 *    | Mesma seleção e mesma edição de Copa | +4 |
 *    | Mesma seleção, eras sobrepostas, Copas diferentes | +2 |
 *    | Mesma seleção, eras não sobrepostas | +1 |
 *    | Nações diferentes, eras sobrepostas | 0 |
 *    | Nações diferentes, eras totalmente distintas | -1 |
 *
 *    mais o "Bônus de Time Histórico Completo": se TODOS os titulares
 *    forem da mesma seleção E da mesma edição de Copa, bônus fixo
 *    adicional de química — o próprio doc 10 define a condição
 *    operacionalmente como "a mesma seleção, a mesma edição", então não
 *    é necessário nenhum lookup externo de elenco real para ESTE bônus
 *    específico (o gancho para o sistema de Combos curados manualmente,
 *    doc 10 §8, é uma camada adicional, fora do escopo desta função).
 *
 * 3. `docs/13-acceptance-tests-qa-master.md`, TC-COMBO-05 — único lugar
 *    que dá o valor NUMÉRICO do bônus de Time Histórico Completo: +8.
 *
 * DUAS DECISÕES DE SÍNTESE, deixadas explícitas porque nenhum doc as
 * resolve sozinho:
 *
 * (a) Doc 10 diz "expande" o componente nacionalidade+era de (1) — não
 *     diz se o bônus de encaixe posicional (+1 por jogador) de (1) some
 *     ou permanece. Decisão: o encaixe posicional permanece, somado ao
 *     valor da tabela de doc 10, com o teto de doc 09 (`clamp(.., 0, 4)`)
 *     reaplicado sobre a SOMA — preservando o teto de 4 por par que doc 09
 *     já documentava, agora também com o piso de -1 introduzido por doc 10.
 *
 * (b) Doc 09 §2 promete uma penalidade "leve" (fora da posição primária
 *     mas dentro de uma secundária) e "severa" (fora de qualquer posição
 *     registrada) "na seção 4" — mas a seção 4 real, como escrita, só
 *     tem o bônus binário acima, sem nenhum valor numérico para essas
 *     duas penalidades. Isso é uma LACUNA REAL de documentação, não uma
 *     omissão minha: não inventei números de penalidade aqui. Implemento
 *     só o que a seção 4 efetivamente especifica (o bônus binário de +1).
 *     Recomendo uma Design Decision futura para fechar essa lacuna antes
 *     que qualquer balanceamento dependa dela.
 *
 * Função pura: nenhum I/O, nenhum estado global. Não simula partida —
 * apenas o número de química 0–100 que a partida (módulo `match`, ainda
 * não implementado) vai consumir como entrada.
 */
import type { AdjacentSlotPair, ChemistryPlayer, ChemistrySquadSlot } from './types';

/** Teto documentado por par (doc 09 §4) — preservado mesmo após a revisão de doc 10 §7. */
const MAX_LINK_POINTS_PER_PAIR = 4;
/** Piso introduzido por doc 10 §7 (nações diferentes, eras totalmente distintas). */
const MIN_LINK_POINTS_PER_PAIR = -1;
/**
 * doc 10 §7 + doc 13 TC-COMBO-05 — único valor numérico documentado para
 * o bônus de Time Histórico Completo. Exportado (não usado internamente
 * nesta função, ver `ChemistryResult`) para que o futuro módulo de
 * Força de Time (doc 09 §3, fora do escopo desta tarefa) tenha o valor
 * canônico pronto, em vez de precisar redescobri-lo no doc.
 */
export const HISTORICAL_COMPLETE_SQUAD_BONUS = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function erasOverlap(a: ChemistryPlayer, b: ChemistryPlayer): boolean {
  return a.eraStart <= b.eraEnd && b.eraStart <= a.eraEnd;
}

/**
 * Tabela de 5 níveis de doc 10 §7 — substitui o componente
 * nacionalidade+era de doc 09 §4 com a granularidade histórica real.
 */
function calculateHistoricalRelationPoints(a: ChemistryPlayer, b: ChemistryPlayer): number {
  const sameNationality = a.nationality === b.nationality;
  const sameWorldCup =
    sameNationality && a.worldCupYear !== undefined && a.worldCupYear === b.worldCupYear;

  if (sameNationality && sameWorldCup) {
    return 4; // mesma seleção e mesma edição de Copa
  }
  if (sameNationality && erasOverlap(a, b)) {
    return 2; // mesma seleção, eras sobrepostas, Copas diferentes
  }
  if (sameNationality) {
    return 1; // mesma seleção, eras não sobrepostas
  }
  if (erasOverlap(a, b)) {
    return 0; // nações diferentes, eras sobrepostas
  }
  return -1; // nações diferentes, eras totalmente distintas (penalidade)
}

/** Link completo de um par adjacente: tabela histórica (doc 10) + bônus de encaixe posicional (doc 09 §4), reclampado. */
function calculatePairLink(slotA: ChemistrySquadSlot, slotB: ChemistrySquadSlot): number {
  const historicalPoints = calculateHistoricalRelationPoints(slotA.player, slotB.player);
  const positionFitBonus =
    (slotA.player.primaryPosition === slotA.formationPosition ? 1 : 0) +
    (slotB.player.primaryPosition === slotB.formationPosition ? 1 : 0);
  return clamp(
    historicalPoints + positionFitBonus,
    MIN_LINK_POINTS_PER_PAIR,
    MAX_LINK_POINTS_PER_PAIR,
  );
}

/**
 * Verifica a condição do "Time Histórico Completo" (doc 10 §7): TODOS os
 * slots fornecidos compartilham a mesma nacionalidade e a mesma edição
 * de Copa definida. Squad vazio, ou onde nenhum jogador tem
 * `worldCupYear` definido, nunca qualifica.
 */
function isCompleteHistoricalSquadCheck(slots: readonly ChemistrySquadSlot[]): boolean {
  if (slots.length === 0) {
    return false;
  }
  // biome-ignore lint/style/noNonNullAssertion: slots.length > 0 checked above
  const first = slots[0]!.player;
  if (first.worldCupYear === undefined) {
    return false;
  }
  return slots.every(
    (slot) =>
      slot.player.nationality === first.nationality &&
      slot.player.worldCupYear === first.worldCupYear,
  );
}

/**
 * Resultado de `calculateChemistry`: o número 0–100 de doc 09 §4 (puro,
 * sem nenhum ajuste) MAIS a condição de "Time Histórico Completo"
 * (doc 10 §7) como um flag separado.
 *
 * Por que separado, e não somado direto à química (como eu tinha feito
 * numa primeira versão desta função): a condição "todos os titulares
 * compartilham nação e Copa" GARANTE MATEMATICAMENTE que cada par
 * adjacente já pontua o teto de 4 (essa É a combinação de maior pontuação
 * possível por par) — então, sempre que `isCompleteHistoricalSquad` é
 * `true`, a química de base já é 100 antes de qualquer bônus. Somar +8
 * a uma química que já está em 100 é matematicamente inerte (o clamp
 * final devolve 100 de qualquer forma) — eu mesmo cometi esse erro numa
 * primeira versão e só percebi escrevendo os testes. Doc 10 diz que o
 * bônus de Time Histórico Completo é "o gancho mecânico para os Combos
 * Lendários" (doc 10 §8) e o efeito de química citado ali provavelmente
 * se destina à camada de Força de Time (`bonusQuimica`, doc 09 §3,
 * escala -3..+4 — NÃO implementada nesta tarefa, "não implementar
 * partidas ainda"), onde +8 teria efeito real mesmo com química-base
 * em 100. Por isso esta função devolve o flag, e deixa para o futuro
 * módulo `match` decidir em qual escala aplicar o +8 — não inventando
 * uma aplicação imediata que eu já sei, por matemática, que não faz
 * nada.
 */
export type ChemistryResult = Readonly<{
  /** A química 0–100 pura de doc 09 §4 — sem nenhum bônus de Time Histórico Completo somado. */
  chemistry: number;
  /** doc 10 §7: todos os titulares compartilham nação e edição de Copa. */
  isCompleteHistoricalSquad: boolean;
}>;

/**
 * Calcula a química do elenco (0–100) e a condição de "Time Histórico
 * Completo", a partir dos slots ocupados e da lista de pares de slots
 * considerados adjacentes nesta formação (ver nota de escopo em
 * `types.ts` sobre por que essa lista é um parâmetro, não derivada
 * internamente de um código de formação).
 */
export function calculateChemistry(
  slots: readonly ChemistrySquadSlot[],
  adjacentPairs: readonly AdjacentSlotPair[],
): ChemistryResult {
  const isCompleteHistoricalSquad = isCompleteHistoricalSquadCheck(slots);

  if (adjacentPairs.length === 0) {
    return { chemistry: 0, isCompleteHistoricalSquad };
  }

  const slotsById = new Map(slots.map((slot) => [slot.slotId, slot]));
  let totalPoints = 0;

  for (const pair of adjacentPairs) {
    const slotA = slotsById.get(pair.slotIdA);
    const slotB = slotsById.get(pair.slotIdB);
    if (slotA === undefined || slotB === undefined) {
      throw new Error(
        `calculateChemistry(): par adjacente referencia um slotId inexistente: ${pair.slotIdA} / ${pair.slotIdB}.`,
      );
    }
    totalPoints += calculatePairLink(slotA, slotB);
  }

  const maxPossible = adjacentPairs.length * MAX_LINK_POINTS_PER_PAIR;
  const chemistry = clamp(Math.round((totalPoints / maxPossible) * 100), 0, 100);

  return { chemistry, isCompleteHistoricalSquad };
}
