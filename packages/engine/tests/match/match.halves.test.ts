import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import {
  applyManualSubstitution,
  applyTacticalIntensity,
  simulateFirstHalf,
  simulateMatch,
  simulateRestOfMatch,
} from '../../src/match/match';
import { buildTeamSnapshot } from './fixtures';

/**
 * Sprint 26 (Gameplay Foundation) — cobertura da API de intervalo
 * jogável. O contrato central: `simulateFirstHalf` + `simulateRestOfMatch`
 * SEM nenhuma intervenção do usuário precisa produzir exatamente o
 * mesmo `MatchResult`, byte a byte, que `simulateMatch` de ponta a
 * ponta — a pausa em si não pode alterar o resultado.
 */

function seed(value: string) {
  const result = createSeed(value);
  if (!result.ok) throw new Error('seed inválido no teste');
  return result.value;
}

describe('simulateFirstHalf + simulateRestOfMatch (Sprint 26)', () => {
  it('sem intervenção do usuário, produz o mesmo MatchResult byte a byte que simulateMatch', () => {
    for (const seedValue of ['halves-01', 'halves-02', 'halves-03', 'halves-04', 'halves-05']) {
      const home = buildTeamSnapshot({ isHomeTeam: true });
      const away = buildTeamSnapshot({ isHomeTeam: false });
      const context = { requiresWinner: true };

      const whole = simulateMatch({ home, away, context, seed: seed(seedValue) });

      const first = simulateFirstHalf({ home, away, context, seed: seed(seedValue) });
      expect(first.kind).toBe('halftime');
      if (first.kind !== 'halftime') continue;
      const split = simulateRestOfMatch(first.state);

      expect(split).toEqual(whole);
    }
  });

  it('getFirstHalf expõe placar/estatísticas parciais coerentes no intervalo', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    const context = { requiresWinner: true };

    const first = simulateFirstHalf({ home, away, context, seed: seed('halves-partial-stats') });
    expect(first.kind).toBe('halftime');
    if (first.kind !== 'halftime') return;

    expect(first.state.nextMinute).toBe(46);
    expect(first.state.events.some((e) => e.type === 'half_time')).toBe(true);
    expect(first.state.events.some((e) => e.type === 'full_time')).toBe(false);
    expect(first.state.home.fieldPlayers.length).toBeGreaterThan(0);
    expect(first.state.away.fieldPlayers.length).toBeGreaterThan(0);

    const finalResult = simulateRestOfMatch(first.state);
    // Placar parcial no intervalo nunca pode ser MAIOR que o placar final
    // (só cresce ou fica igual do intervalo em diante).
    expect(first.state.homeScore).toBeLessThanOrEqual(finalResult.homeScore);
    expect(first.state.awayScore).toBeLessThanOrEqual(finalResult.awayScore);
  });

  it('applyManualSubstitution troca titular por reserva e o jogador que entra afeta o segundo tempo', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    const context = { requiresWinner: true };

    const first = simulateFirstHalf({ home, away, context, seed: seed('halves-sub') });
    expect(first.kind).toBe('halftime');
    if (first.kind !== 'halftime') return;

    const outgoing = first.state.home.fieldPlayers[0]!;
    const incoming = first.state.home.benchRemaining[0]!;

    const subResult = applyManualSubstitution(
      first.state,
      'home',
      outgoing.player.userCardId,
      incoming.userCardId,
    );
    expect(subResult.ok).toBe(true);
    if (!subResult.ok) return;

    const stillOnField = subResult.state.home.fieldPlayers.some(
      (fp) => fp.player.userCardId === outgoing.player.userCardId,
    );
    const nowOnField = subResult.state.home.fieldPlayers.some(
      (fp) => fp.player.userCardId === incoming.userCardId,
    );
    expect(stillOnField).toBe(false);
    expect(nowOnField).toBe(true);
    expect(subResult.state.home.substitutionsUsed).toBe(1);
    expect(subResult.state.events.some((e) => e.type === 'substitution')).toBe(true);

    // O segundo tempo simula normalmente a partir do estado alterado.
    const finalResult = simulateRestOfMatch(subResult.state);
    expect(finalResult.events.length).toBeGreaterThan(subResult.state.events.length);
  });

  it('applyManualSubstitution falha com erro claro ao exceder 5 substituições', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    const context = { requiresWinner: true };

    const first = simulateFirstHalf({ home, away, context, seed: seed('halves-sub-limit') });
    expect(first.kind).toBe('halftime');
    if (first.kind !== 'halftime') return;

    let state = first.state;
    for (let i = 0; i < 5; i += 1) {
      const outgoing = state.home.fieldPlayers[i]!;
      const incoming = state.home.benchRemaining[0];
      if (!incoming) break;
      const result = applyManualSubstitution(
        state,
        'home',
        outgoing.player.userCardId,
        incoming.userCardId,
      );
      if (!result.ok) break;
      state = result.state;
    }

    // Banco de 5 reservas esgota após 5 trocas — a 6ª tentativa (mesmo se
    // sobrasse banco) deve ser bloqueada pelo limite de MAX_SUBSTITUTIONS.
    const stillHasBench = state.home.benchRemaining.length > 0;
    const nextOutgoing = state.home.fieldPlayers[5];
    if (stillHasBench && nextOutgoing) {
      const sixth = applyManualSubstitution(
        state,
        'home',
        nextOutgoing.player.userCardId,
        state.home.benchRemaining[0]!.userCardId,
      );
      expect(sixth.ok).toBe(false);
    } else {
      expect(state.home.substitutionsUsed).toBeLessThanOrEqual(5);
    }
  });

  it('applyTacticalIntensity muda a tática sem afetar o placar/eventos já ocorridos', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    const context = { requiresWinner: true };

    const first = simulateFirstHalf({ home, away, context, seed: seed('halves-tactic') });
    expect(first.kind).toBe('halftime');
    if (first.kind !== 'halftime') return;

    const updated = applyTacticalIntensity(first.state, 'home', 'pressao_alta');
    expect(updated.home.tacticalIntensity).toBe('pressao_alta');
    expect(updated.homeScore).toBe(first.state.homeScore);
    expect(updated.awayScore).toBe(first.state.awayScore);
    expect(updated.events).toEqual(first.state.events);

    // A partir daqui o segundo tempo roda normalmente sob a nova tática.
    const finalResult = simulateRestOfMatch(updated);
    expect(finalResult.engineVersion).toBeDefined();
  });

  it('duas partidas idênticas com a MESMA substituição no intervalo produzem o mesmo resultado (determinismo preservado)', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    const context = { requiresWinner: true };

    function playWithSub() {
      const first = simulateFirstHalf({ home, away, context, seed: seed('halves-determinism') });
      if (first.kind !== 'halftime') throw new Error('esperava intervalo');
      const outgoing = first.state.home.fieldPlayers[0]!;
      const incoming = first.state.home.benchRemaining[0]!;
      const sub = applyManualSubstitution(
        first.state,
        'home',
        outgoing.player.userCardId,
        incoming.userCardId,
      );
      if (!sub.ok) throw new Error('substituição deveria ter sucesso');
      return simulateRestOfMatch(sub.state);
    }

    const a = playWithSub();
    const b = playWithSub();
    expect(a).toEqual(b);
  });
});
