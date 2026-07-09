/**
 * components/packs/pack-visuals.ts — Sprint 22 (Pack Experience 2.0) originalmente
 * vivia dentro de `PackFloatScene.tsx`; extraído na Sprint 25 (AAA Pack Store)
 * porque `FeaturedPackCard.tsx` (a loja) precisa do mesmo gradiente/label por
 * pack que a tela de abertura já usa — mesma identidade visual em dois lugares,
 * uma fonte só.
 */

export type PackVisualId =
  | 'starter'
  | 'classic'
  | 'national'
  | 'elite'
  | 'hero'
  | 'legend'
  | 'goat';

type PackVisual = {
  bg: string;
  shine: string;
  label: string;
};

export const PACK_VISUALS: Record<PackVisualId, PackVisual> = {
  starter: {
    bg: 'linear-gradient(145deg, #05130a 0%, #0c2314 40%, #123a1f 70%, #1f6b3a 100%)',
    shine: 'rgba(74,222,128,0.5)',
    label: 'STARTER',
  },
  classic: {
    bg: 'linear-gradient(145deg, #0d0020 0%, #1a0040 40%, #2d0060 70%, #4c1d95 100%)',
    shine: 'rgba(147,51,234,0.5)',
    label: 'CLASSIC',
  },
  national: {
    bg: 'linear-gradient(145deg, #04140a 0%, #082410 40%, #0d3a17 70%, #1a7a2f 100%)',
    shine: 'rgba(34,197,94,0.5)',
    label: 'BRAZIL',
  },
  elite: {
    bg: 'linear-gradient(145deg, #000d2a 0%, #001a4d 40%, #002266 70%, #1e3a8a 100%)',
    shine: 'rgba(59,130,246,0.5)',
    label: 'ELITE',
  },
  hero: {
    bg: 'linear-gradient(145deg, #0f0018 0%, #1f0030 40%, #350052 70%, #6b0d99 100%)',
    shine: 'rgba(192,38,211,0.5)',
    label: 'HERO',
  },
  legend: {
    bg: 'linear-gradient(145deg, #110800 0%, #2d1500 40%, #4a2200 70%, #78350f 100%)',
    shine: 'rgba(201,168,76,0.6)',
    label: 'LEGEND',
  },
  goat: {
    bg: 'linear-gradient(145deg, #140f00 0%, #2c2000 40%, #4d3800 70%, #92660a 100%)',
    shine: 'rgba(251,191,36,0.55)',
    label: 'GOAT',
  },
};

/** `pack.id` é sempre um `PackVisualId` na prática, mas vem tipado como
 * `string` de `PackDefinitionUI` — indexação por string genérica não
 * garante presença pro TS, daí o fallback pra 'classic' sem non-null
 * assertion (a chave literal `.classic` é garantida pelo `Record` exaustivo
 * acima, diferente da indexação por `id`). */
export function resolvePackVisual(id: string): PackVisual {
  return PACK_VISUALS[id as PackVisualId] ?? PACK_VISUALS.classic;
}
