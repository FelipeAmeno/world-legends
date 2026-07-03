import { describe, expect, it } from 'vitest';
import {
  CARLOS_ALBERTO,
  CARLOS_ALBERTO_COMMON,
  CARLOS_ALBERTO_RARE,
  MARADONA,
  MARADONA_LEGENDARY,
  MARADONA_ULTRA,
  MARADONA_WORLD_CUP_HERO,
  PELE,
  PELE_LEGENDARY,
  PELE_PRIME,
  PELE_ULTRA,
  PELE_WORLD_CUP_HERO,
  RONALDO,
  RONALDO_ELITE,
  RONALDO_EVENT_2002,
  RONALDO_LEGENDARY,
  RONALDO_ULTRA,
  RONALDO_WORLD_CUP_HERO,
  buildDemoCatalog,
} from '../../fixtures/historical-cards';
import { createCardCatalog } from '../../src/catalog/card-catalog';
import { createPlayerCatalog } from '../../src/catalog/player-catalog';

describe('CardCatalog — unicidade (playerId, rarityCode) (doc 17 §5, doc 10 §3)', () => {
  it('registra cartas sem duplicata com sucesso', () => {
    const catalog = createCardCatalog();
    expect(catalog.register(CARLOS_ALBERTO_COMMON).ok).toBe(true);
    expect(catalog.register(CARLOS_ALBERTO_RARE).ok).toBe(true);
  });

  it('rejeita (playerId, rarityCode) duplicado', () => {
    const catalog = createCardCatalog();
    catalog.register(PELE_LEGENDARY);
    const dup = catalog.register(PELE_LEGENDARY);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.kind).toBe('DuplicateCardError');
  });

  it('prime NÃO conta no limite das 6 cartas-base por jogador (doc 10 §3)', () => {
    const catalog = createCardCatalog();
    catalog.register(PELE_LEGENDARY);
    catalog.register(PELE_ULTRA);
    catalog.register(PELE_WORLD_CUP_HERO);
    // Prime tem (playerId, rarityCode=legendary, editionCode=prime) — chave diferente de base
    const primeResult = catalog.register(PELE_PRIME);
    expect(primeResult.ok).toBe(true);
    // Prime não conta no limite de base cards (só edições base/goat contam)
    expect(catalog.size()).toBe(4);
  });

  it('findByPlayerAndRarity retorna a carta correta', () => {
    const catalog = createCardCatalog();
    catalog.register(PELE_LEGENDARY);
    catalog.register(PELE_ULTRA);
    const found = catalog.findByPlayerAndRarity(PELE.id, 'legendary');
    expect(found).not.toBeNull();
    if (found !== null) expect(found.id).toBe(PELE_LEGENDARY.id);
  });

  it('findByPlayer retorna apenas cartas do jogador solicitado', () => {
    const catalog = createCardCatalog();
    catalog.register(PELE_LEGENDARY);
    catalog.register(PELE_ULTRA);
    catalog.register(MARADONA_LEGENDARY);
    const peleCards = catalog.findByPlayer(PELE.id);
    const maradonaCards = catalog.findByPlayer(MARADONA.id);
    expect(peleCards.length).toBe(2);
    expect(maradonaCards.length).toBe(1);
  });

  it('listActive retorna só cartas ativas', () => {
    const catalog = createCardCatalog();
    catalog.register(PELE_LEGENDARY);
    const actives = catalog.listActive();
    expect(actives.length).toBe(1);
  });

  it('findById retorna null para ID inexistente', () => {
    const catalog = createCardCatalog();
    expect(catalog.findById('inexistente' as never)).toBeNull();
  });
});

describe('PlayerCatalog — busca e invariantes (doc 17 §3)', () => {
  it('findByNationality retorna jogadores brasileiros', () => {
    const catalog = createPlayerCatalog();
    catalog.register(PELE);
    catalog.register(MARADONA);
    catalog.register(RONALDO);
    const brs = catalog.findByNationality('BR');
    expect(brs.length).toBe(2); // Pelé e Ronaldo
  });

  it('findByPosition encontra via posição primária E secundária', () => {
    const catalog = createPlayerCatalog();
    catalog.register(MARADONA); // CAM primary, CF secondary
    const caMs = catalog.findByPosition('CAM');
    const cFs = catalog.findByPosition('CF');
    expect(caMs.length).toBe(1);
    expect(cFs.length).toBe(1); // via secondary
  });

  it('rejeita duplicata de playerId', () => {
    const catalog = createPlayerCatalog();
    catalog.register(PELE);
    const dup = catalog.register(PELE);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.kind).toBe('DuplicatePlayerError');
  });

  it('findByName funciona com match parcial (case-insensitive)', () => {
    const catalog = createPlayerCatalog();
    catalog.register(PELE);
    catalog.register(MARADONA);
    const found = catalog.findByName('pelé');
    expect(found.length).toBe(1);
    expect(found[0]?.knownAs).toBe('Pelé');
  });
});

describe('buildDemoCatalog — catálogo histórico completo', () => {
  it('carrega 5 jogadores e todas as cartas sem erro', () => {
    const demo = buildDemoCatalog();
    expect(demo.players.size()).toBe(5);
    expect(demo.cards.size()).toBeGreaterThan(14);
  });

  it('World Cup Hero de Maradona referencia Copa 1986', () => {
    const demo = buildDemoCatalog();
    const wch = demo.cards.findByPlayerAndRarity(MARADONA.id, 'world_cup_hero');
    expect(wch).not.toBeNull();
    if (wch !== null && wch.tournamentContext !== null) {
      expect(wch.tournamentContext.year).toBe(1986);
    }
  });

  it('Ronaldo Event 2002 tem metadados corretos', () => {
    const demo = buildDemoCatalog();
    const found = demo.cards.findById(RONALDO_EVENT_2002.id);
    expect(found).not.toBeNull();
    if (found !== null && found.editionMetadata.kind === 'event') {
      expect(found.editionMetadata.mayReturn).toBe(true);
      expect(found.editionMetadata.casualModeBonus).toBe(3);
    }
  });

  it('Carlos Alberto tem cartas Common e Rare no catálogo', () => {
    const demo = buildDemoCatalog();
    const common = demo.cards.findByPlayerAndRarity(CARLOS_ALBERTO.id, 'common');
    const rare = demo.cards.findByPlayerAndRarity(CARLOS_ALBERTO.id, 'rare');
    expect(common).not.toBeNull();
    expect(rare).not.toBeNull();
  });
});
