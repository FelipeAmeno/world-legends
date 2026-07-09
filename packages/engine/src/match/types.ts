/**
 * Tipos de `match` — oitavo submódulo do Match Engine, e o primeiro que
 * de fato SIMULA uma partida (todos os anteriores eram blocos puros sem
 * decisão de "quando" aplicar algo). Fonte: `docs/09-match-engine-master.md`
 * (quase todas as seções, ver `match.ts` para o mapeamento exato por
 * função), `docs/17-domain-model-master.md` (VOs `PenaltyShootoutResult`/
 * `WalkoverInfo`, nomes de campo em português entre parênteses), e
 * `docs/02-modelagem-banco-dados.md` (enum `event_type`, que motivou a
 * extensão de `events` com `KickoffEvent`/`HalfTimeEvent`/`FullTimeEvent`).
 *
 * A explicação completa da arquitetura (o que é fiel à doc, o que é
 * lacuna documentada e como decidi preenchê-la, o que ficou
 * deliberadamente fora desta primeira versão) está na resposta de texto
 * desta tarefa — aqui só os tipos.
 */
import type { Seed } from '@world-legends/shared';
import type { MatchEvent, TeamSide } from '../events/types';
import type { TacticalIntensity } from '../fatigue/types';
import type { AttributeSet } from '../overall/types';
import type { Position } from '../position';
import type { TraitMagnitude } from '../traits/types';

/** doc 09 §8 — as 5 condições climáticas com efeito documentado. */
export type Weather = 'ensolarado' | 'chuva' | 'calor_extremo' | 'frio_intenso' | 'vento_forte';

/** doc 09 §10.1 — os 3 perfis de árbitro. */
export type RefereeProfile = 'permissivo' | 'normal' | 'rigoroso';

/** Um jogador no contexto de uma partida — atributos já resolvidos, não o agregado `Player`/`Card` completo. */
export type MatchPlayer = Readonly<{
  userCardId: string;
  attributes: AttributeSet;
  primaryPosition: Position;
  /** Só os traits relevantes a `match` precisam estar aqui — não a carta inteira. */
  traits: readonly TraitMagnitude[];
}>;

/** Um titular ocupando um slot da formação. */
export type StartingSlot = Readonly<{
  slotId: string;
  formationPosition: Position;
  player: MatchPlayer;
}>;

/**
 * Um time pronto para simulação: titulares (incluindo o goleiro, slot
 * com `formationPosition === 'GK'`), banco, pares adjacentes para
 * química (mesmo parâmetro explícito de `calculateChemistry`, T005 —
 * `match` também não inventa o mapa de adjacência de nenhuma formação)
 * e a tática escolhida.
 */
export type TeamSnapshot = Readonly<{
  starters: readonly StartingSlot[];
  bench: readonly MatchPlayer[];
  adjacentPairs: readonly { slotIdA: string; slotIdB: string }[];
  tacticalIntensity: TacticalIntensity;
  isHomeTeam: boolean;
}>;

/**
 * Modificador de dificuldade da IA (Sprint 26 — Gameplay Foundation).
 * Diferente do `avgOvr` do oponente (que já define a FORÇA base), isto
 * afeta COMPORTAMENTO: aplicado como um ajuste percentual direto sobre o
 * Team Power do lado marcado como controlado por IA a cada minuto —
 * "Fácil" comete mais erros (força efetiva reduzida = mais bolas
 * perdidas/finalizações desperdiçadas), "Difícil" pressiona melhor
 * (força efetiva aumentada, sobretudo pesa mais quando a IA está
 * defendendo). "Lendário" usa o mesmo `powerModifierPercent` de
 * "Difícil" MAS além disso reage no intervalo (troca de tática +
 * substituição) — essa parte não vive aqui no engine, é orquestrada por
 * quem chama `applyTacticalIntensity`/`applyManualSubstitution` entre
 * as duas metades (ver `apps/web/lib/match-session.ts`).
 */
export type AiDifficultyModifier = Readonly<{
  powerModifierPercent: number;
}>;

/** doc 09 §19/§9 — contexto que não vem de nenhum dos dois times especificamente. */
export type MatchContext = Readonly<{
  /** doc 09 §19: liga/pontos corridos aceita empate; mata-mata/final exige vencedor. */
  requiresWinner: boolean;
  /** Sprint 26: quando presente, aplicado ao Team Power do lado 'away'. */
  awayAiDifficulty?: AiDifficultyModifier;
  /** doc 09 §9: zera o bônus de mando para os dois lados quando true (final em campo neutro). */
  isNeutralVenue?: boolean;
}>;

export type SideStats = Readonly<{
  possessionPercent: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  fouls: number;
  corners: number;
  yellowCards: number;
  redCards: number;
}>;

/** doc 09 §24. */
export type MatchStats = Readonly<{ home: SideStats; away: SideStats }>;

/** doc 17: VO `PenaltyShootoutResult` — nomes de campo em português do doc entre parênteses. */
export type PenaltyShootoutResult = Readonly<{
  homeScore: number; // homeScore
  awayScore: number; // awayScore
  totalRounds: number; // rodadasTotais
  resolvedBySeedTiebreak: boolean; // desempatePorSeed — doc 09 §20.1, DD-02
}>;

/** doc 17: VO `WalkoverInfo` — nomes de campo em português do doc entre parênteses. */
export type WalkoverInfo = Readonly<{
  affectedTeamSide: TeamSide; // ladoAfetado
  minute: number; // minutoDaInterrupcao
  remainingPlayers: number; // jogadoresRestantes
}>;

/**
 * Resultado completo de `simulateMatch`. `penaltyShootout` e `walkover`
 * NUNCA coexistem (doc 17, Invariantes) — garantido estruturalmente pela
 * lógica de `match.ts` (W.O. interrompe a simulação antes que prorrogação
 * ou pênaltis sejam alcançados), não apenas pelo tipo.
 */
export type MatchResult = Readonly<{
  homeScore: number;
  awayScore: number;
  events: readonly MatchEvent[];
  stats: MatchStats;
  mvpUserCardId: string | null;
  weather: Weather;
  refereeProfile: RefereeProfile;
  penaltyShootout?: PenaltyShootoutResult;
  walkover?: WalkoverInfo;
  seed: Seed;
  engineVersion: string;
}>;

/** Os 6 streams de RNG independentes derivados do seed principal — doc 09 §21. */
export type MatchRngStreams = Readonly<{
  events: import('../rng/rng').RNGInstance;
  weather: import('../rng/rng').RNGInstance;
  cards: import('../rng/rng').RNGInstance;
  injuries: import('../rng/rng').RNGInstance;
  narrative: import('../rng/rng').RNGInstance;
  penaltyTiebreak: import('../rng/rng').RNGInstance;
}>;

// ─── Sprint 26 (Gameplay Foundation) — intervalo jogável ──────────────────────
//
// `simulateMatch` roda as duas metades numa chamada síncrona só, sem
// nenhum ponto de pausa — correto para o caso "sem interação do
// usuário", mas insuficiente para um intervalo onde o jogador decide
// substituições/tática ANTES do segundo tempo rodar. Como o servidor
// (Next.js server actions) é stateless entre chamadas, a "pausa" precisa
// viajar até o cliente e voltar — daí `MatchProgressState` ser 100% dado
// plano serializável (inclusive o estado bruto dos streams de RNG via
// `RNGInstance.getState()`/`restoreRNG()`), nunca uma referência viva a
// closures. `simulateFirstHalf` produz esse estado; `simulateRestOfMatch`
// o consome e continua o MESMO stream de onde parou — nenhum sorteio é
// pulado, repetido ou re-embaralhado pela pausa em si.

/** Espelha `FieldPlayerState` de `match.ts`, mas 100% serializável (sem função). */
export type SerializedFieldPlayer = Readonly<{
  slotId: string;
  formationPosition: Position;
  player: MatchPlayer;
  enteredAtMinute: number;
  hasYellowCard: boolean;
  foulsThisMatch: number;
}>;

/** Estado runtime de um lado (casa ou fora) num ponto de pausa da simulação. */
export type SerializedSideState = Readonly<{
  fieldPlayers: readonly SerializedFieldPlayer[];
  benchRemaining: readonly MatchPlayer[];
  substitutionsUsed: number;
  substitutionWindowsUsed: number;
  morale: number;
  adjacentPairs: readonly { slotIdA: string; slotIdB: string }[];
  /** Tática ATUAL — pode já ter sido alterada em relação à do TeamSnapshot original. */
  tacticalIntensity: TacticalIntensity;
  isHomeTeam: boolean;
}>;

/** Estado bruto dos 6 streams de RNG — o suficiente para `restoreRNG()` cada um. */
export type SerializedRngState = Readonly<{
  events: number;
  weather: number;
  cards: number;
  injuries: number;
  narrative: number;
  penaltyTiebreak: number;
}>;

/**
 * Snapshot completo e serializável de uma simulação em andamento — hoje
 * só produzido no intervalo (minuto 45→46), mas o formato não assume
 * nenhum minuto específico.
 */
export type MatchProgressState = Readonly<{
  nextMinute: number;
  homeScore: number;
  awayScore: number;
  stats: MatchStats;
  events: readonly MatchEvent[];
  weather: Weather;
  refereeProfile: RefereeProfile;
  eventMinutesCounted: number;
  eventMinutesFavoringHome: number;
  home: SerializedSideState;
  away: SerializedSideState;
  rngState: SerializedRngState;
  seed: Seed;
  context: MatchContext;
  engineVersion: string;
}>;

/** Resultado de `simulateFirstHalf` — ou a partida já acabou (W.O.), ou chegou ao intervalo. */
export type FirstHalfOutcome =
  | Readonly<{ kind: 'walkover'; result: MatchResult }>
  | Readonly<{ kind: 'halftime'; state: MatchProgressState }>;
