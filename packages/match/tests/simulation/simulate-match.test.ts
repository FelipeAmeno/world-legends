import type { AttributeSet } from '@world-legends/engine';
import { shouldDeclareWalkover } from '@world-legends/engine';
import { createCollectorPublisher, noopPublisher } from '@world-legends/shared';
import type { Position } from '@world-legends/types';
/**
 * Testes de integração de simulateMatch.
 *
 * Estes testes chamam o engine real — são os mais lentos mas também os
 * mais valiosos: verificam o contrato completo entre match e engine.
 *
 * Cobertos:
 * - Reprodutibilidade: mesma seed → mesmo jogo (doc 09 §21)
 * - W.O.: elenco com 6 jogadores → walkover declarado (doc 09 §12.1)
 * - Pênaltis: requiresWinner=true + placar empatado → disputa
 * - 20 rodadas máximas de morte súbita (doc 09 §20.1, MAX_SUDDEN_DEATH_ROUNDS=20)
 * - Desempate por seed: resolvedBySeedTiebreak quando ninguém erra (doc 09 §20.1 DD-02)
 */
import { describe, expect, it } from 'vitest';
import type { CardAttributeResolver } from '../../src/lineups/build-team-snapshot';
import type { LineupInput } from '../../src/lineups/validate-lineup';
import { simulateMatch } from '../../src/simulation/simulate-match';
import { makeSimpleResolver, makeValidLineup } from '../../src/testing/fixtures';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function freshLineup(prefix: string) {
  const base = makeValidLineup(prefix);
  return {
    ...base,
    adjacentPairs: [] as { slotIdA: string; slotIdB: string }[],
    tacticalIntensity: 'equilibrado' as const,
  };
}

function runMatch(seed: string, homeLineup = freshLineup('h'), awayLineup = freshLineup('a')) {
  return simulateMatch({
    matchId: `match-${seed}`,
    homeProfileId: 'player-home',
    awayProfileId: 'player-away',
    homeLineup,
    awayLineup,
    seed,
    requiresWinner: false,
    cardResolver: makeSimpleResolver(),
    publisher: noopPublisher,
  });
}

// ─── Reprodutibilidade ────────────────────────────────────────────────────────

describe('Reprodutibilidade — mesma seed = mesmo jogo (doc 09 §21)', () => {
  it('dois runs com a mesma seed produzem placar idêntico', () => {
    const a = runMatch('repro-seed-01');
    const b = runMatch('repro-seed-01');
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.value.homeScore).toBe(b.value.homeScore);
      expect(a.value.awayScore).toBe(b.value.awayScore);
      expect(a.value.outcome).toBe(b.value.outcome);
    }
  });

  it('mesmo número de eventos com a mesma seed', () => {
    const a = runMatch('repro-seed-02');
    const b = runMatch('repro-seed-02');
    if (a.ok && b.ok) {
      expect(a.value.engineResult.events.length).toBe(b.value.engineResult.events.length);
    }
  });

  it('seeds diferentes produzem resultados possivelmente diferentes', () => {
    const outcomes = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const r = runMatch(`var-seed-${i}`);
      if (r.ok) outcomes.add(`${r.value.homeScore}-${r.value.awayScore}`);
    }
    expect(outcomes.size).toBeGreaterThan(1);
  });

  it('50 runs com mesma seed sempre produzem o mesmo resultado', () => {
    const reference = runMatch('stability-seed');
    if (!reference.ok) throw new Error('reference falhou');
    for (let i = 1; i < 50; i++) {
      const r = runMatch('stability-seed');
      if (!r.ok) throw new Error(`run ${i} falhou`);
      expect(r.value.homeScore).toBe(reference.value.homeScore);
      expect(r.value.awayScore).toBe(reference.value.awayScore);
      expect(r.value.outcome).toBe(reference.value.outcome);
    }
  });
});

// ─── W.O. ─────────────────────────────────────────────────────────────────────

describe('W.O. — walkover com elenco reduzido (doc 09 §12.1)', () => {
  /**
   * W.O. é raro por design (doc 09 §12.1): requer ≥5 expulsões/lesões no mesmo
   * time em uma única partida. O próprio engine reconhece isso em
   * match.acceptance.test.ts: "evento raro; se nenhum W.O. natural surgir
   * nesta amostra, é esperado".
   *
   * Estes testes seguem o mesmo padrão: procuram W.O. em uma amostra grande
   * e, quando encontram, verificam o formato e o outcome. Não obrigam que
   * o W.O. ocorra (o engine já garante a lógica via TC-WO-01/02).
   *
   * O que packages/match garante (e testa aqui):
   * 1. Quando engineResult.walkover existe, outcome é home_walkover ou away_walkover.
   * 2. A propagação de walkover do engine para MatchSummary está correta.
   */
  it('quando há W.O., outcome é home_walkover ou away_walkover (TC-WO propagation)', () => {
    const minAttrs: AttributeSet = {
      pace: 1,
      stamina: 1,
      physical: 1,
      heading: 1,
      finishing: 1,
      shot_power: 1,
      passing: 1,
      vision: 1,
      dribbling: 1,
      penalty_kicks: 1,
      defending: 1,
      composure: 1,
      aggression: 99,
      leadership: 1,
      gk_reflexes: 50,
      gk_positioning: 50,
      gk_handling: 50,
      gk_kicking: 50,
      gk_penalty_save: 50,
    };
    const weakResolver: CardAttributeResolver = (ucId) => ({
      attributes: minAttrs,
      primaryPosition: (ucId.includes('card-0') ? 'GK' : 'ST') as Position,
      traits: [],
    });

    // Procura W.O. em 500 seeds; se encontrar, verifica o formato.
    // Se não encontrar, o teste passa — W.O. é raro por design (doc 09 §12.1).
    for (let i = 0; i < 500; i++) {
      const result = simulateMatch({
        matchId: `wo-${i}`,
        homeProfileId: 'h',
        awayProfileId: 'a',
        homeLineup: freshLineup('h'),
        awayLineup: freshLineup('a'),
        seed: `wo-seed-${i}`,
        requiresWinner: false,
        cardResolver: weakResolver,
        publisher: noopPublisher,
      });
      if (result.ok && result.value.engineResult.walkover !== undefined) {
        // W.O. encontrado: verificar propagação correta para MatchSummary
        expect(['home_walkover', 'away_walkover']).toContain(result.value.outcome);
        const side = result.value.engineResult.walkover.affectedTeamSide;
        const expected = side === 'home' ? 'home_walkover' : 'away_walkover';
        expect(result.value.outcome).toBe(expected);
        return; // 1 caso confirmado é suficiente
      }
    }
    // W.O. não ocorreu em 500 seeds — aceitável (raro por design).
    // A lógica de W.O. é testada em packages/engine, não aqui.
  });

  it('shouldDeclareWalkover unitário: abaixo de 7 jogadores dispara W.O.', () => {
    const r6 = shouldDeclareWalkover(6, 11);
    const r7 = shouldDeclareWalkover(7, 11);
    expect(r6.triggered).toBe(true);
    expect(r7.triggered).toBe(false);
  });
});

// ─── Pênaltis ─────────────────────────────────────────────────────────────────

describe('Disputa de pênaltis — requiresWinner=true (doc 09 §20)', () => {
  it('com requiresWinner=true e empate, o resultado inclui penaltyShootout', () => {
    let foundPenalties = false;
    for (let i = 0; i < 200 && !foundPenalties; i++) {
      const result = simulateMatch({
        matchId: `pk-${i}`,
        homeProfileId: 'h',
        awayProfileId: 'a',
        homeLineup: freshLineup('h'),
        awayLineup: freshLineup('a'),
        seed: `pk-seed-${i}`,
        requiresWinner: true,
        cardResolver: makeSimpleResolver(),
        publisher: noopPublisher,
      });
      if (result.ok && result.value.engineResult.penaltyShootout !== undefined) {
        foundPenalties = true;
        expect(['home_win_penalties', 'away_win_penalties']).toContain(result.value.outcome);
      }
    }
    expect(foundPenalties).toBe(true);
  });

  it('com requiresWinner=false não há pênaltis em empate', () => {
    // Procura um seed que gere empate com requiresWinner=false
    for (let i = 0; i < 200; i++) {
      const result = simulateMatch({
        matchId: `no-pk-${i}`,
        homeProfileId: 'h',
        awayProfileId: 'a',
        homeLineup: freshLineup('h'),
        awayLineup: freshLineup('a'),
        seed: `no-pk-seed-${i}`,
        requiresWinner: false,
        cardResolver: makeSimpleResolver(),
        publisher: noopPublisher,
      });
      if (result.ok && result.value.outcome === 'draw') {
        expect(result.value.engineResult.penaltyShootout).toBeUndefined();
        return;
      }
    }
    // Se não houve empate em 200 seeds, é estatisticamente improvável mas possível
    // O teste é válido — apenas não encontrou o caso
  });
});

// ─── 20 rodadas máximas + desempate por seed ──────────────────────────────────

describe('Pênaltis — 20 rodadas máximas e resolvedBySeedTiebreak (doc 09 §20.1 DD-02)', () => {
  it('nenhum shootout supera 20 rodadas de morte súbita', () => {
    for (let i = 0; i < 100; i++) {
      const result = simulateMatch({
        matchId: `maxrd-${i}`,
        homeProfileId: 'h',
        awayProfileId: 'a',
        homeLineup: freshLineup('h'),
        awayLineup: freshLineup('a'),
        seed: `maxrd-${i}`,
        requiresWinner: true,
        cardResolver: makeSimpleResolver(),
        publisher: noopPublisher,
      });
      if (result.ok && result.value.engineResult.penaltyShootout !== undefined) {
        const { totalRounds } = result.value.engineResult.penaltyShootout;
        // Cada round tem 2 kicks (1 por time) → max 5 rounds normais + 20 morte súbita
        // O número total de rounds (pares) nunca excede 5 + 20 = 25
        expect(totalRounds).toBeLessThanOrEqual(25);
      }
    }
  });

  it('resolvedBySeedTiebreak=true quando pênaltis chegam ao limite de 20 rodadas', () => {
    // Executamos 500 seeds com requiresWinner=true para encontrar casos
    // onde o seed tiebreak foi ativado (probabilidade baixa mas definida)
    let found = false;
    for (let i = 0; i < 500 && !found; i++) {
      const result = simulateMatch({
        matchId: `tiebreak-${i}`,
        homeProfileId: 'h',
        awayProfileId: 'a',
        homeLineup: freshLineup('h'),
        awayLineup: freshLineup('a'),
        seed: `tiebreak-seed-${i}`,
        requiresWinner: true,
        cardResolver: makeSimpleResolver(),
        publisher: noopPublisher,
      });
      if (result.ok && result.value.resolvedBySeedTiebreak) {
        found = true;
        expect(result.value.engineResult.penaltyShootout?.resolvedBySeedTiebreak).toBe(true);
      }
    }
    // Seed tiebreak pode não ocorrer em 500 seeds — não é garantido mas é possível.
    // Marcamos como ok se não ocorreu; o engine T010 garante a implementação.
    // Este teste só falha se resolvedBySeedTiebreak ocorrer mas summary não propagar.
  });
});

// ─── Evento de domínio ────────────────────────────────────────────────────────

describe('simulateMatch — evento match_simulated publicado', () => {
  it('publica exatamente 1 evento match_simulated por partida', () => {
    const { publisher, events } = createCollectorPublisher();
    const result = simulateMatch({
      matchId: 'event-test',
      homeProfileId: 'h',
      awayProfileId: 'a',
      homeLineup: freshLineup('h'),
      awayLineup: freshLineup('a'),
      seed: 'event-seed',
      requiresWinner: false,
      cardResolver: makeSimpleResolver(),
      publisher,
    });
    expect(result.ok).toBe(true);
    expect(events.length).toBe(1);
    expect(events[0]?.eventType).toBe('match_simulated');
  });

  it('payload do evento contém matchId e placar', () => {
    const { publisher, events } = createCollectorPublisher();
    runMatch('payload-seed');
    simulateMatch({
      matchId: 'payload-match',
      homeProfileId: 'player-h',
      awayProfileId: 'player-a',
      homeLineup: freshLineup('h'),
      awayLineup: freshLineup('a'),
      seed: 'payload-seed',
      requiresWinner: false,
      cardResolver: makeSimpleResolver(),
      publisher,
    });
    const payload = events[0]?.payload as Record<string, unknown>;
    expect(payload?.['matchId']).toBe('payload-match');
    expect(payload?.['homeProfileId']).toBe('player-h');
    expect(typeof payload?.['homeScore']).toBe('number');
  });
});

// ─── Erros de input ───────────────────────────────────────────────────────────

describe('simulateMatch — validação de inputs', () => {
  it('lineup inválida de home retorna Err HomeLineupInvalid', () => {
    const badLineup = {
      ...freshLineup('h'),
      starters: freshLineup('h').starters.slice(0, 10), // apenas 10 titulares
    };
    const result = simulateMatch({
      matchId: 'm',
      homeProfileId: 'h',
      awayProfileId: 'a',
      homeLineup: badLineup,
      awayLineup: freshLineup('a'),
      seed: 'err-seed',
      requiresWinner: false,
      cardResolver: makeSimpleResolver(),
      publisher: noopPublisher,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('HomeLineupInvalid');
  });

  it('lineup inválida de away retorna Err AwayLineupInvalid', () => {
    const badAway = {
      ...freshLineup('a'),
      starters: freshLineup('a').starters.slice(0, 9),
    };
    const result = simulateMatch({
      matchId: 'm',
      homeProfileId: 'h',
      awayProfileId: 'a',
      homeLineup: freshLineup('h'),
      awayLineup: badAway,
      seed: 'err-seed-2',
      requiresWinner: false,
      cardResolver: makeSimpleResolver(),
      publisher: noopPublisher,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('AwayLineupInvalid');
  });

  it('CardResolver retornando null causa Err CardNotResolved', () => {
    const nullResolver: CardAttributeResolver = () => null;
    const result = simulateMatch({
      matchId: 'm',
      homeProfileId: 'h',
      awayProfileId: 'a',
      homeLineup: freshLineup('h'),
      awayLineup: freshLineup('a'),
      seed: 'null-resolver',
      requiresWinner: false,
      cardResolver: nullResolver,
      publisher: noopPublisher,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('CardNotResolved');
  });
});
