/**
 * Dados mockados para o app web.
 *
 * Usa as funções e tipos dos packages de domínio:
 *   @world-legends/progression  → perfil e XP do usuário
 *   @world-legends/squad-rating → OVR do squad
 *   @world-legends/chemistry    → química entre jogadores
 *   @world-legends/contracts    → contratos das cartas
 *   @world-legends/card-evolution → evolução das cartas
 *   @world-legends/bench        → banco e moral
 */

import { calculateSquadRating }    from '@world-legends/squad-rating';
import { calculateChemistry }      from '@world-legends/chemistry';
import { calculateBenchMoral }     from '@world-legends/bench';
import { getEvolutionTag }         from '@world-legends/card-evolution';
import { contractStatus }          from '@world-legends/contracts';
import type { PlayerChemistryInput } from '@world-legends/chemistry';
import type { RatedPlayer }          from '@world-legends/squad-rating';
import type { BenchPlayer }          from '@world-legends/bench';

// ─── Tipos locais ─────────────────────────────────────────────────────────────

export type Rarity = 'common' | 'rare' | 'elite' | 'legendary' | 'ultra' | 'world_cup_hero';

export type MockCard = {
  id:          string;
  name:        string;
  shortName:   string;
  position:    string;
  overall:     number;
  nationality: string;
  rarity:      Rarity;
  competition: string;
  era:         string;
  traits:      string[];
  evolution:   number;  // nível de evolução (0–4)
  contracts:   number;  // contratos restantes
  stamina:     number;
  physical:    number;
};

// ─── Catálogo de cartas (Lendas Mundiais) ────────────────────────────────────

export const ALL_CARDS: MockCard[] = [
  // ── Ultras ──────────────────────────────────────────────────────────────────
  { id:'uc-01', name:'Ronaldo Fenômeno',  shortName:'Ronaldo',    position:'ST',  overall:97, nationality:'🇧🇷', rarity:'ultra',       competition:'laliga',      era:'1990s', traits:['clinical_finisher','pace_monster'],  evolution:2, contracts:5, stamina:88, physical:92 },
  { id:'uc-02', name:'Ronaldinho Gaúcho', shortName:'Ronaldinho', position:'CM',  overall:95, nationality:'🇧🇷', rarity:'ultra',       competition:'laliga',      era:'2000s', traits:['dribble_master','clutch_performer'],evolution:1, contracts:7, stamina:85, physical:80 },
  { id:'uc-03', name:'Maradona',          shortName:'Maradona',   position:'CM',  overall:99, nationality:'🇦🇷', rarity:'world_cup_hero',competition:'serie_a',   era:'1980s', traits:['dribble_master','clutch_performer'],evolution:0, contracts:3, stamina:82, physical:79 },
  { id:'uc-04', name:'Pelé',              shortName:'Pelé',       position:'ST',  overall:98, nationality:'🇧🇷', rarity:'world_cup_hero',competition:'brasileirao',era:'1960s', traits:['clinical_finisher','clutch_performer'],evolution:3, contracts:4, stamina:90, physical:88 },

  // ── Legendaries ─────────────────────────────────────────────────────────────
  { id:'uc-05', name:'Zico',              shortName:'Zico',       position:'CM',  overall:93, nationality:'🇧🇷', rarity:'legendary',   competition:'brasileirao', era:'1980s', traits:['playmaker','set_piece_specialist'], evolution:1, contracts:6, stamina:80, physical:75 },
  { id:'uc-06', name:'Romário',           shortName:'Romário',    position:'ST',  overall:93, nationality:'🇧🇷', rarity:'legendary',   competition:'laliga',      era:'1990s', traits:['clinical_finisher'],               evolution:0, contracts:7, stamina:75, physical:72 },
  { id:'uc-07', name:'Roberto Carlos',    shortName:'R.Carlos',   position:'LB',  overall:92, nationality:'🇧🇷', rarity:'legendary',   competition:'laliga',      era:'1990s', traits:['rocket_shot','stamina_boost'],     evolution:2, contracts:2, stamina:94, physical:85 },
  { id:'uc-08', name:'Cafu',              shortName:'Cafu',       position:'RB',  overall:90, nationality:'🇧🇷', rarity:'legendary',   competition:'serie_a',     era:'1990s', traits:['stamina_boost','pace_monster'],    evolution:0, contracts:7, stamina:95, physical:84 },
  { id:'uc-09', name:'Rivaldo',           shortName:'Rivaldo',    position:'LW',  overall:91, nationality:'🇧🇷', rarity:'legendary',   competition:'laliga',      era:'1990s', traits:['clutch_performer','rocket_shot'],  evolution:1, contracts:5, stamina:82, physical:78 },
  { id:'uc-10', name:'Kaká',              shortName:'Kaká',       position:'CAM', overall:90, nationality:'🇧🇷', rarity:'legendary',   competition:'serie_a',     era:'2000s', traits:['playmaker','pace_monster'],        evolution:0, contracts:6, stamina:87, physical:83 },

  // ── Elites ──────────────────────────────────────────────────────────────────
  { id:'uc-11', name:'Lúcio',             shortName:'Lúcio',      position:'CB',  overall:87, nationality:'🇧🇷', rarity:'elite',       competition:'bundesliga',  era:'2000s', traits:['sweeper','aerial_threat'],         evolution:0, contracts:7, stamina:83, physical:88 },
  { id:'uc-12', name:'Aldair',            shortName:'Aldair',     position:'CB',  overall:85, nationality:'🇧🇷', rarity:'elite',       competition:'serie_a',     era:'1990s', traits:['aerial_threat','brick_wall'],      evolution:1, contracts:7, stamina:78, physical:86 },
  { id:'uc-13', name:'Taffarel',          shortName:'Taffarel',   position:'GK',  overall:88, nationality:'🇧🇷', rarity:'elite',       competition:'brasileirao', era:'1990s', traits:['reflexes','penalty_stopper'],      evolution:0, contracts:7, stamina:80, physical:76 },
  { id:'uc-14', name:'Adriano',           shortName:'Adriano',    position:'ST',  overall:86, nationality:'🇧🇷', rarity:'elite',       competition:'serie_a',     era:'2000s', traits:['physical_beast','rocket_shot'],    evolution:0, contracts:4, stamina:77, physical:92 },
  { id:'uc-15', name:'Emerson',           shortName:'Emerson',    position:'CDM', overall:84, nationality:'🇧🇷', rarity:'elite',       competition:'laliga',      era:'2000s', traits:['aggressive_tackler'],              evolution:0, contracts:7, stamina:82, physical:83 },
  { id:'uc-16', name:'Falcão',            shortName:'Falcão',     position:'CM',  overall:89, nationality:'🇧🇷', rarity:'elite',       competition:'brasileirao', era:'1980s', traits:['playmaker','engine'],              evolution:2, contracts:6, stamina:86, physical:80 },

  // ── Rares ───────────────────────────────────────────────────────────────────
  { id:'uc-17', name:'Bebeto',            shortName:'Bebeto',     position:'ST',  overall:82, nationality:'🇧🇷', rarity:'rare',        competition:'laliga',      era:'1990s', traits:['clinical_finisher'],               evolution:0, contracts:7, stamina:78, physical:73 },
  { id:'uc-18', name:'Sócrates',          shortName:'Sócrates',   position:'CAM', overall:83, nationality:'🇧🇷', rarity:'rare',        competition:'brasileirao', era:'1980s', traits:['playmaker','vision'],              evolution:1, contracts:5, stamina:72, physical:70 },
  { id:'uc-19', name:'Dida',              shortName:'Dida',       position:'GK',  overall:83, nationality:'🇧🇷', rarity:'rare',        competition:'serie_a',     era:'2000s', traits:['reflexes'],                        evolution:0, contracts:7, stamina:82, physical:79 },
  { id:'uc-20', name:'Júnior',            shortName:'Júnior',     position:'LB',  overall:81, nationality:'🇧🇷', rarity:'rare',        competition:'brasileirao', era:'1980s', traits:['stamina_boost'],                   evolution:0, contracts:7, stamina:85, physical:74 },
];

// ─── Squad titular (4-3-3) ────────────────────────────────────────────────────

export const SQUAD_IDS = {
  GK:  'uc-13', // Taffarel
  RB:  'uc-08', // Cafu
  CB1: 'uc-12', // Aldair
  CB2: 'uc-11', // Lúcio
  LB:  'uc-07', // Roberto Carlos
  CM1: 'uc-05', // Zico
  CM2: 'uc-02', // Ronaldinho
  CM3: 'uc-16', // Falcão
  RW:  'uc-09', // Rivaldo
  ST:  'uc-01', // Ronaldo
  LW:  'uc-06', // Romário
};

export const BENCH_IDS = ['uc-19','uc-20','uc-15','uc-10','uc-14','uc-18','uc-17'];

// ─── Formação (posições no campo %) ──────────────────────────────────────────

export type PitchSlot = {
  slotId:   string;
  position: string;
  cardId:   string;
  top:      number;  // % from top
  left:     number;  // % from left
};

export const PITCH_433: PitchSlot[] = [
  { slotId:'GK',  position:'GK',  cardId: SQUAD_IDS.GK,  top:84, left:50 },
  { slotId:'RB',  position:'RB',  cardId: SQUAD_IDS.RB,  top:65, left:82 },
  { slotId:'CB1', position:'CB',  cardId: SQUAD_IDS.CB1, top:66, left:62 },
  { slotId:'CB2', position:'CB',  cardId: SQUAD_IDS.CB2, top:66, left:38 },
  { slotId:'LB',  position:'LB',  cardId: SQUAD_IDS.LB,  top:65, left:18 },
  { slotId:'CM1', position:'CM',  cardId: SQUAD_IDS.CM1, top:46, left:72 },
  { slotId:'CM2', position:'CM',  cardId: SQUAD_IDS.CM2, top:44, left:50 },
  { slotId:'CM3', position:'CM',  cardId: SQUAD_IDS.CM3, top:46, left:28 },
  { slotId:'RW',  position:'RW',  cardId: SQUAD_IDS.RW,  top:22, left:80 },
  { slotId:'ST',  position:'ST',  cardId: SQUAD_IDS.ST,  top:17, left:50 },
  { slotId:'LW',  position:'LW',  cardId: SQUAD_IDS.LW,  top:22, left:20 },
];

// ─── Helpers para obter carta por ID ─────────────────────────────────────────

export const CARD_MAP = new Map(ALL_CARDS.map(c => [c.id, c]));
export const getCard = (id: string) => CARD_MAP.get(id)!;

export const STARTER_CARDS  = Object.values(SQUAD_IDS).map(id => getCard(id));
export const BENCH_CARDS    = BENCH_IDS.map(id => getCard(id));

// ─── Cálculos de domínio ────────────────────────────────────────────────────

// Squad Rating (usando @world-legends/squad-rating)
const RATED_PLAYERS: RatedPlayer[] = STARTER_CARDS.map(c => ({
  userCardId: c.id,
  position:   c.position as any,
  overall:    c.overall,
  traits:     c.traits,
}));

export const SQUAD_RATING = calculateSquadRating({
  starters:  RATED_PLAYERS,
  chemistry: 88,
});

// Chemistry (usando @world-legends/chemistry)
const CHEM_PLAYERS: PlayerChemistryInput[] = STARTER_CARDS.map(c => ({
  userCardId:  c.id,
  nationality: c.nationality,
  competition: c.competition,
  era:         c.era as any,
}));

export const SQUAD_CHEMISTRY = calculateChemistry({ players: CHEM_PLAYERS });

// Bench Moral (usando @world-legends/bench)
const BENCH_PLAYERS_DATA: BenchPlayer[] = BENCH_CARDS.map(c => ({
  userCardId:       c.id,
  position:         c.position as any,
  overall:          c.overall,
  traits:           c.traits,
  isInjured:        false,
  suspendedMatches: 0,
}));

export const BENCH_MORAL = calculateBenchMoral(BENCH_PLAYERS_DATA);

// ─── Perfil do usuário ────────────────────────────────────────────────────────

export const USER_PROFILE = {
  userId:       'user-demo',
  username:     'Felipe Ameno',
  level:        12,
  currentXp:    840,
  xpForNext:    1300,
  totalXpEarned:18_340,
  credits:      4_250,
  fragments:    1_780,
  totalCards:   ALL_CARDS.length,
  wins:         34,
  draws:        8,
  losses:       12,
  winRate:      Math.round((34 / 54) * 100),
};

// ─── Histórico de partidas ────────────────────────────────────────────────────

export type MatchRecord = {
  opponent:    string;
  homeScore:   number;
  awayScore:   number;
  isHome:      boolean;
  outcome:     'win' | 'draw' | 'loss';
  credits:     number;
  xp:          number;
  date:        string;
};

export const RECENT_MATCHES: MatchRecord[] = [
  { opponent:'Argentinos All Stars', homeScore:3, awayScore:1, isHome:true,  outcome:'win',  credits:320, xp:220, date:'Hoje' },
  { opponent:'Seleção Europeia',     homeScore:2, awayScore:2, isHome:false, outcome:'draw', credits:120, xp:90,  date:'Ontem' },
  { opponent:'Liga Inglesa XI',      homeScore:4, awayScore:0, isHome:true,  outcome:'win',  credits:275, xp:185, date:'2 dias atrás' },
  { opponent:'Estrelas do Sul',      homeScore:1, awayScore:2, isHome:false, outcome:'loss', credits:50,  xp:40,  date:'3 dias atrás' },
  { opponent:'Campeões Africanos',   homeScore:3, awayScore:0, isHome:true,  outcome:'win',  credits:300, xp:200, date:'4 dias atrás' },
];

// ─── Packs disponíveis na loja ────────────────────────────────────────────────

export type PackDefinition = {
  id:          string;
  name:        string;
  description: string;
  price:       number;
  slots:       number;
  guarantee:   string;
  color:       string;
  rarity:      Rarity;
};

export const PACKS: PackDefinition[] = [
  {
    id: 'classic', name: 'Classic Pack',
    description: 'Cartas clássicas de várias eras. Boa chance de Rares.',
    price: 150, slots: 5, guarantee: 'Mín. 1 Rare',
    color: 'from-slate-700 to-slate-900',
    rarity: 'rare',
  },
  {
    id: 'elite', name: 'Elite Pack',
    description: 'Cartas de alto calibre. Garantia de Elite ou superior.',
    price: 400, slots: 5, guarantee: 'Mín. 1 Elite',
    color: 'from-blue-900 to-slate-900',
    rarity: 'elite',
  },
  {
    id: 'legend', name: 'Legend Pack',
    description: 'As lendas do futebol mundial. Chance de Ultra e WCH.',
    price: 1_000, slots: 5, guarantee: 'Mín. 1 Legendary',
    color: 'from-amber-900 to-slate-900',
    rarity: 'legendary',
  },
];

// ─── Oponentes para simulação de partida ─────────────────────────────────────

export type Opponent = {
  id:          string;
  name:        string;
  formation:   string;
  overallAvg:  number;
  difficulty:  'easy' | 'medium' | 'hard';
  color:       string;
};

export const OPPONENTS: Opponent[] = [
  { id:'opp-1', name:'Estrelas Clássicas',    formation:'4-4-2', overallAvg:78, difficulty:'easy',   color:'text-emerald-400' },
  { id:'opp-2', name:'Seleção Europeia',       formation:'4-3-3', overallAvg:84, difficulty:'medium', color:'text-blue-400' },
  { id:'opp-3', name:'Argentinos All Stars',   formation:'4-2-3-1',overallAvg:88, difficulty:'medium', color:'text-sky-400' },
  { id:'opp-4', name:'Liga Inglesa XI',        formation:'5-3-2', overallAvg:86, difficulty:'medium', color:'text-red-400' },
  { id:'opp-5', name:'Lendas da Copa do Mundo',formation:'4-3-3', overallAvg:92, difficulty:'hard',   color:'text-amber-400' },
  { id:'opp-6', name:'Time das Galáxias',      formation:'3-4-3', overallAvg:95, difficulty:'hard',   color:'text-violet-400' },
];

// ─── Utilitários visuais ──────────────────────────────────────────────────────

export const RARITY_LABEL: Record<Rarity, string> = {
  common:        'Comum',
  rare:          'Rara',
  elite:         'Elite',
  legendary:     'Lendária',
  ultra:         'Ultra',
  world_cup_hero:'WCH',
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common:        'text-gray-400 border-gray-600',
  rare:          'text-purple-400 border-purple-700',
  elite:         'text-blue-400 border-blue-700',
  legendary:     'text-amber-400 border-amber-700',
  ultra:         'text-pink-400 border-pink-700',
  world_cup_hero:'text-slate-100 border-slate-400',
};

export const RARITY_BG: Record<Rarity, string> = {
  common:        'bg-card-common',
  rare:          'bg-card-rare',
  elite:         'bg-card-elite',
  legendary:     'bg-card-legendary',
  ultra:         'bg-card-ultra',
  world_cup_hero:'bg-gradient-to-br from-slate-800 to-slate-950',
};

export function getCardDisplayName(card: MockCard): string {
  const tag = getEvolutionTag(card.evolution);
  return tag ? `${card.shortName} ${tag}` : card.shortName;
}

export function getContractStatus(remaining: number) {
  return contractStatus(remaining);
}

export function getPositionColor(position: string): string {
  const map: Record<string, string> = {
    GK: 'bg-amber-600',
    CB: 'bg-blue-700', LB: 'bg-blue-700', RB: 'bg-blue-700',
    LWB: 'bg-blue-700', RWB: 'bg-blue-700',
    CDM: 'bg-green-700', CM: 'bg-green-700',
    CAM: 'bg-green-700', LM: 'bg-green-700', RM: 'bg-green-700',
    LW: 'bg-red-700', RW: 'bg-red-700', CF: 'bg-red-700', ST: 'bg-red-700',
  };
  return map[position] ?? 'bg-gray-700';
}
