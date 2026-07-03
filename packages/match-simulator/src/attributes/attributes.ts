/**
 * Síntese de AttributeSet a partir de (position, overall).
 *
 * Problema: o engine espera `AttributeSet` completo por jogador (19 atributos),
 * mas packages/squad apenas armazena `overall: number` e `naturalPosition`.
 *
 * Solução: derivar um AttributeSet "plausível" onde
 *   calculateOverall(result, position) ≈ overall
 *
 * Matematicamente garantido porque os pesos do engine somam 1.0 por posição
 * (doc 09 §1.3). Se todos os atributos relevantes valem X, o OVR = X.
 *
 * Os atributos irrelevantes para a posição ficam em valores neutros:
 *   - GK-específicos (gk_*) para jogadores de campo → 20
 *   - Demais irrelevantes → 50 (baseline neutro)
 *
 * Variação posicional aplicada ao overall ±5 para atributos secundários,
 * criando assimetrias realistas (ex: CB com passing alto levemente punido).
 */
import type { AttributeSet } from '@world-legends/engine';
import type { Position } from '@world-legends/types';

// ─── Perfis por posição ───────────────────────────────────────────────────────

/**
 * Para cada posição: quais atributos são primários (peso alto no OVR),
 * quais são secundários (impacto indireto no jogo) e quais são
 * praticamente irrelevantes.
 *
 * Baseado na tabela de pesos de doc 09 §1.3 (transcrita em engine/src/overall/overall.ts).
 */
type PositionProfile = {
  /** Atributos que recebem `overall` integralmente. */
  readonly primary: readonly (keyof AttributeSet)[];
  /** Atributos que recebem `max(40, overall - 15)` — relevantes mas não dominantes. */
  readonly secondary: readonly (keyof AttributeSet)[];
};

const POSITION_PROFILES: Record<Position, PositionProfile> = {
  GK: {
    primary: ['gk_reflexes', 'gk_positioning', 'gk_handling', 'gk_kicking', 'composure'],
    secondary: ['gk_penalty_save', 'physical'],
  },
  CB: {
    primary: ['defending', 'physical', 'heading', 'passing', 'pace', 'composure'],
    secondary: ['aggression', 'leadership'],
  },
  LB: {
    primary: ['pace', 'defending', 'passing', 'dribbling', 'physical', 'stamina'],
    secondary: [],
  },
  RB: {
    primary: ['pace', 'defending', 'passing', 'dribbling', 'physical', 'stamina'],
    secondary: [],
  },
  LWB: {
    primary: ['pace', 'stamina', 'dribbling', 'passing', 'defending', 'physical'],
    secondary: ['finishing'],
  },
  RWB: {
    primary: ['pace', 'stamina', 'dribbling', 'passing', 'defending', 'physical'],
    secondary: ['finishing'],
  },
  CDM: {
    primary: ['defending', 'passing', 'physical', 'composure', 'vision', 'stamina'],
    secondary: ['aggression', 'heading'],
  },
  CM: {
    primary: ['passing', 'vision', 'dribbling', 'stamina', 'composure', 'pace'],
    secondary: ['finishing', 'defending'],
  },
  CAM: {
    primary: ['vision', 'passing', 'dribbling', 'composure', 'finishing', 'pace'],
    secondary: ['shot_power'],
  },
  LM: {
    primary: ['pace', 'dribbling', 'passing', 'stamina', 'vision', 'finishing'],
    secondary: ['shot_power'],
  },
  RM: {
    primary: ['pace', 'dribbling', 'passing', 'stamina', 'vision', 'finishing'],
    secondary: ['shot_power'],
  },
  LW: {
    primary: ['pace', 'dribbling', 'finishing', 'shot_power', 'vision', 'composure'],
    secondary: ['passing', 'stamina'],
  },
  RW: {
    primary: ['pace', 'dribbling', 'finishing', 'shot_power', 'vision', 'composure'],
    secondary: ['passing', 'stamina'],
  },
  CF: {
    primary: ['finishing', 'dribbling', 'composure', 'pace', 'vision', 'shot_power'],
    secondary: ['heading', 'passing'],
  },
  ST: {
    primary: ['finishing', 'shot_power', 'composure', 'pace', 'heading', 'physical'],
    secondary: ['dribbling', 'vision'],
  },
};

// ─── makeAttributesFromOverall ────────────────────────────────────────────────

/**
 * Cria um `AttributeSet` onde `calculateOverall(result, position) ≈ overall`.
 *
 * @param position  Posição natural do jogador
 * @param overall   Overall 40–99
 */
export function makeAttributesFromOverall(position: Position, overall: number): AttributeSet {
  const ovr = Math.max(40, Math.min(99, Math.round(overall)));
  const secondary = Math.max(40, ovr - 12);

  const profile = POSITION_PROFILES[position];
  const isGK = position === 'GK';

  // Base: tudo começa neutro
  const base: AttributeSet = {
    pace: 50,
    stamina: 60,
    physical: 55,
    heading: 50,
    finishing: 50,
    shot_power: 50,
    passing: 55,
    vision: 50,
    dribbling: 50,
    penalty_kicks: 50,
    defending: 50,
    composure: 55,
    aggression: 50,
    leadership: 50,
    // GK: jogadores de campo têm valores mínimos
    gk_reflexes: isGK ? ovr : 22,
    gk_positioning: isGK ? ovr : 20,
    gk_handling: isGK ? ovr : 20,
    gk_kicking: isGK ? ovr : 25,
    gk_penalty_save: isGK ? secondary : 20,
  };

  // Aplicar perfil: primários recebem OVR, secundários recebem OVR-12
  const result = { ...base };
  for (const attr of profile.primary) {
    if (attr in result) (result as Record<string, number>)[attr] = ovr;
  }
  for (const attr of profile.secondary) {
    if (attr in result) (result as Record<string, number>)[attr] = secondary;
  }

  return result;
}
