/**
 * lib/collection-data.ts
 *
 * Camada de dados da coleção — usa @world-legends/cards como única fonte de verdade.
 *
 * Responsabilidades:
 *   1. Registrar jogadores históricos nos catálogos de domínio.
 *   2. Criar cartas usando createCard() com todos os invariantes de domínio.
 *   3. Exportar um DTO plano (CollectionCard) para consumo da UI.
 *   4. Exportar utilitários de filtro e ordenação.
 *
 * ZERO strings hardcoded nas páginas ou componentes — tudo emana desta camada.
 */

import {
  type BaseAttributeSet,
  type Card,
  type Player,
  type Rarity,
  cardId,
  createCard,
  createCardCatalog,
  createPlayer,
  createPlayerCatalog,
  getAllRarities,
  getRarity,
  playerId,
} from '@world-legends/cards';

import type { NationalityCode, Position, RarityCode, TraitName } from '@world-legends/types';
import { ALL_POSITIONS, ALL_RARITY_CODES } from '@world-legends/types';

import { ALL_CARD_SEEDS, ALL_PLAYER_SEEDS } from './catalog-seeds';

// ─── DTO para a UI ────────────────────────────────────────────────────────────

/**
 * Visão plana de uma carta para a camada de apresentação.
 * Agrega Player + Card + Rarity — a UI nunca trabalha com os
 * agregados de domínio diretamente.
 */
export type CollectionCard = Readonly<{
  // Identidade
  readonly cardId: string;
  readonly playerId: string;

  // Exibição
  readonly displayName: string; // "Pelé", "Ronaldo", …
  readonly fullName: string;
  readonly nationality: NationalityCode;
  readonly flagEmoji: string;

  // Jogo
  readonly position: Position;
  readonly overall: number;
  readonly rarityCode: RarityCode;
  readonly rarityLabel: string;
  readonly editionCode: string;

  // Atributos-chave (para detail panel)
  readonly attributes: Readonly<Record<string, number>>;

  // Traits
  readonly traits: readonly { name: string; tier: 1 | 2 | 3 }[];

  // Metadados de exibição
  readonly bioShort: string;
  readonly era: string; // "1990s", "2000s", …

  // Campos de instância do usuário (preenchidos ao enriquecer com dados do DB)
  readonly userCardId?: string; // ID da instância na tabela user_cards
  readonly contracts?: number; // Contratos restantes (padrão 10 — não rastreado ainda)
  readonly evolution?: number; // Nível de evolução (padrão 0 — não rastreado ainda)
}>;

// ─── Mapa de bandeiras ────────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  BR:'🇧🇷', AR:'🇦🇷', DE:'🇩🇪', FR:'🇫🇷', IT:'🇮🇹',
  ES:'🇪🇸', NL:'🇳🇱', PT:'🇵🇹', UY:'🇺🇾', CR:'🇨🇷',
  EN:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', GB:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', HR:'🇭🇷', DK:'🇩🇰',
  HU:'🇭🇺', PL:'🇵🇱', BG:'🇧🇬', CM:'🇨🇲', SU:'🪆',
  RU:'🇷🇺', YU:'🏳', SE:'🇸🇪', RO:'🇷🇴', CO:'🇨🇴',
  CZ:'🇨🇿', CS:'🏳', NG:'🇳🇬', GH:'🇬🇭', MX:'🇲🇽',
  CL:'🇨🇱', AT:'🇦🇹', CI:'🇨🇮', SN:'🇸🇳', KR:'🇰🇷',
  JP:'🇯🇵', BE:'🇧🇪', SC:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', IE:'🇮🇪', WA:'🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  NI:'🇬🇧', TR:'🇹🇷', GR:'🇬🇷', CH:'🇨🇭', RS:'🇷🇸',
  DZ:'🇩🇿', MA:'🇲🇦', US:'🇺🇸', PE:'🇵🇪', PY:'🇵🇾',
  EC:'🇪🇨', AU:'🇦🇺', IS:'🇮🇸', EG:'🇪🇬', IL:'🇮🇱',
  UA:'🇺🇦', ML:'🇲🇱', AL:'🇦🇱', BA:'🇧🇦', SK:'🇸🇰',
  CA:'🇨🇦', SA:'🇸🇦', QA:'🇶🇦', CD:'🇨🇩', PF:'🇵🇫',
  JM:'🇯🇲', CU:'🇨🇺',
};

function flag(code: string): string {
  return FLAG_MAP[code] ?? '🏳';
}

// ─── Helper: era textual ──────────────────────────────────────────────────────

function eraText(start: number): string {
  const decade = Math.floor(start / 10) * 10;
  return `${decade}s`;
}

// ─── Helper: atributos como Record flat ──────────────────────────────────────

function flattenAttributes(attrs: Readonly<Record<string, number>>): Record<string, number> {
  return { ...attrs };
}

// ─── Helper: criar BaseAttributeSet preenchido ───────────────────────────────

function attrs(overrides: Partial<BaseAttributeSet>): BaseAttributeSet {
  const base: BaseAttributeSet = {
    pace: 70,
    stamina: 70,
    physical: 70,
    heading: 60,
    finishing: 60,
    shot_power: 60,
    passing: 65,
    vision: 65,
    dribbling: 65,
    penalty_kicks: 60,
    defending: 40,
    composure: 70,
    aggression: 60,
    leadership: 60,
    gk_reflexes: 20,
    gk_positioning: 20,
    gk_handling: 20,
    gk_kicking: 20,
    gk_penalty_save: 20,
  };
  return Object.freeze({ ...base, ...overrides });
}

// ─── Catálogos de domínio (singleton) ────────────────────────────────────────

const playerCatalog = createPlayerCatalog();
const cardCatalog = createCardCatalog();

// ─── Dados dos jogadores e cartas ─────────────────────────────────────────────

type PlayerSeed = {
  id: string;
  fullName: string;
  knownAs: string;
  birthYear: number;
  nationality: NationalityCode;
  primary: Position;
  secondary: Position[];
  eraStart: number;
  eraEnd: number;
  foot: 'left' | 'right' | 'both';
  height: number;
  bio: string;
  baseAttrs: Partial<BaseAttributeSet>;
};

type CardSeed = {
  playerId: string;
  rarity: RarityCode;
  traits: { trait: TraitName; tier: 1 | 2 | 3 }[];
};

const PLAYER_SEEDS: PlayerSeed[] = [
  {
    id: 'pelé',
    fullName: 'Edson Arantes do Nascimento',
    knownAs: 'Pelé',
    birthYear: 1940,
    nationality: 'BR',
    primary: 'ST',
    secondary: ['CF'],
    eraStart: 1958,
    eraEnd: 1977,
    foot: 'right',
    height: 173,
    bio: 'O Rei do Futebol. Três vezes campeão mundial com o Brasil.',
    baseAttrs: {
      pace: 90,
      stamina: 85,
      physical: 80,
      heading: 78,
      finishing: 97,
      shot_power: 92,
      passing: 88,
      vision: 90,
      dribbling: 95,
      penalty_kicks: 91,
      defending: 38,
      composure: 96,
      aggression: 60,
      leadership: 92,
    },
  },
  {
    id: 'ronaldo',
    fullName: 'Ronaldo Luís Nazário de Lima',
    knownAs: 'Ronaldo Fenômeno',
    birthYear: 1976,
    nationality: 'BR',
    primary: 'ST',
    secondary: ['CF'],
    eraStart: 1993,
    eraEnd: 2011,
    foot: 'both',
    height: 183,
    bio: 'Il Fenomeno. Velocidade, técnica e frieza ímpares.',
    baseAttrs: {
      pace: 97,
      stamina: 82,
      physical: 85,
      heading: 75,
      finishing: 97,
      shot_power: 90,
      passing: 78,
      vision: 84,
      dribbling: 94,
      penalty_kicks: 88,
      defending: 30,
      composure: 93,
      aggression: 72,
      leadership: 80,
    },
  },
  {
    id: 'ronaldinho',
    fullName: 'Ronaldo de Assis Moreira',
    knownAs: 'Ronaldinho',
    birthYear: 1980,
    nationality: 'BR',
    primary: 'CAM',
    secondary: ['LW', 'CM'],
    eraStart: 1998,
    eraEnd: 2015,
    foot: 'both',
    height: 181,
    bio: 'O mais habilidoso. Magia pura no Camp Nou.',
    baseAttrs: {
      pace: 82,
      stamina: 80,
      physical: 75,
      heading: 70,
      finishing: 88,
      shot_power: 83,
      passing: 92,
      vision: 95,
      dribbling: 99,
      penalty_kicks: 82,
      defending: 35,
      composure: 90,
      aggression: 55,
      leadership: 78,
    },
  },
  {
    id: 'maradona',
    fullName: 'Diego Armando Maradona',
    knownAs: 'Maradona',
    birthYear: 1960,
    nationality: 'AR',
    primary: 'CAM',
    secondary: ['CM'],
    eraStart: 1976,
    eraEnd: 1997,
    foot: 'left',
    height: 165,
    bio: 'El Pibe de Oro. A Mão de Deus e o Gol do Século.',
    baseAttrs: {
      pace: 85,
      stamina: 83,
      physical: 76,
      heading: 72,
      finishing: 91,
      shot_power: 88,
      passing: 93,
      vision: 97,
      dribbling: 99,
      penalty_kicks: 89,
      defending: 38,
      composure: 92,
      aggression: 70,
      leadership: 90,
    },
  },
  {
    id: 'zico',
    fullName: 'Arthur Antunes Coimbra',
    knownAs: 'Zico',
    birthYear: 1953,
    nationality: 'BR',
    primary: 'CAM',
    secondary: ['CM'],
    eraStart: 1971,
    eraEnd: 1994,
    foot: 'right',
    height: 176,
    bio: 'O Galinho de Quintino. Maestro das cobranças de falta.',
    baseAttrs: {
      pace: 78,
      stamina: 80,
      physical: 72,
      heading: 75,
      finishing: 90,
      shot_power: 95,
      passing: 92,
      vision: 93,
      dribbling: 90,
      penalty_kicks: 97,
      defending: 40,
      composure: 91,
      aggression: 58,
      leadership: 88,
    },
  },
  {
    id: 'romario',
    fullName: 'Romário de Souza Faria',
    knownAs: 'Romário',
    birthYear: 1966,
    nationality: 'BR',
    primary: 'ST',
    secondary: ['CF'],
    eraStart: 1985,
    eraEnd: 2009,
    foot: 'right',
    height: 169,
    bio: 'O Baixinho. 1000 gols de habilidade e instinto.',
    baseAttrs: {
      pace: 88,
      stamina: 74,
      physical: 70,
      heading: 71,
      finishing: 97,
      shot_power: 86,
      passing: 76,
      vision: 85,
      dribbling: 92,
      penalty_kicks: 85,
      defending: 25,
      composure: 95,
      aggression: 65,
      leadership: 80,
    },
  },
  {
    id: 'roberto-carlos',
    fullName: 'Roberto Carlos da Silva Rocha',
    knownAs: 'Roberto Carlos',
    birthYear: 1973,
    nationality: 'BR',
    primary: 'LB',
    secondary: ['LWB'],
    eraStart: 1991,
    eraEnd: 2013,
    foot: 'left',
    height: 168,
    bio: 'O lateral com o chute mais temido do planeta.',
    baseAttrs: {
      pace: 93,
      stamina: 94,
      physical: 83,
      heading: 68,
      finishing: 70,
      shot_power: 97,
      passing: 83,
      vision: 78,
      dribbling: 80,
      penalty_kicks: 72,
      defending: 84,
      composure: 82,
      aggression: 78,
      leadership: 80,
    },
  },
  {
    id: 'kaka',
    fullName: 'Ricardo Izecson dos Santos Leite',
    knownAs: 'Kaká',
    birthYear: 1982,
    nationality: 'BR',
    primary: 'CAM',
    secondary: ['CM'],
    eraStart: 2001,
    eraEnd: 2017,
    foot: 'right',
    height: 186,
    bio: "Ballon d'Or 2007. Elegância e velocidade rara para um meia.",
    baseAttrs: {
      pace: 86,
      stamina: 85,
      physical: 78,
      heading: 72,
      finishing: 86,
      shot_power: 84,
      passing: 91,
      vision: 90,
      dribbling: 86,
      penalty_kicks: 80,
      defending: 42,
      composure: 88,
      aggression: 55,
      leadership: 80,
    },
  },
  {
    id: 'cafu',
    fullName: 'Marcos Evangelista de Morais',
    knownAs: 'Cafu',
    birthYear: 1970,
    nationality: 'BR',
    primary: 'RB',
    secondary: ['RWB'],
    eraStart: 1989,
    eraEnd: 2008,
    foot: 'right',
    height: 176,
    bio: 'O Biricel. Lateral direito mais titulado da história.',
    baseAttrs: {
      pace: 90,
      stamina: 96,
      physical: 82,
      heading: 72,
      finishing: 65,
      shot_power: 72,
      passing: 80,
      vision: 75,
      dribbling: 77,
      penalty_kicks: 60,
      defending: 85,
      composure: 80,
      aggression: 80,
      leadership: 85,
    },
  },
  {
    id: 'rivaldo',
    fullName: 'Vitor Borba Ferreira',
    knownAs: 'Rivaldo',
    birthYear: 1972,
    nationality: 'BR',
    primary: 'LW',
    secondary: ['CAM', 'CM'],
    eraStart: 1991,
    eraEnd: 2015,
    foot: 'left',
    height: 186,
    bio: "Ballon d'Or 1999. Campeão mundial com uma bicicleta inesquecível.",
    baseAttrs: {
      pace: 82,
      stamina: 80,
      physical: 76,
      heading: 82,
      finishing: 90,
      shot_power: 91,
      passing: 85,
      vision: 88,
      dribbling: 88,
      penalty_kicks: 83,
      defending: 35,
      composure: 88,
      aggression: 62,
      leadership: 76,
    },
  },
  {
    id: 'taffarel',
    fullName: 'Cláudio André Mergen Taffarel',
    knownAs: 'Taffarel',
    birthYear: 1966,
    nationality: 'BR',
    primary: 'GK',
    secondary: [],
    eraStart: 1987,
    eraEnd: 2003,
    foot: 'right',
    height: 186,
    bio: 'Herói do pênalti em 1994. Um dos maiores GKs da história.',
    baseAttrs: {
      pace: 55,
      stamina: 78,
      physical: 80,
      heading: 60,
      finishing: 20,
      shot_power: 30,
      passing: 55,
      vision: 60,
      dribbling: 20,
      penalty_kicks: 40,
      defending: 70,
      composure: 85,
      aggression: 55,
      leadership: 82,
      gk_reflexes: 91,
      gk_positioning: 88,
      gk_handling: 87,
      gk_kicking: 75,
      gk_penalty_save: 90,
    },
  },
  {
    id: 'lucio',
    fullName: 'Lúcio Flávio Assis e Silva',
    knownAs: 'Lúcio',
    birthYear: 1978,
    nationality: 'BR',
    primary: 'CB',
    secondary: [],
    eraStart: 1997,
    eraEnd: 2015,
    foot: 'right',
    height: 188,
    bio: 'Defensor implacável, campeão com Bayern e Internazionale.',
    baseAttrs: {
      pace: 80,
      stamina: 82,
      physical: 88,
      heading: 87,
      finishing: 40,
      shot_power: 55,
      passing: 70,
      vision: 68,
      dribbling: 60,
      penalty_kicks: 45,
      defending: 88,
      composure: 82,
      aggression: 82,
      leadership: 80,
    },
  },
  {
    id: 'falcao',
    fullName: 'Paulo Roberto Falcão',
    knownAs: 'Falcão',
    birthYear: 1953,
    nationality: 'BR',
    primary: 'CM',
    secondary: ['CDM'],
    eraStart: 1972,
    eraEnd: 1987,
    foot: 'right',
    height: 177,
    bio: 'O Rei de Roma. O melhor meia do mundo nos anos 80.',
    baseAttrs: {
      pace: 78,
      stamina: 85,
      physical: 76,
      heading: 74,
      finishing: 82,
      shot_power: 88,
      passing: 91,
      vision: 92,
      dribbling: 86,
      penalty_kicks: 80,
      defending: 76,
      composure: 88,
      aggression: 74,
      leadership: 86,
    },
  },
  {
    id: 'socrates',
    fullName: 'Sócrates Brasileiro Sampaio de Souza Vieira de Oliveira',
    knownAs: 'Sócrates',
    birthYear: 1954,
    nationality: 'BR',
    primary: 'CAM',
    secondary: ['CM'],
    eraStart: 1974,
    eraEnd: 1989,
    foot: 'left',
    height: 192,
    bio: 'O Doutor. Médico, filósofo e artilheiro do Corinthians.',
    baseAttrs: {
      pace: 74,
      stamina: 80,
      physical: 78,
      heading: 82,
      finishing: 82,
      shot_power: 85,
      passing: 90,
      vision: 93,
      dribbling: 83,
      penalty_kicks: 88,
      defending: 42,
      composure: 90,
      aggression: 60,
      leadership: 92,
    },
  },
  {
    id: 'bebeto',
    fullName: 'José Roberto Gama de Oliveira',
    knownAs: 'Bebeto',
    birthYear: 1964,
    nationality: 'BR',
    primary: 'ST',
    secondary: ['CF'],
    eraStart: 1984,
    eraEnd: 2002,
    foot: 'right',
    height: 176,
    bio: 'Parceiro eterno de Romário. Gol da Caxangá na Copa de 94.',
    baseAttrs: {
      pace: 86,
      stamina: 78,
      physical: 72,
      heading: 74,
      finishing: 88,
      shot_power: 82,
      passing: 78,
      vision: 80,
      dribbling: 84,
      penalty_kicks: 82,
      defending: 28,
      composure: 88,
      aggression: 60,
      leadership: 76,
    },
  },
  {
    id: 'adriano',
    fullName: 'Adriano Leite Ribeiro',
    knownAs: 'Adriano',
    birthYear: 1982,
    nationality: 'BR',
    primary: 'ST',
    secondary: [],
    eraStart: 2001,
    eraEnd: 2016,
    foot: 'left',
    height: 188,
    bio: 'O Imperador. Chute mais potente de sua geração.',
    baseAttrs: {
      pace: 82,
      stamina: 74,
      physical: 92,
      heading: 84,
      finishing: 88,
      shot_power: 97,
      passing: 70,
      vision: 74,
      dribbling: 78,
      penalty_kicks: 80,
      defending: 30,
      composure: 76,
      aggression: 80,
      leadership: 72,
    },
  },
];

const CARD_SEEDS: CardSeed[] = [
  {
    playerId: 'pelé',
    rarity: 'world_cup_hero',
    traits: [
      { trait: 'Matador', tier: 3 },
      { trait: 'Hero Moment', tier: 3 },
    ],
  },
  {
    playerId: 'ronaldo',
    rarity: 'ultra',
    traits: [
      { trait: 'Matador', tier: 3 },
      { trait: 'Big Game Player', tier: 2 },
    ],
  },
  {
    playerId: 'ronaldinho',
    rarity: 'ultra',
    traits: [
      { trait: 'Maestro', tier: 3 },
      { trait: 'Big Game Player', tier: 2 },
    ],
  },
  {
    playerId: 'maradona',
    rarity: 'world_cup_hero',
    traits: [
      { trait: 'Maestro', tier: 3 },
      { trait: 'Clutch Player', tier: 3 },
    ],
  },
  {
    playerId: 'zico',
    rarity: 'legendary',
    traits: [
      { trait: 'Dead Ball Specialist', tier: 3 },
      { trait: 'Maestro', tier: 2 },
    ],
  },
  {
    playerId: 'romario',
    rarity: 'legendary',
    traits: [
      { trait: 'Matador', tier: 3 },
      { trait: 'Gelo nas Veias', tier: 2 },
    ],
  },
  {
    playerId: 'roberto-carlos',
    rarity: 'legendary',
    traits: [
      { trait: 'Dead Ball Specialist', tier: 3 },
      { trait: 'Iron Man', tier: 2 },
    ],
  },
  {
    playerId: 'kaka',
    rarity: 'legendary',
    traits: [
      { trait: 'Maestro', tier: 2 },
      { trait: 'Big Game Player', tier: 2 },
    ],
  },
  {
    playerId: 'cafu',
    rarity: 'legendary',
    traits: [
      { trait: 'Iron Man', tier: 3 },
      { trait: 'Capitão', tier: 2 },
    ],
  },
  {
    playerId: 'rivaldo',
    rarity: 'legendary',
    traits: [
      { trait: 'Matador', tier: 2 },
      { trait: 'Clutch Player', tier: 3 },
    ],
  },
  {
    playerId: 'taffarel',
    rarity: 'elite',
    traits: [
      { trait: 'Muralha', tier: 3 },
      { trait: 'Gelo nas Veias', tier: 2 },
    ],
  },
  {
    playerId: 'lucio',
    rarity: 'elite',
    traits: [
      { trait: 'Muralha', tier: 2 },
      { trait: 'Leader', tier: 1 },
    ],
  },
  {
    playerId: 'falcao',
    rarity: 'elite',
    traits: [
      { trait: 'Maestro', tier: 3 },
      { trait: 'Big Game Player', tier: 1 },
    ],
  },
  {
    playerId: 'socrates',
    rarity: 'rare',
    traits: [
      { trait: 'Maestro', tier: 2 },
      { trait: 'Leader', tier: 2 },
    ],
  },
  {
    playerId: 'bebeto',
    rarity: 'rare',
    traits: [
      { trait: 'Matador', tier: 2 },
      { trait: 'Fast Recovery', tier: 1 },
    ],
  },
  {
    playerId: 'adriano',
    rarity: 'elite',
    traits: [
      { trait: 'Matador', tier: 2 },
      { trait: 'Super Sub', tier: 1 },
    ],
  },
];

// ─── População dos catálogos ──────────────────────────────────────────────────

let _initialized = false;

function ensureInitialized() {
  if (_initialized) return;
  _initialized = true;

  // Registrar jogadores (seeds manuais + catálogo completo)
  for (const seed of [...PLAYER_SEEDS, ...ALL_PLAYER_SEEDS]) {
    const result = createPlayer({
      id: playerId(seed.id),
      fullName: seed.fullName,
      knownAs: seed.knownAs,
      birthYear: seed.birthYear,
      nationality: seed.nationality,
      primaryPosition: seed.primary,
      secondaryPositions: seed.secondary,
      preferredFoot: seed.foot,
      heightCm: seed.height,
      eraStart: seed.eraStart,
      eraEnd: seed.eraEnd,
      baseAttributes: attrs(seed.baseAttrs),
      bioShort: seed.bio,
      sourceNotes: 'Dados históricos curados — fontes: Wikipedia, FIFA, RSSSF.',
    });
    if (result.ok) playerCatalog.register(result.value);
  }

  const WCH_CONTEXT: Record<string, import('@world-legends/cards').TournamentContext> = {
    pelé: {
      tournament: 'FIFA World Cup',
      year: 1970,
      hostCountry: 'Mexico',
      narrativeDescription: 'O Rei na Copa de 1970',
      performanceIndicator: 99,
    },
    maradona: {
      tournament: 'FIFA World Cup',
      year: 1986,
      hostCountry: 'Mexico',
      narrativeDescription: 'La Mano de Dios na Copa de 1986',
      performanceIndicator: 99,
    },
  };

  // Registrar cartas (seeds manuais + catálogo completo)
  for (const seed of [...CARD_SEEDS, ...ALL_CARD_SEEDS]) {
    const player = playerCatalog.findById(playerId(seed.playerId));
    if (!player) continue;

    const result = createCard({
      id: cardId(`${seed.playerId}-${seed.rarity}`),
      playerId: player.id,
      rarityCode: seed.rarity,
      editionCode: 'base',
      baseAttributes: player.baseAttributes,
      playerPosition: player.positions.primary,
      editionMetadata: { kind: 'base' },
      traits: seed.traits,
      ...(seed.rarity === 'world_cup_hero'
        ? {
            tournamentContext: WCH_CONTEXT[seed.playerId] ?? {
              tournament: 'FIFA World Cup',
              year: 2002,
              hostCountry: 'Japan/Korea',
              narrativeDescription: 'Ícone da Copa do Mundo',
              performanceIndicator: 90,
            },
          }
        : {}),
    });

    if (result.ok) cardCatalog.register(result.value);
  }
}

// ─── Mapear Card + Player → CollectionCard ────────────────────────────────────

function toCollectionCard(card: Card, player: Player): CollectionCard {
  const rarity = getRarity(card.rarityCode);

  // Atributos relevantes para exibição no detail panel
  const attrs: Record<string, number> = {
    Velocidade: player.baseAttributes.pace,
    Finalização: player.baseAttributes.finishing,
    Passe: player.baseAttributes.passing,
    Drible: player.baseAttributes.dribbling,
    Físico: player.baseAttributes.physical,
    Visão: player.baseAttributes.vision,
    Defesa: player.baseAttributes.defending,
    Compostura: player.baseAttributes.composure,
    Liderança: player.baseAttributes.leadership,
  };

  // Para GKs, substituir atributos ofensivos por de goleiro
  if (player.positions.primary === 'GK') {
    attrs['Reflexos GK'] = player.baseAttributes.gk_reflexes;
    attrs['Posicion. GK'] = player.baseAttributes.gk_positioning;
    attrs['Toque GK'] = player.baseAttributes.gk_handling;
    attrs['Chute GK'] = player.baseAttributes.gk_kicking;
    attrs['Pen. Save'] = player.baseAttributes.gk_penalty_save;
    delete attrs.Finalização;
    delete attrs.Drible;
    delete attrs.Defesa;
  }

  return Object.freeze({
    cardId: card.id as string,
    playerId: player.id as string,
    displayName: player.knownAs,
    fullName: player.fullName,
    nationality: player.nationality,
    flagEmoji: flag(player.nationality),
    position: player.positions.primary,
    overall: card.overall,
    rarityCode: card.rarityCode,
    rarityLabel: rarity.label,
    editionCode: card.editionCode,
    attributes: Object.freeze(attrs),
    traits: card.traits.map((t) => ({ name: t.trait as string, tier: t.tier })),
    bioShort: player.bioShort,
    era: eraText(player.era.start),
  });
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Retorna todas as cartas da coleção como DTOs para a UI. */
export function getCollection(): CollectionCard[] {
  ensureInitialized();
  return cardCatalog.listActive().map((card) => {
    const player = playerCatalog.findById(card.playerId)!;
    return toCollectionCard(card, player);
  });
}

/** Indexed map for O(1) lookup by cardId — used by pack-opening and server actions. */
export function getCollectionMap(): Map<string, CollectionCard> {
  const all = getCollection();
  return new Map(all.map((c) => [c.cardId, c]));
}

/** Enriches DB user-card rows with catalog data, preserving order. */
export function enrichWithUserCards(
  rows: ReadonlyArray<{ cardId: string; userCardId: string; acquiredAt: string }>,
): CollectionCard[] {
  const catalog = getCollectionMap();
  return rows.flatMap((row) => {
    const card = catalog.get(row.cardId);
    return card ? [{ ...card, userCardId: row.userCardId, contracts: 10, evolution: 0 }] : [];
  });
}

/** Retorna os metadados de todas as raridades (para filtros e badges). */
export function getAvailableRarities(): readonly Rarity[] {
  return getAllRarities();
}

/** Retorna as posições presentes na coleção. */
export function getAvailablePositions(cards: CollectionCard[]): readonly Position[] {
  const found = new Set(cards.map((c) => c.position));
  return ALL_POSITIONS.filter((p) => found.has(p));
}

// ─── Filtro e Ordenação ───────────────────────────────────────────────────────

export type SortKey = 'overall' | 'rarity' | 'name' | 'position';

const RARITY_ORDER: Record<RarityCode, number> = {
  world_cup_hero: 6,
  ultra: 5,
  legendary: 4,
  elite: 3,
  rare: 2,
  common: 1,
};

export type FilterState = {
  search: string;
  rarity: RarityCode | 'all';
  position: Position | 'all';
  sortKey: SortKey;
};

export function applyFilters(cards: CollectionCard[], filter: FilterState): CollectionCard[] {
  let result = cards;

  if (filter.search.trim()) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q),
    );
  }

  if (filter.rarity !== 'all') {
    result = result.filter((c) => c.rarityCode === filter.rarity);
  }

  if (filter.position !== 'all') {
    result = result.filter((c) => c.position === filter.position);
  }

  return result.slice().sort((a, b) => {
    switch (filter.sortKey) {
      case 'overall':
        return b.overall - a.overall;
      case 'rarity':
        return RARITY_ORDER[b.rarityCode] - RARITY_ORDER[a.rarityCode];
      case 'name':
        return a.displayName.localeCompare(b.displayName);
      case 'position':
        return a.position.localeCompare(b.position);
      default:
        return 0;
    }
  });
}

/** Rótulos de UI para as opções de ordenação — vindos do domínio, não da UI. */
export const SORT_OPTIONS: readonly { key: SortKey; label: string }[] = [
  { key: 'overall', label: 'OVR' },
  { key: 'rarity', label: 'Raridade' },
  { key: 'name', label: 'Nome' },
  { key: 'position', label: 'Posição' },
];

/** Rótulos de UI para as posições. */
export const POSITION_LABELS: Readonly<Partial<Record<Position, string>>> = {
  GK: 'Goleiro',
  CB: 'Zagueiro',
  LB: 'Lateral Esq.',
  RB: 'Lateral Dir.',
  CDM: 'Volante',
  CM: 'Meia',
  CAM: 'Meia Atak.',
  LM: 'Meia Esq.',
  RM: 'Meia Dir.',
  LW: 'Ponta Esq.',
  RW: 'Ponta Dir.',
  CF: 'Centroavante',
  ST: 'Atacante',
};

/** Mapa visual de raridade → cores Tailwind (para componentes). */
export const RARITY_VISUAL: Record<
  RarityCode,
  {
    borderClass: string;
    textClass: string;
    glowClass: string;
    bgClass: string;
    shimmer: boolean;
  }
> = {
  common: {
    borderClass: 'border-gray-600/60',
    textClass: 'text-gray-400',
    glowClass: '',
    bgClass: 'bg-gradient-to-br from-[#0f1017] to-[#1a1b24]',
    shimmer: false,
  },
  rare: {
    borderClass: 'border-purple-700/80',
    textClass: 'text-purple-400',
    glowClass: 'shadow-[0_0_12px_rgba(147,51,234,0.28)]',
    bgClass: 'bg-gradient-to-br from-[#0d0021] to-[#1a0038]',
    shimmer: false,
  },
  elite: {
    borderClass: 'border-blue-700/80',
    textClass: 'text-blue-400',
    glowClass: 'shadow-[0_0_14px_rgba(37,99,235,0.32)]',
    bgClass: 'bg-gradient-to-br from-[#000d1a] to-[#001a2e]',
    shimmer: false,
  },
  legendary: {
    borderClass: 'border-amber-600/80',
    textClass: 'text-amber-400',
    glowClass: 'shadow-[0_0_18px_rgba(201,168,76,0.42)]',
    bgClass: 'bg-gradient-to-br from-[#1a1000] to-[#2a1c00]',
    shimmer: false,
  },
  ultra: {
    borderClass: 'border-pink-600/80',
    textClass: 'text-pink-400',
    glowClass: 'shadow-[0_0_22px_rgba(236,72,153,0.48)]',
    bgClass: 'bg-gradient-to-br from-[#1a0020] to-[#001a30]',
    shimmer: true,
  },
  world_cup_hero: {
    borderClass: 'border-slate-300/60',
    textClass: 'text-slate-100',
    glowClass: 'shadow-[0_0_24px_rgba(255,255,255,0.22)]',
    bgClass: 'bg-gradient-to-br from-[#1a1820] to-[#0d0b12]',
    shimmer: true,
  },
};
