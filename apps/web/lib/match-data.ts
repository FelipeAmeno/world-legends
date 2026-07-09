/**
 * lib/match-data.ts
 *
 * Bridge entre a camada de UI e os packages de domínio da partida.
 * Responsabilidades:
 *   1. Construir Squad (packages/squad) a partir dos cards padrão.
 *   2. Construir time adversário sintético baseado no OVR médio.
 *   3. Executar simulateSquadMatch (packages/match-simulator).
 *   4. Transformar MatchResult → DTOs visuais para a UI.
 *   5. Calcular recompensas pós-partida.
 *
 * Zero lógica de UI aqui — apenas domínio + transformação.
 */

import type { MatchEvent, TacticalIntensity } from '@world-legends/engine';
import { simulateSquadMatch } from '@world-legends/match-simulator';
import type { SquadMatchOutput } from '@world-legends/match-simulator';
import { addPlayer, createSquad } from '@world-legends/squad';
import { type CollectionCard, getCollection } from './collection-data';

// ─── Lineup padrão do usuário (4-3-3 com lendas) ─────────────────────────────

/** Mapeamento slotId → cardId para 4-3-3 */
const DEFAULT_LINEUP_433: Array<{ slotId: string; cardId: string }> = [
  { slotId: 'GK-1', cardId: 'taffarel' },
  { slotId: 'RB-1', cardId: 'cafu' },
  { slotId: 'CB-1', cardId: 'lucio' },
  { slotId: 'CB-2', cardId: 'falcao' }, // fallback temporário
  { slotId: 'LB-1', cardId: 'roberto-carlos' },
  { slotId: 'CM-1', cardId: 'zico' },
  { slotId: 'CM-2', cardId: 'ronaldinho' },
  { slotId: 'CM-3', cardId: 'rivaldo' },
  { slotId: 'RW-1', cardId: 'bebeto' },
  { slotId: 'ST-1', cardId: 'ronaldo' },
  { slotId: 'LW-1', cardId: 'romario' },
];

// ─── Oponentes pré-definidos ──────────────────────────────────────────────────

export type MatchOpponent = {
  id: string;
  name: string;
  formation: string;
  avgOvr: number;
  difficulty: 'easy' | 'medium' | 'hard';
  color: string;
  flag: string;
};

export const MATCH_OPPONENTS: readonly MatchOpponent[] = [
  {
    id: 'classic-xi',
    name: 'Estrelas Clássicas',
    formation: '4-4-2',
    avgOvr: 74,
    difficulty: 'easy',
    color: 'text-emerald-400',
    flag: '⭐',
  },
  {
    id: 'euro-xi',
    name: 'Seleção Europeia',
    formation: '4-3-3',
    avgOvr: 82,
    difficulty: 'medium',
    color: 'text-blue-400',
    flag: '🇪🇺',
  },
  {
    id: 'arg-xi',
    name: 'Argentinos All Stars',
    formation: '4-2-3-1',
    avgOvr: 88,
    difficulty: 'medium',
    color: 'text-sky-400',
    flag: '🇦🇷',
  },
  {
    id: 'england-xi',
    name: 'Liga Inglesa XI',
    formation: '5-3-2',
    avgOvr: 85,
    difficulty: 'medium',
    color: 'text-red-400',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  },
  {
    id: 'wc-legends',
    name: 'Lendas da Copa do Mundo',
    formation: '4-3-3',
    avgOvr: 92,
    difficulty: 'hard',
    color: 'text-amber-400',
    flag: '🏆',
  },
  {
    id: 'galaxy-xi',
    name: 'Time das Galáxias',
    formation: '3-4-3',
    avgOvr: 95,
    difficulty: 'hard',
    color: 'text-violet-400',
    flag: '🌌',
  },
];

// ─── Tipos de display ─────────────────────────────────────────────────────────

export type EventDisplay = {
  minute: number;
  type: string;
  side: 'home' | 'away' | 'neutral';
  icon: string;
  text: string;
  highlight: boolean;
};

export type MatchDisplay = {
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away' | 'draw';
  userOvr?: number;
  events: EventDisplay[];
  stats: {
    possession: [number, number];
    shots: [number, number];
    shotsOnTarget: [number, number];
    xg: [number, number];
    fouls: [number, number];
    corners: [number, number];
    yellowCards: [number, number];
    redCards: [number, number];
  };
  mvp: CollectionCard | null;
  weather: string;
  referee: string;
  rewards: {
    credits: number;
    xp: number;
    bonuses: Array<{ label: string; credits: number; xp: number }>;
  };
  homeName: string;
  awayName: string;
  /**
   * Sprint 26 (Gameplay Foundation) — lineup/banco REAIS do squad salvo
   * pelo usuário, populados pelo fluxo novo (`lib/match-session.ts`).
   * Opcionais porque o fluxo antigo/demo (`runMatch` com
   * `DEFAULT_LINEUP_433`, usado só por ferramentas internas) não os
   * preenche — nesse caso a UI cai no `getUserLineup()` de sempre.
   */
  userLineup?: LineupPlayer[];
  userBench?: LineupPlayer[];
};

// ─── Dificuldade da IA (Sprint 26 — Gameplay Foundation) ─────────────────────
//
// Diferente do `difficulty` estático por oponente (`MatchOpponent.difficulty`,
// só um selo visual hoje), isto é uma escolha do usuário que afeta
// COMPORTAMENTO da IA a cada minuto via `AiDifficultyModifier` do engine —
// não é só reduzir/aumentar o OVR do time adversário.

export type MatchDifficulty = 'easy' | 'normal' | 'hard' | 'legendary';

export type DifficultyDef = {
  label: string;
  description: string;
  /** Repassado direto pra `MatchContext.awayAiDifficulty.powerModifierPercent` do engine. */
  powerModifierPercent: number;
  /** Lendário: IA reage no intervalo (troca tática + faz 1 substituição). */
  reactsAtHalftime: boolean;
};

export const DIFFICULTY_DEFS: Record<MatchDifficulty, DifficultyDef> = {
  easy: {
    label: 'Fácil',
    description: 'A IA comete mais erros — chutes e marcação menos precisos.',
    powerModifierPercent: -10,
    reactsAtHalftime: false,
  },
  normal: {
    label: 'Normal',
    description: 'Comportamento equilibrado, sem ajustes.',
    powerModifierPercent: 0,
    reactsAtHalftime: false,
  },
  hard: {
    label: 'Difícil',
    description: 'A IA pressiona melhor e erra menos.',
    powerModifierPercent: 8,
    reactsAtHalftime: false,
  },
  legendary: {
    label: 'Lendário',
    description: 'A IA pressiona melhor E reage no intervalo — muda de tática e faz substituições.',
    powerModifierPercent: 8,
    reactsAtHalftime: true,
  },
};

// ─── Probability helpers ──────────────────────────────────────────────────────

export function computeWinProbability(
  userOvr: number,
  oppOvr: number,
): {
  home: number;
  draw: number;
  away: number;
} {
  const homeAdj = userOvr * 1.1; // home advantage
  const total = homeAdj + oppOvr;
  const homeP = Math.round((homeAdj / total) * 100);
  const awayP = Math.round((oppOvr / total) * 70); // away less likely
  const drawP = Math.max(5, 100 - homeP - awayP);
  const norm = homeP + awayP + drawP;
  return {
    home: Math.round((homeP / norm) * 100),
    draw: Math.round((drawP / norm) * 100),
    away: Math.round((awayP / norm) * 100),
  };
}

// ─── runMatch ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-001';

/**
 * Executa uma partida completa usando packages/match-simulator.
 * Retorna display data pronta para a UI.
 */
export function runMatch(
  opponent: MatchOpponent,
  seed: number,
  _lineup?: ReadonlyArray<{ slotId: string; cardId: string }>,
): MatchDisplay {
  const allCards = getCollection();
  const cardMap = new Map(allCards.map((c) => [c.playerId, c]));

  // ── Construir Squad do usuário ───────────────────────────────────────────────
  const homeSquadResult = createSquad({
    userId: USER_ID,
    formation: '4-3-3',
    generateId: () => 'sq-home',
  });
  if (!homeSquadResult.ok) return EMPTY_DISPLAY;

  let homeSquad = homeSquadResult.value;

  // Resolver de PlayerInfo para addPlayer
  const homeResolver = (ucId: string) => {
    const card = allCards.find((c) => c.playerId === ucId);
    if (!card) return null;
    return {
      userCardId: ucId,
      userId: USER_ID,
      naturalPosition: card.position as any,
      nationality: card.nationality,
      overall: card.overall,
      isInjured: false,
      suspendedMatches: 0,
    };
  };

  // Adicionar jogadores nos slots
  for (const { slotId, cardId } of DEFAULT_LINEUP_433) {
    const card = allCards.find((c) => c.playerId === cardId);
    if (!card) continue;
    const r = addPlayer({
      squad: homeSquad,
      userCardId: card.playerId,
      slotId,
      resolvePlayer: homeResolver,
    });
    if (r.ok) homeSquad = r.value;
  }

  // ── Construir Squad adversário (sintético) ────────────────────────────────────
  const AWAY_USER_ID = `opp-${opponent.id}`;
  const awaySquadResult = createSquad({
    userId: AWAY_USER_ID,
    formation: '4-3-3',
    generateId: () => 'sq-away',
  });
  if (!awaySquadResult.ok) return EMPTY_DISPLAY;

  let awaySquad = awaySquadResult.value;

  // Jogadores sintéticos para o adversário
  type AISeed = { slotId: string; position: string; ovr: number };
  const aiSlots: AISeed[] = [
    { slotId: 'GK-1', position: 'GK', ovr: opponent.avgOvr - 2 },
    { slotId: 'RB-1', position: 'RB', ovr: opponent.avgOvr - 3 },
    { slotId: 'CB-1', position: 'CB', ovr: opponent.avgOvr - 1 },
    { slotId: 'CB-2', position: 'CB', ovr: opponent.avgOvr },
    { slotId: 'LB-1', position: 'LB', ovr: opponent.avgOvr - 3 },
    { slotId: 'CM-1', position: 'CM', ovr: opponent.avgOvr + 2 },
    { slotId: 'CM-2', position: 'CM', ovr: opponent.avgOvr },
    { slotId: 'CM-3', position: 'CM', ovr: opponent.avgOvr - 1 },
    { slotId: 'RW-1', position: 'RW', ovr: opponent.avgOvr + 1 },
    { slotId: 'ST-1', position: 'ST', ovr: opponent.avgOvr + 3 },
    { slotId: 'LW-1', position: 'LW', ovr: opponent.avgOvr + 1 },
  ];

  const awayResolver = (ucId: string) => {
    const slot = aiSlots.find((s) => `ai-${s.slotId}` === ucId);
    if (!slot) return null;
    return {
      userCardId: ucId,
      userId: AWAY_USER_ID,
      naturalPosition: slot.position as any,
      nationality: 'XX',
      overall: Math.max(60, Math.min(99, slot.ovr)),
      isInjured: false,
      suspendedMatches: 0,
    };
  };

  for (const slot of aiSlots) {
    const ucId = `ai-${slot.slotId}`;
    const r = addPlayer({
      squad: awaySquad,
      userCardId: ucId,
      slotId: slot.slotId,
      resolvePlayer: awayResolver,
    });
    if (r.ok) awaySquad = r.value;
  }

  // ── Resolvers para match-simulator (PlayerMatchData) ─────────────────────────
  const homeMatchResolver = (ucId: string) => {
    const card = allCards.find((c) => c.playerId === ucId);
    if (!card) return null;
    return {
      userCardId: card.playerId,
      naturalPosition: card.position as any,
      overall: card.overall,
      nationality: card.nationality,
      traits: [],
    };
  };

  const awayMatchResolver = (ucId: string) => {
    const slot = aiSlots.find((s) => `ai-${s.slotId}` === ucId);
    if (!slot) return null;
    return {
      userCardId: ucId,
      naturalPosition: slot.position as any,
      overall: Math.max(60, Math.min(99, slot.ovr)),
      nationality: 'XX',
      traits: [],
    };
  };

  // ── Simular ──────────────────────────────────────────────────────────────────
  let output: SquadMatchOutput;
  try {
    output = simulateSquadMatch({
      homeSquad,
      awaySquad,
      seed,
      resolveHome: homeMatchResolver,
      resolveAway: awayMatchResolver,
    });
  } catch {
    return EMPTY_DISPLAY;
  }

  const { result, winner, homeChemistry, awayChemistry } = output;

  // ── Transformar eventos ───────────────────────────────────────────────────────
  const nameByPlayerId = new Map(allCards.map((c) => [c.playerId, c.displayName]));
  const aiIdSet = new Set(aiSlots.map((s) => `ai-${s.slotId}`));
  const events = transformEvents(
    result.events,
    (id) => nameByPlayerId.get(id),
    (id) => !aiIdSet.has(id),
  );

  // ── MVP ───────────────────────────────────────────────────────────────────────
  const mvpCard = result.mvpUserCardId
    ? (allCards.find((c) => c.playerId === result.mvpUserCardId) ?? null)
    : null;

  // ── Recompensas ───────────────────────────────────────────────────────────────
  const rewards = computeRewards(winner, result.homeScore, result.stats);

  // ── Stats display ─────────────────────────────────────────────────────────────
  const s = result.stats;

  return {
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    winner,
    events,
    stats: {
      possession: [s.home.possessionPercent, s.away.possessionPercent],
      shots: [s.home.shots, s.away.shots],
      shotsOnTarget: [s.home.shotsOnTarget, s.away.shotsOnTarget],
      xg: [Math.round(s.home.xg * 10) / 10, Math.round(s.away.xg * 10) / 10],
      fouls: [s.home.fouls, s.away.fouls],
      corners: [s.home.corners, s.away.corners],
      yellowCards: [s.home.yellowCards, s.away.yellowCards],
      redCards: [s.home.redCards, s.away.redCards],
    },
    mvp: mvpCard,
    weather: WEATHER_LABELS[result.weather] ?? result.weather,
    referee: REFEREE_LABELS[result.refereeProfile] ?? result.refereeProfile,
    rewards,
    homeName: 'Seleção BR Lendas',
    awayName: opponent.name,
  };
}

// ─── Transformar eventos → display ───────────────────────────────────────────

const EVENT_ICONS: Record<string, string> = {
  kickoff: '⚽',
  half_time: '🔔',
  full_time: '🏁',
  goal: '⚽',
  assist: '🎯',
  card: '🟨',
  injury: '🚑',
  penalty: '🥊',
  substitution: '🔄',
  walkover: '⚠️',
};

/**
 * Sprint 26 — antes recebia `cards`/`aiCardIds` fixos e montava um Map
 * keyed por `playerId` internamente (só funcionava porque o fluxo demo
 * usa `playerId` como se fosse `userCardId`). Agora recebe resolvers —
 * `resolveName`/`isHomeCardId` — pra funcionar tanto com esse fluxo
 * demo quanto com o fluxo real (`lib/match-session.ts`, keyed por
 * `userCardId` de verdade). Comportamento idêntico para os chamadores
 * existentes, que só passam a fazer explicitamente o que antes era
 * implícito no Map.
 */
export function transformEvents(
  events: readonly MatchEvent[],
  resolveName: (userCardId: string) => string | undefined,
  isHomeCardId: (userCardId: string) => boolean,
): EventDisplay[] {
  return (
    events.map((ev) => {
      const base = {
        minute: (ev as any).minute ?? 0,
        type: ev.type,
        icon: EVENT_ICONS[ev.type] ?? '•',
        highlight: false,
        side: 'neutral' as const,
      };

      switch (ev.type) {
        case 'kickoff':
          return { ...base, text: '⚽ Bola rolando!', highlight: false };
        case 'half_time':
          return { ...base, text: '🔔 Intervalo', highlight: false };
        case 'full_time':
          return { ...base, text: '🏁 Apito final', highlight: true };
        case 'goal': {
          const name = resolveName(ev.scorerUserCardId) ?? ev.scorerUserCardId.slice(0, 8);
          const isHome = isHomeCardId(ev.scorerUserCardId);
          const side = isHome ? 'home' : 'away';
          const own = ev.isOwnGoal ? ' (GOL CONTRA)' : '';
          return {
            ...base,
            side,
            highlight: true,
            text: `⚽ GOL! ${name}${own} (${ev.teamSide === 'home' ? 'Casa' : 'Fora'})`,
          };
        }
        case 'card': {
          const name = resolveName(ev.playerUserCardId) ?? ev.playerUserCardId.slice(0, 8);
          const isHome = isHomeCardId(ev.playerUserCardId);
          const color = ev.cardType === 'yellow' ? '🟨' : '🟥';
          return {
            ...base,
            side: isHome ? 'home' : 'away',
            text: `${color} ${name} — ${ev.cardType === 'yellow' ? 'amarelo' : 'vermelho'}`,
          };
        }
        case 'injury': {
          const name = resolveName(ev.playerUserCardId) ?? ev.playerUserCardId.slice(0, 8);
          const isHome = isHomeCardId(ev.playerUserCardId);
          return {
            ...base,
            side: isHome ? 'home' : 'away',
            text: `🚑 Lesão: ${name} (${ev.severity})`,
          };
        }
        case 'substitution': {
          const out = resolveName(ev.playerOutUserCardId) ?? ev.playerOutUserCardId.slice(0, 8);
          const inn = resolveName(ev.playerInUserCardId) ?? ev.playerInUserCardId.slice(0, 8);
          const isHome = isHomeCardId(ev.playerOutUserCardId);
          return { ...base, side: isHome ? 'home' : 'away', text: `🔄 Sub: ${inn} ↔ ${out}` };
        }
        default:
          return { ...base, text: ev.description ?? ev.type };
      }
    }) as EventDisplay[]
  ).filter((e) => e.type !== 'assist'); // assists mostrados como parte do gol
}

// ─── Recompensas ──────────────────────────────────────────────────────────────

export function computeRewards(
  winner: 'home' | 'away' | 'draw',
  homeGoals: number,
  stats: any,
): MatchDisplay['rewards'] {
  const BASE = {
    win: { credits: 200, xp: 150 },
    draw: { credits: 100, xp: 80 },
    loss: { credits: 50, xp: 40 },
  };

  const outcome = winner === 'home' ? 'win' : winner === 'draw' ? 'draw' : 'loss';
  const base = BASE[outcome];
  const bonuses: MatchDisplay['rewards']['bonuses'] = [];

  if (stats.home.yellowCards === 0 && stats.home.redCards === 0) {
    bonuses.push({ label: '⚖️ Jogo limpo', credits: 25, xp: 20 });
  }
  if (stats.away.shots > 0 && stats.away.shotsOnTarget === 0) {
    bonuses.push({ label: '🧱 Goleiro imbatível', credits: 50, xp: 30 });
  }
  if (homeGoals >= 3) {
    bonuses.push({ label: `⚡ ${homeGoals} gols`, credits: homeGoals * 15, xp: homeGoals * 10 });
  }
  if (winner === 'home' && stats.away.shots > 0 && stats.home.possession >= 55) {
    bonuses.push({ label: '🎮 Domínio total', credits: 40, xp: 25 });
  }

  const totalCredits = base.credits + bonuses.reduce((s, b) => s + b.credits, 0);
  const totalXp = base.xp + bonuses.reduce((s, b) => s + b.xp, 0);

  return { credits: totalCredits, xp: totalXp, bonuses };
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const WEATHER_LABELS: Record<string, string> = {
  ensolarado: '☀️ Ensolarado',
  chuva: '🌧️ Chuva',
  calor_extremo: '🌡️ Calor extremo',
  frio_intenso: '🥶 Frio intenso',
  vento_forte: '💨 Vento forte',
};

export const REFEREE_LABELS: Record<string, string> = {
  permissivo: '🟢 Árbitro permissivo',
  normal: '⚖️ Árbitro normal',
  rigoroso: '🔴 Árbitro rigoroso',
};

// ─── Fallback ─────────────────────────────────────────────────────────────────

export const EMPTY_DISPLAY: MatchDisplay = {
  homeScore: 0,
  awayScore: 0,
  winner: 'draw',
  events: [],
  stats: {
    possession: [50, 50],
    shots: [0, 0],
    shotsOnTarget: [0, 0],
    xg: [0, 0],
    fouls: [0, 0],
    corners: [0, 0],
    yellowCards: [0, 0],
    redCards: [0, 0],
  },
  mvp: null,
  weather: '',
  referee: '',
  homeName: 'Casa',
  awayName: 'Fora',
  rewards: { credits: 0, xp: 0, bonuses: [] },
};

// ─── Lineup display ───────────────────────────────────────────────────────────

export type LineupPlayer = {
  position: string;
  name: string;
  ovr: number;
  flag: string;
  rarity?: string;
  /** Sprint 26: identifica o jogador real pro fluxo de substituição no intervalo. */
  userCardId?: string;
};

// ─── Táticas/mentalidades (Sprint 26 — Gameplay Foundation) ──────────────────
//
// As 5 mentalidades que o usuário escolhe no intervalo (`Alterar Tática`) —
// mapeiam 1:1 pras `TacticalIntensity` do engine que já tinham efeito real
// (fadiga + modificador de setor ataque/meio/defesa). `ultra_defensivo`/
// `ultra_ofensivo` continuam existindo no engine só como extremos
// alcançados automaticamente via química baixa/alta — não aparecem aqui.

export const TACTIC_DEFS: ReadonlyArray<{
  value: TacticalIntensity;
  label: string;
  description: string;
}> = [
  { value: 'defensivo', label: 'Defensivo', description: 'Prioriza a marcação, cede a posse.' },
  { value: 'equilibrado', label: 'Equilibrado', description: 'Sem favorecer nenhum setor.' },
  { value: 'ofensivo', label: 'Ofensivo', description: 'Empurra linhas, arrisca mais na frente.' },
  {
    value: 'pressao_alta',
    label: 'Pressão Alta',
    description: 'Marca no campo de ataque — cansa mais rápido.',
  },
  {
    value: 'contra_ataque',
    label: 'Contra-Ataque',
    description: 'Se fecha atrás e busca transições rápidas.',
  },
];

export function getUserLineup(): LineupPlayer[] {
  const cards = getCollection();
  const cardMap = new Map(cards.map((c) => [c.playerId, c]));

  return DEFAULT_LINEUP_433.map(({ slotId, cardId }) => {
    const card = cardMap.get(cardId);
    const pos = slotId.replace(/-\d+$/, '');
    if (!card) return { position: pos, name: '?', ovr: 0, flag: '', rarity: 'common' };
    return {
      position: pos,
      name: card.displayName,
      ovr: card.overall,
      flag: card.flagEmoji,
      rarity: card.rarityCode,
    };
  });
}

export function getAILineup(opponent: MatchOpponent): LineupPlayer[] {
  const positions = ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'];
  return positions.map((pos, i) => ({
    position: pos,
    name: `${opponent.name.split(' ')[0]} ${pos}`,
    ovr: Math.max(60, Math.min(99, opponent.avgOvr + (i % 3 === 0 ? 2 : i % 3 === 1 ? 0 : -2))),
    flag: opponent.flag,
    rarity: 'elite',
  }));
}
