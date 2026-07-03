/**
 * Os 7 tipos de evento de partida — quinto submódulo do Match Engine
 * (docs/19-implementation-strategy-master.md, §10/§18 — esta sessão
 * chama de T007; no roteiro mestre real, `events` viria depois de
 * `fatigue`/`injuries`, mas a ordem das tarefas pedidas nesta conversa
 * pulou direto para aqui, mesmo padrão de desvio já visto em sessões
 * anteriores).
 *
 * Esta tarefa é PURAMENTE de modelagem de dados — nenhuma lógica de
 * sorteio/probabilidade/simulação (isso é `match`, mais adiante).
 * `MatchEvent` é a forma que o futuro `match` vai PRODUZIR; por ora,
 * só define a forma.
 *
 * Fonte canônica do formato: `docs/02-modelagem-banco-dados.md`, tabela
 * `match_events` — `event_type` (enum), `team_side`, `minute`,
 * `primary_user_card_id`/`secondary_user_card_id`, `description`. Os
 * algoritmos que documentam CADA evento especificamente: cartões
 * (doc 09 §10), suspensão (doc 09 §11), lesões (doc 09 §12),
 * substituições (doc 09 §13), gol/xG (doc 09 §17), pênalti (doc 09 §18),
 * disputa de pênaltis (doc 09 §20), W.O. (doc 09 §12.1, DD-01).
 *
 * DUAS DECISÕES DE SÍNTESE, deixadas explícitas:
 *
 * (a) `AssistEvent` como tipo PRÓPRIO. O enum `event_type` de doc 02 NÃO
 *     tem um valor `assist` — uma assistência vive dentro do próprio
 *     evento `goal`, no campo `secondary_user_card_id`. Você pediu
 *     `AssistEvent` como um dos 7 tipos a modelar, então: `GoalEvent`
 *     mantém `assisterUserCardId` opcional (mapeia 1:1 com
 *     `secondary_user_card_id` de doc 02, sem perder compatibilidade
 *     com o schema), E existe um `AssistEvent` separado — útil como
 *     fato de domínio independente e consultável (MVP por jogador,
 *     doc 05 §5: "gols×3 + assistências×2"; sinergia do trait Maestro,
 *     doc 10 §5). Os dois nascem juntos no mesmo minuto/lado quando um
 *     gol tem assistência — a forma como esse par se achata de volta em
 *     UMA linha de `match_events` é decisão do futuro módulo de
 *     persistência, fora do escopo aqui.
 *
 * (b) `WalkoverEvent` não existe no enum de doc 02 — mas isso é uma
 *     LACUNA JÁ RECONHECIDA pelo próprio doc 09 §12.1 ("Nota de
 *     escopo": a atualização de doc 02 para reconhecer `walkover` foi
 *     deliberadamente postergada como passo de sincronização separado),
 *     não algo que estou descobrindo agora. Modelo `WalkoverEvent`
 *     fielmente ao payload documentado em doc 09 §12.1.
 *
 * Decisão de escopo: doc 09 §20.1 (DD-02) documenta um evento adicional,
 * `penalty_tiebreak_resolved` (desempate por seed após 20 rodadas de
 * morte súbita, SEM nenhuma cobrança real) — distinto de uma cobrança
 * de pênalti de fato. Você pediu exatamente 7 tipos, sem incluir esse;
 * não o modelei aqui deliberadamente, não por esquecimento.
 */

import type { InjurySeverity } from '../injuries/types';

/** doc 02, `team_side` — único valor de lado em todo o schema de partida. */
export type TeamSide = 'home' | 'away';

export type GoalEvent = Readonly<{
  type: 'goal';
  minute: number;
  /** O lado que marca o gol — mesmo em gol contra, é o lado BENEFICIADO no placar (doc 02: `goal`/`own_goal` colapsados aqui num único tipo com `isOwnGoal`). */
  teamSide: TeamSide;
  scorerUserCardId: string;
  /** Mapeia para `secondary_user_card_id` de doc 02 quando há assistência. Ver nota (a) acima sobre `AssistEvent`. */
  assisterUserCardId?: string;
  /** doc 02 trata `goal`/`own_goal` como dois `event_type` distintos; aqui, um único campo. */
  isOwnGoal: boolean;
  description: string;
}>;

export type AssistEvent = Readonly<{
  type: 'assist';
  minute: number;
  teamSide: TeamSide;
  assisterUserCardId: string;
  scorerUserCardId: string;
  description: string;
}>;

/** doc 09 §10: motivo do vermelho — direto, ou automático por segundo amarelo na mesma partida. */
export type RedCardReason = 'direct' | 'second_yellow';

export type CardEvent = Readonly<{
  type: 'card';
  minute: number;
  teamSide: TeamSide;
  playerUserCardId: string;
  cardType: 'yellow' | 'red';
  /** Só definido quando `cardType === 'red'` — ver validação em `events.ts`. */
  redCardReason?: RedCardReason;
  description: string;
}>;

/**
 * `InjurySeverity` foi promovido para `../injuries/types.ts` na Tarefa
 * T009 (módulo `injuries` é o dono conceitual deste tipo) — reexportado
 * aqui por compatibilidade, mesmo padrão usado para `Position` em
 * `overall/types.ts` na Tarefa T005.
 */
export type { InjurySeverity };

export type InjuryEvent = Readonly<{
  type: 'injury';
  minute: number;
  teamSide: TeamSide;
  playerUserCardId: string;
  severity: InjurySeverity;
  /** Dias de recuperação sorteados dentro da faixa de `INJURY_RECOVERY_DAYS[severity]` (doc 09 §12) — já um valor concreto, não a faixa. */
  recoveryDays: number;
  /** doc 09 §12, "risco de recaída": nova lesão da mesma região por retorno precoce. */
  isRelapse: boolean;
  description: string;
}>;

/** doc 09 §18: GOL / DEFESA / PARA_FORA. */
export type PenaltyOutcome = 'scored' | 'saved' | 'missed';
/** Cobrança durante o jogo (doc 09 §18) ou durante a disputa de pênaltis (doc 09 §20) — mesmo algoritmo de cobrança em ambos os casos. */
export type PenaltyContext = 'in_game' | 'shootout';

export type PenaltyEvent = Readonly<{
  type: 'penalty';
  minute: number;
  teamSide: TeamSide;
  takerUserCardId: string;
  goalkeeperUserCardId: string;
  outcome: PenaltyOutcome;
  context: PenaltyContext;
  /** Só definido quando `context === 'shootout'` (doc 09 §20). */
  shootoutRound?: number;
  description: string;
}>;

/** doc 09 §13 + doc 05 §4.3: as 4 causas documentadas de substituição. */
export type SubstitutionReason = 'tactical' | 'injury' | 'red_card' | 'fatigue';

export type SubstitutionEvent = Readonly<{
  type: 'substitution';
  minute: number;
  teamSide: TeamSide;
  playerOutUserCardId: string;
  playerInUserCardId: string;
  reason: SubstitutionReason;
  description: string;
}>;

export type WalkoverEvent = Readonly<{
  type: 'walkover';
  /** doc 09 §12.1: minutoDaInterrupcao. */
  minute: number;
  /** doc 09 §12.1: ladoAfetado — o lado que CAIU abaixo de 7 jogadores, não o vencedor por W.O. */
  affectedTeamSide: TeamSide;
  /** doc 09 §12.1: jogadoresRestantes — por definição, sempre < 7 quando este evento existe. */
  remainingPlayers: number;
  /** Único valor documentado em doc 09 §12.1 — tipo literal, não `string`, pela mesma razão de "estado inválido irrepresentável" usada em T006. */
  reason: 'insuficiência de elenco';
  description: string;
}>;

/**
 * Três marcadores de fase, adicionados nesta tarefa (T010) por
 * necessidade estrutural: o pseudocódigo integrado de doc 09 §25
 * registra `kickoff`/`half_time`/`full_time_90` na timeline, e doc 02
 * tem `kickoff`/`half_time`/`full_time` no enum de `event_type` desde
 * o início — só não tinham sido modelados na T007 porque o pedido
 * daquela tarefa listava exatamente 7 tipos, sem estes. Sem eles, a
 * timeline produzida por `match` não poderia ser fiel ao documentado
 * (doc 09 §22: "o replay é a própria lista de MatchEvent").
 */
export type KickoffEvent = Readonly<{ type: 'kickoff'; minute: 0; description: string }>;
export type HalfTimeEvent = Readonly<{ type: 'half_time'; minute: number; description: string }>;
export type FullTimeEvent = Readonly<{ type: 'full_time'; minute: number; description: string }>;

export type MatchEvent =
  | KickoffEvent
  | GoalEvent
  | AssistEvent
  | CardEvent
  | InjuryEvent
  | PenaltyEvent
  | SubstitutionEvent
  | WalkoverEvent
  | HalfTimeEvent
  | FullTimeEvent;
