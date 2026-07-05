/**
 * lib/leaderboard/mock-data.ts — T064
 *
 * Dados simulados para todas as categorias do leaderboard.
 *
 * Para conectar ao backend:
 *   Substituir getLeaderboard(category) por:
 *   const res = await fetch(`/api/ranking/${category}`)
 *   return res.json() as LeaderboardResponse
 */

import { USER_PROFILE } from '@/lib/mock-data';
import type {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardResponse,
  SeasonInfo,
} from './types';

// ─── Pool de jogadores fictícios ──────────────────────────────────────────────

const NAMES = [
  'CarlosFC',
  'PelézinhoBR',
  'MaestroAR',
  'EuroKing',
  'AfricaStriker',
  'BallonBR',
  'LendaFR',
  'TikiFR',
  'CatenaccioIT',
  'JogaBonitoSP',
  'FintaAR',
  'TricolorRJ',
  'GauchodeSC',
  'SeleçãoFC',
  'TorcedorGO',
  'Ronaldito',
  'KaiserDE',
  'TotaFR',
  'DribleMX',
  'PoderNG',
  'VeloceIT',
  'ZidaneKid',
  'HammerEN',
  'CruyffNL',
  'EurekaPT',
  'KingsNG',
  'SambaKing',
  'CondorCO',
  'MbaFrance',
  'SuperLew',
  'IbrahimSE',
  'MatadorUY',
  'DribblerCO',
  'TangoAR',
  'SonkickKR',
  'IkuruJP',
  'DiegoHero',
  'MokataNG',
  'TriangleNL',
  'SpeedDK',
  'GoldenDE',
  'WembleyEN',
  'BarçaBR',
  'ClassicoSP',
  'MidnightPT',
  'UruguayFC',
  'AtacanteCL',
  'PergolaMX',
  'SelecionadoGH',
  'FlipperSN',
];

const FLAGS = [
  '🇧🇷',
  '🇦🇷',
  '🇫🇷',
  '🇩🇪',
  '🇮🇹',
  '🇪🇸',
  '🇵🇹',
  '🇳🇱',
  '🇨🇲',
  '🇸🇳',
  '🇳🇬',
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  '🇺🇾',
  '🇲🇽',
  '🇨🇴',
  '🇨🇱',
  '🇬🇭',
  '🇯🇵',
  '🇰🇷',
  '🇸🇪',
];
const NATL = [
  'BR',
  'AR',
  'FR',
  'DE',
  'IT',
  'ES',
  'PT',
  'NL',
  'CM',
  'SN',
  'NG',
  'EN',
  'UY',
  'MX',
  'CO',
  'CL',
  'GH',
  'JP',
  'KR',
  'SE',
];

const RARITY_CODES = ['legendary', 'ultra', 'elite', 'legendary', 'rare', 'world_cup_hero'];

// ─── Gerador determinístico ────────────────────────────────────────────────────

function makeEntry(idx: number, overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  const isCurrentUser = idx === 8; // o usuário logado sempre aparece em posição ~9
  const wins = Math.max(1, (800 - idx * 14 - idx * idx * 0.3) | 0);
  const losses = Math.max(0, 150 - idx * 2);
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const squadOvr = Math.min(99, Math.max(74, (97 - idx * 0.4) | 0));
  const totalCards = Math.max(1, (80 - idx) | 0);
  const level = Math.max(1, (60 - idx * 0.9) | 0);
  const flagIdx = idx % FLAGS.length;
  const nameIdx = idx % NAMES.length;
  const rarityIdx = idx % RARITY_CODES.length;
  const seasonPoints = Math.max(0, 3000 - idx * 55);

  return {
    rank: idx + 1,
    userId: `player-${idx + 1}`,
    username: isCurrentUser ? USER_PROFILE.username : NAMES[nameIdx]!,
    avatarInitial: (isCurrentUser ? USER_PROFILE.username : NAMES[nameIdx]!)
      .charAt(0)
      .toUpperCase(),
    nationality: isCurrentUser ? 'BR' : NATL[flagIdx]!,
    flagEmoji: isCurrentUser ? '🇧🇷' : FLAGS[flagIdx]!,
    level: isCurrentUser ? USER_PROFILE.level : level,
    wins: isCurrentUser ? USER_PROFILE.wins : wins,
    losses: isCurrentUser ? USER_PROFILE.losses : losses,
    winRate: isCurrentUser
      ? Math.round((USER_PROFILE.wins / Math.max(1, USER_PROFILE.wins + USER_PROFILE.losses)) * 100)
      : winRate,
    squadOvr: isCurrentUser ? 89 : squadOvr,
    totalCards: isCurrentUser ? USER_PROFILE.totalCards : totalCards,
    seasonPoints: isCurrentUser ? 820 : seasonPoints,
    topCard: {
      name: NAMES[(idx * 3) % NAMES.length]!,
      ovr: squadOvr,
      rarityCode: RARITY_CODES[rarityIdx]!,
    },
    isCurrentUser,
    isFriend: [2, 5, 11, 18, 23].includes(idx),
    isOnline: idx < 5 || idx === 8,
    ...overrides,
  };
}

// ─── Função de acesso ──────────────────────────────────────────────────────────

const SEASON: SeasonInfo = {
  number: 4,
  name: 'Copa das Lendas IV',
  startsAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
  endsAt: new Date(Date.now() + 16 * 86_400_000).toISOString(),
  reward1st: '5.000c + Legend Pack',
  reward2nd: '2.500c + Elite Pack',
  reward3rd: '1.200c + Classic Pack',
};

export function getLeaderboard(
  category: LeaderboardCategory,
  countryCode = 'BR',
): LeaderboardResponse {
  // Gerar 50 entradas base
  const allEntries = Array.from({ length: 50 }, (_, i) => makeEntry(i));

  let entries: LeaderboardEntry[];
  const currentUserEntry = allEntries.find((e) => e.isCurrentUser) ?? allEntries[8]!;

  switch (category) {
    case 'global_wins':
      entries = [...allEntries]
        .sort((a, b) => b.wins - a.wins)
        .map((e, i) => ({ ...e, rank: i + 1 }));
      break;

    case 'global_ovr':
      entries = [...allEntries]
        .sort((a, b) => b.squadOvr - a.squadOvr)
        .map((e, i) => ({ ...e, rank: i + 1 }));
      break;

    case 'global_collection':
      entries = [...allEntries]
        .sort((a, b) => b.totalCards - a.totalCards)
        .map((e, i) => ({ ...e, rank: i + 1 }));
      break;

    case 'country_wins': {
      const countryEntries = allEntries
        .filter((e) => e.nationality === countryCode || e.isCurrentUser)
        .slice(0, 20)
        .sort((a, b) => b.wins - a.wins)
        .map((e, i) => ({ ...e, rank: i + 1 }));
      entries = countryEntries;
      break;
    }

    case 'friends_wins': {
      const friends = allEntries
        .filter((e) => e.isFriend || e.isCurrentUser)
        .sort((a, b) => b.wins - a.wins)
        .map((e, i) => ({ ...e, rank: i + 1 }));
      entries = friends;
      break;
    }

    case 'season':
      entries = [...allEntries]
        .sort((a, b) => b.seasonPoints - a.seasonPoints)
        .map((e, i) => ({ ...e, rank: i + 1 }));
      break;

    default:
      entries = allEntries;
  }

  return {
    category,
    entries,
    currentUser: entries.find((e) => e.isCurrentUser) ?? currentUserEntry,
    totalPlayers: 48_392 + (category === 'friends_wins' ? 0 : 0),
    updatedAt: new Date().toISOString(),
    season: SEASON,
  };
}

// Todos os países disponíveis nos dados
export const AVAILABLE_COUNTRIES = NATL.map((code, i) => ({
  code,
  flag: FLAGS[i]!,
  label:
    {
      BR: 'Brasil',
      AR: 'Argentina',
      FR: 'França',
      DE: 'Alemanha',
      IT: 'Itália',
      ES: 'Espanha',
      PT: 'Portugal',
      NL: 'Holanda',
      CM: 'Camarões',
      SN: 'Senegal',
      NG: 'Nigéria',
      EN: 'Inglaterra',
      UY: 'Uruguai',
      MX: 'México',
      CO: 'Colômbia',
      CL: 'Chile',
      GH: 'Gana',
      JP: 'Japão',
      KR: 'Coreia',
      SE: 'Suécia',
    }[code] ?? code,
}));
