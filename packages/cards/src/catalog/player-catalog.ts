/**
 * `PlayerCatalog` — registro em memória de players históricos.
 *
 * Simples por design: Player é um agregado de referência curado
 * administrativamente, não por ação do jogador. O invariante central
 * é que nunca é deletado (doc 17 §3).
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type { NationalityCode, Position } from '@world-legends/types';
import type { Player, PlayerId } from '../player/types';

export type PlayerCatalogError =
  | ValidationError
  | Readonly<{ kind: 'DuplicatePlayerError'; playerId: PlayerId }>
  | Readonly<{ kind: 'PlayerNotFoundError'; playerId: PlayerId }>;

export type PlayerCatalog = {
  register(player: Player): Result<Player, PlayerCatalogError>;
  findById(id: PlayerId): Player | null;
  findByName(knownAs: string): readonly Player[];
  findByNationality(code: NationalityCode): readonly Player[];
  findByPosition(position: Position): readonly Player[];
  listActive(): readonly Player[];
  size(): number;
};

export function createPlayerCatalog(): PlayerCatalog {
  const byId = new Map<PlayerId, Player>();

  return {
    register(player: Player): Result<Player, PlayerCatalogError> {
      if (byId.has(player.id)) {
        return Err(Object.freeze({ kind: 'DuplicatePlayerError' as const, playerId: player.id }));
      }
      byId.set(player.id, player);
      return Ok(player);
    },

    findById(id: PlayerId): Player | null {
      return byId.get(id) ?? null;
    },

    findByName(knownAs: string): readonly Player[] {
      const q = knownAs.toLowerCase();
      return [...byId.values()].filter((p) => p.knownAs.toLowerCase().includes(q));
    },

    findByNationality(code: NationalityCode): readonly Player[] {
      return [...byId.values()].filter((p) => p.nationality === code);
    },

    findByPosition(position: Position): readonly Player[] {
      return [...byId.values()].filter(
        (p) => p.positions.primary === position || p.positions.secondary.includes(position),
      );
    },

    listActive(): readonly Player[] {
      return [...byId.values()].filter((p) => p.isActive);
    },

    size(): number {
      return byId.size;
    },
  };
}
