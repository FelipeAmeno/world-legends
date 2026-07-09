/**
 * components/packs/pack-cinematic-tokens.ts — Sprint 22 (Pack Experience 2.0)
 *
 * Toda constante numérica dos efeitos cinematográficos NOVOS desta sprint
 * (tilt 3D real, luz volumétrica, smoke, sombra de contato, "carta nasce
 * da luz") vive aqui — nenhum valor mágico inline nesses componentes,
 * conforme item "tudo parametrizado" do brief.
 *
 * O que já existia antes desta sprint (flash/rings em ExplosionOverlay,
 * camera shake em useCameraShake, timing por raridade em RevealedCard.tsx
 * — RARITY_FLIP_DUR/PARTICLE_COUNT/etc.) já era parametrizado como tabelas
 * nomeadas por raridade, não números soltos no meio de JSX — não precisou
 * migrar pra cá, só o que é genuinamente novo.
 */

// ─── Tilt 3D real do pack (item 1 — "Novo Pack 3D") ────────────────────────────
// Antes desta sprint, `PackFloatScene` já tinha `rotateY` no float idle, mas
// SEM `perspective` em nenhum ancestral — rotateY sem perspective não produz
// profundidade real (fica um "achatamento" 2D, não uma rotação 3D de verdade).
export const PACK_TILT_PERSPECTIVE_PX = 1000;
export const PACK_TILT_MAX_DEG = 12; // máximo de inclinação reativa ao ponteiro

// ─── Luz volumétrica (item 2) ───────────────────────────────────────────────────
export const VOLUMETRIC_RAY_COUNT = 8;
export const VOLUMETRIC_OPACITY_IDLE = 0.1;
export const VOLUMETRIC_OPACITY_CHARGE = 0.38;
export const VOLUMETRIC_ROTATE_DURATION_S = 14;

// ─── Smoke (item 4) ──────────────────────────────────────────────────────────
export const SMOKE_PUFF_COUNT = 6;
export const SMOKE_RISE_DURATION_MS = 1900;
export const SMOKE_MAX_OPACITY = 0.32;
export const SMOKE_MAX_SCALE = 2.6;

// ─── Sombra de contato / "sombras reais" (item 9) ──────────────────────────────
export const CONTACT_SHADOW_BLUR_PX = 26;
export const CONTACT_SHADOW_OPACITY = 0.5;
export const CONTACT_SHADOW_WIDTH_PX = 150;
export const CONTACT_SHADOW_HEIGHT_PX = 28;

// ─── "Carta nasce da luz" (item 10) ─────────────────────────────────────────────
export const LIGHT_BIRTH_DURATION_MS = 480;
export const LIGHT_BIRTH_START_SCALE = 4.5;
