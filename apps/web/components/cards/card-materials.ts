/**
 * components/cards/card-materials.ts — Sprint 19 (World Legends Visual Identity)
 *
 * Sistema de materiais por raridade. Cada raridade tem um MATERIAL, não só
 * uma cor — a classe CSS (`app/globals.css`, seção "CARD MATERIALS")
 * implementa a textura/acabamento; este arquivo é a fonte única de qual
 * material corresponde a qual raridade e os parâmetros que
 * ReflectionLayer/AmbientLightLayer leem pra se comportar de acordo
 * (metal cromado reflete forte e nítido; plástico fosco quase não reflete).
 */
import type { RarityCode } from '@world-legends/types';

export type MaterialId = 'plastic' | 'anodized-metal' | 'carbon' | 'gold' | 'platinum' | 'ceramic';

export type MaterialDef = {
  id: MaterialId;
  /** Nome pra documentação/UI de debug — nunca aparece na carta em si. */
  label: string;
  className: string;
  /** 0 (sem reflexo, plástico) a 1 (espelhado, cromado) — usado por ReflectionLayer. */
  reflectionIntensity: number;
  /** Largura relativa do feixe de reflexo — materiais polidos têm feixe estreito e nítido. */
  reflectionSharpness: 'soft' | 'medium' | 'sharp';
  /** Intensidade da luz ambiente que o material "recebe" — cerâmica/cromado brilham mais. */
  ambientIntensity: number;
};

export const RARITY_MATERIAL: Record<RarityCode, MaterialDef> = {
  common: {
    id: 'plastic',
    label: 'Plástico Fosco',
    className: 'card-material-plastic',
    reflectionIntensity: 0.08,
    reflectionSharpness: 'soft',
    ambientIntensity: 0.15,
  },
  rare: {
    id: 'anodized-metal',
    label: 'Metal Anodizado',
    className: 'card-material-anodized',
    reflectionIntensity: 0.35,
    reflectionSharpness: 'medium',
    ambientIntensity: 0.3,
  },
  elite: {
    id: 'carbon',
    label: 'Carbono Premium',
    className: 'card-material-carbon',
    reflectionIntensity: 0.4,
    reflectionSharpness: 'medium',
    ambientIntensity: 0.32,
  },
  legendary: {
    id: 'gold',
    label: 'Ouro Lapidado',
    className: 'card-material-gold',
    reflectionIntensity: 0.6,
    reflectionSharpness: 'medium',
    ambientIntensity: 0.45,
  },
  ultra: {
    id: 'platinum',
    label: 'Platina Cromada',
    className: 'card-material-platinum',
    reflectionIntensity: 0.85,
    reflectionSharpness: 'sharp',
    ambientIntensity: 0.55,
  },
  world_cup_hero: {
    id: 'ceramic',
    label: 'Cerâmica Branca Premium',
    className: 'card-material-ceramic',
    reflectionIntensity: 0.7,
    reflectionSharpness: 'soft',
    ambientIntensity: 0.6,
  },
};
