/**
 * Fábricas de TraitMagnitude — quarto submódulo do Match Engine
 * (docs/19-implementation-strategy-master.md, §10 e §18 — Tarefa T018 no
 * roteiro mestre, "TraitMagnitude (VO com teto por construção)", chamada
 * aqui de T006). Cada fábrica corresponde a uma linha da tabela de
 * tetos em `docs/11-balance-competitive-validation-master.md`, §7.
 *
 * Todas retornam `Result` (de `@world-legends/shared`) — REJEITAM
 * construção acima do teto, em vez de aplicar `clamp` silenciosamente.
 * Decisão deliberada: diferente de `Percentage` (T002, que tem as duas
 * formas — validar e clampar), aqui só existe a forma validadora. Doc 11
 * §7 enquadra estes tetos como uma defesa contra erro de quem cadastra
 * uma carta nova ("para nunca dependerem do bom senso de quem cadastra
 * uma carta nova") — um `clamp` silencioso esconderia exatamente o tipo
 * de erro de digitação (ex: 120 em vez de 12) que esse teto existe para
 * pegar. Nenhuma fábrica aceita valor negativo.
 *
 * Não implementa partidas: nenhuma destas fábricas é consumida por
 * nenhuma lógica de simulação ainda — isso é trabalho do módulo `match`,
 * mais adiante na ordem do doc 19 §10.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type {
  BigGamePlayerMagnitude,
  CapitaoMagnitude,
  ClutchPlayerMagnitude,
  DeadBallSpecialistMagnitude,
  FastRecoveryMagnitude,
  GeloNasVeiasMagnitude,
  HeroMomentMagnitude,
  IronManMagnitude,
  LeaderMagnitude,
  MaestroMagnitude,
  MatadorMagnitude,
  MuralhaMagnitude,
  SuperSubMagnitude,
} from './types';

/** Valida um único campo numérico contra [0, max], devolvendo um ValidationError nomeado se falhar. */
function validateBounded(
  value: number,
  max: number,
  fieldName: string,
  traitName: string,
): ValidationError | null {
  if (!Number.isFinite(value) || value < 0) {
    return validationError(
      `${traitName}: ${fieldName} não pode ser negativo; recebido ${value}.`,
      fieldName,
    );
  }
  if (value > max) {
    return validationError(
      `${traitName}: ${fieldName} excede o teto de ${max} (doc 11 §7); recebido ${value}.`,
      fieldName,
    );
  }
  return null;
}

// Teto de 12% — doc 11 §7.
const MATADOR_MAX_PERCENT = 12;
export function createMatadorMagnitude(
  areaConversionBonusPercent: number,
): Result<MatadorMagnitude, ValidationError> {
  const error = validateBounded(
    areaConversionBonusPercent,
    MATADOR_MAX_PERCENT,
    'areaConversionBonusPercent',
    'Matador',
  );
  if (error) return Err(error);
  return Ok(Object.freeze({ trait: 'Matador' as const, areaConversionBonusPercent }));
}

// Teto de 10% — doc 11 §7.
const MAESTRO_MAX_PERCENT = 10;
export function createMaestroMagnitude(
  assistChanceBonusPercent: number,
): Result<MaestroMagnitude, ValidationError> {
  const error = validateBounded(
    assistChanceBonusPercent,
    MAESTRO_MAX_PERCENT,
    'assistChanceBonusPercent',
    'Maestro',
  );
  if (error) return Err(error);
  return Ok(Object.freeze({ trait: 'Maestro' as const, assistChanceBonusPercent }));
}

// Tetos compostos: +6 moral inicial, -30% redução de queda — doc 11 §7.
const CAPITAO_MAX_INITIAL_MORAL = 6;
const CAPITAO_MAX_MORAL_DECAY_REDUCTION_PERCENT = 30;
export function createCapitaoMagnitude(
  initialMoralBonus: number,
  moralDecayReductionPercent: number,
): Result<CapitaoMagnitude, ValidationError> {
  const error =
    validateBounded(initialMoralBonus, CAPITAO_MAX_INITIAL_MORAL, 'initialMoralBonus', 'Capitão') ??
    validateBounded(
      moralDecayReductionPercent,
      CAPITAO_MAX_MORAL_DECAY_REDUCTION_PERCENT,
      'moralDecayReductionPercent',
      'Capitão',
    );
  if (error) return Err(error);
  return Ok(
    Object.freeze({ trait: 'Capitão' as const, initialMoralBonus, moralDecayReductionPercent }),
  );
}

// Teto de 10% — doc 11 §7.
const MURALHA_MAX_PERCENT = 10;
export function createMuralhaMagnitude(
  opponentXgReductionPercent: number,
): Result<MuralhaMagnitude, ValidationError> {
  const error = validateBounded(
    opponentXgReductionPercent,
    MURALHA_MAX_PERCENT,
    'opponentXgReductionPercent',
    'Muralha',
  );
  if (error) return Err(error);
  return Ok(Object.freeze({ trait: 'Muralha' as const, opponentXgReductionPercent }));
}

// Teto de 8% — doc 11 §7.
const CLUTCH_PLAYER_MAX_PERCENT = 8;
export function createClutchPlayerMagnitude(
  lateGamePerformanceBonusPercent: number,
): Result<ClutchPlayerMagnitude, ValidationError> {
  const error = validateBounded(
    lateGamePerformanceBonusPercent,
    CLUTCH_PLAYER_MAX_PERCENT,
    'lateGamePerformanceBonusPercent',
    'Clutch Player',
  );
  if (error) return Err(error);
  return Ok(Object.freeze({ trait: 'Clutch Player' as const, lateGamePerformanceBonusPercent }));
}

// Teto de 8% — doc 11 §7.
const BIG_GAME_PLAYER_MAX_PERCENT = 8;
export function createBigGamePlayerMagnitude(
  highImportancePerformanceBonusPercent: number,
): Result<BigGamePlayerMagnitude, ValidationError> {
  const error = validateBounded(
    highImportancePerformanceBonusPercent,
    BIG_GAME_PLAYER_MAX_PERCENT,
    'highImportancePerformanceBonusPercent',
    'Big Game Player',
  );
  if (error) return Err(error);
  return Ok(
    Object.freeze({ trait: 'Big Game Player' as const, highImportancePerformanceBonusPercent }),
  );
}

// Tetos compostos: -25% risco de lesão, -20% taxa de fadiga — doc 11 §7.
const IRON_MAN_MAX_INJURY_RISK_REDUCTION_PERCENT = 25;
const IRON_MAN_MAX_FATIGUE_RATE_REDUCTION_PERCENT = 20;
export function createIronManMagnitude(
  injuryRiskReductionPercent: number,
  fatigueRateReductionPercent: number,
): Result<IronManMagnitude, ValidationError> {
  const error =
    validateBounded(
      injuryRiskReductionPercent,
      IRON_MAN_MAX_INJURY_RISK_REDUCTION_PERCENT,
      'injuryRiskReductionPercent',
      'Iron Man',
    ) ??
    validateBounded(
      fatigueRateReductionPercent,
      IRON_MAN_MAX_FATIGUE_RATE_REDUCTION_PERCENT,
      'fatigueRateReductionPercent',
      'Iron Man',
    );
  if (error) return Err(error);
  return Ok(
    Object.freeze({
      trait: 'Iron Man' as const,
      injuryRiskReductionPercent,
      fatigueRateReductionPercent,
    }),
  );
}

// Teto de 30% — doc 11 §7.
const FAST_RECOVERY_MAX_PERCENT = 30;
export function createFastRecoveryMagnitude(
  injuryDurationReductionPercent: number,
): Result<FastRecoveryMagnitude, ValidationError> {
  const error = validateBounded(
    injuryDurationReductionPercent,
    FAST_RECOVERY_MAX_PERCENT,
    'injuryDurationReductionPercent',
    'Fast Recovery',
  );
  if (error) return Err(error);
  return Ok(Object.freeze({ trait: 'Fast Recovery' as const, injuryDurationReductionPercent }));
}

// Teto de 10% — doc 11 §7.
const SUPER_SUB_MAX_PERCENT = 10;
export function createSuperSubMagnitude(
  firstMinutesAttributeBonusPercent: number,
): Result<SuperSubMagnitude, ValidationError> {
  const error = validateBounded(
    firstMinutesAttributeBonusPercent,
    SUPER_SUB_MAX_PERCENT,
    'firstMinutesAttributeBonusPercent',
    'Super Sub',
  );
  if (error) return Err(error);
  return Ok(Object.freeze({ trait: 'Super Sub' as const, firstMinutesAttributeBonusPercent }));
}

// Teto de 15% — doc 11 §7.
const DEAD_BALL_SPECIALIST_MAX_PERCENT = 15;
export function createDeadBallSpecialistMagnitude(
  setPieceBonusPercent: number,
): Result<DeadBallSpecialistMagnitude, ValidationError> {
  const error = validateBounded(
    setPieceBonusPercent,
    DEAD_BALL_SPECIALIST_MAX_PERCENT,
    'setPieceBonusPercent',
    'Dead Ball Specialist',
  );
  if (error) return Err(error);
  return Ok(Object.freeze({ trait: 'Dead Ball Specialist' as const, setPieceBonusPercent }));
}

// Teto de 0.5 pontos percentuais — doc 11 §7 (nota: unidade pequena de propósito, não é um erro de digitação).
const HERO_MOMENT_MAX_PERCENTAGE_POINTS = 0.5;
export function createHeroMomentMagnitude(
  rareEventChanceBonusPercentagePoints: number,
): Result<HeroMomentMagnitude, ValidationError> {
  const error = validateBounded(
    rareEventChanceBonusPercentagePoints,
    HERO_MOMENT_MAX_PERCENTAGE_POINTS,
    'rareEventChanceBonusPercentagePoints',
    'Hero Moment',
  );
  if (error) return Err(error);
  return Ok(Object.freeze({ trait: 'Hero Moment' as const, rareEventChanceBonusPercentagePoints }));
}

// Teto de 10% — doc 11 §7. (componente qualitativo de variância não tem número documentado — ver types.ts)
const GELO_NAS_VEIAS_MAX_PERCENT = 10;
export function createGeloNasVeiasMagnitude(
  penaltyConversionBonusPercent: number,
): Result<GeloNasVeiasMagnitude, ValidationError> {
  const error = validateBounded(
    penaltyConversionBonusPercent,
    GELO_NAS_VEIAS_MAX_PERCENT,
    'penaltyConversionBonusPercent',
    'Gelo nas Veias',
  );
  if (error) return Err(error);
  return Ok(Object.freeze({ trait: 'Gelo nas Veias' as const, penaltyConversionBonusPercent }));
}

/**
 * Leader: SEM teto percentual absoluto documentado para o valor de uma
 * única carta (ver nota em types.ts) — só valida não-negatividade e
 * finitude. O teto estrutural real deste trait está na FUNÇÃO DE
 * EMPILHAMENTO abaixo, não na construção individual.
 */
export function createLeaderMagnitude(
  basePerCardBonus: number,
): Result<LeaderMagnitude, ValidationError> {
  if (!Number.isFinite(basePerCardBonus) || basePerCardBonus < 0) {
    return Err(
      validationError(
        `Leader: basePerCardBonus não pode ser negativo; recebido ${basePerCardBonus}.`,
        'basePerCardBonus',
      ),
    );
  }
  return Ok(Object.freeze({ trait: 'Leader' as const, basePerCardBonus }));
}

/**
 * Empilhamento de Leader (doc 11 §7):
 *
 *     BônusTotalLeader(n) = Σ_{i=1}^{n} base × (0.5)^(i-1)
 *
 * com teto absoluto de 2×base. A série geométrica de razão 0.5 converge
 * matematicamente para exatamente 2×base quando n→∞ — ou seja, o teto
 * não é um clamp arbitrário sobre o resultado, é uma PROPRIEDADE da
 * própria fórmula (soma de uma progressão geométrica infinita de razão
 * 1/2 = primeiro termo × 2). O `Math.min` abaixo é só uma garantia
 * defensiva extra contra erro de ponto flutuante, nunca deveria
 * realmente entrar em ação para nenhum `n` finito.
 */
export function calculateLeaderStackedBonus(
  basePerCardBonus: number,
  stackedCardCount: number,
): number {
  if (stackedCardCount <= 0 || basePerCardBonus <= 0) {
    return 0;
  }
  let total = 0;
  for (let i = 0; i < stackedCardCount; i += 1) {
    total += basePerCardBonus * 0.5 ** i;
  }
  const absoluteCeiling = 2 * basePerCardBonus;
  return Math.min(total, absoluteCeiling);
}
