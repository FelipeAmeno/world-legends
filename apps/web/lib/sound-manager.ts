/**
 * lib/sound-manager.ts — T052
 *
 * Gerenciador de áudio via Web Audio API.
 * Os arquivos de som são placeholders (sin wave sintético).
 *
 * Para adicionar sons reais:
 *   1. Adicionar arquivos em /public/sounds/
 *   2. Descomentar o loader em loadSound()
 *
 * Sons planejados:
 *   pack_select.mp3   → card swipe suave
 *   pack_charge.mp3   → build-up eletrônico
 *   pack_open.mp3     → whoosh + crack
 *   card_common.mp3   → soft pop
 *   card_rare.mp3     → shimmer
 *   card_elite.mp3    → electric zap
 *   card_legendary.mp3 → epic fanfare
 *   card_ultra.mp3    → rainbow synth chord
 *   card_goat.mp3     → orchestral hit + choir
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new AudioContext(); } catch { return null; }
  }
  return ctx;
}

/** Gera um bip sintético como placeholder de som */
function playTone(
  freq:    number,
  dur:     number,
  type:    OscillatorType = 'sine',
  volume:  number = 0.15,
  delay:   number = 0,
): void {
  const c = getCtx();
  if (!c) return;

  const osc  = c.createOscillator();
  const gain = c.createGain();

  osc.connect(gain);
  gain.connect(c.destination);

  osc.type      = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);

  gain.gain.setValueAtTime(0, c.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);

  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + dur + 0.01);
}

// ─── Sons por evento ──────────────────────────────────────────────────────────

export const SFX = {
  packSelect: () => {
    playTone(440, 0.12, 'sine', 0.1);
    playTone(660, 0.10, 'sine', 0.08, 0.06);
  },

  packCharge: () => {
    // Build-up crescente
    const c = getCtx(); if (!c) return;
    [200, 300, 440, 600, 800].forEach((freq, i) => {
      playTone(freq, 0.2, 'sawtooth', 0.05 + i * 0.02, i * 0.18);
    });
  },

  packOpen: () => {
    // Whoosh + crack
    playTone(120, 0.08, 'square', 0.2);
    playTone(2000, 0.25, 'sine', 0.15, 0.05);
    playTone(800,  0.30, 'triangle', 0.1, 0.1);
  },

  cardCommon: () => {
    playTone(550, 0.12, 'sine', 0.12);
  },

  cardRare: () => {
    playTone(660, 0.15, 'sine', 0.15);
    playTone(880, 0.12, 'sine', 0.10, 0.08);
  },

  cardElite: () => {
    playTone(440, 0.05, 'square', 0.20);
    playTone(880, 0.25, 'sine',   0.15, 0.05);
    playTone(1320,0.20, 'sine',   0.10, 0.12);
  },

  cardLegendary: () => {
    [440, 550, 660, 880, 1100].forEach((f, i) => {
      playTone(f, 0.4, 'sine', 0.12 + i * 0.02, i * 0.06);
    });
  },

  cardUltra: () => {
    [330, 415, 495, 660, 825, 990].forEach((f, i) => {
      playTone(f, 0.5, 'sine', 0.10 + i * 0.015, i * 0.05);
    });
  },

  cardGoat: () => {
    // Orchestral hit sintético
    const freqs = [220, 277, 330, 440, 554, 660, 880];
    freqs.forEach((f, i) => {
      playTone(f, 1.5, 'sine',     0.12 + i * 0.01, i * 0.03);
      playTone(f * 2, 0.8, 'triangle', 0.06,         i * 0.04 + 0.3);
    });
  },
} as const;

export type SFXKey = keyof typeof SFX;

/** Mapa de raridade → som */
export const RARITY_SFX: Record<string, SFXKey> = {
  common:         'cardCommon',
  rare:           'cardRare',
  elite:          'cardElite',
  legendary:      'cardLegendary',
  ultra:          'cardUltra',
  world_cup_hero: 'cardGoat',
};
