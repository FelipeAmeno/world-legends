import type { TraitMagnitude } from '@world-legends/engine';
import type { MatchResult } from '@world-legends/engine';
import type { Squad } from '@world-legends/squad';
/**
 * Tipos do bounded context Match Simulator (T028).
 *
 * Este package é a camada de orquestração entre:
 *   packages/squad  → Squad, PlayerInfo
 *   packages/engine → TeamSnapshot, simulateMatch, MatchResult
 *
 * Responsabilidade única: converter squads montados pelo usuário no
 * formato que o engine espera, executar a simulação e expor o resultado.
 *
 * Doc 18 §3: este package depende de @world-legends/engine e
 * @world-legends/squad mas não de @world-legends/db nem de infraestrutura.
 */
import type { Position } from '@world-legends/types';

// ─── Porta: dados de um jogador para a simulação ──────────────────────────────

/**
 * Dados de um UserCard resolvidos para a simulação.
 * Diferente do PlayerInfo do squad (que só precisa de posição/nação/OVR),
 * aqui incluímos traits — necessários para o engine (doc 09 §6).
 */
export type PlayerMatchData = Readonly<{
  readonly userCardId: string;
  readonly naturalPosition: Position;
  /** Overall 40–99, usado para sintetizar AttributeSet (doc 09 §2). */
  readonly overall: number;
  readonly nationality: string;
  /** Traits ativos da carta. Pode ser [] para cartas sem trait. */
  readonly traits: readonly TraitMagnitude[];
}>;

/**
 * Porta: resolve dados de simulação a partir de um userCardId.
 * Injetada pelo chamador — evita dependência em packages/cards ou /db.
 */
export type PlayerMatchResolver = (userCardId: string) => PlayerMatchData | null;

// ─── Input da simulação ───────────────────────────────────────────────────────

export type SquadMatchInput = Readonly<{
  readonly homeSquad: Squad;
  readonly awaySquad: Squad;
  /** Seed numérico — convertido para Seed do engine via Uint32Array. */
  readonly seed: number;
  readonly context?: Readonly<{
    /** Liga/pontos corridos aceita empate; copa exige vencedor. */
    readonly requiresWinner: boolean;
    /** Final em campo neutro cancela vantagem do mando. */
    readonly isNeutralVenue?: boolean;
  }>;
  /** Resolver de dados de home. Se omitido, usa o mesmo que away. */
  readonly resolveHome: PlayerMatchResolver;
  readonly resolveAway: PlayerMatchResolver;
}>;

// ─── Re-export do MatchResult do engine ──────────────────────────────────────

export type { MatchResult } from '@world-legends/engine';

// ─── Winner helper ────────────────────────────────────────────────────────────

/** Vencedor da partida, considerando pênaltis se houver. */
export type MatchWinner = 'home' | 'away' | 'draw';

export function determineWinner(result: MatchResult): MatchWinner {
  if (result.penaltyShootout) {
    return result.penaltyShootout.homeScore > result.penaltyShootout.awayScore ? 'home' : 'away';
  }
  if (result.homeScore > result.awayScore) return 'home';
  if (result.awayScore > result.homeScore) return 'away';
  return 'draw';
}
