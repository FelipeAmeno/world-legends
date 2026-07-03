import { buildLink } from '../rules/link-rules';
/**
 * ChemistryCalculator — T033.
 *
 * Calcula a `SquadChemistry` de um conjunto de jogadores.
 *
 * Algoritmo:
 *   1. Gerar todos os pares C(N,2) = N×(N−1)/2 entre os N jogadores.
 *      - Se `pairs` forem fornecidos, usar apenas esses pares (adjacência
 *        customizada). Caso contrário, calcular todos os pares.
 *   2. Para cada par: `buildLink(a, b)`.
 *   3. Somar os totais → `totalLinkBonus`.
 *   4. Normalizar: `total = round(totalLinkBonus / (numLinks × 4) × 100)`.
 *   5. Per player: soma das contribuições de cada jogador nos seus links,
 *      normalizada para 0–10.
 *
 * Dois modos de uso:
 *   A) Todos os pares (padrão) — verifica química total do elenco.
 *   B) Pares adjacentes (via `adjacentPairs`) — simula links táticos da formação.
 *
 * INVARIANTE: package chemistry não modifica nenhum outro package existente.
 */
import type { ChemistryLink, PlayerChemistryInput, SquadChemistry } from '../types/types';
import { MAX_LINK_BONUS, MAX_SQUAD_CHEMISTRY } from '../types/types';

// ─── Tipos de input do calculator ────────────────────────────────────────────

/** Par de userCardIds para adjacência customizada. */
export type AdjacencyPair = Readonly<{
  readonly idA: string;
  readonly idB: string;
}>;

export type ChemistryCalculatorInput = Readonly<{
  readonly players: readonly PlayerChemistryInput[];
  /**
   * Opcional: lista de pares adjacentes.
   * Se omitido → todos os C(N,2) pares são calculados.
   * Se fornecido → apenas os pares listados são considerados.
   */
  readonly adjacentPairs?: readonly AdjacencyPair[];
}>;

// ─── Utilitários internos ─────────────────────────────────────────────────────

function buildAllPairs(players: readonly PlayerChemistryInput[]): AdjacencyPair[] {
  const pairs: AdjacencyPair[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      // biome-ignore lint/style/noNonNullAssertion: i and j are bounded by players.length
      pairs.push({ idA: players[i]!.userCardId, idB: players[j]!.userCardId });
    }
  }
  return pairs;
}

function normalizeToMax(raw: number, max: number, cap: number): number {
  if (max <= 0) return 0;
  return Math.min(cap, Math.round((raw / max) * cap));
}

function zeroChemistry(players: readonly PlayerChemistryInput[]): SquadChemistry {
  return Object.freeze({
    total: 0,
    links: Object.freeze([]),
    perPlayer: Object.freeze(Object.fromEntries(players.map((p) => [p.userCardId, 0]))),
    breakdown: Object.freeze({
      nationalityLinks: 0,
      competitionLinks: 0,
      eraLinks: 0,
      perfectLinks: 0,
      totalLinkBonus: 0,
      totalLinks: 0,
    }),
  });
}

// ─── calculateChemistry ───────────────────────────────────────────────────────

/**
 * Calcula a química completa de um conjunto de jogadores.
 *
 * @param input.players       Lista de jogadores com seus perfis de química.
 * @param input.adjacentPairs Pares adjacentes. Se omitido, usa todos os pares.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: chemistry calculation requires nested logic
export function calculateChemistry(input: ChemistryCalculatorInput): SquadChemistry {
  const { players, adjacentPairs } = input;

  // ── Casos degenerados ───────────────────────────────────────────────────────
  if (players.length <= 1) {
    return zeroChemistry(players);
  }

  // ── Construir mapa de players ────────────────────────────────────────────────
  const playerMap = new Map<string, PlayerChemistryInput>(players.map((p) => [p.userCardId, p]));

  // ── Determinar quais pares usar ──────────────────────────────────────────────
  const pairsToUse: readonly AdjacencyPair[] =
    adjacentPairs && adjacentPairs.length > 0 ? adjacentPairs : buildAllPairs(players);

  // ── Calcular links ───────────────────────────────────────────────────────────
  const links: ChemistryLink[] = [];

  for (const pair of pairsToUse) {
    const a = playerMap.get(pair.idA);
    const b = playerMap.get(pair.idB);
    if (!a || !b) continue; // ignorar pares com jogadores não encontrados
    links.push(buildLink(a, b));
  }

  if (links.length === 0) {
    return zeroChemistry(players);
  }

  // ── Totais globais ───────────────────────────────────────────────────────────
  let totalLinkBonus = 0;
  let nationalityLinks = 0;
  let competitionLinks = 0;
  let eraLinks = 0;
  let perfectLinks = 0;

  const rawPerPlayer = new Map<string, number>(players.map((p) => [p.userCardId, 0]));

  for (const link of links) {
    totalLinkBonus += link.total;
    if (link.nationalityBonus > 0) nationalityLinks++;
    if (link.competitionBonus > 0) competitionLinks++;
    if (link.eraBonus > 0) eraLinks++;
    if (link.isPerfect) perfectLinks++;

    // Distribuir bonus por jogador
    rawPerPlayer.set(link.playerAId, (rawPerPlayer.get(link.playerAId) ?? 0) + link.total);
    rawPerPlayer.set(link.playerBId, (rawPerPlayer.get(link.playerBId) ?? 0) + link.total);
  }

  // ── Normalização total ────────────────────────────────────────────────────
  const maxPossible = links.length * MAX_LINK_BONUS;
  const total = normalizeToMax(totalLinkBonus, maxPossible, MAX_SQUAD_CHEMISTRY);

  // ── Per player (0-10) ─────────────────────────────────────────────────────
  // Cada jogador participa de (numLinks-per-player) links.
  // Para todos os pares: cada jogador tem (N-1) links → max = (N-1) × 4.
  // Para pares customizados: contamos os links por jogador.
  const linksPerPlayer = new Map<string, number>(players.map((p) => [p.userCardId, 0]));
  for (const link of links) {
    linksPerPlayer.set(link.playerAId, (linksPerPlayer.get(link.playerAId) ?? 0) + 1);
    linksPerPlayer.set(link.playerBId, (linksPerPlayer.get(link.playerBId) ?? 0) + 1);
  }

  const perPlayer: Record<string, number> = {};
  for (const [id, raw] of rawPerPlayer) {
    const n = linksPerPlayer.get(id) ?? 0;
    perPlayer[id] = normalizeToMax(raw, n * MAX_LINK_BONUS, 10);
  }

  return Object.freeze({
    total,
    links: Object.freeze(links),
    perPlayer: Object.freeze(perPlayer),
    breakdown: Object.freeze({
      nationalityLinks,
      competitionLinks,
      eraLinks,
      perfectLinks,
      totalLinkBonus,
      totalLinks: links.length,
    }),
  });
}
