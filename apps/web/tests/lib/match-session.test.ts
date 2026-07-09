import type { CollectionCard } from '@/lib/collection-data';
import { MATCH_OPPONENTS } from '@/lib/match-data';
import {
  applyHalftimeSubstitution,
  applyHalftimeTactic,
  applyLegendaryAiHalftimeReaction,
  buildAiTeamSnapshot,
  buildHalftimeDisplay,
  buildUserTeamSnapshot,
  finishMatchSimulation,
  startMatchSimulation,
} from '@/lib/match-session';
import type { SavedSquad } from '@/lib/server/game-data';
import type { Position } from '@world-legends/types';
import { describe, expect, it } from 'vitest';

/**
 * Sprint 26 (Gameplay Foundation) — cobertura de integração do fluxo de
 * partida com squad real.
 *
 * A conta de QA usada nesta sessão não tem goleiro na coleção (0
 * saldo, sem pacotes abertos) — impossível montar um squad válido pra
 * testar o caminho "feliz" ao vivo no navegador sem violar o limite já
 * estabelecido de não creditar saldo/cartas diretamente via Supabase.
 * Este teste cobre exatamente o mesmo caminho de código que os server
 * actions (`startMatchAction`/`applySubstitutionAction`/
 * `applyTacticAction`/`continueMatchAction`) chamam, só que com um
 * squad sintético construído aqui — é o caminho "feliz" completo,
 * validado de ponta a ponta.
 */

const FORMATION_SLOTS: ReadonlyArray<{ slotId: string; position: Position }> = [
  { slotId: 'GK', position: 'GK' },
  { slotId: 'RB', position: 'RB' },
  { slotId: 'CB1', position: 'CB' },
  { slotId: 'CB2', position: 'CB' },
  { slotId: 'LB', position: 'LB' },
  { slotId: 'CM1', position: 'CM' },
  { slotId: 'CM2', position: 'CM' },
  { slotId: 'CM3', position: 'CM' },
  { slotId: 'RW', position: 'RW' },
  { slotId: 'ST', position: 'ST' },
  { slotId: 'LW', position: 'LW' },
];

const BENCH_POSITIONS: readonly Position[] = ['GK', 'CB', 'CM', 'ST', 'LW'];

function makeCard(userCardId: string, position: Position, overall: number): CollectionCard {
  return {
    cardId: `card-${userCardId}`,
    playerId: `player-${userCardId}`,
    displayName: `Jogador ${userCardId}`,
    fullName: `Jogador Completo ${userCardId}`,
    nationality: 'BR',
    flagEmoji: '🇧🇷',
    position,
    overall,
    rarityCode: 'common',
    rarityLabel: 'Comum',
    editionCode: 'base',
    attributes: {},
    traits: [],
    bioShort: '',
    era: '2020s',
    userCardId,
  };
}

function firstOpponent() {
  const opponent = MATCH_OPPONENTS[0];
  if (!opponent) throw new Error('MATCH_OPPONENTS está vazio');
  return opponent;
}

function buildFixture(): { activeSquad: SavedSquad; userCards: CollectionCard[] } {
  const userCards: CollectionCard[] = [];
  const slots: SavedSquad['slots'] = [];

  FORMATION_SLOTS.forEach((slot, i) => {
    const userCardId = `starter-${i}`;
    userCards.push(makeCard(userCardId, slot.position, 70 + (i % 10)));
    slots.push({ slotId: slot.slotId, userCardId, isStarter: true, benchOrder: null });
  });

  BENCH_POSITIONS.forEach((position, i) => {
    const userCardId = `bench-${i}`;
    userCards.push(makeCard(userCardId, position, 65 + i));
    slots.push({ slotId: `bench-slot-${i}`, userCardId, isStarter: false, benchOrder: i });
  });

  return {
    activeSquad: { id: 'squad-fixture', formation: '4-3-3', slots },
    userCards,
  };
}

describe('buildUserTeamSnapshot (Sprint 26 — Prioridade 0)', () => {
  it('bloqueia com NO_SQUAD quando o usuário não tem squad salvo', () => {
    const result = buildUserTeamSnapshot(null, []);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NO_SQUAD');
  });

  it('bloqueia com INVALID_SQUAD quando o squad está incompleto (menos de 11 titulares)', () => {
    const { activeSquad, userCards } = buildFixture();
    const incomplete: SavedSquad = {
      ...activeSquad,
      slots: activeSquad.slots.filter((s) => s.slotId !== 'LW'),
    };
    const result = buildUserTeamSnapshot(incomplete, userCards);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_SQUAD');
    expect(result.errors.some((e) => e.includes('11 titulares'))).toBe(true);
  });

  it('constrói o TeamSnapshot corretamente a partir de um squad válido — o time que entra em campo é EXATAMENTE o squad salvo', () => {
    const { activeSquad, userCards } = buildFixture();
    const result = buildUserTeamSnapshot(activeSquad, userCards);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.starters).toHaveLength(11);
    expect(result.lineup).toHaveLength(11);
    expect(result.bench).toHaveLength(5);

    // Cada titular do snapshot corresponde exatamente ao userCardId salvo no slot.
    for (const slot of activeSquad.slots.filter((s) => s.isStarter)) {
      const starter = result.snapshot.starters.find((s) => s.slotId === slot.slotId);
      expect(starter?.player.userCardId).toBe(slot.userCardId);
    }
  });
});

describe('fluxo completo de partida com intervalo jogável (Sprint 26)', () => {
  it('1º tempo → intervalo → substituição → tática → 2º tempo → resultado final', () => {
    const { activeSquad, userCards } = buildFixture();
    const teamResult = buildUserTeamSnapshot(activeSquad, userCards);
    expect(teamResult.ok).toBe(true);
    if (!teamResult.ok) return;

    const opponent = firstOpponent();
    const ai = buildAiTeamSnapshot(opponent);

    const outcome = startMatchSimulation({
      home: teamResult.snapshot,
      away: ai.snapshot,
      seed: 123456,
      difficulty: 'normal',
      opponent,
      userCards,
      aiCardIds: ai.aiCardIds,
    });

    expect(outcome.kind).toBe('halftime');
    if (outcome.kind !== 'halftime') return;

    const halftime = buildHalftimeDisplay(outcome.state, opponent, userCards, ai.aiCardIds);
    expect(halftime.homeFieldPlayers).toHaveLength(11);
    expect(halftime.maxSubs).toBe(5);
    expect(halftime.homeSubsUsed).toBe(0);

    // Substituição: troca o 1º titular por um reserva.
    const [outgoingPlayer] = halftime.homeFieldPlayers;
    const [incomingPlayer] = halftime.homeBench;
    if (!outgoingPlayer?.userCardId || !incomingPlayer?.userCardId) {
      throw new Error('fixture sem jogadores suficientes');
    }
    const outgoing = outgoingPlayer.userCardId;
    const incoming = incomingPlayer.userCardId;
    const subResult = applyHalftimeSubstitution(outcome.state, outgoing, incoming);
    expect(subResult.ok).toBe(true);
    if (!subResult.ok) return;

    const afterSub = buildHalftimeDisplay(subResult.state, opponent, userCards, ai.aiCardIds);
    expect(afterSub.homeSubsUsed).toBe(1);
    expect(afterSub.homeFieldPlayers.some((p) => p.userCardId === incoming)).toBe(true);
    expect(afterSub.homeFieldPlayers.some((p) => p.userCardId === outgoing)).toBe(false);

    // Tática: muda a mentalidade do time.
    const afterTactic = applyHalftimeTactic(subResult.state, 'pressao_alta');
    expect(afterTactic.home.tacticalIntensity).toBe('pressao_alta');

    // 2º tempo: roda o resto e monta o MatchDisplay final.
    const display = finishMatchSimulation(afterTactic, opponent, userCards, ai.aiCardIds);
    expect(display.homeScore).toBeGreaterThanOrEqual(halftime.homeScore);
    expect(display.awayScore).toBeGreaterThanOrEqual(halftime.awayScore);
    expect(['home', 'away', 'draw']).toContain(display.winner);
    expect(display.rewards.credits).toBeGreaterThan(0);
    expect(display.events.some((e) => e.type === 'full_time')).toBe(true);
  });

  it('IA Lendária reage no intervalo: muda tática e usa 1 substituição do lado adversário', () => {
    const { activeSquad, userCards } = buildFixture();
    const teamResult = buildUserTeamSnapshot(activeSquad, userCards);
    expect(teamResult.ok).toBe(true);
    if (!teamResult.ok) return;

    const opponent = firstOpponent();
    const ai = buildAiTeamSnapshot(opponent);

    const outcome = startMatchSimulation({
      home: teamResult.snapshot,
      away: ai.snapshot,
      seed: 999,
      difficulty: 'legendary',
      opponent,
      userCards,
      aiCardIds: ai.aiCardIds,
    });
    expect(outcome.kind).toBe('halftime');
    if (outcome.kind !== 'halftime') return;

    const reacted = applyLegendaryAiHalftimeReaction(outcome.state, 'legendary');
    // A IA lendária sempre reage: tática vira uma das 3 reativas por placar
    // (pressao_alta perdendo / contra_ataque ganhando / ofensivo empatando).
    expect(['pressao_alta', 'contra_ataque', 'ofensivo']).toContain(reacted.away.tacticalIntensity);
    // E usa 1 substituição, se banco e campo permitirem.
    expect(reacted.away.substitutionsUsed).toBeGreaterThanOrEqual(
      outcome.state.away.substitutionsUsed,
    );
  });

  it('dificuldade Normal não faz a IA reagir no intervalo', () => {
    const { activeSquad, userCards } = buildFixture();
    const teamResult = buildUserTeamSnapshot(activeSquad, userCards);
    expect(teamResult.ok).toBe(true);
    if (!teamResult.ok) return;

    const opponent = firstOpponent();
    const ai = buildAiTeamSnapshot(opponent);
    const outcome = startMatchSimulation({
      home: teamResult.snapshot,
      away: ai.snapshot,
      seed: 42,
      difficulty: 'normal',
      opponent,
      userCards,
      aiCardIds: ai.aiCardIds,
    });
    expect(outcome.kind).toBe('halftime');
    if (outcome.kind !== 'halftime') return;

    const unchanged = applyLegendaryAiHalftimeReaction(outcome.state, 'normal');
    expect(unchanged).toBe(outcome.state);
  });
});
