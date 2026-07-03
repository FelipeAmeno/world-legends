/**
 * Tipos do bounded context Rewards (T029).
 *
 * `calculateRewards` recebe o resultado de uma partida e retorna
 * créditos, XP e atualizações de progresso para o usuário.
 *
 * Domínio puro: sem banco, sem API. O chamador (apps/*) aplica
 * os créditos via @world-legends/economy e o progresso via
 * @world-legends/collection ou @world-legends/achievements.
 *
 * Doc 18 §3: depende apenas de @world-legends/engine (tipos) e
 * @world-legends/shared.
 */
import type { MatchResult, TeamSide } from '@world-legends/engine';

// ─── Re-exports úteis ─────────────────────────────────────────────────────────

export type { MatchResult, TeamSide } from '@world-legends/engine';

// ─── Resultado de uma partida (vitória / empate / derrota) ───────────────────

export type Outcome = 'win' | 'draw' | 'loss';

// ─── Tipos de bônus reconhecidos ─────────────────────────────────────────────

export type BonusType =
  | 'clean_sheet' // Adversário não marcou
  | 'hat_trick' // Jogador do squad marcou 3+ gols
  | 'mvp' // Jogador do squad foi o MVP
  | 'goal_scored'; // Bônus por gol marcado (por gol, acumulativo)

// ─── BonusReward — um bônus individual aplicado ──────────────────────────────

export type BonusReward = Readonly<{
  readonly type: BonusType;
  readonly credits: number;
  readonly xp: number;
  /**
   * Detalhe para display (ex: "3 gols de uc-st-001", "MVP: uc-cm-007").
   * Nunca null — sempre informativo.
   */
  readonly detail: string;
}>;

// ─── ProgressUpdate — atualização de progresso/álbum ─────────────────────────

/**
 * Categorias de progresso que o sistema de recompensas rastreia.
 * O chamador decide como persistir (collection, achievements, album).
 */
export type ProgressCategory =
  | 'matches_played' // sempre +1
  | 'wins' // +1 em vitória
  | 'draws' // +1 em empate
  | 'losses' // +1 em derrota
  | 'goals_scored' // total de gols marcados pelo squad
  | 'goals_conceded' // total de gols sofridos
  | 'clean_sheets' // +1 se zero gols sofridos
  | 'hat_tricks' // +N (número de hat tricks na partida)
  | 'mvp_awards'; // +1 se MVP pertence ao squad

export type ProgressUpdate = Readonly<{
  readonly category: ProgressCategory;
  readonly increment: number;
}>;

// ─── RewardResult — saída de calculateRewards ────────────────────────────────

export type RewardResult = Readonly<{
  /** Recompensa base (vitória/empate/derrota) — sempre presente. */
  readonly base: Readonly<{
    readonly outcome: Outcome;
    readonly credits: number;
    readonly xp: number;
  }>;
  /** Lista de bônus aplicados (pode ser vazia). */
  readonly bonuses: readonly BonusReward[];
  /** Total consolidado: base + somatório dos bônus. */
  readonly total: Readonly<{
    readonly credits: number;
    readonly xp: number;
  }>;
  /** Atualizações de progresso para álbuns e achievements. */
  readonly progress: readonly ProgressUpdate[];
}>;

// ─── CalculateRewardsInput ────────────────────────────────────────────────────

export type CalculateRewardsInput = Readonly<{
  /** Resultado completo da partida (engine T010 / match-simulator T028). */
  readonly result: MatchResult;
  /** Qual lado o usuário jogou. */
  readonly userSide: TeamSide;
  /**
   * UserCardIds do squad do usuário (titulares + banco).
   * Usado para detectar hat trick e MVP.
   */
  readonly userCardIds: readonly string[];
}>;
