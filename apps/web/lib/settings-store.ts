/**
 * lib/settings-store.ts — T058
 *
 * Store de configurações persistido em localStorage.
 * Sem React — puro TS para ser consumido em qualquer lugar.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Language = 'pt-BR' | 'en' | 'es';
export type FpsTarget = 30 | 60;
export type PerfMode = 'low' | 'medium' | 'high';
export type ThemeMode = 'dark'; // sempre dark por ora

export type GameSettings = {
  // Áudio
  sound: boolean;
  musicVolume: number; // 0–100
  sfxVolume: number; // 0–100
  muteMusic: boolean;
  muteSfx: boolean;

  // Experiência
  vibration: boolean;
  animations: boolean; // desabilitar animações p/ dispositivos lentos

  // Performance
  fps: FpsTarget;
  performance: PerfMode;

  // Interface
  language: Language;
  compactMode: boolean; // UI mais densa

  // Privacidade
  analytics: boolean;
  crashReports: boolean;
  personalData: boolean;
};

export const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  musicVolume: 70,
  sfxVolume: 80,
  muteMusic: false,
  muteSfx: false,
  vibration: true,
  animations: true,
  fps: 60,
  performance: 'high',
  language: 'pt-BR',
  compactMode: false,
  analytics: true,
  crashReports: true,
  personalData: false,
};

const LS_KEY = 'wl-settings-v1';

// ─── I/O ─────────────────────────────────────────────────────────────────────

export function loadSettings(): GameSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: GameSettings): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
}

export function resetSettings(): GameSettings {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
  return DEFAULT_SETTINGS;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const LANG_LABELS: Record<Language, string> = {
  'pt-BR': '🇧🇷 Português',
  en: '🇺🇸 English',
  es: '🇪🇸 Español',
};

export const FPS_LABELS: Record<FpsTarget, string> = {
  30: '30 FPS · Bateria',
  60: '60 FPS · Fluido',
};

export const PERF_LABELS: Record<PerfMode, string> = {
  low: '⚡ Baixo · Máxima Bateria',
  medium: '⚖️ Médio · Equilibrado',
  high: '✨ Alto · Melhor Visual',
};
