/**
 * Tipos do bounded context Chemistry (T033).
 *
 * Sistema de química baseado em três dimensões (doc T033):
 *   Nacionalidade  → +2 por link compartilhado
 *   Competição     → +1 por link compartilhado
 *   Era histórica  → +1 por link compartilhado
 *   Máximo total   → 100
 *
 * Este package é independente — não importa packages de domínio existentes
 * (squad, match-simulator) nem altera sua lógica. É um sistema alternativo/
 * complementar de química que usa dimensões adicionais.
 *
 * Uso esperado: apps/* pode chamar ambos os sistemas e combinar os scores.
 */

// ─── Dimensões de química ────────────────────────────────────────────────────

/**
 * Código ISO de competição.
 * Exemplos: 'laliga', 'bundesliga', 'premier_league', 'serie_a',
 *           'ligue_1', 'brasileirao', 'world_cup', 'champions_league'
 */
export type CompetitionCode = string & { readonly _brand: 'CompetitionCode' };

/**
 * Era histórica do jogador.
 * Baseado na década de pico de carreira.
 */
export type EraCode = '1950s' | '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';

// ─── PlayerChemistryInput — Porta de entrada ──────────────────────────────────

/**
 * Dados mínimos de um jogador para o cálculo de química.
 * Injetado pelo chamador (apps/* ou packages que coordenam).
 *
 * Nota: `userCardId` identifica o jogador na resposta (SquadChemistry.perPlayer).
 */
export type PlayerChemistryInput = Readonly<{
  readonly userCardId: string;
  /** Código ISO-3166-1 alpha-2 (ex: 'BR', 'AR', 'ES', 'DE'). */
  readonly nationality: string;
  /** Código da competição de origem do jogador. */
  readonly competition: string;
  /** Década de pico de carreira. */
  readonly era: EraCode;
}>;

// ─── ChemistryLink — Value Object ────────────────────────────────────────────

/**
 * Um link de química entre dois jogadores específicos.
 *
 * Bônus:
 *   nationalityBonus: +2 se mesma nacionalidade, 0 caso contrário.
 *   competitionBonus: +1 se mesma competição, 0 caso contrário.
 *   eraBonus:         +1 se mesma era histórica, 0 caso contrário.
 *   total:            soma dos três (0–4).
 *
 * `isPerfect` = true quando total === 4 (os dois jogadores compartilham
 * os três atributos — link máximo possível).
 */
export type ChemistryLink = Readonly<{
  readonly playerAId: string;
  readonly playerBId: string;
  /** +2 se mesma nacionalidade. */
  readonly nationalityBonus: 0 | 2;
  /** +1 se mesma competição. */
  readonly competitionBonus: 0 | 1;
  /** +1 se mesma era histórica. */
  readonly eraBonus: 0 | 1;
  /** Soma: 0, 1, 2, 3 ou 4. */
  readonly total: number;
  /** true se total === 4 (link máximo). */
  readonly isPerfect: boolean;
  /** Atributos compartilhados (útil para UI). */
  readonly shared: Readonly<{
    readonly nationality: boolean;
    readonly competition: boolean;
    readonly era: boolean;
  }>;
}>;

// ─── SquadChemistry — Resultado do cálculo ───────────────────────────────────

/**
 * Resultado completo do cálculo de química de um squad.
 *
 * Fórmula de normalização:
 *   totalPossible = numLinks × 4     (max se todos os links fossem perfeitos)
 *   total = round(totalLinkBonus / totalPossible × 100), capped em 100
 *
 * Squad com 0 jogadores ou 1 jogador → total = 0 (sem links).
 * Squad com N jogadores → numLinks = C(N,2) = N×(N−1)/2.
 *
 * `perPlayer`: score de contribuição por jogador (0–10).
 *   playerRaw   = soma dos link bonuses do jogador com TODOS os outros
 *   playerMax   = (numPlayers − 1) × 4
 *   playerScore = round(playerRaw / playerMax × 10), capped em 10
 */
export type SquadChemistry = Readonly<{
  /** Score total do squad (0–100). */
  readonly total: number;
  /** Todos os pares de links calculados. */
  readonly links: readonly ChemistryLink[];
  /** Score por jogador (0–10). Keyed por userCardId. */
  readonly perPlayer: Readonly<Record<string, number>>;
  readonly breakdown: Readonly<{
    /** Links que têm bonus de nacionalidade. */
    readonly nationalityLinks: number;
    /** Links que têm bonus de competição. */
    readonly competitionLinks: number;
    /** Links que têm bonus de era histórica. */
    readonly eraLinks: number;
    /** Links com total === 4. */
    readonly perfectLinks: number;
    /** Soma de todos os link.total (raw antes da normalização). */
    readonly totalLinkBonus: number;
    /** Total de links (pares). */
    readonly totalLinks: number;
  }>;
}>;

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Bônus por link de mesma nacionalidade. */
export const NATIONALITY_BONUS = 2 as const;
/** Bônus por link de mesma competição. */
export const COMPETITION_BONUS = 1 as const;
/** Bônus por link de mesma era histórica. */
export const ERA_BONUS = 1 as const;
/** Máximo possível por link. */
export const MAX_LINK_BONUS = NATIONALITY_BONUS + COMPETITION_BONUS + ERA_BONUS; // 4
/** Score máximo do squad. */
export const MAX_SQUAD_CHEMISTRY = 100;
