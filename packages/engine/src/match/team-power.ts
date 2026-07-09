import type { TacticalIntensity } from '../fatigue/types';
/**
 * `calculateTeamPower` — doc 09 §3, o número 1–99 que dirige a resolução
 * de eventos (quem é "favorecido" a cada minuto, qualidade ofensiva vs
 * defensiva no xG). Sintetiza setor (doc 09 §1.3 via `calculateOverall`,
 * T004), tática (doc 09 §14), química (doc 09 §4 + o bônus de Time
 * Histórico Completo que ficou pendente desde a T005 — ver nota abaixo),
 * moral (doc 09 §5) e vantagem de mando (doc 09 §9).
 *
 * DECISÃO DE SÍNTESE (mapeamento posição→setor): doc 09 §1.3 confirma
 * que a MESMA tabela de pesos por posição alimenta tanto Overall quanto
 * "a contribuição individual de cada jogador para a Força de Setor",
 * mas NENHUM doc dá a tabela posição→setor explicitamente — só nomeia
 * os setores descritivamente ("atacantes e meias ofensivos", "meio
 * campistas", "zagueiros e laterais"). O mapeamento abaixo é meu,
 * baseado nessa descrição, e é FIXO (independente de formação) — doc 09
 * §15 diz que a "ponderação de setor" deveria variar por formação, mas
 * sem nenhuma tabela concreta disso em doc nenhum; não implementado.
 *
 * RESOLVE O GANCHO DA T005: `calculateChemistry` (T005) descobriu que
 * somar o bônus de Time Histórico Completo (+8) direto na química 0–100
 * é matematicamente inerte, e devolveu `isCompleteHistoricalSquad` como
 * flag separado para "a futura camada de Força de Time decidir em que
 * escala aplicar". Esta é essa camada: o +8 é somado aqui, ao
 * `bonusQuimica` (escala -3..+4), onde tem efeito real mesmo com química
 * de base em 100.
 */
import { calculateOverall } from '../overall/overall';
import type { AttributeSet } from '../overall/types';
import type { Position } from '../position';
import type { StartingSlot } from './types';

export type Sector = 'attack' | 'midfield' | 'defense' | 'goalkeeper';

/** Decisão própria, ver nota acima — sem tabela posição→setor documentada. */
const SECTOR_BY_POSITION: Readonly<Record<Position, Sector>> = {
  GK: 'goalkeeper',
  CB: 'defense',
  LB: 'defense',
  RB: 'defense',
  LWB: 'defense',
  RWB: 'defense',
  CDM: 'midfield',
  CM: 'midfield',
  CAM: 'midfield',
  LM: 'midfield',
  RM: 'midfield',
  LW: 'attack',
  RW: 'attack',
  CF: 'attack',
  ST: 'attack',
};

/**
 * doc 09 §14 — colunas "Modificador ataque/meio/defesa" da tabela de
 * táticas (a coluna de fadiga já está em `fatigue.ts`, T008).
 *
 * `pressao_alta`/`contra_ataque` (Sprint 26, decisão própria — sem
 * tabela documentada, mesmo padrão das demais linhas): pressão alta
 * ataca o meio-campo do adversário para recuperar a bola rápido —
 * ganho real em meio e ataque (transição), defesa um pouco mais aberta
 * (linha alta = espaço nas costas); contra-ataque é o oposto de
 * ultra_ofensivo com a MESMA filosofia "poucos, mas letais": defesa
 * sólida (absorve pressão), ataque afiado nas raras posses, meio-campo
 * sacrificado (não tenta controlar o jogo).
 */
const TACTICAL_SECTOR_MODIFIER: Readonly<
  Record<TacticalIntensity, Readonly<{ attack: number; midfield: number; defense: number }>>
> = {
  ultra_defensivo: { attack: 0.7, midfield: 0.85, defense: 1.25 },
  defensivo: { attack: 0.85, midfield: 0.95, defense: 1.15 },
  equilibrado: { attack: 1.0, midfield: 1.0, defense: 1.0 },
  ofensivo: { attack: 1.15, midfield: 0.95, defense: 0.85 },
  ultra_ofensivo: { attack: 1.3, midfield: 0.85, defense: 0.65 },
  pressao_alta: { attack: 1.1, midfield: 1.15, defense: 0.9 },
  contra_ataque: { attack: 1.1, midfield: 0.8, defense: 1.1 },
};

/** doc 09 §9. */
export const HOME_ADVANTAGE_POWER_BONUS = 3;
export const HOME_ADVANTAGE_MORALE_BONUS = 5;
export const HOME_ADVANTAGE_CARD_LENIENCY_PERCENT = 10;

/** doc 10 §7 + doc 13 TC-COMBO-05 — o mesmo valor exportado por `chemistry.ts` desde a T005, agora finalmente consumido. */
const HISTORICAL_COMPLETE_SQUAD_BONUS = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function calculateSectorStrength(starters: readonly StartingSlot[], sector: Sector): number {
  const playersInSector = starters.filter(
    (slot) => SECTOR_BY_POSITION[slot.formationPosition] === sector,
  );
  if (playersInSector.length === 0) {
    // formação atípica sem nenhum jogador no setor — não deveria ocorrer
    // numa escalação real de 11, mas evita divisão por zero sem inventar
    // um valor extremo; 50 é o ponto médio neutro da escala 1-99.
    return 50;
  }
  const total = playersInSector.reduce(
    (sum, slot) =>
      sum + calculateOverall(slot.player.attributes as AttributeSet, slot.formationPosition),
    0,
  );
  return total / playersInSector.length;
}

/**
 * doc 09 §4: "bonusQuimica na Força de Time: de -3 (química<20) a +4
 * (química>85)." Doc só dá os dois pontos-âncora, não a curva entre
 * eles — interpolação linear é minha escolha explícita, não inventei um
 * novo formato de curva sem necessidade.
 */
export function calculateChemistryBonus(
  chemistry: number,
  isCompleteHistoricalSquad: boolean,
): number {
  let bonus: number;
  if (chemistry <= 20) {
    bonus = -3;
  } else if (chemistry >= 85) {
    bonus = 4;
  } else {
    bonus = -3 + ((chemistry - 20) / (85 - 20)) * (4 - -3);
  }
  if (isCompleteHistoricalSquad) {
    bonus += HISTORICAL_COMPLETE_SQUAD_BONUS;
  }
  return bonus;
}

/** doc 09 §5: `mapear(moral, de=[-100,100], para=[-6,+6])` — interpolação linear explícita no próprio doc, não uma escolha minha. */
export function calculateMoraleBonus(moraleMinus100To100: number): number {
  const clampedMorale = clamp(moraleMinus100To100, -100, 100);
  return (clampedMorale / 100) * 6;
}

export function calculateTeamPower(input: {
  starters: readonly StartingSlot[];
  tacticalIntensity: TacticalIntensity;
  chemistry: number;
  isCompleteHistoricalSquad: boolean;
  moraleMinus100To100: number;
  isHomeTeam: boolean;
  isNeutralVenue: boolean;
  averageFatiguePoints: number;
}): number {
  const modifier = TACTICAL_SECTOR_MODIFIER[input.tacticalIntensity];
  const attack = calculateSectorStrength(input.starters, 'attack') * modifier.attack;
  const midfield = calculateSectorStrength(input.starters, 'midfield') * modifier.midfield;
  const defense = calculateSectorStrength(input.starters, 'defense') * modifier.defense;
  const goalkeeper = calculateSectorStrength(input.starters, 'goalkeeper');

  let base = attack * 0.3 + midfield * 0.3 + defense * 0.3 + goalkeeper * 0.1;
  base += calculateChemistryBonus(input.chemistry, input.isCompleteHistoricalSquad);
  base += calculateMoraleBonus(input.moraleMinus100To100);
  if (input.isHomeTeam && !input.isNeutralVenue) {
    base += HOME_ADVANTAGE_POWER_BONUS;
  }
  base -= input.averageFatiguePoints;

  return clamp(base, 1, 99);
}

export { SECTOR_BY_POSITION };
