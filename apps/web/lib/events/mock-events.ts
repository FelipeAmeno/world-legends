/**
 * lib/events/mock-events.ts — T065
 *
 * Eventos simulados prontos para Copa do Mundo, Champions e Libertadores.
 *
 * Para LiveOps: substituir getEvents() por fetch('/api/events')
 * O tipo GameEvent já é compatível com a API futura.
 */

import type { GameEvent, EventRewardItem } from './types';

// ─── Helpers de recompensa ────────────────────────────────────────────────────

const xp      = (amount: number): EventRewardItem => ({ kind:'xp',       amount, label:`+${amount} XP`,       icon:'⭐' });
const credits = (amount: number): EventRewardItem => ({ kind:'credits',  amount, label:`+${amount}c`,          icon:'💰' });
const pack    = (id: string, name: string): EventRewardItem =>
  ({ kind:'pack', amount:1, packId:id, label:`1 ${name}`, icon:'📦' });
const card    = (id: string, name: string): EventRewardItem =>
  ({ kind:'exclusive_card', amount:1, cardId:id, label:name, icon:'🃏' });
const badge   = (name: string): EventRewardItem =>
  ({ kind:'badge', amount:1, label:name, icon:'🏅' });
const title   = (name: string): EventRewardItem =>
  ({ kind:'title', amount:1, label:`Título: "${name}"`, icon:'🎖️' });
const frags   = (amount: number): EventRewardItem =>
  ({ kind:'fragments', amount, label:`+${amount} gemas`, icon:'💎' });

// ─── Data helpers ─────────────────────────────────────────────────────────────

const now      = () => Date.now();
const fromNow  = (ms: number) => new Date(now() + ms).toISOString();
const agoMs    = (ms: number) => new Date(now() - ms).toISOString();

const HOUR = 3_600_000;
const DAY  = 86_400_000;

// ─── Eventos ──────────────────────────────────────────────────────────────────

export const MOCK_EVENTS: GameEvent[] = [

  // ── 1. Copa do Mundo — EVENTO PRINCIPAL ──────────────────────────────────────
  {
    id:       'wc-2026',
    category: 'world_cup',
    featured: true,
    isNew:    false,
    title:    'Copa do Mundo 2026',
    subtitle: 'EUA · México · Canadá',
    description:
      'A maior competição do futebol mundial chegou ao World Legends! ' +
      'Monte seu squad com as lendas da Copa e dispute o torneio mais épico. ' +
      'Cartas exclusivas World Cup Hero disponíveis apenas neste evento.',
    banner: {
      from:'#1a0800', via:'#78350f', to:'#b45309',
      icon:'🌍', accent:'#f59e0b',
      badgeText:'EVENTO PRINCIPAL', badgeColor:'#f59e0b',
    },
    difficulty:   'legendary',
    startsAt:     agoMs(2 * DAY),
    endsAt:       fromNow(28 * DAY),
    maxEntries:   3,
    format:       'tournament',
    participants: 48_392,
    tags:         ['copa','world_cup','2026','exclusivo'],

    requirements: [
      { kind:'min_ovr',    value:85,  label:'Squad mínimo 85 OVR' },
      { kind:'min_level',  value:10,  label:'Nível 10 ou superior' },
      { kind:'squad_size', value:11,  label:'Squad completo (11 titulares)' },
    ],

    rewards: [
      xp(500),
      credits(200),
    ],

    rewardTiers: [
      {
        tier:'Participação', icon:'🏅', color:'text-white/50',
        items:[xp(500), credits(200)],
      },
      {
        tier:'Top 50%', icon:'🥉', color:'text-amber-600',
        items:[xp(1000), credits(500), frags(50)],
        maxRank: 24196,
      },
      {
        tier:'Top 25%', icon:'🥈', color:'text-slate-300',
        items:[xp(2000), credits(1200), pack('classic', 'Classic Pack')],
        maxRank: 12098,
      },
      {
        tier:'Top 10%', icon:'🥇', color:'text-yellow-400',
        items:[xp(3500), credits(2500), pack('elite', 'Elite Pack'), frags(200)],
        maxRank: 4839,
      },
      {
        tier:'Top 3', icon:'🏆', color:'text-gold',
        items:[xp(10000), credits(8000), pack('legend', 'Legend Pack'), card('wch-exclusive', 'World Cup Hero Exclusivo'), title('Campeão Mundial')],
        maxRank: 3,
      },
    ],
  },

  // ── 2. Champions League ───────────────────────────────────────────────────────
  {
    id:       'ucl-2025',
    category: 'champions_league',
    featured: true,
    isNew:    true,
    title:    'UEFA Champions League',
    subtitle: 'Final de Lisboa 2025',
    description:
      'A competição de clubes mais prestigiada do mundo! ' +
      'Use lendas europeias e prove que você é o melhor do continente. ' +
      'Formato de eliminatória: perca 1 partida e você está fora!',
    banner: {
      from:'#000d2a', via:'#1e3a8a', to:'#2563eb',
      icon:'⭐', accent:'#60a5fa',
      badgeText:'AO VIVO', badgeColor:'#ef4444',
    },
    difficulty:   'elite',
    startsAt:     agoMs(5 * DAY),
    endsAt:       fromNow(9 * DAY),
    maxEntries:   1,
    format:       'tournament',
    participants: 31_847,
    tags:         ['europa','champions','uefa','eliminatória'],

    requirements: [
      { kind:'min_ovr',    value:82,  label:'Squad mínimo 82 OVR' },
      { kind:'min_level',  value:8,   label:'Nível 8 ou superior' },
      { kind:'nationality', code:'EU', flag:'🇪🇺', label:'3+ jogadores europeus no squad' },
    ],

    rewards: [xp(400), credits(150)],

    rewardTiers: [
      { tier:'Participação', icon:'🏅', color:'text-white/50', items:[xp(400), credits(150)] },
      { tier:'Top 50%',      icon:'🥉', color:'text-amber-600', items:[xp(800), credits(400), frags(30)], maxRank:15923 },
      { tier:'Top 25%',      icon:'🥈', color:'text-slate-300', items:[xp(1800), credits(900), pack('classic','Classic Pack')], maxRank:7961 },
      { tier:'Top 10%',      icon:'🥇', color:'text-yellow-400', items:[xp(3000), credits(2000), pack('elite','Elite Pack')], maxRank:3184 },
      { tier:'Campeão',      icon:'👑', color:'text-gold',
        items:[xp(8000), credits(6000), pack('legend','Legend Pack'), badge('Rei da Europa'), title('Rei da Europa')],
        maxRank:1,
      },
    ],
  },

  // ── 3. Libertadores ───────────────────────────────────────────────────────────
  {
    id:       'libertadores-2025',
    category: 'libertadores',
    featured: false,
    isNew:    true,
    title:    'CONMEBOL Libertadores',
    subtitle: 'Glória Sul-Americana',
    description:
      'A taça mais desejada da América do Sul. ' +
      'Monte um squad com as lendas sul-americanas e dispute o torneio mais apaixonante do mundo. ' +
      'Recompensas exclusivas aguardam os melhores treinadores.',
    banner: {
      from:'#0d1a00', via:'#1a4000', to:'#365314',
      icon:'🏆', accent:'#a3e635',
      badgeText:'EM ANDAMENTO', badgeColor:'#84cc16',
    },
    difficulty:   'professional',
    startsAt:     agoMs(1 * DAY),
    endsAt:       fromNow(14 * DAY),
    maxEntries:   2,
    format:       'best_of_3',
    participants: 22_108,
    tags:         ['america_sul','libertadores','conmebol'],

    requirements: [
      { kind:'min_ovr',   value:78, label:'Squad mínimo 78 OVR' },
      { kind:'min_level', value:5,  label:'Nível 5 ou superior' },
      { kind:'nationality', code:'LATAM', flag:'🌎', label:'5+ jogadores latino-americanos' },
    ],

    rewards: [xp(300), credits(100)],

    rewardTiers: [
      { tier:'Participação', icon:'🏅', color:'text-white/50', items:[xp(300), credits(100)] },
      { tier:'Top 50%',      icon:'🥉', color:'text-amber-600', items:[xp(700), credits(350), frags(20)], maxRank:11054 },
      { tier:'Top 25%',      icon:'🥈', color:'text-slate-300', items:[xp(1500), credits(800), pack('classic','Classic Pack')], maxRank:5527 },
      { tier:'Top 10%',      icon:'🥇', color:'text-yellow-400', items:[xp(2500), credits(1800), pack('elite','Elite Pack')], maxRank:2210 },
      { tier:'Campeão',      icon:'🏆', color:'text-emerald-400',
        items:[xp(6000), credits(5000), pack('legend','Legend Pack'), badge('Rei das Américas'), title('Rei das Américas')],
        maxRank:1,
      },
    ],
  },

  // ── 4. Copa América ───────────────────────────────────────────────────────────
  {
    id:       'copa-america-2025',
    category: 'copa_america',
    featured: false,
    isNew:    false,
    title:    'Copa América 2025',
    subtitle: 'Nações da América',
    description:
      'A competição nacional mais antiga das Américas. ' +
      'Use jogadores de um único país e prove a supremacia da sua seleção favorita!',
    banner: {
      from:'#001a0f', via:'#064e3b', to:'#065f46',
      icon:'🌎', accent:'#10b981',
      badgeText:'TERMINA EM 3 DIAS', badgeColor:'#ef4444',
    },
    difficulty:   'professional',
    startsAt:     agoMs(11 * DAY),
    endsAt:       fromNow(3 * DAY),
    maxEntries:   2,
    format:       'single_match',
    participants: 15_442,
    tags:         ['copa_america','america_sul','seleção'],

    requirements: [
      { kind:'min_ovr',    value:76, label:'Squad mínimo 76 OVR' },
      { kind:'min_level',  value:4,  label:'Nível 4 ou superior' },
      { kind:'squad_size', value:11, label:'11 jogadores da mesma nação' },
    ],

    rewards: [xp(250), credits(80)],

    rewardTiers: [
      { tier:'Participação', icon:'🏅', color:'text-white/50', items:[xp(250), credits(80)] },
      { tier:'Top 50%',      icon:'🥉', color:'text-amber-600', items:[xp(600), credits(300)], maxRank:7721 },
      { tier:'Top 10%',      icon:'🥇', color:'text-yellow-400', items:[xp(2000), credits(1500), pack('elite','Elite Pack')], maxRank:1544 },
      { tier:'Campeão',      icon:'🏆', color:'text-emerald-400',
        items:[xp(5000), credits(4000), pack('legend','Legend Pack'), title('Campeão das Américas')],
        maxRank:1,
      },
    ],
  },

  // ── 5. Desafio Semanal ────────────────────────────────────────────────────────
  {
    id:       'weekly-2025-w22',
    category: 'weekly_challenge',
    featured: false,
    isNew:    true,
    title:    'Desafio da Semana',
    subtitle: 'Ataque total — 5 gols em 3 partidas',
    description:
      'Esta semana: mostre poder ofensivo! ' +
      'Marque pelo menos 5 gols em 3 partidas diferentes para completar o desafio. ' +
      'Quanto mais gols, maior sua pontuação!',
    banner: {
      from:'#0d0020', via:'#2e1065', to:'#4c1d95',
      icon:'⚡', accent:'#a855f7',
      badgeText:'SEMANAL', badgeColor:'#a855f7',
    },
    difficulty:   'amateur',
    startsAt:     agoMs(1 * DAY),
    endsAt:       fromNow(6 * DAY),
    maxEntries:   3,
    format:       'accumulate',
    participants: 8_234,
    tags:         ['semanal','challenge','gols'],

    requirements: [
      { kind:'min_level', value:2, label:'Nível 2 ou superior' },
    ],

    rewards: [xp(200), credits(100)],

    rewardTiers: [
      { tier:'Participação', icon:'🏅', color:'text-white/50', items:[xp(200), credits(100)] },
      { tier:'Top 50%',      icon:'🥉', color:'text-amber-600', items:[xp(500), credits(250), frags(25)], maxRank:4117 },
      { tier:'Top 10%',      icon:'🥇', color:'text-yellow-400', items:[xp(1200), credits(800), pack('classic','Classic Pack')], maxRank:823 },
    ],
  },

  // ── 6. Desafio Diário ─────────────────────────────────────────────────────────
  {
    id:       `daily-${new Date().toISOString().slice(0,10)}`,
    category: 'daily_challenge',
    featured: false,
    isNew:    true,
    title:    'Desafio de Hoje',
    subtitle: 'Vença com squad máx 82 OVR',
    description:
      'Restrição: squad máximo 82 OVR. ' +
      'Vença 1 partida com essas condições e colete a recompensa do dia!',
    banner: {
      from:'#1a0020', via:'#7c1d5a', to:'#9d174d',
      icon:'🎯', accent:'#ec4899',
      badgeText:'HOJE', badgeColor:'#ec4899',
    },
    difficulty:   'beginner',
    startsAt:     new Date(new Date().setHours(0,0,0,0)).toISOString(),
    endsAt:       new Date(new Date().setHours(23,59,59,999)).toISOString(),
    maxEntries:   1,
    format:       'challenge',
    participants: 3_892,
    tags:         ['diário','fácil','beginner'],

    requirements: [
      { kind:'min_level', value:1, label:'Qualquer nível' },
    ],

    rewards: [xp(150), credits(75), frags(10)],

    rewardTiers: [
      { tier:'Participação', icon:'🎯', color:'text-pink-400', items:[xp(150), credits(75), frags(10)] },
    ],
  },

  // ── 7. Eurocopa ───────────────────────────────────────────────────────────────
  {
    id:       'euro-2025',
    category: 'euro',
    featured: false,
    isNew:    false,
    title:    'Eurocopa 2025',
    subtitle: 'O melhor da Europa',
    description:
      'Em breve! Prepare seu squad europeu e esteja pronto quando a Eurocopa começar.',
    banner: {
      from:'#000d3a', via:'#1e3a8a', to:'#1d4ed8',
      icon:'⚽', accent:'#60a5fa',
      badgeText:'EM BREVE', badgeColor:'#6b7280',
    },
    difficulty:   'elite',
    startsAt:     fromNow(15 * DAY),
    endsAt:       fromNow(43 * DAY),
    maxEntries:   2,
    format:       'tournament',
    participants: 0,
    tags:         ['europa','euro','upcoming'],

    requirements: [
      { kind:'min_ovr',    value:83, label:'Squad mínimo 83 OVR' },
      { kind:'min_level',  value:9,  label:'Nível 9 ou superior' },
      { kind:'nationality', code:'EU', flag:'🇪🇺', label:'Squad 100% europeu' },
    ],

    rewards: [xp(400), credits(150)],

    rewardTiers: [
      { tier:'Participação', icon:'🏅', color:'text-white/50', items:[xp(400), credits(150)] },
      { tier:'Campeão',      icon:'🏆', color:'text-yellow-400',
        items:[xp(7000), credits(5500), pack('legend','Legend Pack'), title('Rei da Europa')],
        maxRank:1,
      },
    ],
  },
];

// ─── API-ready function ───────────────────────────────────────────────────────

export function getEvents(): GameEvent[] {
  return MOCK_EVENTS;
}

export function getEventById(id: string): GameEvent | undefined {
  return MOCK_EVENTS.find(e => e.id === id);
}

export function getFeaturedEvents(): GameEvent[] {
  return MOCK_EVENTS.filter(e => e.featured);
}
