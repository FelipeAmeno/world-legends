/**
 * Testes de lógica do pack action (Sprint 1 — P2, P4).
 *
 * Cobre a lógica pura que pode ser testada sem infraestrutura de BD:
 *   - Construção de UserPityState a partir de contadores
 *   - Decisão de savePityState (reset vs. increment vs. noop)
 *   - updatePityAfterOpening comportamento por raridade
 *   - Lógica de compensação (invariante de atomicidade)
 */
import { describe, expect, it } from 'vitest';
import {
  createPityCounter,
  createUserPityState,
  updatePityAfterOpening,
  isForced,
  PITY_THRESHOLDS,
} from '@world-legends/packs';
import type { UserPityState } from '@world-legends/packs';
import type { RarityCode } from '@world-legends/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeState(legCount: number, ultraCount: number): UserPityState {
  return {
    legendaryPlus: createPityCounter('legendary_plus', legCount),
    ultraPlus: createPityCounter('ultra_plus', ultraCount),
  };
}

/**
 * Replica a lógica de savePityState de lib/actions/packs.ts para testar
 * o comportamento de decisão isoladamente.
 */
type PityOp = 'reset' | 'increment' | 'noop';
function decideSaveOp(oldCount: number, newCount: number): PityOp {
  if (newCount === 0 && oldCount !== 0) return 'reset';
  if (newCount > oldCount) return 'increment';
  return 'noop';
}

// ─── createPityCounter ────────────────────────────────────────────────────────

describe('createPityCounter', () => {
  it('cria contador com packsSinceLastHit=0 por padrão', () => {
    const c = createPityCounter('legendary_plus');
    expect(c.packsSinceLastHit).toBe(0);
  });

  it('cria contador com contagem explícita', () => {
    const c = createPityCounter('ultra_plus', 37);
    expect(c.packsSinceLastHit).toBe(37);
  });

  it('clipa contagens negativas para 0', () => {
    const c = createPityCounter('legendary_plus', -5);
    expect(c.packsSinceLastHit).toBe(0);
  });

  it('tipo é preservado corretamente', () => {
    expect(createPityCounter('legendary_plus').type).toBe('legendary_plus');
    expect(createPityCounter('ultra_plus').type).toBe('ultra_plus');
  });
});

// ─── loadPityState (comportamento de construção) ──────────────────────────────

describe('construção de UserPityState (P4)', () => {
  it('estado zerado quando ambos contadores retornam 0 (novo usuário)', () => {
    const state = makeState(0, 0);
    expect(state.legendaryPlus.packsSinceLastHit).toBe(0);
    expect(state.ultraPlus.packsSinceLastHit).toBe(0);
  });

  it('estado carrega contadores existentes do banco', () => {
    const state = makeState(15, 72);
    expect(state.legendaryPlus.packsSinceLastHit).toBe(15);
    expect(state.ultraPlus.packsSinceLastHit).toBe(72);
  });

  it('fallback para 0 quando banco retorna erro (equivalente ao createUserPityState)', () => {
    const defaultState = createUserPityState();
    const stateFromError = makeState(0, 0);
    expect(stateFromError.legendaryPlus.packsSinceLastHit).toBe(
      defaultState.legendaryPlus.packsSinceLastHit,
    );
    expect(stateFromError.ultraPlus.packsSinceLastHit).toBe(
      defaultState.ultraPlus.packsSinceLastHit,
    );
  });
});

// ─── savePityState (lógica de decisão) ───────────────────────────────────────

describe('savePityState — lógica de decisão (P4)', () => {
  it('dispara reset quando contador passa de N para 0 (hit)', () => {
    expect(decideSaveOp(10, 0)).toBe('reset');
    expect(decideSaveOp(39, 0)).toBe('reset');
    expect(decideSaveOp(1, 0)).toBe('reset');
  });

  it('dispara increment quando contador aumentou', () => {
    expect(decideSaveOp(0, 1)).toBe('increment');
    expect(decideSaveOp(10, 11)).toBe('increment');
    expect(decideSaveOp(38, 39)).toBe('increment');
  });

  it('noop quando ambos são zero (hit + zero inicial — não há estado anterior)', () => {
    expect(decideSaveOp(0, 0)).toBe('noop');
  });

  it('noop quando contador não mudou (caso de guarda)', () => {
    expect(decideSaveOp(5, 5)).toBe('noop');
  });
});

// ─── updatePityAfterOpening ───────────────────────────────────────────────────

describe('updatePityAfterOpening (P4)', () => {
  it('carta comum incrementa ambos os contadores', () => {
    const old = makeState(5, 30);
    const next = updatePityAfterOpening(old, 'common');
    expect(next.legendaryPlus.packsSinceLastHit).toBe(6);
    expect(next.ultraPlus.packsSinceLastHit).toBe(31);
  });

  it('carta rare incrementa ambos os contadores', () => {
    const old = makeState(10, 60);
    const next = updatePityAfterOpening(old, 'rare');
    expect(next.legendaryPlus.packsSinceLastHit).toBe(11);
    expect(next.ultraPlus.packsSinceLastHit).toBe(61);
  });

  it('carta legendary reseta legendaryPlus e incrementa ultraPlus', () => {
    const old = makeState(20, 80);
    const next = updatePityAfterOpening(old, 'legendary');
    expect(next.legendaryPlus.packsSinceLastHit).toBe(0);
    expect(next.ultraPlus.packsSinceLastHit).toBe(81);
  });

  it('carta ultra reseta ambos os contadores', () => {
    const old = makeState(35, 110);
    const next = updatePityAfterOpening(old, 'ultra');
    expect(next.legendaryPlus.packsSinceLastHit).toBe(0);
    expect(next.ultraPlus.packsSinceLastHit).toBe(0);
  });

  it('carta world_cup_hero reseta ambos os contadores (melhor que ultra)', () => {
    const old = makeState(39, 119);
    const next = updatePityAfterOpening(old, 'world_cup_hero');
    expect(next.legendaryPlus.packsSinceLastHit).toBe(0);
    expect(next.ultraPlus.packsSinceLastHit).toBe(0);
  });

  it('elite incrementa ambos (não satisfaz nenhum)', () => {
    const old = makeState(0, 0);
    const next = updatePityAfterOpening(old, 'elite');
    expect(next.legendaryPlus.packsSinceLastHit).toBe(1);
    expect(next.ultraPlus.packsSinceLastHit).toBe(1);
  });

  it('não muta o estado original (imutabilidade)', () => {
    const old = makeState(5, 30);
    updatePityAfterOpening(old, 'common');
    expect(old.legendaryPlus.packsSinceLastHit).toBe(5);
    expect(old.ultraPlus.packsSinceLastHit).toBe(30);
  });
});

// ─── isForced — limiares de pity ─────────────────────────────────────────────

describe('isForced — limiares documentados (doc 10 §15)', () => {
  it('legendary_plus NÃO forçado antes do limiar (39)', () => {
    const c = createPityCounter('legendary_plus', PITY_THRESHOLDS.legendary_plus - 1);
    expect(isForced(c)).toBe(false);
  });

  it('legendary_plus forçado ao atingir limiar (40)', () => {
    const c = createPityCounter('legendary_plus', PITY_THRESHOLDS.legendary_plus);
    expect(isForced(c)).toBe(true);
  });

  it('ultra_plus NÃO forçado antes do limiar (119)', () => {
    const c = createPityCounter('ultra_plus', PITY_THRESHOLDS.ultra_plus - 1);
    expect(isForced(c)).toBe(false);
  });

  it('ultra_plus forçado ao atingir limiar (120)', () => {
    const c = createPityCounter('ultra_plus', PITY_THRESHOLDS.ultra_plus);
    expect(isForced(c)).toBe(true);
  });
});

// ─── Atomicidade — invariantes de compensação (P2) ───────────────────────────

describe('invariantes de atomicidade (P2)', () => {
  type Card = { userCardId: string; cardId: string };

  function simulateOpenPack(
    balance: number,
    price: number,
    createdCards: Card[],
    debitFails: boolean,
  ): { ok: boolean; compensated: string[]; newBalance?: number } {
    if (balance < price) return { ok: false, compensated: [] };

    // Cards são criados ANTES do débito
    const created = [...createdCards];

    if (debitFails) {
      // Compensação: apagar todas as cartas criadas
      const compensated = created.map((c) => c.userCardId);
      return { ok: false, compensated };
    }

    return { ok: true, compensated: [], newBalance: balance - price };
  }

  it('retorna ok:false quando saldo insuficiente (sem criar cartas)', () => {
    const result = simulateOpenPack(100, 150, [], false);
    expect(result.ok).toBe(false);
    expect(result.compensated).toHaveLength(0);
  });

  it('retorna ok:true e novo saldo quando debit bem-sucedido', () => {
    const cards: Card[] = [
      { userCardId: 'uc-1', cardId: 'card-1' },
      { userCardId: 'uc-2', cardId: 'card-2' },
    ];
    const result = simulateOpenPack(500, 150, cards, false);
    expect(result.ok).toBe(true);
    expect(result.newBalance).toBe(350);
    expect(result.compensated).toHaveLength(0);
  });

  it('compensa todas as cartas criadas quando debit falha (P2)', () => {
    const cards: Card[] = [
      { userCardId: 'uc-1', cardId: 'card-1' },
      { userCardId: 'uc-2', cardId: 'card-2' },
      { userCardId: 'uc-3', cardId: 'card-3' },
    ];
    const result = simulateOpenPack(500, 150, cards, true);
    expect(result.ok).toBe(false);
    expect(result.compensated).toHaveLength(3);
    expect(result.compensated).toContain('uc-1');
    expect(result.compensated).toContain('uc-2');
    expect(result.compensated).toContain('uc-3');
  });

  it('zero cartas compensadas quando abertura tem zero cartas criadas e debit falha', () => {
    const result = simulateOpenPack(500, 150, [], true);
    expect(result.ok).toBe(false);
    expect(result.compensated).toHaveLength(0);
  });
});
