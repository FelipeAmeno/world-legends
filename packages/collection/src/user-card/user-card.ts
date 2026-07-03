import type { CardId } from '@world-legends/cards';
/**
 * `UserCard` — instância possuída de uma carta por um usuário.
 *
 * Responsabilidades (doc 17 §6):
 * - Unicidade: (profileId, cardId) — uma segunda cópia vira fragmento.
 * - Form em [-2, +2].
 * - GOAT/WCH só via AcquisitionSource = 'achievement'.
 * - Estado mutável: lesão, suspensão, forma.
 *
 * Não carrega a carta inteira — só o CardId. A carta real fica no
 * catálogo (`packages/cards`). Fronteira de agregado doc 17 §4.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';

export type UserCardId = string & { readonly _brand: 'UserCardId' };
export function userCardId(v: string): UserCardId {
  if (!v.trim()) throw new Error('UserCardId vazio');
  return v as UserCardId;
}

export type ProfileId = string & { readonly _brand: 'ProfileId' };
export function profileId(v: string): ProfileId {
  if (!v.trim()) throw new Error('ProfileId vazio');
  return v as ProfileId;
}

/**
 * doc 17 §6: Form em [-2, +2].
 * Afeta o desempenho do jogador na simulação (doc 09 §6).
 */
export type Form = -2 | -1 | 0 | 1 | 2;

/** doc 02 DDL user_cards: como a carta foi adquirida. */
export type AcquisitionSource = 'pack' | 'draft' | 'reward' | 'trade' | 'craft' | 'achievement';

export type InjuryStatus = Readonly<{
  readonly isInjured: boolean;
  /** Rodada de liga em que o jogador volta. Null se não lesionado. */
  readonly returnsAtRound: number | null;
}>;

export type SuspensionStatus = Readonly<{
  readonly suspendedMatches: number; // ≥ 0
  readonly yellowCardsAccum: number; // ≥ 0
}>;

export type UserCard = Readonly<{
  readonly id: UserCardId;
  readonly profileId: ProfileId;
  readonly cardId: CardId;
  readonly form: Form;
  readonly injury: InjuryStatus;
  readonly suspension: SuspensionStatus;
  readonly source: AcquisitionSource;
  readonly acquiredAt: Date;
}>;

export type CreateUserCardInput = {
  id: string;
  profileId: string;
  cardId: CardId;
  source: AcquisitionSource;
  /** Raridade da carta — necessário para validar WCH/GOAT só via achievement. */
  rarityCode: import('@world-legends/types').RarityCode;
  editionCode: import('@world-legends/types').EditionCode;
};

export function createUserCard(input: CreateUserCardInput): Result<UserCard, ValidationError> {
  // doc 17 §6: WCH e GOAT só via achievement
  if (
    (input.rarityCode === 'world_cup_hero' || input.editionCode === 'goat') &&
    input.source !== 'achievement'
  ) {
    return Err(
      validationError(
        `Cartas World Cup Hero e GOAT só podem ser adquiridas via "achievement" (doc 17 §6). Fonte recebida: "${input.source}"`,
        'source',
      ),
    );
  }

  const uc: UserCard = Object.freeze({
    id: userCardId(input.id),
    profileId: profileId(input.profileId),
    cardId: input.cardId,
    form: 0 as Form,
    injury: Object.freeze({ isInjured: false, returnsAtRound: null }),
    suspension: Object.freeze({ suspendedMatches: 0, yellowCardsAccum: 0 }),
    source: input.source,
    acquiredAt: new Date(),
  });
  return Ok(uc);
}

/** Aplica um delta de forma, clampado a [-2, +2]. */
export function applyFormDelta(uc: UserCard, delta: number): UserCard {
  const raw = uc.form + delta;
  const clamped = Math.min(2, Math.max(-2, Math.round(raw))) as Form;
  return Object.freeze({ ...uc, form: clamped });
}

/** Marca o jogador como lesionado. */
export function applyInjury(uc: UserCard, returnsAtRound: number): UserCard {
  return Object.freeze({
    ...uc,
    injury: Object.freeze({ isInjured: true, returnsAtRound }),
  });
}

/** Recupera o jogador de lesão. */
export function recoverFromInjury(uc: UserCard): UserCard {
  return Object.freeze({
    ...uc,
    injury: Object.freeze({ isInjured: false, returnsAtRound: null }),
  });
}

/** Acumula cartão amarelo; 3 amarelos → suspensão automática de 1 partida. */
export function addYellowCard(uc: UserCard): UserCard {
  const newYellows = uc.suspension.yellowCardsAccum + 1;
  const extraSuspension = newYellows % 3 === 0 ? 1 : 0;
  return Object.freeze({
    ...uc,
    suspension: Object.freeze({
      yellowCardsAccum: newYellows,
      suspendedMatches: uc.suspension.suspendedMatches + extraSuspension,
    }),
  });
}

/** Desconta 1 partida de suspensão. */
export function serveSuspension(uc: UserCard): UserCard {
  if (uc.suspension.suspendedMatches <= 0) return uc;
  return Object.freeze({
    ...uc,
    suspension: Object.freeze({
      ...uc.suspension,
      suspendedMatches: uc.suspension.suspendedMatches - 1,
    }),
  });
}

export function isEligibleAsStarter(uc: UserCard): boolean {
  return !uc.injury.isInjured && uc.suspension.suspendedMatches === 0;
}
