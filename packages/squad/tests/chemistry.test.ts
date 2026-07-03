/**
 * Testes de `calculateChemistry` — TC-SQUAD-30..38
 */
import { describe, expect, it } from 'vitest';
import { positionFitScore } from '../src/positions/compatibility';
import { makePlantel, makePlayer, makeResolver } from '../src/testing/fixtures';
import type { PlayerInfo, Squad } from '../src/types/types';
import { addPlayer } from '../src/use-cases/addPlayer';
import { calculateChemistryUseCase } from '../src/use-cases/calculateChemistry';
import { createSquad } from '../src/use-cases/createSquad';

let seq = 0;
const nextId = () => `ch-${++seq}`;

function buildCompleteSquad(plantel: PlayerInfo[]): Squad {
  const resolver = makeResolver(plantel);
  const r = createSquad({ userId: 'user-001', formation: '4-3-3', generateId: nextId });
  if (!r.ok) throw new Error('createSquad falhou');

  const slots = [
    'GK-1',
    'RB-1',
    'CB-1',
    'CB-2',
    'LB-1',
    'CM-1',
    'CM-2',
    'CM-3',
    'RW-1',
    'ST-1',
    'LW-1',
  ];
  const cards = [
    'uc-gk',
    'uc-rb',
    'uc-cb1',
    'uc-cb2',
    'uc-lb',
    'uc-cm1',
    'uc-cm2',
    'uc-cm3',
    'uc-rw',
    'uc-st',
    'uc-lw',
  ];

  let squad = r.value;
  for (let i = 0; i < 11; i++) {
    const a = addPlayer({
      squad,
      userCardId: cards[i]!,
      slotId: slots[i]!,
      resolvePlayer: resolver,
    });
    if (!a.ok) throw new Error(`Starter ${i}: ${JSON.stringify(a.error)}`);
    squad = a.value;
  }
  return squad;
}

describe('positionFitScore', () => {
  it('posição natural retorna 4', () => {
    expect(positionFitScore('GK', 'GK')).toBe(4);
    expect(positionFitScore('ST', 'ST')).toBe(4);
    expect(positionFitScore('CB', 'CB')).toBe(4);
    expect(positionFitScore('CM', 'CM')).toBe(4);
  });

  it('posição compatível retorna 2', () => {
    expect(positionFitScore('CM', 'CDM')).toBe(2);
    expect(positionFitScore('ST', 'LW')).toBe(2);
    expect(positionFitScore('CDM', 'CM')).toBe(2);
    expect(positionFitScore('LW', 'ST')).toBe(2);
  });

  it('posição incompatível retorna 0', () => {
    expect(positionFitScore('GK', 'ST')).toBe(0);
    expect(positionFitScore('ST', 'GK')).toBe(0);
    expect(positionFitScore('CB', 'ST')).toBe(0);
  });
});

describe('calculateChemistry', () => {
  describe('TC-SQUAD-30: squad vazio retorna zero', () => {
    it('squad completamente vazio tem química 0', () => {
      const r = createSquad({ userId: 'user-001', formation: '4-3-3', generateId: nextId });
      if (!r.ok) throw new Error();
      const result = calculateChemistryUseCase({ squad: r.value, resolvePlayer: () => null });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.total).toBe(0);
      expect(result.value.average).toBe(0);
    });
  });

  describe('TC-SQUAD-31: squad completo em posições naturais', () => {
    it('total > 0 quando squad está completo com posições naturais', () => {
      const plantel = makePlantel();
      const resolver = makeResolver(plantel);
      const squad = buildCompleteSquad(plantel);
      const result = calculateChemistryUseCase({ squad, resolvePlayer: resolver });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // Squad completo com formação bonus (+2 por jogador) = pelo menos 22 total
      expect(result.value.total).toBeGreaterThan(20);
    });

    it('formationBonus existe quando squad está completo', () => {
      const plantel = makePlantel();
      const resolver = makeResolver(plantel);
      const squad = buildCompleteSquad(plantel);
      const result = calculateChemistryUseCase({ squad, resolvePlayer: resolver });
      if (!result.ok) return;
      expect(result.value.breakdown.formationBonus).toBeGreaterThan(0);
    });
  });

  describe('TC-SQUAD-32: all-Brazilian squad tem nationality bonus', () => {
    it('10 brasileiros geram nationalityBonus > 0', () => {
      // Plantel padrão tem 9 BR nos titulares (uc-cm3 é AR)
      const plantel = makePlantel();
      const resolver = makeResolver(plantel);
      const squad = buildCompleteSquad(plantel);
      const result = calculateChemistryUseCase({ squad, resolvePlayer: resolver });
      if (!result.ok) return;
      expect(result.value.breakdown.nationalityBonus).toBeGreaterThan(0);
    });

    it('seleção BR completa (11 BR) tem nationalityBonus máximo por jogador', () => {
      // Construir plantel todo BR — inclui banco para buildCompleteSquad() não falhar
      const allBR: PlayerInfo[] = [
        makePlayer({
          userCardId: 'uc-gk',
          naturalPosition: 'GK',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-rb',
          naturalPosition: 'RB',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-cb1',
          naturalPosition: 'CB',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-cb2',
          naturalPosition: 'CB',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-lb',
          naturalPosition: 'LB',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-cm1',
          naturalPosition: 'CM',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-cm2',
          naturalPosition: 'CM',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-cm3',
          naturalPosition: 'CM',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-rw',
          naturalPosition: 'RW',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-st',
          naturalPosition: 'ST',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-lw',
          naturalPosition: 'LW',
          userId: 'user-001',
          nationality: 'BR',
        }),
        // Banco BR (exigido por buildCompleteSquad)
        makePlayer({
          userCardId: 'uc-b1',
          naturalPosition: 'GK',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-b2',
          naturalPosition: 'CB',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-b3',
          naturalPosition: 'CM',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-b4',
          naturalPosition: 'ST',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-b5',
          naturalPosition: 'LW',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-b6',
          naturalPosition: 'RB',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-b7',
          naturalPosition: 'CDM',
          userId: 'user-001',
          nationality: 'BR',
        }),
      ];
      const resolver = makeResolver(allBR);
      const squad = buildCompleteSquad(allBR);
      const result = calculateChemistryUseCase({ squad, resolvePlayer: resolver });
      if (!result.ok) return;

      // Com 10 companheiros de mesma nação: bonus = 4 por jogador
      // positionFit natural = 4, formationBonus = 2 → max 10 por jogador
      // Todos deveriam ter 10/10
      const scores = Object.values(result.value.perPlayer);
      expect(scores.every((s) => s === 10)).toBe(true);
      expect(result.value.total).toBe(100);
    });
  });

  describe('TC-SQUAD-33: squad incompleto tem química parcial', () => {
    it('squad com 1 jogador tem total menor que squad completo', () => {
      const gk = makePlayer({ naturalPosition: 'GK', userCardId: 'uc-gk', nationality: 'BR' });
      const r = createSquad({ userId: 'user-001', formation: '4-3-3', generateId: nextId });
      if (!r.ok) throw new Error();
      const added = addPlayer({
        squad: r.value,
        userCardId: 'uc-gk',
        slotId: 'GK-1',
        resolvePlayer: makeResolver([gk]),
      });
      if (!added.ok) throw new Error();
      const result = calculateChemistryUseCase({
        squad: added.value,
        resolvePlayer: makeResolver([gk]),
      });
      if (!result.ok) return;
      // Squad incompleto: formationBonus = 0, nationalityBonus = 0, só positionFit
      // Mas média = sum/11 (não 1), então total baixo
      expect(result.value.total).toBeLessThan(50);
      expect(result.value.breakdown.formationBonus).toBe(0);
    });
  });

  describe('TC-SQUAD-34: perPlayer contém score para cada titular preenchido', () => {
    it('squad com 3 titulares tem 3 entradas em perPlayer', () => {
      const players = [
        makePlayer({
          userCardId: 'uc-gk',
          naturalPosition: 'GK',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-rb',
          naturalPosition: 'RB',
          userId: 'user-001',
          nationality: 'BR',
        }),
        makePlayer({
          userCardId: 'uc-cb1',
          naturalPosition: 'CB',
          userId: 'user-001',
          nationality: 'BR',
        }),
      ];
      const resolver = makeResolver(players);
      const r = createSquad({ userId: 'user-001', formation: '4-3-3', generateId: nextId });
      if (!r.ok) throw new Error();
      let squad = r.value;
      for (const [id, slot] of [
        ['uc-gk', 'GK-1'],
        ['uc-rb', 'RB-1'],
        ['uc-cb1', 'CB-1'],
      ] as const) {
        const a = addPlayer({ squad, userCardId: id, slotId: slot, resolvePlayer: resolver });
        if (!a.ok) throw new Error();
        squad = a.value;
      }
      const result = calculateChemistryUseCase({ squad, resolvePlayer: resolver });
      if (!result.ok) return;
      expect(Object.keys(result.value.perPlayer)).toHaveLength(3);
    });
  });

  describe('TC-SQUAD-35: posição fora do natural → score menor', () => {
    it('CM em CDM tem score menor que CM em CM', () => {
      const cmInCM = makePlayer({
        userCardId: 'uc-cm-a',
        naturalPosition: 'CM',
        userId: 'user-001',
        nationality: 'BR',
      });
      const cmInCdm = makePlayer({
        userCardId: 'uc-cm-b',
        naturalPosition: 'CM',
        userId: 'user-001',
        nationality: 'BR',
      });

      // Squad 4-3-3: slot CM-1 vs squad 4-2-3-1: slot CDM-1
      const r1 = createSquad({ userId: 'user-001', formation: '4-3-3', generateId: nextId });
      const r2 = createSquad({ userId: 'user-001', formation: '4-2-3-1', generateId: nextId });
      if (!r1.ok || !r2.ok) throw new Error();

      const a1 = addPlayer({
        squad: r1.value,
        userCardId: 'uc-cm-a',
        slotId: 'CM-1',
        resolvePlayer: makeResolver([cmInCM]),
      });
      const a2 = addPlayer({
        squad: r2.value,
        userCardId: 'uc-cm-b',
        slotId: 'CDM-1',
        resolvePlayer: makeResolver([cmInCdm]),
      });
      if (!a1.ok || !a2.ok) throw new Error();

      const res1 = calculateChemistryUseCase({
        squad: a1.value,
        resolvePlayer: makeResolver([cmInCM]),
      });
      const res2 = calculateChemistryUseCase({
        squad: a2.value,
        resolvePlayer: makeResolver([cmInCdm]),
      });
      if (!res1.ok || !res2.ok) return;

      const scoreNatural = res1.value.perPlayer['uc-cm-a'] ?? 0;
      const scoreCompatible = res2.value.perPlayer['uc-cm-b'] ?? 0;
      expect(scoreNatural).toBeGreaterThan(scoreCompatible);
    });
  });

  describe('TC-SQUAD-36: chemistry total 0–100', () => {
    it('total está sempre no intervalo [0, 100]', () => {
      const plantel = makePlantel();
      const resolver = makeResolver(plantel);
      const squad = buildCompleteSquad(plantel);
      const result = calculateChemistryUseCase({ squad, resolvePlayer: resolver });
      if (!result.ok) return;
      expect(result.value.total).toBeGreaterThanOrEqual(0);
      expect(result.value.total).toBeLessThanOrEqual(100);
    });
  });

  describe('TC-SQUAD-37: average ≈ total / 10', () => {
    it('average é coerente com total', () => {
      const plantel = makePlantel();
      const resolver = makeResolver(plantel);
      const squad = buildCompleteSquad(plantel);
      const result = calculateChemistryUseCase({ squad, resolvePlayer: resolver });
      if (!result.ok) return;
      // total = round(average * 10), então total/10 ≈ average
      expect(Math.abs(result.value.total / 10 - result.value.average)).toBeLessThan(0.2);
    });
  });

  describe('TC-SQUAD-38: breakdown.positionFit coerente', () => {
    it('positionFit é soma dos fits individuais', () => {
      const plantel = makePlantel();
      const resolver = makeResolver(plantel);
      const squad = buildCompleteSquad(plantel);
      const result = calculateChemistryUseCase({ squad, resolvePlayer: resolver });
      if (!result.ok) return;
      // 11 jogadores em posições naturais → cada um tem fit 4 → soma 44
      expect(result.value.breakdown.positionFit).toBe(44);
    });
  });
});
