/**
 * lib/mission-system.ts — T059
 *
 * Sistema de missões completo:
 *   - Daily (reset 24h)
 *   - Weekly (reset segunda-feira)
 *   - Lifetime (multi-stage progressivo)
 *
 * LiveOps-ready:
 *   - Definições separadas do progresso → vêm do servidor futuramente
 *   - fetchMissionDefs() com fallback local
 *   - Tags para filtragem e A/B testing
 *   - versão para cache busting
 *
 * Progress ↔ GameContext:
 *   - Usa wins, losses, totalCards, credits da store global
 *   - Atualiza quando o jogador reivindica recompensas
 */

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type MissionType = 'daily' | 'weekly' | 'lifetime';

export type RewardKind = 'xp' | 'credits' | 'pack' | 'fragments';

export type MissionReward = Readonly<{
  kind:    RewardKind;
  amount:  number;
  packId?: string;       // para kind=pack
  label:   string;       // "+200c", "+1 Classic Pack"
  icon:    string;
}>;

export type MissionStage = Readonly<{
  stage:   number;       // 1-based
  target:  number;       // cumulativo
  rewards: MissionReward[];
  label:   string;       // "Bronze", "Prata", "Ouro"
}>;

export type MissionDef = Readonly<{
  id:       string;
  type:     MissionType;
  icon:     string;
  title:    string;
  desc:     string;
  stages:   readonly MissionStage[];   // 1 estágio = missão simples
  tags:     string[];   // 'beginner','advanced','pack','match','collection'
  priority: number;
  trackKey: TrackKey;   // qual métrica do perfil rastrear
  version:  number;     // para cache busting em LiveOps
}>;

export type TrackKey =
  | 'matchesPlayed'
  | 'wins'
  | 'losses'
  | 'draws'
  | 'packsOpened'
  | 'cardsOwned'
  | 'creditsEarned'
  | 'dailiesCompleted'
  | 'missionsCompleted'
  | 'winStreak';

// ─── Progress ─────────────────────────────────────────────────────────────────

export type MissionProgress = {
  missionId:    string;
  current:      number;         // progresso atual (cumulativo lifetime / período daily/weekly)
  stageClaimed: number;         // último estágio reivindicado (0 = nenhum)
  lastRefresh:  string;         // ISO date string
};

// ─── Definições de missões ────────────────────────────────────────────────────

const xp    = (amount: number): MissionReward => ({ kind:'xp',       amount, label:`+${amount} XP`,       icon:'⭐' });
const cred  = (amount: number): MissionReward => ({ kind:'credits',  amount, label:`+${amount}c`,          icon:'💰' });
const pack  = (id:string, name:string): MissionReward =>
              ({ kind:'pack', amount:1, packId:id, label:`+1 ${name}`,  icon:'📦' });
const frag  = (amount: number): MissionReward => ({ kind:'fragments',amount, label:`+${amount} gemas`,    icon:'💎' });

function simpleStage(target: number, ...rewards: MissionReward[]): readonly MissionStage[] {
  return [{ stage:1, target, rewards, label:'' }];
}

function multiStage(
  targets:  number[],
  labels:   string[],
  rewards:  MissionReward[][],
): readonly MissionStage[] {
  return targets.map((target, i) => ({
    stage:   i + 1,
    target,
    rewards: rewards[i]!,
    label:   labels[i]!,
  }));
}

// ─── DAILY missions ───────────────────────────────────────────────────────────

const DAILY_DEFS: readonly MissionDef[] = [
  {
    id:'daily_play1',  type:'daily',  icon:'⚽', priority:10,
    title:'Jogador Dedicado', desc:'Dispute 1 partida hoje.',
    trackKey:'matchesPlayed', tags:['beginner','match'], version:1,
    stages: simpleStage(1, xp(50), cred(50)),
  },
  {
    id:'daily_win1',   type:'daily',  icon:'🏆', priority:20,
    title:'Vitória do Dia',   desc:'Vença 1 partida hoje.',
    trackKey:'wins', tags:['match'], version:1,
    stages: simpleStage(1, xp(100), cred(100)),
  },
  {
    id:'daily_pack1',  type:'daily',  icon:'📦', priority:30,
    title:'Abre Packs',       desc:'Abra 1 pack hoje.',
    trackKey:'packsOpened', tags:['pack'], version:1,
    stages: simpleStage(1, xp(75), cred(75)),
  },
  {
    id:'daily_match3', type:'daily',  icon:'🎮', priority:40,
    title:'Maratonista',      desc:'Dispute 3 partidas hoje.',
    trackKey:'matchesPlayed', tags:['match','advanced'], version:1,
    stages: simpleStage(3, xp(150), cred(120)),
  },
  {
    id:'daily_win2',   type:'daily',  icon:'⚡', priority:50,
    title:'Dobradinha',       desc:'Vença 2 partidas hoje.',
    trackKey:'wins', tags:['match','advanced'], version:1,
    stages: simpleStage(2, xp(200), cred(200), frag(20)),
  },
];

// ─── WEEKLY missions ──────────────────────────────────────────────────────────

const WEEKLY_DEFS: readonly MissionDef[] = [
  {
    id:'weekly_play5',   type:'weekly', icon:'⚽', priority:10,
    title:'Semana Ativa', desc:'Dispute 5 partidas nesta semana.',
    trackKey:'matchesPlayed', tags:['match'], version:1,
    stages: simpleStage(5, xp(300), cred(250)),
  },
  {
    id:'weekly_win3',    type:'weekly', icon:'🏆', priority:20,
    title:'Três em Um',  desc:'Vença 3 partidas nesta semana.',
    trackKey:'wins', tags:['match'], version:1,
    stages: simpleStage(3, xp(400), cred(350)),
  },
  {
    id:'weekly_pack3',   type:'weekly', icon:'📦', priority:30,
    title:'Colecionador Semanal', desc:'Abra 3 packs nesta semana.',
    trackKey:'packsOpened', tags:['pack'], version:1,
    stages: simpleStage(3, xp(350), cred(300), frag(50)),
  },
  {
    id:'weekly_win5',    type:'weekly', icon:'👑', priority:40,
    title:'Dominador',   desc:'Vença 5 partidas nesta semana.',
    trackKey:'wins', tags:['match','advanced'], version:1,
    stages: simpleStage(5, xp(600), cred(500), pack('classic','Classic Pack')),
  },
  {
    id:'weekly_daily5',  type:'weekly', icon:'🗓️', priority:50,
    title:'Consistente', desc:'Complete 5 missões diárias nesta semana.',
    trackKey:'dailiesCompleted', tags:['meta'], version:1,
    stages: simpleStage(5, xp(500), cred(400), frag(100)),
  },
];

// ─── LIFETIME missions (progressivas) ────────────────────────────────────────

const LIFETIME_DEFS: readonly MissionDef[] = [
  {
    id:'life_matches',  type:'lifetime', icon:'⚽', priority:10,
    title:'Guerreiro Eterno',  desc:'Partidas disputadas no total.',
    trackKey:'matchesPlayed', tags:['match'], version:1,
    stages: multiStage(
      [5, 20, 50, 100, 200],
      ['Bronze','Prata','Ouro','Platina','Diamante'],
      [
        [xp(200), cred(150)],
        [xp(500), cred(400)],
        [xp(1000), cred(800), pack('classic','Classic Pack')],
        [xp(2000), cred(1500), pack('elite','Elite Pack')],
        [xp(5000), cred(3000), pack('legend','Legend Pack')],
      ],
    ),
  },
  {
    id:'life_wins',     type:'lifetime', icon:'🏆', priority:20,
    title:'Lenda das Vitórias', desc:'Vitórias acumuladas no total.',
    trackKey:'wins', tags:['match'], version:1,
    stages: multiStage(
      [1, 10, 25, 50, 100],
      ['Bronze','Prata','Ouro','Platina','Diamante'],
      [
        [xp(100), cred(100)],
        [xp(400), cred(300)],
        [xp(800), cred(600), frag(100)],
        [xp(1500), cred(1200), pack('classic','Classic Pack')],
        [xp(3000), cred(2500), pack('legend','Legend Pack')],
      ],
    ),
  },
  {
    id:'life_cards',    type:'lifetime', icon:'🃏', priority:30,
    title:'Grande Colecionador', desc:'Cartas coletadas no total.',
    trackKey:'cardsOwned', tags:['collection'], version:1,
    stages: multiStage(
      [5, 15, 30, 60, 100],
      ['Iniciante','Colecionador','Curador','Mestre','Lenda'],
      [
        [xp(150), cred(100)],
        [xp(400), cred(300)],
        [xp(800), cred(600), frag(150)],
        [xp(1500), cred(1200), pack('elite','Elite Pack')],
        [xp(4000), cred(3000), pack('legend','Legend Pack'), frag(500)],
      ],
    ),
  },
  {
    id:'life_packs',    type:'lifetime', icon:'📦', priority:40,
    title:'Abridor de Packs',   desc:'Packs abertos no total.',
    trackKey:'packsOpened', tags:['pack'], version:1,
    stages: multiStage(
      [1, 5, 15, 30, 50],
      ['Estreante','Empolgado','Viciado','Maníaco','Lendário'],
      [
        [xp(100), cred(80)],
        [xp(300), cred(250), frag(50)],
        [xp(700), cred(600), pack('classic','Classic Pack')],
        [xp(1500), cred(1200), pack('elite','Elite Pack')],
        [xp(3000), cred(2500), pack('legend','Legend Pack'), frag(300)],
      ],
    ),
  },
  {
    id:'life_missions', type:'lifetime', icon:'🎯', priority:50,
    title:'Missão Cumprida',    desc:'Missões completadas no total.',
    trackKey:'missionsCompleted', tags:['meta'], version:1,
    stages: multiStage(
      [5, 20, 50, 100, 250],
      ['Novato','Dedicado','Veterano','Expert','Mestre'],
      [
        [xp(200), cred(150)],
        [xp(600), cred(500)],
        [xp(1200), cred(1000), pack('classic','Classic Pack')],
        [xp(2500), cred(2000), pack('elite','Elite Pack')],
        [xp(6000), cred(5000), pack('legend','Legend Pack'), frag(500)],
      ],
    ),
  },
];

export const ALL_MISSION_DEFS: readonly MissionDef[] = [
  ...DAILY_DEFS,
  ...WEEKLY_DEFS,
  ...LIFETIME_DEFS,
];

// ─── LiveOps: fetchMissionDefs ────────────────────────────────────────────────

/**
 * Pronto para LiveOps:
 *   - Substituir por fetch('https://api.worldlegends.com/missions/v1')
 *   - Server pode injetar missões de evento, A/B tests, etc.
 */
export async function fetchMissionDefs(): Promise<readonly MissionDef[]> {
  // Futuramente: const res = await fetch('/api/missions'); return res.json();
  return ALL_MISSION_DEFS;
}

// ─── Progress I/O ─────────────────────────────────────────────────────────────

const LS_KEY = 'wl-missions-v2';

export function loadAllProgress(): Record<string, MissionProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveAllProgress(prog: Record<string, MissionProgress>): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prog)); } catch {}
}

// ─── Refresh de missões (daily/weekly reset) ──────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function getMondayOf(d: Date): Date {
  const copy = new Date(d);
  const day  = copy.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0,0,0,0);
  return copy;
}

export function refreshProgress(
  prog: Record<string, MissionProgress>,
  defs: readonly MissionDef[],
  now: Date = new Date(),
): Record<string, MissionProgress> {
  const updated = { ...prog };

  for (const def of defs) {
    const p = updated[def.id];
    if (!p) continue;
    const lastRefresh = new Date(p.lastRefresh);

    if (def.type === 'daily' && !isSameDay(lastRefresh, now)) {
      // Reset diário
      updated[def.id] = { ...p, current:0, stageClaimed:0, lastRefresh:now.toISOString() };
    } else if (def.type === 'weekly') {
      const lastMonday = getMondayOf(lastRefresh);
      const thisMonday = getMondayOf(now);
      if (lastMonday < thisMonday) {
        // Reset semanal
        updated[def.id] = { ...p, current:0, stageClaimed:0, lastRefresh:now.toISOString() };
      }
    }
  }

  return updated;
}

// ─── Computed: missão completa para UI ───────────────────────────────────────

export type MissionView = {
  def:          MissionDef;
  progress:     MissionProgress;
  currentStage: MissionStage;
  nextStage:    MissionStage | null;
  pct:          number;           // 0-100 percentual para barra
  claimable:    boolean;          // pode reivindicar agora
  allDone:      boolean;          // todos os estágios completos
};

export function buildMissionViews(
  defs:       readonly MissionDef[],
  prog:       Record<string, MissionProgress>,
  metrics:    PlayerMetrics,
  now:        Date = new Date(),
): MissionView[] {
  return defs.map(def => {
    const p = prog[def.id] ?? {
      missionId:    def.id,
      current:      0,
      stageClaimed: 0,
      lastRefresh:  now.toISOString(),
    };

    // Para diárias/semanais, o progresso vem do período atual (armazenado)
    // Para lifetime, vem da métrica do jogador (sempre atual)
    const rawValue = def.type === 'lifetime'
      ? metrics[def.trackKey] ?? 0
      : p.current;

    const nextUnclaimedStage = def.stages.find(s => s.stage > p.stageClaimed) ?? def.stages[def.stages.length-1]!;
    const prevStageTarget    = def.stages.find(s => s.stage === p.stageClaimed)?.target ?? 0;
    const currentTarget      = nextUnclaimedStage.target;

    const stageProgress = Math.max(0, rawValue - prevStageTarget);
    const stageRange    = currentTarget - prevStageTarget;
    const pct           = Math.min(100, Math.round((stageProgress / stageRange) * 100));
    const claimable     = rawValue >= currentTarget && p.stageClaimed < nextUnclaimedStage.stage;
    const allDone       = p.stageClaimed >= def.stages[def.stages.length-1]!.stage;

    return {
      def,
      progress: { ...p, current: rawValue },
      currentStage: nextUnclaimedStage,
      nextStage:    def.stages.find(s => s.stage === nextUnclaimedStage.stage + 1) ?? null,
      pct,
      claimable,
      allDone,
    };
  });
}

// ─── PlayerMetrics (vem do GameContext + localStorage) ───────────────────────

export type PlayerMetrics = {
  matchesPlayed:    number;
  wins:             number;
  losses:           number;
  draws:            number;
  packsOpened:      number;
  cardsOwned:       number;
  creditsEarned:    number;
  dailiesCompleted: number;
  missionsCompleted:number;
  winStreak:        number;
};

// ─── Claim reward ─────────────────────────────────────────────────────────────

export function claimMission(
  missionId:   string,
  stageNumber: number,
  prog:        Record<string, MissionProgress>,
  now:         Date = new Date(),
): Record<string, MissionProgress> {
  const p = prog[missionId] ?? { missionId, current:0, stageClaimed:0, lastRefresh:now.toISOString() };
  return {
    ...prog,
    [missionId]: { ...p, stageClaimed: stageNumber, lastRefresh: now.toISOString() },
  };
}
