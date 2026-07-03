/**
 * Fixtures para os testes do packages/squad.
 *
 * PlayerInfo mínimos para cobrir os TCs sem depender de outros packages.
 * Cada fixture tem um ID determinístico no formato "uc-{nome}-{posição}".
 */
import type { Position } from '@world-legends/types';
import type { PlayerInfo } from '../types/types';

// ─── Contador de ID determinístico ───────────────────────────────────────────

let _seq = 1;
export function resetFixtureSeq(): void {
  _seq = 1;
}

export function makePlayer(
  overrides: Partial<PlayerInfo> & { naturalPosition: Position },
): PlayerInfo {
  const id = overrides.userCardId ?? `uc-${_seq++}`;
  return Object.freeze({
    userId: 'user-001',
    nationality: overrides.nationality ?? 'BR',
    overall: overrides.overall ?? 82,
    isInjured: overrides.isInjured ?? false,
    suspendedMatches: overrides.suspendedMatches ?? 0,
    ...overrides,
    userCardId: id,
  });
}

// ─── Plantel pré-montado para testes de squad completo ───────────────────────

/**
 * 18 jogadores fictícios (11 titulares + 7 banco).
 * Formação base: 4-3-3 (GK, RB, CB, CB, LB, CM, CM, CM, RW, ST, LW).
 */
export function makePlantel(userId = 'user-001'): PlayerInfo[] {
  resetFixtureSeq();
  const players: PlayerInfo[] = [
    makePlayer({
      userCardId: 'uc-gk',
      naturalPosition: 'GK',
      userId,
      nationality: 'BR',
      overall: 88,
    }),
    makePlayer({
      userCardId: 'uc-rb',
      naturalPosition: 'RB',
      userId,
      nationality: 'BR',
      overall: 84,
    }),
    makePlayer({
      userCardId: 'uc-cb1',
      naturalPosition: 'CB',
      userId,
      nationality: 'BR',
      overall: 86,
    }),
    makePlayer({
      userCardId: 'uc-cb2',
      naturalPosition: 'CB',
      userId,
      nationality: 'BR',
      overall: 85,
    }),
    makePlayer({
      userCardId: 'uc-lb',
      naturalPosition: 'LB',
      userId,
      nationality: 'BR',
      overall: 84,
    }),
    makePlayer({
      userCardId: 'uc-cm1',
      naturalPosition: 'CM',
      userId,
      nationality: 'BR',
      overall: 88,
    }),
    makePlayer({
      userCardId: 'uc-cm2',
      naturalPosition: 'CM',
      userId,
      nationality: 'BR',
      overall: 87,
    }),
    makePlayer({
      userCardId: 'uc-cm3',
      naturalPosition: 'CM',
      userId,
      nationality: 'AR',
      overall: 89,
    }),
    makePlayer({
      userCardId: 'uc-rw',
      naturalPosition: 'RW',
      userId,
      nationality: 'BR',
      overall: 90,
    }),
    makePlayer({
      userCardId: 'uc-st',
      naturalPosition: 'ST',
      userId,
      nationality: 'BR',
      overall: 95,
    }),
    makePlayer({
      userCardId: 'uc-lw',
      naturalPosition: 'LW',
      userId,
      nationality: 'BR',
      overall: 91,
    }),
    // Banco (7)
    makePlayer({
      userCardId: 'uc-b1',
      naturalPosition: 'GK',
      userId,
      nationality: 'DE',
      overall: 80,
    }),
    makePlayer({
      userCardId: 'uc-b2',
      naturalPosition: 'CB',
      userId,
      nationality: 'DE',
      overall: 81,
    }),
    makePlayer({
      userCardId: 'uc-b3',
      naturalPosition: 'CM',
      userId,
      nationality: 'FR',
      overall: 82,
    }),
    makePlayer({
      userCardId: 'uc-b4',
      naturalPosition: 'ST',
      userId,
      nationality: 'PT',
      overall: 83,
    }),
    makePlayer({
      userCardId: 'uc-b5',
      naturalPosition: 'LW',
      userId,
      nationality: 'NL',
      overall: 84,
    }),
    makePlayer({
      userCardId: 'uc-b6',
      naturalPosition: 'RB',
      userId,
      nationality: 'IT',
      overall: 80,
    }),
    makePlayer({
      userCardId: 'uc-b7',
      naturalPosition: 'CDM',
      userId,
      nationality: 'ES',
      overall: 81,
    }),
  ];
  return players;
}

/** Cria mapa userId → PlayerInfo para uso como resolvePlayer. */
export function makeResolver(players: PlayerInfo[]): (id: string) => PlayerInfo | null {
  const map = new Map(players.map((p) => [p.userCardId, p]));
  return (id) => map.get(id) ?? null;
}
