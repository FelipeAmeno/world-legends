import type { CollectionCard } from '@/lib/collection-data';
import { type BuildHomeV2ViewModelInput, buildHomeV2ViewModel } from '@/lib/home-v2/view-model';
import { describe, expect, it } from 'vitest';

function card(overrides: Partial<CollectionCard> & { cardId: string }): CollectionCard {
  return {
    playerId: overrides.cardId,
    displayName: overrides.cardId,
    fullName: overrides.cardId,
    nationality: 'BRA',
    flagEmoji: '🇧🇷',
    position: 'ST',
    overall: 80,
    rarityCode: 'rare',
    rarityLabel: 'Rare',
    editionCode: 'base',
    attributes: {},
    traits: [],
    bioShort: '',
    era: '2020s',
    ...overrides,
  } as CollectionCard;
}

function baseInput(overrides: Partial<BuildHomeV2ViewModelInput> = {}): BuildHomeV2ViewModelInput {
  return {
    profile: { username: 'felipe4', displayName: null, softCurrency: 1000, fragmentBalance: 20 },
    collection: [],
    favoriteCardIds: [],
    squadSummary: null,
    matchStats: { wins: 0, draws: 0, losses: 0, recentMatches: [] },
    progression: { level: 1, xp: 0, xpForNext: 100 },
    catalogCount: 200,
    availablePackNames: ['Classic Pack'],
    ...overrides,
  };
}

describe('Sprint 43F — home-v2/view-model (agregação pura, sem I/O, sem duplicar fonte de verdade)', () => {
  it('142. highlightedCards vem do seletor real (selectTopCards), nunca de dados mock', () => {
    const collection = [
      card({ cardId: 'a', overall: 70 }),
      card({ cardId: 'b', overall: 95 }),
      card({ cardId: 'c', overall: 85 }),
      card({ cardId: 'd', overall: 60 }),
    ];
    const vm = buildHomeV2ViewModel(baseInput({ collection }));
    expect(vm.highlightedCards.map((c) => c.cardId)).toEqual(['b', 'c', 'a']);
  });

  it('143. coleção vazia produz highlightedCards vazio — estado vazio intencional, nunca cartas mock de preenchimento', () => {
    const vm = buildHomeV2ViewModel(baseInput({ collection: [] }));
    expect(vm.highlightedCards).toEqual([]);
  });

  it('144. username usa displayName quando presente, senão username; nunca um placeholder fabricado quando o profile existe', () => {
    const vm1 = buildHomeV2ViewModel(
      baseInput({
        profile: {
          username: 'felipe4',
          displayName: 'Felipe',
          softCurrency: 0,
          fragmentBalance: 0,
        },
      }),
    );
    expect(vm1.userSummary.username).toBe('Felipe');
    const vm2 = buildHomeV2ViewModel(
      baseInput({
        profile: { username: 'felipe4', displayName: null, softCurrency: 0, fragmentBalance: 0 },
      }),
    );
    expect(vm2.userSummary.username).toBe('felipe4');
  });

  it('145. profile ausente nunca lança — cai num fallback honesto, moedas zeradas (nunca inventadas)', () => {
    const vm = buildHomeV2ViewModel(baseInput({ profile: null }));
    expect(vm.currencies).toEqual({ softCurrency: 0, fragmentBalance: 0 });
    expect(vm.userSummary.username).toBe('Treinador');
  });

  it('146. winRate é derivado real (wins / total), nunca fabricado; total zero nunca divide por zero', () => {
    const vmZero = buildHomeV2ViewModel(baseInput());
    expect(vmZero.playSummary.winRate).toBe(0);

    const vm = buildHomeV2ViewModel(
      baseInput({ matchStats: { wins: 3, draws: 1, losses: 1, recentMatches: [] } }),
    );
    expect(vm.playSummary.winRate).toBe(0.6);
  });

  it('147. squadSummary nulo é preservado como estado vazio real, nunca substituído por um squad fabricado', () => {
    const vm = buildHomeV2ViewModel(baseInput({ squadSummary: null }));
    expect(vm.squadSummary).toBeNull();
  });

  it('148. squadSummary real é passado adiante sem alteração', () => {
    const vm = buildHomeV2ViewModel(
      baseInput({ squadSummary: { formation: '4-3-3', overall: 84, chemistry: 91 } }),
    );
    expect(vm.squadSummary).toEqual({ formation: '4-3-3', overall: 84, chemistry: 91 });
  });

  it('149. completionPercent é derivado real (ownedCount / catalogCount), nunca fabricado; catálogo zero nunca divide por zero', () => {
    const vm = buildHomeV2ViewModel(
      baseInput({ collection: [card({ cardId: 'a' })], catalogCount: 200 }),
    );
    expect(vm.collectionSummary).toEqual({
      ownedCount: 1,
      catalogCount: 200,
      completionPercent: 1,
    });

    const vmNoCatalog = buildHomeV2ViewModel(baseInput({ catalogCount: 0 }));
    expect(vmNoCatalog.collectionSummary.completionPercent).toBe(0);
  });

  it('150. marketplaceSummary é sempre { readOnly: true } — nunca inclui uma listagem, preço ou atividade', () => {
    const vm = buildHomeV2ViewModel(baseInput());
    expect(vm.marketplaceSummary).toEqual({ readOnly: true });
    expect(Object.keys(vm.marketplaceSummary)).toEqual(['readOnly']);
  });

  it('151. packSummary.ownedUnopenedCount é sempre null — nunca 0 fabricado (0 significaria "sabemos que você tem zero", que é falso)', () => {
    const vm = buildHomeV2ViewModel(baseInput());
    expect(vm.packSummary.ownedUnopenedCount).toBeNull();
  });

  it('152. featureAvailability marca marketplaceTransactions/packInventory/leagueMode/worldCupMode como false — nunca omitido, nunca true sem a capacidade existir', () => {
    const vm = buildHomeV2ViewModel(baseInput());
    expect(vm.featureAvailability).toEqual({
      marketplaceTransactions: false,
      packInventory: false,
      leagueMode: false,
      worldCupMode: false,
    });
  });

  it('153. recentResult vem do primeiro item real de recentMatches, null quando vazio', () => {
    const vmEmpty = buildHomeV2ViewModel(baseInput());
    expect(vmEmpty.playSummary.recentResult).toBeNull();

    const recent = {
      outcome: 'win' as const,
      opponent: 'CPU',
      homeScore: 2,
      awayScore: 1,
      date: '2026-07-16',
    };
    const vm = buildHomeV2ViewModel(
      baseInput({ matchStats: { wins: 1, draws: 0, losses: 0, recentMatches: [recent] } }),
    );
    expect(vm.playSummary.recentResult).toEqual(recent);
  });

  it('154. usuário com exatamente 2 cartas produz highlightedCards com 2 itens (nunca completado com carta mock)', () => {
    const collection = [card({ cardId: 'a', overall: 90 }), card({ cardId: 'b', overall: 80 })];
    const vm = buildHomeV2ViewModel(baseInput({ collection }));
    expect(vm.highlightedCards).toHaveLength(2);
  });

  it('155. usuário com exatamente 1 carta produz highlightedCards com 1 item', () => {
    const collection = [card({ cardId: 'a', overall: 90 })];
    const vm = buildHomeV2ViewModel(baseInput({ collection }));
    expect(vm.highlightedCards).toHaveLength(1);
  });

  it('156. packSummary.canPurchase é false quando nenhum pack real está disponível — nunca inventa um pack pra parecer disponível', () => {
    const vm = buildHomeV2ViewModel(baseInput({ availablePackNames: [] }));
    expect(vm.packSummary.canPurchase).toBe(false);
    expect(vm.packSummary.availablePackNames).toEqual([]);
  });
});
