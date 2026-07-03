/**
 * @world-legends/persistence — In-memory adapter smoke tests
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  MemAchievementRepository,
  MemCollectionRepository,
  MemMatchRepository,
  MemPackRepository,
  MemSquadRepository,
  MemUserRepository,
  createRegistry,
  getRegistry,
  resetRegistry,
} from '../src/index';

// ─── MemUserRepository ────────────────────────────────────────────────────────

describe('MemUserRepository', () => {
  let repo: MemUserRepository;

  beforeEach(() => {
    repo = new MemUserRepository();
  });

  it('returns null for unknown user', async () => {
    const r = await repo.findById('unknown');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeNull();
  });

  it('upserts and retrieves a user', async () => {
    await repo.upsert({
      id: 'u1',
      username: 'alice',
      level: 1,
      xp: 0,
      credits: 100,
      fragments: 0,
      premium: 0,
    });
    const found = await repo.findById('u1');
    expect(found.ok).toBe(true);
    if (found.ok) {
      expect(found.value?.id).toBe('u1');
      expect(found.value?.username).toBe('alice');
    }
  });

  it('upsert is idempotent (updates existing)', async () => {
    await repo.upsert({
      id: 'u1',
      username: 'alice',
      level: 1,
      xp: 0,
      credits: 100,
      fragments: 0,
      premium: 0,
    });
    const r = await repo.upsert({
      id: 'u1',
      username: 'alice-v2',
      level: 2,
      xp: 0,
      credits: 200,
      fragments: 0,
      premium: 0,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.username).toBe('alice-v2');
  });
});

// ─── MemCollectionRepository ──────────────────────────────────────────────────

describe('MemCollectionRepository', () => {
  let repo: MemCollectionRepository;

  beforeEach(() => {
    repo = new MemCollectionRepository();
  });

  it('returns empty array for user with no cards', async () => {
    const r = await repo.findByUserId('u1');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(0);
  });

  it('adds and retrieves a card', async () => {
    const r = await repo.addCard({
      user_id: 'u1',
      card_id: 'c1',
      obtained_at: new Date().toISOString(),
      source: 'pack',
    });
    expect(r.ok).toBe(true);

    const cards = await repo.findByUserId('u1');
    expect(cards.ok).toBe(true);
    if (cards.ok) expect(cards.value).toHaveLength(1);
  });

  it('finds card by id', async () => {
    const added = await repo.addCard({
      user_id: 'u1',
      card_id: 'c1',
      obtained_at: new Date().toISOString(),
      source: 'pack',
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;

    const found = await repo.findById(added.value.id);
    expect(found.ok).toBe(true);
    if (found.ok) expect(found.value?.card_id).toBe('c1');
  });

  it('counts cards by user', async () => {
    await repo.addCard({
      user_id: 'u1',
      card_id: 'c1',
      obtained_at: new Date().toISOString(),
      source: 'pack',
    });
    await repo.addCard({
      user_id: 'u1',
      card_id: 'c2',
      obtained_at: new Date().toISOString(),
      source: 'craft',
    });
    const r = await repo.countByUserId('u1');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(2);
  });
});

// ─── MemSquadRepository ───────────────────────────────────────────────────────

describe('MemSquadRepository', () => {
  let repo: MemSquadRepository;

  beforeEach(() => {
    repo = new MemSquadRepository();
  });

  it('returns null for user with no squad', async () => {
    const r = await repo.findByUserId('u1');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeNull();
  });

  it('upserts and retrieves a squad', async () => {
    const slots: import('../src/index').SquadSlotJson[] = [];
    await repo.upsert({ user_id: 'u1', slots });
    const r = await repo.findByUserId('u1');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value?.user_id).toBe('u1');
  });
});

// ─── MemMatchRepository ───────────────────────────────────────────────────────

describe('MemMatchRepository', () => {
  let repo: MemMatchRepository;

  beforeEach(() => {
    repo = new MemMatchRepository();
  });

  it('creates a match and retrieves it', async () => {
    const r = await repo.create({
      user_id: 'u1',
      opponent_id: 'u2',
      played_at: new Date().toISOString(),
      outcome: 'win',
      user_score: 3,
      opponent_score: 1,
      xp_earned: 50,
      credits_earned: 100,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const history = await repo.findByUserId('u1', 10);
    expect(history.ok).toBe(true);
    if (history.ok) expect(history.value).toHaveLength(1);
  });

  it('returns empty history for new user', async () => {
    const r = await repo.findByUserId('u1', 10);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(0);
  });

  it('returns match stats', async () => {
    const r = await repo.getStats('u1');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.totalMatches).toBe(0);
      expect(r.value.wins).toBe(0);
    }
  });
});

// ─── MemPackRepository ────────────────────────────────────────────────────────

describe('MemPackRepository', () => {
  let repo: MemPackRepository;

  beforeEach(() => {
    repo = new MemPackRepository();
  });

  it('creates a pack opening record', async () => {
    const r = await repo.create({
      user_id: 'u1',
      pack_type: 'starter',
      opened_at: new Date().toISOString(),
      card_ids: ['c1', 'c2', 'c3'],
      credits_spent: 500,
    });
    expect(r.ok).toBe(true);
  });

  it('returns empty history for new user', async () => {
    const r = await repo.findByUserId('u1', 10);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(0);
  });
});

// ─── MemAchievementRepository ─────────────────────────────────────────────────

describe('MemAchievementRepository', () => {
  let repo: MemAchievementRepository;

  beforeEach(() => {
    repo = new MemAchievementRepository();
  });

  it('returns empty list for new user', async () => {
    const r = await repo.findByUserId('u1');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(0);
  });

  it('claims an achievement', async () => {
    const r = await repo.claim({
      user_id: 'u1',
      achievement_id: 'first_win',
      unlocked_at: new Date().toISOString(),
    });
    expect(r.ok).toBe(true);

    const found = await repo.findByUserId('u1');
    expect(found.ok).toBe(true);
    if (found.ok) expect(found.value).toHaveLength(1);
  });
});

// ─── Registry ─────────────────────────────────────────────────────────────────

describe('PersistenceRegistry', () => {
  beforeEach(() => {
    resetRegistry();
  });

  it('createRegistry returns memory adapters', () => {
    const reg = createRegistry('memory');
    expect(reg.users).toBeInstanceOf(MemUserRepository);
    expect(reg.collection).toBeInstanceOf(MemCollectionRepository);
    expect(reg.squads).toBeInstanceOf(MemSquadRepository);
    expect(reg.matches).toBeInstanceOf(MemMatchRepository);
    expect(reg.packs).toBeInstanceOf(MemPackRepository);
    expect(reg.achievements).toBeInstanceOf(MemAchievementRepository);
  });

  it('getRegistry returns memory adapter when no env vars set', () => {
    const reg = getRegistry();
    expect(reg.users).toBeInstanceOf(MemUserRepository);
  });

  it('getRegistry returns same instance (singleton)', () => {
    const r1 = getRegistry();
    const r2 = getRegistry();
    expect(r1).toBe(r2);
  });

  it('resetRegistry clears singleton', () => {
    const r1 = getRegistry();
    resetRegistry();
    const r2 = getRegistry();
    expect(r1).not.toBe(r2);
  });
});
