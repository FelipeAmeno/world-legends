'use client';

/**
 * SettingsPage — T058
 *
 * Tela completa de configurações com:
 *   - Perfil/Conta
 *   - Áudio (som, música, sfx, volumes)
 *   - Jogo (vibração, animações, FPS, performance)
 *   - Interface (idioma, modo compacto)
 *   - Privacidade (analytics, crash reports, dados pessoais)
 *   - Ações destrutivas (reset, logout)
 *
 * Todas as configurações persistem em localStorage via settings-store.ts.
 * Framer Motion nos toggles e nas transições de seções.
 */

import { useGameState } from '@/lib/game-context';
import { USER_PROFILE } from '@/lib/mock-data';
import {
  FPS_LABELS,
  type FpsTarget,
  type GameSettings,
  LANG_LABELS,
  type Language,
  PERF_LABELS,
  type PerfMode,
  loadSettings,
  resetSettings,
  saveSettings,
} from '@/lib/settings-store';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Seções ───────────────────────────────────────────────────────────────────

type SectionId = 'account' | 'audio' | 'game' | 'ui' | 'privacy' | 'danger';

const SECTIONS: Array<{ id: SectionId; icon: string; label: string }> = [
  { id: 'account', icon: '👤', label: 'Conta' },
  { id: 'audio', icon: '🔊', label: 'Áudio' },
  { id: 'game', icon: '🎮', label: 'Jogo' },
  { id: 'ui', icon: '🖥', label: 'Interface' },
  { id: 'privacy', icon: '🔒', label: 'Privacidade' },
  { id: 'danger', icon: '⚠️', label: 'Avançado' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_LAZY);
  const [activeSection, setActive] = useState<SectionId>('account');
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const savedTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const state = useGameState();

  // Carregar do localStorage no cliente
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Auto-save em qualquer mudança
  const update = useCallback(<K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
    setSaved(true);
    clearTimeout(savedTimeout.current);
    savedTimeout.current = setTimeout(() => setSaved(false), 1800);
  }, []);

  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    setSettings(resetSettings());
    setResetConfirm(false);
  };

  const profile = state.isOnboarded
    ? { username: state.username, level: state.level }
    : { username: USER_PROFILE.username, level: USER_PROFILE.level };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl gold-text tracking-wider">CONFIGURAÇÕES</h1>
          <p className="text-muted text-xs mt-0.5">Personalize sua experiência</p>
        </div>
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-700/50"
            >
              <span className="text-emerald-400 text-xs">✓</span>
              <span className="text-emerald-400 text-xs font-medium">Salvo</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section nav (mobile horizontal scroll / desktop sidebar) */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scroll-x-hide">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={[
              'flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0 text-sm font-medium transition-all',
              activeSection === s.id
                ? 'bg-gold/10 border-gold/40 text-gold'
                : 'bg-surface border-border text-muted hover:text-parchment hover:border-border/80',
            ].join(' ')}
          >
            <span>{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── CONTA ─────────────────────────────────────────────────────── */}
          {activeSection === 'account' && (
            <div className="space-y-3">
              <SettingsSection title="Perfil">
                <AccountCard username={profile.username} level={profile.level} />
              </SettingsSection>

              <SettingsSection title="Sessão">
                <SettingsItem
                  icon="🌐"
                  label="Versão do app"
                  value={<span className="text-muted text-xs">v0.1.0-dev</span>}
                />
                <SettingsItem
                  icon="🔄"
                  label="Sincronização"
                  value={<span className="text-emerald-400 text-xs">✓ Local</span>}
                />
                <SettingsItem
                  icon="📊"
                  label="Armazenamento usado"
                  value={<span className="text-muted text-xs">~124 KB</span>}
                />
              </SettingsSection>
            </div>
          )}

          {/* ── ÁUDIO ─────────────────────────────────────────────────────── */}
          {activeSection === 'audio' && (
            <div className="space-y-3">
              <SettingsSection title="Sons">
                <ToggleItem
                  icon="🔊"
                  label="Sons do Jogo"
                  desc="Efeitos sonoros das ações"
                  value={settings.sound}
                  onChange={(v) => update('sound', v)}
                />
                <ToggleItem
                  icon="🎵"
                  label="Música de Fundo"
                  desc="Trilha sonora da tela"
                  value={!settings.muteMusic}
                  onChange={(v) => update('muteMusic', !v)}
                />
              </SettingsSection>

              <SettingsSection title="Volumes">
                <SliderItem
                  icon="🎮"
                  label="Volume SFX"
                  value={settings.sfxVolume}
                  onChange={(v) => update('sfxVolume', v)}
                  disabled={!settings.sound}
                />
                <SliderItem
                  icon="🎵"
                  label="Volume Música"
                  value={settings.musicVolume}
                  onChange={(v) => update('musicVolume', v)}
                  disabled={settings.muteMusic}
                />
              </SettingsSection>

              {/* Preview */}
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-muted text-xs mb-2">Prévia do som</p>
                <button
                  onClick={() => {
                    if (!settings.sound) return;
                    // Tocar tom simples via Web Audio API
                    try {
                      const ctx = new AudioContext();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.frequency.setValueAtTime(660, ctx.currentTime);
                      gain.gain.setValueAtTime(settings.sfxVolume / 200, ctx.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                      osc.start();
                      osc.stop(ctx.currentTime + 0.3);
                    } catch {}
                  }}
                  className="px-4 py-2 rounded-lg bg-surface border border-border text-parchment text-sm hover:border-gold-dim transition-all disabled:opacity-40"
                  disabled={!settings.sound}
                >
                  🎵 Testar Som
                </button>
              </div>
            </div>
          )}

          {/* ── JOGO ──────────────────────────────────────────────────────── */}
          {activeSection === 'game' && (
            <div className="space-y-3">
              <SettingsSection title="Controles">
                <ToggleItem
                  icon="📳"
                  label="Vibração"
                  desc="Feedback tátil em gols e ações"
                  value={settings.vibration}
                  onChange={(v) => {
                    update('vibration', v);
                    if (v && navigator.vibrate) navigator.vibrate([40, 20, 60]);
                  }}
                />
                <ToggleItem
                  icon="✨"
                  label="Animações"
                  desc="Desative em dispositivos lentos"
                  value={settings.animations}
                  onChange={(v) => update('animations', v)}
                />
              </SettingsSection>

              <SettingsSection title="Performance">
                <SegmentedItem
                  icon="⚡"
                  label="Alvo de FPS"
                  options={[30, 60] as FpsTarget[]}
                  labels={FPS_LABELS}
                  value={settings.fps}
                  onChange={(v) => update('fps', v)}
                />
              </SettingsSection>

              <SettingsSection title="Qualidade Gráfica">
                {(['low', 'medium', 'high'] as PerfMode[]).map((mode) => (
                  <SelectableItem
                    key={mode}
                    label={PERF_LABELS[mode]}
                    selected={settings.performance === mode}
                    onClick={() => update('performance', mode)}
                  />
                ))}
              </SettingsSection>

              {/* Performance indicator */}
              <div className="glass rounded-xl p-4">
                <p className="text-muted text-[10px] uppercase tracking-wider mb-2">Modo Ativo</p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((bar) => (
                      <div
                        key={bar}
                        className="w-3 rounded-sm"
                        style={{
                          height: bar * 8 + 8,
                          background:
                            bar <= ['low', 'medium', 'high'].indexOf(settings.performance) + 1
                              ? '#c9a84c'
                              : 'rgba(255,255,255,0.1)',
                        }}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-parchment text-sm font-bold">
                      {PERF_LABELS[settings.performance].split(' · ')[0]}
                    </p>
                    <p className="text-muted text-[10px]">
                      {settings.fps} FPS · {settings.animations ? 'Animações ON' : 'Animações OFF'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INTERFACE ─────────────────────────────────────────────────── */}
          {activeSection === 'ui' && (
            <div className="space-y-3">
              <SettingsSection title="Idioma">
                {(Object.entries(LANG_LABELS) as [Language, string][]).map(([lang, label]) => (
                  <SelectableItem
                    key={lang}
                    label={label}
                    selected={settings.language === lang}
                    onClick={() => update('language', lang)}
                  />
                ))}
              </SettingsSection>

              <SettingsSection title="Display">
                <ToggleItem
                  icon="🌙"
                  label="Modo Escuro"
                  desc="Sempre ativo no World Legends"
                  value={true}
                  onChange={() => {}}
                  disabled
                />
                <ToggleItem
                  icon="📱"
                  label="Modo Compacto"
                  desc="Interface mais densa"
                  value={settings.compactMode}
                  onChange={(v) => update('compactMode', v)}
                />
              </SettingsSection>

              {/* Theme preview */}
              <div className="glass rounded-xl p-4">
                <p className="text-muted text-[10px] uppercase tracking-wider mb-3">
                  Prévia do Tema
                </p>
                <div className="flex gap-2">
                  {['obsidian', 'midnight', 'surface', 'border'].map((color) => (
                    <div
                      key={color}
                      className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center"
                      style={{ background: `var(--tw-color-${color}, #07080f)` }}
                    >
                      <span className="text-[8px] text-muted">{color.slice(0, 3)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-muted text-[9px] mt-2">Paleta World Legends · Dark Only</p>
              </div>
            </div>
          )}

          {/* ── PRIVACIDADE ───────────────────────────────────────────────── */}
          {activeSection === 'privacy' && (
            <div className="space-y-3">
              <SettingsSection title="Rastreamento">
                <ToggleItem
                  icon="📊"
                  label="Analytics"
                  desc="Ajuda a melhorar o jogo"
                  value={settings.analytics}
                  onChange={(v) => update('analytics', v)}
                />
                <ToggleItem
                  icon="🐛"
                  label="Relatórios de Erro"
                  desc="Enviar crashes automaticamente"
                  value={settings.crashReports}
                  onChange={(v) => update('crashReports', v)}
                />
                <ToggleItem
                  icon="👤"
                  label="Dados Personalizados"
                  desc="Recomendações baseadas em uso"
                  value={settings.personalData}
                  onChange={(v) => update('personalData', v)}
                />
              </SettingsSection>

              <SettingsSection title="Dados">
                <SettingsItem
                  icon="📦"
                  label="Exportar Dados"
                  value={
                    <button
                      onClick={() => {
                        const data = {
                          settings: loadSettings(),
                          exported: new Date().toISOString(),
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: 'application/json',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'wl-data.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                    >
                      Baixar JSON →
                    </button>
                  }
                />
                <SettingsItem
                  icon="📜"
                  label="Política de Privacidade"
                  value={<span className="text-blue-400 text-xs">Ver →</span>}
                />
                <SettingsItem
                  icon="📋"
                  label="Termos de Uso"
                  value={<span className="text-blue-400 text-xs">Ver →</span>}
                />
              </SettingsSection>

              <div className="glass rounded-xl p-4">
                <p className="text-muted text-[10px] mb-1">📍 Armazenamento local</p>
                <p className="text-white/60 text-xs">
                  Seus dados ficam somente no seu dispositivo. Nenhuma informação é enviada a
                  servidores sem seu consentimento explícito.
                </p>
              </div>
            </div>
          )}

          {/* ── AVANÇADO / PERIGO ─────────────────────────────────────────── */}
          {activeSection === 'danger' && (
            <div className="space-y-3">
              <SettingsSection title="Sessão">
                <DangerItem
                  icon="🔄"
                  label="Restaurar Padrões"
                  desc="Redefinir todas as configurações para o padrão"
                  buttonLabel={resetConfirm ? '⚠️ Confirmar Reset' : 'Restaurar'}
                  variant={resetConfirm ? 'destructive' : 'warning'}
                  onClick={handleReset}
                />
                <DangerItem
                  icon="🚪"
                  label="Sair da Conta"
                  desc="Encerrar sessão atual (dados locais permanecem)"
                  buttonLabel="Logout"
                  variant="warning"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('wl-game-state-v1');
                      window.location.href = '/login';
                    }
                  }}
                />
              </SettingsSection>

              <SettingsSection title="Dados do Perfil">
                <DangerItem
                  icon="🗑️"
                  label="Apagar Progresso"
                  desc="Apaga permanentemente todo o progresso local"
                  buttonLabel="Apagar Tudo"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Isso apagará TODO o progresso. Tem certeza?')) {
                      if (typeof window !== 'undefined') {
                        localStorage.clear();
                        window.location.href = '/login';
                      }
                    }
                  }}
                />
              </SettingsSection>

              {/* App info */}
              <div className="glass rounded-xl p-4 text-center">
                <p className="font-display text-2xl gold-text mb-1">WORLD LEGENDS</p>
                <p className="text-muted text-[10px]">v0.1.0-dev · T058</p>
                <p className="text-muted/50 text-[9px] mt-1">
                  29 packages · 130 arquivos TypeScript
                </p>
                <p className="text-muted/30 text-[8px] mt-2">
                  Powered by @world-legends/engine · Framer Motion · Next.js 15
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted text-[9px] uppercase tracking-widest mb-2 px-1">{title}</p>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
        {children}
      </div>
    </div>
  );
}

function SettingsItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="text-lg w-7 text-center">{icon}</span>
        <span className="text-parchment text-sm">{label}</span>
      </div>
      <div>{value}</div>
    </div>
  );
}

function AccountCard({ username, level }: { username: string; level: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-obsidian font-black text-xl border-2"
        style={{
          background: 'linear-gradient(135deg, #c9a84c, #e6c85a)',
          border: '2px solid rgba(201,168,76,0.4)',
        }}
      >
        {username.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-parchment font-bold">{username}</p>
        <p className="text-muted text-xs">Nível {level} · World Legends</p>
      </div>
      <div className="ml-auto">
        <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 font-bold">
          ATIVO
        </span>
      </div>
    </div>
  );
}

function ToggleItem({
  icon,
  label,
  desc,
  value,
  onChange,
  disabled = false,
}: {
  icon: string;
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3.5 ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3 flex-1">
        <span className="text-lg w-7 text-center mt-0.5">{icon}</span>
        <div className="min-w-0">
          <p className="text-parchment text-sm font-medium">{label}</p>
          <p className="text-muted text-[10px] mt-0.5">{desc}</p>
        </div>
      </div>
      <Toggle value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Toggle({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      className="shrink-0 ml-3 relative"
      disabled={disabled}
    >
      <div
        className="w-12 h-6.5 rounded-full transition-all duration-200 border"
        style={{
          background: value ? '#10b981' : 'rgba(255,255,255,0.08)',
          borderColor: value ? '#059669' : 'rgba(255,255,255,0.12)',
          boxShadow: value ? '0 0 8px rgba(16,185,129,0.4)' : undefined,
          width: 48,
          height: 26,
        }}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          style={{ height: 22, width: 22, top: 2 }}
          animate={{ x: value ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        />
      </div>
    </button>
  );
}

function SliderItem({
  icon,
  label,
  value,
  onChange,
  disabled = false,
}: {
  icon: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`px-4 py-3.5 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-lg w-7 text-center">{icon}</span>
          <span className="text-parchment text-sm">{label}</span>
        </div>
        <span className="font-display text-base gold-text">{value}%</span>
      </div>
      <div className="ml-10">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => !disabled && onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full accent-gold cursor-pointer"
          style={{ accentColor: '#c9a84c' }}
        />
        <div className="flex justify-between text-[8px] text-muted mt-0.5">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

function SegmentedItem<T extends string | number>({
  icon,
  label,
  options,
  labels,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  options: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-lg w-7 text-center">{icon}</span>
        <span className="text-parchment text-sm">{label}</span>
      </div>
      <div className="ml-10 flex gap-1.5">
        {options.map((opt) => (
          <button
            key={String(opt)}
            onClick={() => onChange(opt)}
            className={[
              'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border',
              value === opt
                ? 'bg-gold/15 border-gold-dim text-gold'
                : 'bg-surface border-border text-muted hover:text-parchment',
            ].join(' ')}
          >
            {String(opt) + (typeof opt === 'number' ? ' FPS' : '')}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectableItem({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full px-4 py-3.5 text-left hover:bg-white/2 transition-colors"
    >
      <span className={`text-sm ${selected ? 'text-parchment font-semibold' : 'text-muted'}`}>
        {label}
      </span>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-gold font-bold text-base"
        >
          ✓
        </motion.span>
      )}
    </button>
  );
}

function DangerItem({
  icon,
  label,
  desc,
  buttonLabel,
  variant,
  onClick,
}: {
  icon: string;
  label: string;
  desc: string;
  buttonLabel: string;
  variant: 'warning' | 'destructive';
  onClick: () => void;
}) {
  const btnStyle =
    variant === 'destructive'
      ? 'bg-red-900/40 border-red-700/50 text-red-400 hover:bg-red-900/60'
      : 'bg-yellow-900/30 border-yellow-700/40 text-yellow-400 hover:bg-yellow-900/50';

  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-start gap-3 flex-1">
        <span className="text-lg w-7 text-center mt-0.5">{icon}</span>
        <div>
          <p className="text-parchment text-sm font-medium">{label}</p>
          <p className="text-muted text-[10px] mt-0.5">{desc}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`ml-3 shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${btnStyle}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

// Default para SSR (será substituído no useEffect)
const DEFAULT_LAZY: GameSettings = {
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
