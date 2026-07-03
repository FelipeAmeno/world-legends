/**
 * `simulateSquadMatch` — T028 Match Simulator MVP.
 *
 * Ponto de entrada público do packages/match-simulator.
 * Orquestra o pipeline completo:
 *
 *   1. Calcular química dos dois squads (packages/squad)
 *   2. Construir TeamSnapshot para home e away (squadToTeamSnapshot)
 *   3. Serializar seed numérico → Seed do engine (Uint32Array)
 *   4. Chamar engine.simulateMatch()
 *   5. Retornar MatchResult + winner helper
 *
 * Determinismo garantido: a função é pura. O mesmo
 * (homeSquad, awaySquad, seed) produz sempre o mesmo MatchResult,
 * byte a byte — herdado do engine (doc 09 §21).
 *
 * Utiliza:
 *   - overall    → via makeAttributesFromOverall (síntese de AttributeSet)
 *   - química    → via calculateChemistry (packages/squad) → tacticalIntensity
 *   - traits     → via PlayerMatchData.traits → engine.MatchPlayer.traits
 */
import { type MatchResult, simulateMatch } from '@world-legends/engine';
import type { Seed } from '@world-legends/shared';
import { type PlayerInfoResolver, calculateChemistry } from '@world-legends/squad';
import { squadToTeamSnapshot } from '../adapter/adapter';
import { determineWinner } from '../types/types';
import type { MatchWinner, SquadMatchInput } from '../types/types';

// ─── seedFromNumber ───────────────────────────────────────────────────────────

function seedFromNumber(seed: number): Seed {
  return Object.freeze({ value: String(seed >>> 0) });
}

// ─── playerInfoResolverFromMatchResolver ──────────────────────────────────────

/**
 * Adapta PlayerMatchResolver → PlayerInfoResolver (do packages/squad).
 * Necessário para chamar calculateChemistry do squad sem acoplamento direto.
 */
function toPlayerInfoResolver(
  resolve: (id: string) => {
    naturalPosition: import('@world-legends/types').Position;
    nationality: string;
    overall: number;
  } | null,
): PlayerInfoResolver {
  return (id) => {
    const data = resolve(id);
    if (!data) return null;
    return {
      userCardId: id,
      userId: '', // não usado no cálculo de química
      naturalPosition: data.naturalPosition,
      nationality: data.nationality,
      overall: data.overall,
      isInjured: false,
      suspendedMatches: 0,
    };
  };
}

// ─── simulateSquadMatch ───────────────────────────────────────────────────────

export type SquadMatchOutput = Readonly<{
  result: MatchResult;
  winner: MatchWinner;
  homeChemistry: number;
  awayChemistry: number;
}>;

/**
 * Simula uma partida completa entre dois squads.
 *
 * @param input.homeSquad   Squad do time da casa (packages/squad)
 * @param input.awaySquad   Squad do visitante
 * @param input.seed        Semente determinística (número inteiro)
 * @param input.resolveHome Resolver de PlayerMatchData para o time da casa
 * @param input.resolveAway Resolver de PlayerMatchData para o visitante
 * @param input.context     Contexto da partida (copa/liga, campo neutro)
 */
export function simulateSquadMatch(input: SquadMatchInput): SquadMatchOutput {
  const { homeSquad, awaySquad, seed, resolveHome, resolveAway, context } = input;

  // ── 1. Química de cada squad ───────────────────────────────────────────────
  const homeChemistry = calculateChemistry(homeSquad, toPlayerInfoResolver(resolveHome));
  const awayChemistry = calculateChemistry(awaySquad, toPlayerInfoResolver(resolveAway));

  // ── 2. Converter para TeamSnapshot ────────────────────────────────────────
  const homeSnapshot = squadToTeamSnapshot(homeSquad, homeChemistry.total, true, resolveHome);
  const awaySnapshot = squadToTeamSnapshot(awaySquad, awayChemistry.total, false, resolveAway);

  // ── 3. Simular partida no engine ─────────────────────────────────────────
  const result = simulateMatch({
    home: homeSnapshot,
    away: awaySnapshot,
    context: {
      requiresWinner: context?.requiresWinner ?? false,
      isNeutralVenue: context?.isNeutralVenue ?? false,
    },
    seed: seedFromNumber(seed),
  });

  // ── 4. Determinar vencedor ────────────────────────────────────────────────
  const winner = determineWinner(result);

  return Object.freeze({
    result,
    winner,
    homeChemistry: homeChemistry.total,
    awayChemistry: awayChemistry.total,
  });
}
