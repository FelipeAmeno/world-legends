import { describe, expect, it } from 'vitest';
import { MARADONA_PLAYER_INPUT, PELE_PLAYER_INPUT } from '../../fixtures/historical-players';
import { createPlayer, deactivatePlayer } from '../../src/player/player';

describe('createPlayer — invariantes (doc 17 §3)', () => {
  it('cria Pelé com sucesso', () => {
    const result = createPlayer(PELE_PLAYER_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.knownAs).toBe('Pelé');
      expect(result.value.nationality).toBe('BR');
      expect(result.value.positions.primary).toBe('ST');
      expect(result.value.isActive).toBe(true);
    }
  });

  it('cria Maradona com posição primária CAM e secundárias CF/LW', () => {
    const result = createPlayer(MARADONA_PLAYER_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.positions.primary).toBe('CAM');
      expect(result.value.positions.secondary).toContain('CF');
    }
  });

  it('rejeita era_start > era_end', () => {
    const result = createPlayer({ ...PELE_PLAYER_INPUT, eraStart: 1980, eraEnd: 1970 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe('era');
  });

  it('rejeita posição primária inválida', () => {
    const result = createPlayer({ ...PELE_PLAYER_INPUT, primaryPosition: 'XX' as never });
    expect(result.ok).toBe(false);
  });

  it('rejeita posição primária repetida nas secundárias', () => {
    const result = createPlayer({ ...PELE_PLAYER_INPUT, secondaryPositions: ['ST', 'CF'] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe('secondaryPositions');
  });

  it('rejeita atributo fora de [1, 99]', () => {
    const attrs = { ...PELE_PLAYER_INPUT.baseAttributes, finishing: 100 };
    const result = createPlayer({ ...PELE_PLAYER_INPUT, baseAttributes: attrs });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe('baseAttributes.finishing');
  });

  it('rejeita knownAs vazio', () => {
    const result = createPlayer({ ...PELE_PLAYER_INPUT, knownAs: '   ' });
    expect(result.ok).toBe(false);
  });

  it('rejeita heightCm absurdo', () => {
    const result = createPlayer({ ...PELE_PLAYER_INPUT, heightCm: 50 });
    expect(result.ok).toBe(false);
  });

  it('Player é imutável (Object.freeze)', () => {
    const result = createPlayer(PELE_PLAYER_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.isFrozen(result.value)).toBe(true);
    }
  });

  it('deactivatePlayer cria um novo Player com isActive = false (não muta o original)', () => {
    const result = createPlayer(PELE_PLAYER_INPUT);
    if (!result.ok) throw new Error('fixture inválida');
    const original = result.value;
    const deactivated = deactivatePlayer(original);
    expect(original.isActive).toBe(true);
    expect(deactivated.isActive).toBe(false);
    expect(deactivated.knownAs).toBe(original.knownAs);
  });
});
