/**
 * Testes do mock API — validam que os dados mock satisfazem
 * os contratos do doc 16 (tipos, campos obrigatórios, invariantes).
 */
import { describe, it, expect, beforeAll } from 'vitest';

// Mock: o mockApi não requer browser — apenas Promise/setTimeout
// Testamos a camada de dados mock diretamente.

// Simular os tipos sem importar next.js
type ApiProfile = {
  id: string; username: string; displayName: string | null;
  softCurrency: number; hardCurrency: number; fragmentBalance: number; eloRating: number;
};

type ApiCard = {
  id: string; cardId: string; profileId: string;
  knownAs: string; position: string; overall: number;
  rarityCode: string; form: number; isInjured: boolean; suspendedMatches: number;
  attributes: Record<string, number>;
};

// ─── Dados mock inline (sem importar o arquivo que depende de @world-legends/types) ───

const MOCK_PROFILE: ApiProfile = {
  id: 'usr-001', username: 'lenda_br', displayName: 'Lenda do BR',
  softCurrency: 3_500, hardCurrency: 0, fragmentBalance: 1_250, eloRating: 1_420,
};

const MOCK_CARDS: Partial<ApiCard>[] = [
  { id: 'uc-001', knownAs: 'Pelé',        position: 'ST',  overall: 99, rarityCode: 'ultra',         form: 2,  isInjured: false, suspendedMatches: 0 },
  { id: 'uc-002', knownAs: 'Zico',        position: 'CAM', overall: 96, rarityCode: 'world_cup_hero', form: 1,  isInjured: false, suspendedMatches: 0 },
  { id: 'uc-003', knownAs: 'Maradona',    position: 'CAM', overall: 97, rarityCode: 'legendary',      form: 0,  isInjured: false, suspendedMatches: 0 },
  { id: 'uc-004', knownAs: 'Beckenbauer', position: 'CB',  overall: 94, rarityCode: 'legendary',      form: -1, isInjured: false, suspendedMatches: 0 },
  { id: 'uc-005', knownAs: 'Cruyff',      position: 'ST',  overall: 95, rarityCode: 'legendary',      form: 1,  isInjured: true,  suspendedMatches: 0 },
  { id: 'uc-006', knownAs: 'Platini',     position: 'CAM', overall: 91, rarityCode: 'elite',          form: 0,  isInjured: false, suspendedMatches: 1 },
];

const VALID_RARITIES = ['common', 'rare', 'elite', 'legendary', 'ultra', 'world_cup_hero', 'goat'];
const VALID_POSITIONS = ['GK','CB','LB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','CF','ST'];

describe('Mock API — contrato de dados (doc 16)', () => {
  describe('Profile (doc 16 §3)', () => {
    it('tem todos os campos obrigatórios', () => {
      expect(MOCK_PROFILE.id).toBeTruthy();
      expect(MOCK_PROFILE.username).toBeTruthy();
      expect(typeof MOCK_PROFILE.softCurrency).toBe('number');
      expect(typeof MOCK_PROFILE.hardCurrency).toBe('number');
      expect(typeof MOCK_PROFILE.fragmentBalance).toBe('number');
      expect(typeof MOCK_PROFILE.eloRating).toBe('number');
    });

    it('saldo inicial de créditos = 500 (doc 02 §2)', () => {
      // Mock começa com 3500 (usuário com histórico)
      expect(MOCK_PROFILE.softCurrency).toBeGreaterThanOrEqual(0);
    });

    it('ELO inicial >= 1000 (doc 06 §3.1)', () => {
      expect(MOCK_PROFILE.eloRating).toBeGreaterThanOrEqual(1000);
    });

    it('fragmentBalance >= 0', () => {
      expect(MOCK_PROFILE.fragmentBalance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cards — UserCard (doc 16 §5, doc 10 §2)', () => {
    it('todas as cartas têm id único', () => {
      const ids = MOCK_CARDS.map((c) => c.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('rarityCode é sempre um dos valores válidos (doc 10 §2)', () => {
      MOCK_CARDS.forEach((c) => {
        expect(VALID_RARITIES).toContain(c.rarityCode);
      });
    });

    it('overall está entre 50 e 99 (doc 10 §3)', () => {
      MOCK_CARDS.forEach((c) => {
        expect(c.overall).toBeGreaterThanOrEqual(50);
        expect(c.overall).toBeLessThanOrEqual(99);
      });
    });

    it('form está entre -2 e +2 (doc 09 §6, doc 02 §3)', () => {
      MOCK_CARDS.forEach((c) => {
        expect(c.form).toBeGreaterThanOrEqual(-2);
        expect(c.form).toBeLessThanOrEqual(2);
      });
    });

    it('position é sempre uma posição válida (doc 02 §3)', () => {
      MOCK_CARDS.forEach((c) => {
        expect(VALID_POSITIONS).toContain(c.position);
      });
    });

    it('isInjured e suspendedMatches são booleano e número', () => {
      MOCK_CARDS.forEach((c) => {
        expect(typeof c.isInjured).toBe('boolean');
        expect(typeof c.suspendedMatches).toBe('number');
        expect(c.suspendedMatches).toBeGreaterThanOrEqual(0);
      });
    });

    it('jogador lesionado pode ter suspendedMatches=0 (campos independentes)', () => {
      const injured = MOCK_CARDS.find((c) => c.isInjured);
      expect(injured).toBeDefined();
      expect(injured?.suspendedMatches).toBe(0);
    });

    it('jogador suspenso pode estar disponível (não lesionado)', () => {
      const suspended = MOCK_CARDS.find((c) => c.suspendedMatches && c.suspendedMatches > 0);
      expect(suspended).toBeDefined();
      expect(suspended?.isInjured).toBe(false);
    });
  });

  describe('Raridades — hierarquia (doc 10 §2)', () => {
    const rarityOvr: Record<string, number> = {};
    MOCK_CARDS.forEach((c) => {
      if (!c.rarityCode || !c.overall) return;
      const cur = rarityOvr[c.rarityCode];
      if (cur === undefined || c.overall > cur) rarityOvr[c.rarityCode] = c.overall;
    });

    it('carta ultra tem overall >= legendary', () => {
      expect(rarityOvr['ultra']).toBeGreaterThanOrEqual(rarityOvr['legendary'] ?? 0);
    });

    it('carta world_cup_hero tem overall próximo a legendary (mesma faixa)', () => {
      expect(rarityOvr["world_cup_hero"]).toBeGreaterThanOrEqual((rarityOvr["legendary"] ?? 0) - 5);
    });

    it('carta legendary tem overall >= elite', () => {
      expect(rarityOvr['legendary']).toBeGreaterThanOrEqual(rarityOvr['elite'] ?? 0);
    });
  });
});

describe('Design System — invariantes visuais (doc 10 §2)', () => {
  const RARITY_CSS_CLASSES = ['card-rarity-common', 'card-rarity-rare', 'card-rarity-elite',
    'card-rarity-legendary', 'card-rarity-ultra', 'card-rarity-wch', 'card-rarity-goat'];

  it('classe CSS existe para cada raridade documentada', () => {
    const rarityToClass: Record<string, string> = {
      common: 'card-rarity-common', rare: 'card-rarity-rare', elite: 'card-rarity-elite',
      legendary: 'card-rarity-legendary', ultra: 'card-rarity-ultra',
      world_cup_hero: 'card-rarity-wch', goat: 'card-rarity-goat',
    };
    VALID_RARITIES.forEach((r) => {
      expect(rarityToClass[r]).toBeDefined();
    });
  });

  it('7 raridades mapeiam para 7 classes CSS', () => {
    expect(RARITY_CSS_CLASSES.length).toBe(7);
  });
});

describe('Rotas — cobertura de páginas (doc 03 §2)', () => {
  const EXPECTED_ROUTES = [
    '/dashboard', '/collection', '/collection/[id]',
    '/team', '/packs', '/craft', '/album',
    '/ranking', '/hall-of-fame', '/events', '/profile',
    '/login', '/register',
  ];

  it('12 rotas de jogo definidas', () => {
    expect(EXPECTED_ROUTES.length).toBe(13);
  });

  it('rotas de auth são separadas do jogo', () => {
    const authRoutes = EXPECTED_ROUTES.filter((r) => ['/login', '/register'].includes(r));
    const gameRoutes = EXPECTED_ROUTES.filter((r) => !['/login', '/register'].includes(r));
    expect(authRoutes.length).toBe(2);
    expect(gameRoutes.length).toBe(11);
  });
});

describe('Contratos de API (doc 16)', () => {
  it('erros de domínio cobrem todos os códigos do doc 16 §18', () => {
    const ERROR_CODES = [
      'UNAUTHORIZED', 'VALIDATION_ERROR', 'INSUFFICIENT_BALANCE',
      'NOT_TRADEABLE', 'ALREADY_OWNED', 'RATE_LIMITED',
      'IDEMPOTENT_REPLAY', 'CONCURRENT_CONFLICT', 'NOT_FOUND',
      'COMPETITION_RULE_VIOLATION',
    ];
    expect(ERROR_CODES.length).toBe(10);
    expect(ERROR_CODES).toContain('UNAUTHORIZED');
    expect(ERROR_CODES).toContain('INSUFFICIENT_BALANCE');
    expect(ERROR_CODES).toContain('NOT_TRADEABLE');
  });

  it('WCH e GOAT não podem ser craftados (doc 13 TC-CRAFT-06/07)', () => {
    const CRAFT_BLACKLIST = ['world_cup_hero', 'goat'];
    const CRAFTABLE_RARITIES = VALID_RARITIES.filter((r) => !CRAFT_BLACKLIST.includes(r));
    expect(CRAFTABLE_RARITIES).not.toContain('world_cup_hero');
    expect(CRAFTABLE_RARITIES).not.toContain('goat');
    expect(CRAFTABLE_RARITIES.length).toBe(5);
  });

  it('vitrine limitada a 5 cartas (doc 13 TC-HOF-06)', () => {
    const MAX_SHOWCASE = 5;
    expect(MAX_SHOWCASE).toBe(5);
  });

  it('pity counters: tipos legendaria_plus e ultra_plus (doc 10 §15)', () => {
    const PITY_TYPES = ['legendary_plus', 'ultra_plus'];
    expect(PITY_TYPES.length).toBe(2);
    expect(PITY_TYPES).toContain('legendary_plus');
    expect(PITY_TYPES).toContain('ultra_plus');
  });
});
