/**
 * lib/match-experience.ts — T055
 *
 * Motor da Match Experience:
 *   - Narração em PT-BR com 4+ variações por tipo de evento
 *   - Cálculo de momentum (0–100 por equipe) que muda a cada evento
 *   - Tipos de evento enriquecidos para a UI
 *   - Replay progressivo baseado em minutos
 */

import type { EventDisplay, MatchDisplay, MatchOpponent } from './match-data';
import { runMatch, MATCH_OPPONENTS }                      from './match-data';

// ─── Rich event ───────────────────────────────────────────────────────────────

export type EventKind =
  | 'kickoff' | 'goal_home' | 'goal_away' | 'own_goal'
  | 'yellow_home' | 'yellow_away' | 'red_home' | 'red_away'
  | 'injury' | 'sub' | 'chance' | 'save'
  | 'half_time' | 'full_time' | 'var';

export type RichEvent = {
  id:          number;
  minute:      number;
  kind:        EventKind;
  headline:    string;       // "GOOOOL!"
  commentary:  string;       // narração completa
  side:        'home' | 'away' | 'neutral';
  actor?:      string;       // nome do jogador
  sub?:        string;       // substituto (subs)
  isKey:       boolean;      // evento de destaque (goal, save incrível)
  momentum:    number;       // delta de momentum para home (positivo = home, negativo = away)
  bgColor:     string;
  iconText:    string;
};

// ─── Narração PT-BR ───────────────────────────────────────────────────────────

type CommentFn = (actor?: string, sub?: string) => string;

const NARRATIONS: Record<EventKind, CommentFn[]> = {
  kickoff: [
    () => 'A bola rola! Começa o jogo!',
    () => 'Apito inicial! A partida começa agora!',
    () => 'E lá vem a bola — o clássico está aberto!',
  ],
  goal_home: [
    a => `⚽ GOOOOL! ${a} balança a rede! Que golaço!`,
    a => `${a} EXPLODE O ESTÁDIO! Gol sensacional!`,
    a => `INACREDITÁVEL! ${a} marca com categoria!`,
    a => `Que pintura de ${a}! Gol antológico!`,
    a => `${a} DECIDE! A torcida vai à loucura!`,
  ],
  goal_away: [
    a => `Gol do adversário… ${a} aproveita e marca.`,
    a => `${a} não perdoa e empata o marcador.`,
    a => `Contra-ataque mortal! ${a} não perde a chance.`,
    a => `${a} dá trabalho. Gol do rival.`,
  ],
  own_goal: [
    a => `Oh não! Gol contra de ${a}! Que azar!`,
    a => `Tragédia! ${a} manda para as próprias redes.`,
  ],
  yellow_home: [
    a => `Cartão amarelo para ${a}. Falta desnecessária.`,
    a => `${a} é advertido. Precisa tomar cuidado.`,
    a => `Árbitro puxa o cartão para ${a}. Advertência.`,
  ],
  yellow_away: [
    a => `Cartão amarelo para o adversário — ${a} recebe a advertência.`,
    a => `${a} (rival) amarelado. Falta dura.`,
  ],
  red_home: [
    a => `CARTÃO VERMELHO! ${a} é expulso! Equipe em desvantagem!`,
    a => `${a} FOI! Expulsão polêmica mas direta!`,
  ],
  red_away: [
    a => `Expulsão do adversário! ${a} deixa o campo com vermelho direto.`,
    a => `${a} (rival) recebe o vermelho. Vantagem numérica!`,
  ],
  injury: [
    a => `Lesão preocupante de ${a}. Equipe médica em campo.`,
    a => `${a} cai lesionado. Dúvida para o restante da partida.`,
    a => `Susto! ${a} sente a musculatura e pede substituição.`,
  ],
  sub: [
    (a,b) => `Substituição: ${b} entra no lugar de ${a}.`,
    (a,b) => `Mudança tática — ${b} substitui ${a}.`,
    (a,b) => `${a} deixa o campo; ${b} traz energia nova.`,
  ],
  chance: [
    () => 'Boa chance desperdiçada! Quase o gol!',
    () => 'Chute para fora! Que oportunidade perdida!',
    () => 'Bateu por cima do gol! O gol estava aberto!',
    () => 'Finalizou mal. A bola foi às nuvens.',
    () => 'Cruzamento perigoso mas ninguém alcança!',
  ],
  save: [
    () => 'DEFESA ESPETACULAR do goleiro! Salvou a equipe!',
    () => 'O goleiro voa e tira de letra! Intervenção milagrosa!',
    () => 'Uuuuh! Que reflexo extraordinário do goleiro!',
    () => 'GRANDE DEFESA! A bola ia entrar mas o goleiro foi lá!',
    () => 'Defesa inacreditável! Como ele chegou nessa bola?!',
  ],
  half_time: [
    () => '🔔 Fim do primeiro tempo. Análise no intervalo.',
    () => 'Apito do árbitro encerra a primeira etapa.',
    () => 'Intervalo! As equipes vão para o vestiário.',
  ],
  full_time: [
    () => '🏁 APITO FINAL! A partida acabou!',
    () => 'É ISSO! O árbitro encerra o jogo!',
    () => 'Fim de papo! Apito triplo confirma o resultado!',
  ],
  var: [
    () => 'Revisão no VAR... o árbitro é chamado para checar o lance.',
    () => 'VAR em ação! Checando possível infração.',
  ],
};

function pickComment(kind: EventKind, actor?: string, sub?: string, seed=0): string {
  const list = NARRATIONS[kind] ?? NARRATIONS.chance;
  const idx  = seed % list.length;
  return list[idx]!(actor, sub);
}

// ─── Momentum delta por tipo ──────────────────────────────────────────────────

const MOMENTUM_DELTA: Record<EventKind, number> = {
  kickoff:    0,
  goal_home: +30, goal_away: -30, own_goal:   -20,
  yellow_home:-5, yellow_away:+5, red_home:  -20, red_away:  +20,
  injury:     -8, sub:        0,
  chance:     +8, save:      +12,
  half_time:  0, full_time:   0, var:         0,
};

// ─── Cores e ícones ───────────────────────────────────────────────────────────

const EVENT_STYLE: Record<EventKind, { bg:string; icon:string }> = {
  kickoff:     { bg:'rgba(255,255,255,0.04)', icon:'⚽' },
  goal_home:   { bg:'rgba(16,185,129,0.12)', icon:'⚽' },
  goal_away:   { bg:'rgba(239,68,68,0.10)',  icon:'⚽' },
  own_goal:    { bg:'rgba(239,68,68,0.12)',  icon:'⚽' },
  yellow_home: { bg:'rgba(234,179,8,0.12)',  icon:'🟨' },
  yellow_away: { bg:'rgba(234,179,8,0.10)',  icon:'🟨' },
  red_home:    { bg:'rgba(239,68,68,0.18)',  icon:'🟥' },
  red_away:    { bg:'rgba(239,68,68,0.14)',  icon:'🟥' },
  injury:      { bg:'rgba(251,146,60,0.10)', icon:'🚑' },
  sub:         { bg:'rgba(99,102,241,0.10)', icon:'🔄' },
  chance:      { bg:'rgba(59,130,246,0.08)', icon:'💨' },
  save:        { bg:'rgba(34,211,238,0.12)', icon:'🧤' },
  half_time:   { bg:'rgba(255,255,255,0.06)', icon:'🔔' },
  full_time:   { bg:'rgba(255,255,255,0.08)', icon:'🏁' },
  var:         { bg:'rgba(139,92,246,0.10)', icon:'📺' },
};

function classifyEvent(ev: EventDisplay): EventKind {
  const t = ev.type;
  if (t === 'kickoff')   return 'kickoff';
  if (t === 'half_time') return 'half_time';
  if (t === 'full_time') return 'full_time';
  if (t === 'injury')    return 'injury';
  if (t === 'substitution') return 'sub';
  if (t === 'card') {
    const isYellow = ev.text.includes('amarelo');
    const isHome   = ev.side === 'home';
    if (isYellow) return isHome ? 'yellow_home' : 'yellow_away';
    return isHome ? 'red_home' : 'red_away';
  }
  if (t === 'goal') {
    if (ev.text.includes('GOL CONTRA')) return 'own_goal';
    return ev.side === 'home' ? 'goal_home' : 'goal_away';
  }
  return 'chance';
}

function extractActor(ev: EventDisplay): string | undefined {
  // Tentar extrair nome do texto do evento
  const m = ev.text.match(/GOL! (.+?) \(/) ??
            ev.text.match(/Lesão: (.+?) \(/) ??
            ev.text.match(/Sub: (.+?) ↔/) ??
            ev.text.match(/🟨 (.+?) —/) ??
            ev.text.match(/🟥 (.+?) —/);
  return m?.[1];
}

// ─── buildRichEvents ──────────────────────────────────────────────────────────

export function buildRichEvents(events: EventDisplay[]): RichEvent[] {
  const result: RichEvent[] = [];

  for (let i = 0; i < events.length; i++) {
    const ev    = events[i]!;
    const kind  = classifyEvent(ev);
    const style = EVENT_STYLE[kind];
    const actor = extractActor(ev);
    const isGoal= kind === 'goal_home' || kind === 'goal_away' || kind === 'own_goal';
    const isSave= kind === 'save';
    const isCard= kind.includes('red') || kind.includes('yellow');

    result.push({
      id:         i,
      minute:     ev.minute,
      kind,
      headline:   isGoal ? 'GOOOOOL!' : style.icon + ' ' + kindLabel(kind),
      commentary: pickComment(kind, actor, undefined, i),
      side:       ev.side,
      ...(actor !== undefined ? { actor } : {}),
      isKey:      isGoal || isSave || kind === 'full_time',
      momentum:   MOMENTUM_DELTA[kind] ?? 0,
      bgColor:    style.bg,
      iconText:   style.icon,
    });
  }

  return result;
}

function kindLabel(k: EventKind): string {
  const LABELS: Partial<Record<EventKind, string>> = {
    half_time:'Intervalo', full_time:'Fim de jogo', injury:'Lesão',
    sub:'Substituição', save:'Defesa incrível', chance:'Chance perdida',
    var:'VAR', yellow_home:'Cartão', yellow_away:'Cartão',
    red_home:'Expulsão', red_away:'Expulsão',
  };
  return LABELS[k] ?? '';
}

// ─── Cálculo de momentum acumulado ────────────────────────────────────────────

export type MomentumPoint = { minute: number; home: number }; // home 0–100

export function buildMomentumCurve(events: RichEvent[]): MomentumPoint[] {
  const points: MomentumPoint[] = [{ minute:0, home:50 }];
  let current = 50;

  for (const ev of events) {
    current += ev.momentum;
    current  = Math.max(10, Math.min(90, current));
    points.push({ minute: ev.minute, home: current });
  }

  return points;
}

// ─── Função principal: prepare de experiência ─────────────────────────────────

export type MatchExperienceData = {
  display:    MatchDisplay;
  rich:       RichEvent[];
  momentum:   MomentumPoint[];
  opponent:   MatchOpponent;
  matchId:    string;
  newBalance: number;
};

export function buildMatchExperienceData(
  display:    MatchDisplay,
  opponent:   MatchOpponent,
  matchId:    string,
  newBalance: number,
): MatchExperienceData {
  const rich     = buildRichEvents(display.events);
  const momentum = buildMomentumCurve(rich);
  return { display, rich, momentum, opponent, matchId, newBalance };
}

export function prepareMatchExperience(
  opponentId: string,
  seed:       number,
): MatchExperienceData {
  const opponent = MATCH_OPPONENTS.find(o => o.id === opponentId)
    ?? MATCH_OPPONENTS[0]!;

  const display  = runMatch(opponent, seed);
  const rich     = buildRichEvents(display.events);
  const momentum = buildMomentumCurve(rich);

  return { display, rich, momentum, opponent, matchId: '', newBalance: 0 };
}
