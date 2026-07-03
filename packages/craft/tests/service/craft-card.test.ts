import { createCollectorPublisher, noopPublisher } from '@world-legends/shared';
import type { EditionCode, RarityCode } from '@world-legends/types';
/**
 * Testes de `craftCard` — cobertura de todos os TCs de craft do doc 13 §10.
 *
 * As "portas" (CardResolver, OwnershipChecker etc.) são implementadas aqui
 * como simples objetos em memória — sem importar nenhum package concreto de
 * cards/collection/economy. Isso valida a lógica pura de craftCard() sem
 * acoplamento a implementações específicas (Ports & Adapters, doc 18 §3.2).
 */
import { describe, expect, it } from 'vitest';
import {
  type CardResolver,
  type FragmentSpender,
  type IdempotencyStore,
  type OwnershipChecker,
  type UserCardCreator,
  craftCard,
} from '../../src/service/craft-card';

// ─── Adapters em memória para os testes ───────────────────────────────────────

function makeCardResolver(
  cards: Record<string, { rarityCode: RarityCode; editionCode: EditionCode }>,
): CardResolver {
  return (cardId) => cards[cardId] ?? null;
}

function makeOwnershipChecker(owned: Set<string>): OwnershipChecker {
  return (_, cardId) => owned.has(cardId);
}

function makeFragmentSpender(initialBalance: number): {
  spender: FragmentSpender;
  getBalance: () => number;
} {
  let balance = initialBalance;
  return {
    spender: (_, amount) => {
      if (balance < amount) return { success: false, have: balance, need: amount };
      balance -= amount;
      return { success: true, newFragmentBalance: balance };
    },
    getBalance: () => balance,
  };
}

function makeUserCardCreator(alreadyCreated: Set<string>): UserCardCreator {
  return ({ cardId }) => {
    if (alreadyCreated.has(cardId)) return { success: false, reason: 'already exists' };
    alreadyCreated.add(cardId);
    return { success: true };
  };
}

function makeIdempotencyStore(): IdempotencyStore {
  const keys = new Set<string>();
  return {
    has: (profileId, key) => keys.has(`${profileId}:${key}`),
    register: (profileId, key) => {
      keys.add(`${profileId}:${key}`);
    },
  };
}

// ─── Fixture padrão ───────────────────────────────────────────────────────────

function setup(
  options: {
    rarityCode?: RarityCode;
    editionCode?: EditionCode;
    initialFragments?: number;
    alreadyOwns?: boolean;
  } = {},
) {
  const {
    rarityCode = 'common',
    editionCode = 'base',
    initialFragments = 9_999,
    alreadyOwns = false,
  } = options;

  const cardId = 'card-001';
  const cardCatalog = { [cardId]: { rarityCode, editionCode } };
  const ownedCards = new Set<string>(alreadyOwns ? [cardId] : []);
  const { spender, getBalance } = makeFragmentSpender(initialFragments);
  const created = new Set<string>();
  const idempotencyStore = makeIdempotencyStore();

  const input = {
    craftRequestId: 'req-001',
    profileId: 'profile-001',
    targetCardId: cardId,
  };

  const ports = {
    cardResolver: makeCardResolver(cardCatalog),
    ownershipChecker: makeOwnershipChecker(ownedCards),
    fragmentSpender: spender,
    userCardCreator: makeUserCardCreator(created),
    publisher: noopPublisher,
    idempotencyStore,
  };

  return { input, ports, getBalance };
}

// ─── TC-CRAFT-01..05: custo correto por raridade ─────────────────────────────

describe('TC-CRAFT-01 — Common: custo = 50 fragmentos exatamente', () => {
  it('debita exatamente 50 e retorna CraftRequest com fragmentCost=50', () => {
    const { input, ports, getBalance } = setup({ rarityCode: 'common', initialFragments: 100 });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fragmentCost).toBe(50);
      expect(result.value.fragmentBalanceAfter).toBe(50);
      expect(getBalance()).toBe(50);
    }
  });
});

describe('TC-CRAFT-02 — Rare: custo = 200 fragmentos', () => {
  it('debita exatamente 200', () => {
    const { input, ports } = setup({ rarityCode: 'rare', initialFragments: 500 });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.fragmentCost).toBe(200);
  });
});

describe('TC-CRAFT-03 — Elite: custo = 600 fragmentos', () => {
  it('debita exatamente 600', () => {
    const { input, ports } = setup({ rarityCode: 'elite', initialFragments: 1_000 });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.fragmentCost).toBe(600);
  });
});

describe('TC-CRAFT-04 — Legendary: custo = 1500 fragmentos', () => {
  it('debita exatamente 1500', () => {
    const { input, ports } = setup({ rarityCode: 'legendary', initialFragments: 2_000 });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.fragmentCost).toBe(1_500);
  });
});

describe('TC-CRAFT-05 — Ultra: custo = 4000 fragmentos', () => {
  it('debita exatamente 4000', () => {
    const { input, ports } = setup({ rarityCode: 'ultra', initialFragments: 5_000 });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.fragmentCost).toBe(4_000);
  });
});

// ─── TC-CRAFT-06: WCH bloqueado ───────────────────────────────────────────────

describe('TC-CRAFT-06 — World Cup Hero: operação bloqueada, sem débito', () => {
  it('retorna Err NotCraftable com reason exclusive_event_drop', () => {
    const { input, ports, getBalance } = setup({
      rarityCode: 'world_cup_hero',
      initialFragments: 99_999,
    });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === 'NotCraftable') {
      expect(result.error.reason).toBe('exclusive_event_drop');
    }
    expect(getBalance()).toBe(99_999); // sem débito
  });

  it('nenhum evento é publicado quando WCH é bloqueado', () => {
    const { input, ports } = setup({ rarityCode: 'world_cup_hero', initialFragments: 99_999 });
    const { publisher, events } = createCollectorPublisher();
    craftCard(input, { ...ports, publisher });
    expect(events.length).toBe(0);
  });
});

// ─── TC-CRAFT-07: GOAT bloqueado ──────────────────────────────────────────────

describe('TC-CRAFT-07 — GOAT: operação bloqueada, sem débito', () => {
  it('edição goat retorna Err NotCraftable com reason exclusive_achievement', () => {
    const { input, ports, getBalance } = setup({
      rarityCode: 'ultra',
      editionCode: 'goat',
      initialFragments: 99_999,
    });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === 'NotCraftable') {
      expect(result.error.reason).toBe('exclusive_achievement');
    }
    expect(getBalance()).toBe(99_999); // sem débito
  });
});

// ─── TC-CRAFT-08: saldo insuficiente ─────────────────────────────────────────

describe('TC-CRAFT-08 — Saldo insuficiente: rejeição integral, sem débito parcial', () => {
  it('1 fragmento abaixo do custo → Err InsufficientFragments', () => {
    const { input, ports, getBalance } = setup({
      rarityCode: 'legendary',
      initialFragments: 1_499,
    });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === 'InsufficientFragments') {
      expect(result.error.have).toBe(1_499);
      expect(result.error.need).toBe(1_500);
    }
    expect(getBalance()).toBe(1_499); // zero débito
  });

  it('saldo zero → Err InsufficientFragments', () => {
    const { input, ports } = setup({ rarityCode: 'common', initialFragments: 0 });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('InsufficientFragments');
  });

  it('nenhum evento publicado em saldo insuficiente', () => {
    const { input, ports } = setup({ rarityCode: 'ultra', initialFragments: 100 });
    const { publisher, events } = createCollectorPublisher();
    craftCard(input, { ...ports, publisher });
    expect(events.length).toBe(0);
  });
});

// ─── TC-CRAFT-09: saldo nunca negativo ───────────────────────────────────────

describe('TC-CRAFT-09 — Saldo de fragmentos nunca negativo', () => {
  it('após craft bem-sucedido, fragmentBalanceAfter = saldo anterior - custo ≥ 0', () => {
    const { input, ports } = setup({ rarityCode: 'elite', initialFragments: 600 });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fragmentBalanceAfter).toBe(0);
      expect(result.value.fragmentBalanceAfter).toBeGreaterThanOrEqual(0);
    }
  });

  it('sequência: 3 crafts consecutivos nunca leva o saldo abaixo de zero', () => {
    const created = new Set<string>();
    const { spender, getBalance } = makeFragmentSpender(500);
    const idempotencyStore = makeIdempotencyStore();
    const baseInput = { profileId: 'p', craftRequestId: 'r' };
    const basePorts = {
      ownershipChecker: ((_: string, cardId: string) => created.has(cardId)) as OwnershipChecker,
      fragmentSpender: spender,
      userCardCreator: makeUserCardCreator(created),
      publisher: noopPublisher,
      idempotencyStore,
    };

    // Common (50), Rare (200), Elite (600 — deve falhar pois saldo restante < 600)
    const cardCatalog1 = {
      c1: { rarityCode: 'common' as RarityCode, editionCode: 'base' as EditionCode },
    };
    const cardCatalog2 = {
      c2: { rarityCode: 'rare' as RarityCode, editionCode: 'base' as EditionCode },
    };
    const cardCatalog3 = {
      c3: { rarityCode: 'elite' as RarityCode, editionCode: 'base' as EditionCode },
    };

    craftCard(
      { ...baseInput, targetCardId: 'c1', craftRequestId: 'r1' },
      { ...basePorts, cardResolver: makeCardResolver(cardCatalog1) },
    );
    craftCard(
      { ...baseInput, targetCardId: 'c2', craftRequestId: 'r2' },
      { ...basePorts, cardResolver: makeCardResolver(cardCatalog2) },
    );
    const r3 = craftCard(
      { ...baseInput, targetCardId: 'c3', craftRequestId: 'r3' },
      { ...basePorts, cardResolver: makeCardResolver(cardCatalog3) },
    );

    expect(r3.ok).toBe(false); // saldo = 250, custo = 600 → falha
    expect(getBalance()).toBeGreaterThanOrEqual(0); // nunca negativo
    expect(getBalance()).toBe(250); // 500 - 50 - 200 = 250
  });
});

// ─── TC-CRAFT-10: alvo já possuído ───────────────────────────────────────────

describe('TC-CRAFT-10 — Alvo já possuído: bloqueado antes de qualquer débito', () => {
  it('retorna Err AlreadyOwned sem debitar fragmentos', () => {
    const { input, ports, getBalance } = setup({ alreadyOwns: true, initialFragments: 9_999 });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('AlreadyOwned');
    expect(getBalance()).toBe(9_999); // sem débito
  });

  it('nenhum evento publicado quando carta já é possuída', () => {
    const { input, ports } = setup({ alreadyOwns: true, initialFragments: 9_999 });
    const { publisher, events } = createCollectorPublisher();
    craftCard(input, { ...ports, publisher });
    expect(events.length).toBe(0);
  });
});

// ─── Sucesso: CraftRequest bem formado ───────────────────────────────────────

describe('craftCard — resultado bem-sucedido', () => {
  it('retorna CraftRequest com todos os campos esperados', () => {
    const { input, ports } = setup({ rarityCode: 'legendary', initialFragments: 2_000 });
    const result = craftCard(input, ports);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.profileId).toBe('profile-001');
      expect(result.value.targetCardId).toBe('card-001');
      expect(result.value.targetRarityCode).toBe('legendary');
      expect(result.value.targetEditionCode).toBe('base');
      expect(result.value.fragmentCost).toBe(1_500);
      expect(result.value.fragmentBalanceAfter).toBe(500);
      expect(Object.isFrozen(result.value)).toBe(true);
    }
  });

  it('publica evento craft_completed após craft bem-sucedido', () => {
    const { input, ports } = setup({ rarityCode: 'rare', initialFragments: 500 });
    const { publisher, events } = createCollectorPublisher();
    craftCard(input, { ...ports, publisher });
    expect(events.length).toBe(1);
    expect(events[0]?.eventType).toBe('craft_completed');
    const payload = events[0]?.payload as Record<string, unknown>;
    expect(payload['fragmentCost']).toBe(200);
    expect(payload['rarityCode']).toBe('rare');
  });
});

// ─── Idempotência (TC-SEC-01) ─────────────────────────────────────────────────

describe('TC-SEC-01 — Idempotência: mesmo idempotencyKey nunca executa segundo débito', () => {
  it('segunda chamada com a mesma key retorna DuplicateRequest', () => {
    const { input, ports } = setup({ rarityCode: 'common', initialFragments: 500 });
    const inputWithKey = { ...input, idempotencyKey: 'k-001' };

    const r1 = craftCard(inputWithKey, ports);
    expect(r1.ok).toBe(true);

    // Segunda tentativa — mesma key, carta diferente para não bater em AlreadyOwned
    const r2 = craftCard(
      { ...inputWithKey, targetCardId: 'card-999', craftRequestId: 'req-002' },
      {
        ...ports,
        cardResolver: makeCardResolver({
          'card-999': { rarityCode: 'common', editionCode: 'base' },
        }),
      },
    );
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.kind).toBe('DuplicateRequest');
  });

  it('idempotencyKey é registrada no resultado', () => {
    const { input, ports } = setup({ rarityCode: 'common', initialFragments: 500 });
    const r = craftCard({ ...input, idempotencyKey: 'key-abc' }, ports);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.idempotencyKey).toBe('key-abc');
  });
});

// ─── Carta não encontrada ─────────────────────────────────────────────────────

describe('craftCard — carta não encontrada no catálogo', () => {
  it('retorna Err CardNotFound para cardId desconhecido', () => {
    const { ports } = setup();
    const result = craftCard(
      { craftRequestId: 'r1', profileId: 'p1', targetCardId: 'inexistente' },
      ports,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('CardNotFound');
  });
});
