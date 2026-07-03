/**
 * Mock API client (doc 16).
 *
 * Simula todos os contratos do doc 16 com dados realistas.
 * Substituído pelo client tRPC real quando o backend estiver conectado.
 * Delay artificial para simular latência de rede.
 */
import type { RarityCode } from '@world-legends/types';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// ─── Tipos alinhados ao doc 16 ────────────────────────────────────────────────

export type ApiProfile = {
  id: string; username: string; displayName: string | null;
  avatarUrl: string | null; countryCode: string;
  softCurrency: number; hardCurrency: number; fragmentBalance: number;
  eloRating: number;
};

export type ApiCard = {
  id: string; cardId: string; profileId: string;
  knownAs: string; position: string; nationality: string;
  overall: number; rarityCode: RarityCode; editionCode: string;
  artworkUrl: string | null; form: number;
  isInjured: boolean; suspendedMatches: number;
  acquiredVia: string; acquiredAt: string;
  attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number };
  traits: string[];
};

export type ApiPack = {
  id: string; code: string; name: string;
  priceSoft: number | null; priceHard: number | null;
  cardsPerPack: number; description: string;
  guarantees: string[];
  isPurchasable: boolean;
};

export type ApiRankingRow = {
  rank: number; profileId: string; username: string; displayName: string | null;
  eloRating: number; division: string; wins: number; draws: number; losses: number;
  matchesPlayed: number;
};

export type ApiMatch = {
  id: string; homeProfileId: string; awayProfileId: string;
  homeUsername: string; awayUsername: string;
  homeScore: number; awayScore: number;
  status: string; simulatedAt: string; engineVersion: string;
};

export type ApiMatchEvent = {
  id: number; minute: number; eventType: string; teamSide: string;
  description: string; playerName?: string;
};

export type ApiAchievement = {
  id: string; name: string; description: string;
  category: string; currentValue: number; targetValue: number;
  unlockedAt: string | null; rewards: Array<{ kind: string; amount?: number }>;
};

export type ApiEvent = {
  id: string; kind: string; name: string; description: string;
  startsAt: string; endsAt: string; status: 'upcoming' | 'active' | 'ended';
  theme?: string; missions?: Array<{ id: string; name: string; target: number; current: number; rewards: string[] }>;
};

export type ApiAlbumSet = {
  id: string; code: string; name: string; nation: string;
  totalCards: number; ownedCards: number; completedAt: string | null;
};

// ─── Dados mock realistas ─────────────────────────────────────────────────────

const MOCK_PROFILE: ApiProfile = {
  id: 'usr-001', username: 'lenda_br', displayName: 'Lenda do BR',
  avatarUrl: null, countryCode: 'BR',
  softCurrency: 3_500, hardCurrency: 0, fragmentBalance: 1_250, eloRating: 1_420,
};

const MOCK_CARDS: ApiCard[] = [
  { id: 'uc-001', cardId: 'c-pele-goat', profileId: 'usr-001', knownAs: 'Pelé', position: 'ST', nationality: 'BR', overall: 99, rarityCode: 'ultra', editionCode: 'base', artworkUrl: null, form: 2, isInjured: false, suspendedMatches: 0, acquiredVia: 'pack', acquiredAt: '2025-01-01', attributes: { pace: 95, shooting: 99, passing: 88, dribbling: 98, defending: 40, physical: 78 }, traits: ['Artilheiro Nato', 'Driblador'] },
  { id: 'uc-002', cardId: 'c-zico-wch', profileId: 'usr-001', knownAs: 'Zico', position: 'CAM', nationality: 'BR', overall: 96, rarityCode: 'world_cup_hero', editionCode: 'base', artworkUrl: null, form: 1, isInjured: false, suspendedMatches: 0, acquiredVia: 'pack', acquiredAt: '2025-01-05', attributes: { pace: 82, shooting: 94, passing: 96, dribbling: 95, defending: 55, physical: 76 }, traits: ['Maestro', 'Cobrador de Falta'] },
  { id: 'uc-003', cardId: 'c-maradona-leg', profileId: 'usr-001', knownAs: 'Maradona', position: 'CAM', nationality: 'AR', overall: 97, rarityCode: 'legendary', editionCode: 'base', artworkUrl: null, form: 0, isInjured: false, suspendedMatches: 0, acquiredVia: 'craft', acquiredAt: '2025-01-08', attributes: { pace: 87, shooting: 91, passing: 91, dribbling: 99, defending: 46, physical: 72 }, traits: ['Driblador', 'Carrasco de Copa'] },
  { id: 'uc-004', cardId: 'c-beckenbauer-leg', profileId: 'usr-001', knownAs: 'Beckenbauer', position: 'CB', nationality: 'DE', overall: 94, rarityCode: 'legendary', editionCode: 'base', artworkUrl: null, form: -1, isInjured: false, suspendedMatches: 0, acquiredVia: 'pack', acquiredAt: '2025-01-10', attributes: { pace: 78, shooting: 62, passing: 86, dribbling: 80, defending: 97, physical: 82 }, traits: ['Líder Defensivo', 'Capitão'] },
  { id: 'uc-005', cardId: 'c-cruyff-leg', profileId: 'usr-001', knownAs: 'Cruyff', position: 'ST', nationality: 'NL', overall: 95, rarityCode: 'legendary', editionCode: 'base', artworkUrl: null, form: 1, isInjured: true, suspendedMatches: 0, acquiredVia: 'pack', acquiredAt: '2025-01-12', attributes: { pace: 91, shooting: 88, passing: 93, dribbling: 97, defending: 51, physical: 71 }, traits: ['Pressing Alto', 'Totaal Football'] },
  { id: 'uc-006', cardId: 'c-platini-eli', profileId: 'usr-001', knownAs: 'Platini', position: 'CAM', nationality: 'FR', overall: 91, rarityCode: 'elite', editionCode: 'base', artworkUrl: null, form: 0, isInjured: false, suspendedMatches: 1, acquiredVia: 'pack', acquiredAt: '2025-01-15', attributes: { pace: 80, shooting: 91, passing: 90, dribbling: 88, defending: 52, physical: 73 }, traits: ['Cobrador de Falta', 'Goleador'] },
  { id: 'uc-007', cardId: 'c-ronaldo-r9-leg', profileId: 'usr-001', knownAs: 'R9', position: 'ST', nationality: 'BR', overall: 96, rarityCode: 'legendary', editionCode: 'base', artworkUrl: null, form: 2, isInjured: false, suspendedMatches: 0, acquiredVia: 'reward', acquiredAt: '2025-01-18', attributes: { pace: 96, shooting: 96, passing: 82, dribbling: 97, defending: 34, physical: 80 }, traits: ['Artilheiro Nato', 'Velocista'] },
  { id: 'uc-008', cardId: 'c-eusebio-leg', profileId: 'usr-001', knownAs: 'Eusébio', position: 'ST', nationality: 'PT', overall: 93, rarityCode: 'legendary', editionCode: 'base', artworkUrl: null, form: 0, isInjured: false, suspendedMatches: 0, acquiredVia: 'pack', acquiredAt: '2025-01-20', attributes: { pace: 93, shooting: 94, passing: 78, dribbling: 88, defending: 38, physical: 83 }, traits: ['Artilheiro Nato', 'Potência'] },
  { id: 'uc-009', cardId: 'c-yashin-leg', profileId: 'usr-001', knownAs: 'Yashin', position: 'GK', nationality: 'RU', overall: 96, rarityCode: 'legendary', editionCode: 'base', artworkUrl: null, form: 1, isInjured: false, suspendedMatches: 0, acquiredVia: 'pack', acquiredAt: '2025-01-22', attributes: { pace: 50, shooting: 15, passing: 65, dribbling: 25, defending: 10, physical: 80 }, traits: ['Aranh-a Negra', 'Reflexos'] },
  { id: 'uc-010', cardId: 'c-carlos-rare', profileId: 'usr-001', knownAs: 'R. Carlos', position: 'LB', nationality: 'BR', overall: 88, rarityCode: 'rare', editionCode: 'base', artworkUrl: null, form: 0, isInjured: false, suspendedMatches: 0, acquiredVia: 'pack', acquiredAt: '2025-01-24', attributes: { pace: 92, shooting: 80, passing: 80, dribbling: 82, defending: 84, physical: 85 }, traits: ['Canhão', 'Lateral Ofensivo'] },
  { id: 'uc-011', cardId: 'c-overath-rare', profileId: 'usr-001', knownAs: 'Overath', position: 'CM', nationality: 'DE', overall: 85, rarityCode: 'rare', editionCode: 'base', artworkUrl: null, form: 0, isInjured: false, suspendedMatches: 0, acquiredVia: 'pack', acquiredAt: '2025-01-26', attributes: { pace: 76, shooting: 78, passing: 88, dribbling: 80, defending: 76, physical: 78 }, traits: ['Box to Box'] },
  { id: 'uc-012', cardId: 'c-tostao-common', profileId: 'usr-001', knownAs: 'Tostão', position: 'CF', nationality: 'BR', overall: 82, rarityCode: 'common', editionCode: 'base', artworkUrl: null, form: 0, isInjured: false, suspendedMatches: 0, acquiredVia: 'pack', acquiredAt: '2025-01-28', attributes: { pace: 82, shooting: 85, passing: 83, dribbling: 86, defending: 44, physical: 70 }, traits: [] },
];

const MOCK_PACKS: ApiPack[] = [
  { id: 'pk-classic', code: 'classic', name: 'Pack Clássico', priceSoft: 500, priceHard: null, cardsPerPack: 5, description: 'O ponto de entrada da coleção. Cartas de todas as raridades, com garantia de ao menos uma Rara.', guarantees: ['Ao menos 1 Rara'], isPurchasable: true },
  { id: 'pk-elite', code: 'elite', name: 'Pack Elite', priceSoft: 1_500, priceHard: null, cardsPerPack: 5, description: 'Maior chance de Lendárias. Garantia de ao menos uma Elite.', guarantees: ['Ao menos 1 Elite', 'Chance dobrada de Lendária'], isPurchasable: true },
  { id: 'pk-legend', code: 'legend', name: 'Pack Lenda', priceSoft: 4_000, priceHard: null, cardsPerPack: 5, description: 'O pack mais poderoso do catálogo base. Garantia de Lendária.', guarantees: ['Lendária garantida'], isPurchasable: true },
  { id: 'pk-copa70', code: 'copa_70_event', name: 'Pack Copa 70 ★', priceSoft: 2_500, priceHard: null, cardsPerPack: 5, description: 'Edição especial da Copa de 70. Cartas exclusivas desta campanha histórica.', guarantees: ['Carta de Copa 70 garantida', 'Chance de World Cup Hero'], isPurchasable: true },
];

const MOCK_RANKING: ApiRankingRow[] = [
  { rank: 1, profileId: 'usr-002', username: 'campeao_br', displayName: 'Campeão BR', eloRating: 2_100, division: 'World Legend', wins: 48, draws: 6, losses: 4, matchesPlayed: 58 },
  { rank: 2, profileId: 'usr-003', username: 'rei_do_futebol', displayName: 'Rei do Futebol', eloRating: 1_980, division: 'World Legend', wins: 44, draws: 8, losses: 6, matchesPlayed: 58 },
  { rank: 3, profileId: 'usr-001', username: 'lenda_br', displayName: 'Lenda do BR', eloRating: 1_420, division: 'Lenda', wins: 28, draws: 12, losses: 18, matchesPlayed: 58 },
  { rank: 4, profileId: 'usr-004', username: 'craque_de_copa', displayName: 'Craque de Copa', eloRating: 1_380, division: 'Lenda', wins: 26, draws: 10, losses: 22, matchesPlayed: 58 },
  { rank: 5, profileId: 'usr-005', username: 'tiki_taka_br', displayName: null, eloRating: 1_310, division: 'Elite', wins: 24, draws: 14, losses: 20, matchesPlayed: 58 },
  { rank: 6, profileId: 'usr-006', username: 'zagueirão', displayName: 'Zagueirão', eloRating: 1_280, division: 'Elite', wins: 22, draws: 16, losses: 20, matchesPlayed: 58 },
  { rank: 7, profileId: 'usr-007', username: 'meia_fantasma', displayName: null, eloRating: 1_220, division: 'Ouro', wins: 20, draws: 12, losses: 26, matchesPlayed: 58 },
  { rank: 8, profileId: 'usr-008', username: 'artilheiro99', displayName: 'Artilheiro 99', eloRating: 1_190, division: 'Ouro', wins: 18, draws: 14, losses: 26, matchesPlayed: 58 },
];

const MOCK_ACHIEVEMENTS: ApiAchievement[] = [
  { id: 'ach-hat-trick', name: 'Hat-Trick Lendário', description: 'Tenha um jogador marcando 3 gols em uma única partida.', category: 'performance', currentValue: 1, targetValue: 1, unlockedAt: '2025-01-15', rewards: [{ kind: 'fragments', amount: 200 }] },
  { id: 'ach-10-wins', name: 'Dez Vitórias', description: 'Vença 10 partidas ranqueadas.', category: 'performance', currentValue: 10, targetValue: 10, unlockedAt: '2025-01-20', rewards: [{ kind: 'credits', amount: 500 }] },
  { id: 'ach-first-legendary', name: 'Ícone Obtido', description: 'Obtenha sua primeira carta Legendary.', category: 'collection', currentValue: 1, targetValue: 1, unlockedAt: '2025-01-08', rewards: [{ kind: 'fragments', amount: 300 }] },
  { id: 'ach-100-matches', name: 'Veterano de Campo', description: 'Dispute 100 partidas.', category: 'veteran', currentValue: 58, targetValue: 100, unlockedAt: null, rewards: [{ kind: 'credits', amount: 1000 }] },
  { id: 'ach-first-ultra', name: 'Além da Lenda', description: 'Obtenha sua primeira carta Ultra.', category: 'collection', currentValue: 1, targetValue: 1, unlockedAt: '2025-01-01', rewards: [{ kind: 'fragments', amount: 800 }] },
  { id: 'ach-complete-album', name: 'Colecionador Completo', description: 'Complete qualquer álbum de seleção.', category: 'collection', currentValue: 0, targetValue: 1, unlockedAt: null, rewards: [{ kind: 'fragments', amount: 1500 }] },
];

const MOCK_EVENTS: ApiEvent[] = [
  { id: 'ev-copa70', kind: 'season_event', name: 'Copa 70 — O Brasil Pentacampeão', description: 'Reviva a gloriosa Copa de 1970. Colete cartas exclusivas da Seleção Canarinho mais icônica da história.', startsAt: new Date(Date.now() - 2 * 24 * 3600_000).toISOString(), endsAt: new Date(Date.now() + 5 * 24 * 3600_000).toISOString(), status: 'active', theme: 'Copa do Mundo México 1970', missions: [{ id: 'm1', name: 'Vencer 5 Partidas', target: 5, current: 3, rewards: ['200 fragmentos'] }, { id: 'm2', name: 'Abrir 3 Packs Copa 70', target: 3, current: 1, rewards: ['1 Pack Elite'] }, { id: 'm3', name: 'Colecionar 5 cartas BR', target: 5, current: 4, rewards: ['Badge Copa 70'] }] },
  { id: 'ev-double-drop', kind: 'double_drop', name: 'Fim de Semana de Drop Duplo', description: 'Drop rate dobrado para Lendárias em todos os packs. Só até domingo!', startsAt: new Date(Date.now() - 1 * 3600_000).toISOString(), endsAt: new Date(Date.now() + 47 * 3600_000).toISOString(), status: 'active' },
  { id: 'ev-community', kind: 'community_goal', name: 'Meta da Comunidade: 50k Packs', description: 'Se a comunidade abrir 50.000 packs coletivamente, todos recebem 500 fragmentos!', startsAt: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(), endsAt: new Date(Date.now() + 4 * 24 * 3600_000).toISOString(), status: 'active' },
];

const MOCK_ALBUMS: ApiAlbumSet[] = [
  { id: 'alb-br70', code: 'brasil-1970', name: 'Brasil 1970', nation: 'BR', totalCards: 22, ownedCards: 14, completedAt: null },
  { id: 'alb-ar78', code: 'argentina-1978', name: 'Argentina 1978', nation: 'AR', totalCards: 22, ownedCards: 8, completedAt: null },
  { id: 'alb-de74', code: 'alemanha-1974', name: 'Alemanha 1974', nation: 'DE', totalCards: 22, ownedCards: 18, completedAt: null },
  { id: 'alb-nl74', code: 'holanda-1974', name: 'Holanda 1974', nation: 'NL', totalCards: 22, ownedCards: 11, completedAt: null },
  { id: 'alb-it82', code: 'italia-1982', name: 'Itália 1982', nation: 'IT', totalCards: 22, ownedCards: 5, completedAt: null },
  { id: 'alb-fr84', code: 'franca-1984', name: 'França Euro 84', nation: 'FR', totalCards: 18, ownedCards: 3, completedAt: null },
];

const MOCK_MATCH_EVENTS: ApiMatchEvent[] = [
  { id: 1, minute: 1, eventType: 'kickoff', teamSide: 'home', description: 'Bola rolando! Pelé e Zico lideram o ataque brasileiro.' },
  { id: 2, minute: 12, eventType: 'chance', teamSide: 'home', description: 'Pelé avança pela direita e arrisca de longe — por cima!' },
  { id: 3, minute: 19, eventType: 'goal', teamSide: 'home', description: '⚽ GOOOL! Pelé abre o placar com uma finalização precisa no ângulo!', playerName: 'Pelé' },
  { id: 4, minute: 28, eventType: 'yellow_card', teamSide: 'away', description: '🟨 Maradona é advertido por falta em Zico.', playerName: 'Maradona' },
  { id: 5, minute: 35, eventType: 'chance', teamSide: 'away', description: 'Cruyff tenta o dribble, mas Beckenbauer lê a jogada e intercepta.' },
  { id: 6, minute: 44, eventType: 'goal', teamSide: 'home', description: '⚽ GOOOL! Zico amplia com uma cobrança de falta magistral!', playerName: 'Zico' },
  { id: 7, minute: 45, eventType: 'half_time', teamSide: 'home', description: '— Intervalo: Brasil 2 × 0 Resto do Mundo.' },
  { id: 8, minute: 58, eventType: 'goal', teamSide: 'away', description: '⚽ Cruyff desconta de cabeça após escanteio!', playerName: 'Cruyff' },
  { id: 9, minute: 71, eventType: 'chance', teamSide: 'home', description: 'R9 invade a área e isola — que oportunidade perdida!' },
  { id: 10, minute: 82, eventType: 'goal', teamSide: 'home', description: '⚽ Pelé fecha o placar com seu hat-trick! Que partida histórica!', playerName: 'Pelé' },
  { id: 11, minute: 90, eventType: 'full_time', teamSide: 'home', description: '⬛ Fim de jogo! Brasil 3 × 1 Resto do Mundo.' },
];

// ─── Mock API ─────────────────────────────────────────────────────────────────

export const mockApi = {
  // Perfil
  async getMe(): Promise<ApiProfile> {
    await delay(); return MOCK_PROFILE;
  },
  async updateProfile(input: Partial<Pick<ApiProfile, 'displayName' | 'avatarUrl'>>): Promise<ApiProfile> {
    await delay(300); return { ...MOCK_PROFILE, ...input };
  },

  // Coleção (doc 16 §5)
  async getMyCards(filters?: { position?: string; rarityCode?: string; search?: string }): Promise<ApiCard[]> {
    await delay();
    let cards = [...MOCK_CARDS];
    if (filters?.rarityCode) cards = cards.filter((c) => c.rarityCode === filters.rarityCode);
    if (filters?.position) cards = cards.filter((c) => c.position === filters.position);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      cards = cards.filter((c) => c.knownAs.toLowerCase().includes(q) || c.nationality.toLowerCase().includes(q));
    }
    return cards;
  },
  async getCardDetail(userCardId: string): Promise<ApiCard | null> {
    await delay();
    return MOCK_CARDS.find((c) => c.id === userCardId) ?? null;
  },

  // Packs (doc 16 §6)
  async getPacks(): Promise<ApiPack[]> {
    await delay(); return MOCK_PACKS;
  },
  async openPack(_packId: string): Promise<ApiCard[]> {
    await delay(1500);
    // Simula abertura: 5 cartas sorteadas
    const pool = [...MOCK_CARDS];
    const drawn: ApiCard[] = [];
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const card = pool[idx];
      if (card) drawn.push({ ...card, id: `uc-new-${Date.now()}-${i}` });
    }
    return drawn.sort((a, b) => a.overall - b.overall); // reveal menor → maior
  },

  // Ranking (doc 16 §9)
  async getLeaderboard(_division?: string): Promise<ApiRankingRow[]> {
    await delay(); return MOCK_RANKING;
  },
  async getMyPosition(): Promise<ApiRankingRow | null> {
    await delay(); return MOCK_RANKING.find((r) => r.profileId === 'usr-001') ?? null;
  },

  // Partida (doc 16 §7)
  async getMatch(matchId: string): Promise<{ homeScore: number; awayScore: number; homeUsername: string; awayUsername: string } | null> {
    await delay(); return { homeScore: 3, awayScore: 1, homeUsername: 'lenda_br', awayUsername: 'rival_de_copa' };
  },
  async getMatchEvents(_matchId: string): Promise<ApiMatchEvent[]> {
    await delay(300); return MOCK_MATCH_EVENTS;
  },

  // Conquistas (doc 16 §11)
  async getAchievements(): Promise<ApiAchievement[]> {
    await delay(); return MOCK_ACHIEVEMENTS;
  },

  // Eventos (doc 16 §12)
  async getActiveEvents(): Promise<ApiEvent[]> {
    await delay(); return MOCK_EVENTS.filter((e) => e.status === 'active');
  },
  async getAllEvents(): Promise<ApiEvent[]> {
    await delay(); return MOCK_EVENTS;
  },

  // Álbum (doc 16 §5 + doc 07)
  async getAlbums(): Promise<ApiAlbumSet[]> {
    await delay(); return MOCK_ALBUMS;
  },

  // Craft (doc 16 §6)
  async getFragmentBalance(): Promise<number> {
    await delay(); return MOCK_PROFILE.fragmentBalance;
  },
  async craftCard(_cardId: string, _idempotencyKey: string): Promise<{ ok: boolean; error?: string; card?: ApiCard }> {
    await delay(800);
    return { ok: false, error: 'Funcionalidade disponível em breve.' };
  },
};
