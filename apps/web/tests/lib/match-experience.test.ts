import type { EventDisplay } from '@/lib/match-data';
import { buildMomentumCurve, buildRichEvents } from '@/lib/match-experience';
import { describe, expect, it } from 'vitest';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<EventDisplay> = {}): EventDisplay {
  return {
    minute: 1,
    type: 'chance',
    text: 'Boa chance',
    side: 'neutral',
    icon: '⚠️',
    highlight: false,
    ...overrides,
  };
}

// ─── buildRichEvents ──────────────────────────────────────────────────────────

describe('buildRichEvents', () => {
  it('retorna array vazio para entrada vazia', () => {
    expect(buildRichEvents([])).toEqual([]);
  });

  it('atribui ids sequenciais começando em 0', () => {
    const events = [makeEvent({ minute: 5 }), makeEvent({ minute: 10 })];
    const rich = buildRichEvents(events);
    expect(rich[0]?.id).toBe(0);
    expect(rich[1]?.id).toBe(1);
  });

  it('preserva o minuto de cada evento', () => {
    const events = [makeEvent({ minute: 23 }), makeEvent({ minute: 67 })];
    const rich = buildRichEvents(events);
    expect(rich[0]?.minute).toBe(23);
    expect(rich[1]?.minute).toBe(67);
  });

  it('classifica goal_home corretamente e marca isKey=true', () => {
    const event = makeEvent({ type: 'goal', side: 'home', text: 'Ronaldo marca!' });
    const [rich] = buildRichEvents([event]);
    expect(rich?.kind).toBe('goal_home');
    expect(rich?.isKey).toBe(true);
    expect(rich?.headline).toBe('GOOOOOL!');
  });

  it('classifica goal_away corretamente e marca isKey=true', () => {
    const event = makeEvent({ type: 'goal', side: 'away', text: 'Gol adversário' });
    const [rich] = buildRichEvents([event]);
    expect(rich?.kind).toBe('goal_away');
    expect(rich?.isKey).toBe(true);
  });

  it('marca full_time como isKey=true', () => {
    const event = makeEvent({ type: 'full_time', side: 'neutral', minute: 90 });
    const [rich] = buildRichEvents([event]);
    expect(rich?.isKey).toBe(true);
  });

  it('marca chance como isKey=false', () => {
    const event = makeEvent({ type: 'chance', side: 'neutral' });
    const [rich] = buildRichEvents([event]);
    expect(rich?.isKey).toBe(false);
  });

  it('goal_home tem momentum positivo', () => {
    const event = makeEvent({ type: 'goal', side: 'home' });
    const [rich] = buildRichEvents([event]);
    expect(rich?.momentum).toBeGreaterThan(0);
  });

  it('goal_away tem momentum negativo', () => {
    const event = makeEvent({ type: 'goal', side: 'away' });
    const [rich] = buildRichEvents([event]);
    expect(rich?.momentum).toBeLessThan(0);
  });

  it('preenche bgColor e iconText', () => {
    const event = makeEvent({ type: 'goal', side: 'home' });
    const [rich] = buildRichEvents([event]);
    expect(typeof rich?.bgColor).toBe('string');
    expect(rich?.bgColor.length).toBeGreaterThan(0);
    expect(typeof rich?.iconText).toBe('string');
    expect(rich?.iconText.length).toBeGreaterThan(0);
  });

  it('mantém side original do evento', () => {
    const home = makeEvent({ type: 'chance', side: 'home' });
    const away = makeEvent({ type: 'chance', side: 'away' });
    const rich = buildRichEvents([home, away]);
    expect(rich[0]?.side).toBe('home');
    expect(rich[1]?.side).toBe('away');
  });
});

// ─── buildMomentumCurve ───────────────────────────────────────────────────────

describe('buildMomentumCurve', () => {
  it('retorna ponto inicial com home=50 quando não há eventos', () => {
    const curve = buildMomentumCurve([]);
    expect(curve).toHaveLength(1);
    expect(curve[0]).toEqual({ minute: 0, home: 50 });
  });

  it('número de pontos = 1 + número de eventos', () => {
    const rich = buildRichEvents([makeEvent({ minute: 10 }), makeEvent({ minute: 20 })]);
    const curve = buildMomentumCurve(rich);
    expect(curve).toHaveLength(3);
  });

  it('home está sempre entre 10 e 90 (clamp)', () => {
    // Sequência de gols da casa força o acúmulo para cima
    const goals = Array.from({ length: 20 }, (_, i) =>
      makeEvent({ type: 'goal', side: 'home', minute: i + 1 }),
    );
    const rich = buildRichEvents(goals);
    const curve = buildMomentumCurve(rich);
    for (const p of curve) {
      expect(p.home).toBeGreaterThanOrEqual(10);
      expect(p.home).toBeLessThanOrEqual(90);
    }
  });

  it('gols consecutivos do adversário desviam momentum abaixo de 50', () => {
    const awayGoals = Array.from({ length: 5 }, (_, i) =>
      makeEvent({ type: 'goal', side: 'away', minute: i + 1 }),
    );
    const rich = buildRichEvents(awayGoals);
    const curve = buildMomentumCurve(rich);
    const last = curve[curve.length - 1]!;
    expect(last.home).toBeLessThan(50);
  });

  it('preserva o minuto de cada ponto', () => {
    const ev = makeEvent({ minute: 45 });
    const [rich] = buildRichEvents([ev]);
    const curve = buildMomentumCurve([rich!]);
    expect(curve[1]?.minute).toBe(45);
  });
});
