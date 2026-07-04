/**
 * lib/sound-manager.ts — Sprint 3 (expanded)
 *
 * Gerenciador de áudio via Web Audio API.
 * Sons sintéticos como placeholders — substituir por arquivos reais.
 *
 * Para adicionar sons reais:
 *   1. Adicionar arquivos em /public/sounds/
 *   2. Usar loadSound() para pré-carregar
 *   3. Substituir playTone() por playBuffer()
 *
 * Catálogo de sons planejados:
 *   PACKS
 *     pack_select.mp3   → card swipe suave
 *     pack_charge.mp3   → build-up eletrônico
 *     pack_open.mp3     → whoosh + crack
 *
 *   CARDS (por raridade)
 *     card_common.mp3   → soft pop
 *     card_rare.mp3     → shimmer
 *     card_elite.mp3    → electric zap
 *     card_legendary.mp3 → epic fanfare curta
 *     card_ultra.mp3    → rainbow synth chord
 *     card_goat.mp3     → orchestral hit + choir
 *
 *   UI
 *     ui_tap.mp3        → click seco e curto
 *     ui_success.mp3    → confirmação positiva
 *     ui_error.mp3      → buzz negativo
 *     ui_toggle.mp3     → switch mecânico
 *     ui_nav.mp3        → transição suave
 *
 *   MATCH
 *     match_goal.mp3    → crowd roar + horn
 *     match_start.mp3   → apito de árbitro
 *     match_end.mp3     → apito final triplo
 *     match_win.mp3     → fanfare de vitória
 *     match_lose.mp3    → tom descendente
 *
 *   REWARDS
 *     reward_coins.mp3  → moedas caindo
 *     reward_xp.mp3     → chime ascendente
 *     level_up.mp3      → fanfare + ding
 *     mission_done.mp3  → arpejo completo
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

// ─── Sons de UI (Sprint 3) ────────────────────────────────────────────────────

export const UI_SFX = {
  /** Clique seco em botão */
  tap: () => {
    playTone(800, 0.04, 'sine', 0.08);
    playTone(1200, 0.03, 'sine', 0.05, 0.02);
  },

  /** Confirmação positiva */
  success: () => {
    playTone(660, 0.12, 'sine', 0.12);
    playTone(880, 0.15, 'sine', 0.10, 0.10);
    playTone(1100,0.20, 'sine', 0.08, 0.20);
  },

  /** Erro / ação bloqueada */
  error: () => {
    playTone(180, 0.08, 'sawtooth', 0.15);
    playTone(140, 0.12, 'sawtooth', 0.12, 0.08);
  },

  /** Toggle / switch */
  toggle: () => {
    playTone(900, 0.04, 'square', 0.06);
    playTone(1100,0.04, 'square', 0.05, 0.04);
  },

  /** Transição de tela */
  navigate: () => {
    playTone(440, 0.06, 'sine', 0.07);
    playTone(550, 0.08, 'sine', 0.06, 0.05);
  },

  /** Squad salvo */
  save: () => {
    playTone(550, 0.10, 'sine', 0.10);
    playTone(660, 0.12, 'sine', 0.08, 0.08);
    playTone(880, 0.14, 'sine', 0.06, 0.16);
  },
} as const;

// ─── Sons de Partida (Sprint 3) ───────────────────────────────────────────────

export const MATCH_SFX = {
  /** Gol marcado — torcida */
  goal: () => {
    // Horn + crowd roar sintético
    [220, 277, 330, 440].forEach((f, i) => {
      playTone(f, 0.8, 'sawtooth', 0.10 + i * 0.02, i * 0.04);
    });
    playTone(880, 0.5, 'sine', 0.15, 0.1);
  },

  /** Apito inicial */
  kickoff: () => {
    playTone(1200, 0.12, 'square', 0.18);
    playTone(1000, 0.10, 'square', 0.15, 0.14);
  },

  /** Apito final */
  fullTime: () => {
    playTone(1200, 0.12, 'square', 0.18);
    playTone(1000, 0.10, 'square', 0.15, 0.14);
    playTone(1200, 0.12, 'square', 0.18, 0.28);
  },

  /** Vitória */
  win: () => {
    [440, 550, 660, 880, 1100].forEach((f, i) => {
      playTone(f, 0.35, 'sine', 0.10 + i * 0.02, i * 0.08);
    });
  },

  /** Derrota */
  lose: () => {
    [440, 370, 330, 220].forEach((f, i) => {
      playTone(f, 0.4, 'sine', 0.12, i * 0.1);
    });
  },
} as const;

// ─── Sons de Recompensa (Sprint 3) ────────────────────────────────────────────

export const REWARD_SFX = {
  /** Moedas pequenas */
  coins: () => {
    [880, 990, 1100].forEach((f, i) => {
      playTone(f, 0.08, 'sine', 0.10, i * 0.06);
    });
  },

  /** XP ganho */
  xp: () => {
    playTone(660, 0.10, 'triangle', 0.10);
    playTone(880, 0.14, 'triangle', 0.08, 0.08);
  },

  /** Level up! */
  levelUp: () => {
    const chord = [330, 415, 495, 660, 825, 990, 1320];
    chord.forEach((f, i) => {
      playTone(f, 0.6, 'sine', 0.08 + i * 0.01, i * 0.05);
    });
    // Shimmer peak
    playTone(1760, 0.8, 'sine', 0.10, 0.4);
  },

  /** Missão concluída */
  missionDone: () => {
    [440, 550, 660, 880].forEach((f, i) => {
      playTone(f, 0.2, 'sine', 0.10, i * 0.07);
    });
    playTone(1320, 0.3, 'sine', 0.08, 0.32);
  },
} as const;
