'use client';

import { useGame } from '@/lib/game-context';

// Títulos por nível (reuso da lógica do ProfileHero)
const TITLES: [number, string][] = [
  [1, 'Recruta'],
  [3, 'Jovem Promessa'],
  [5, 'Profissional'],
  [8, 'Internacional'],
  [10, 'Ídolo'],
  [12, 'Estrela'],
  [15, 'Superestrela'],
  [20, 'Lenda'],
  [30, 'Imortal'],
  [50, 'GOAT'],
];
function getTitle(level: number): string {
  return [...TITLES].filter(([l]) => l <= level).pop()?.[1] ?? 'Recruta';
}

// Partículas determinísticas
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  x: Math.round(Math.cos((i / 24) * Math.PI * 2) * (80 + (i % 4) * 20)),
  y: Math.round(Math.sin((i / 24) * Math.PI * 2) * (80 + (i % 4) * 20)),
  size: 3 + (i % 4),
  delay: i * 35,
  color: i % 3 === 0 ? '#c9a84c' : i % 3 === 1 ? '#e6c85a' : '#ffffff',
}));

export function LevelUpOverlay() {
  const { state, dismissLevelUp } = useGame();
  const { leveledUp, level, prevLevel } = state;

  if (!leveledUp) return null;

  const newTitle = getTitle(level);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={dismissLevelUp}
    >
      {/* Container central */}
      <div
        className="relative flex flex-col items-center text-center animate-[slideUp_0.5s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Partículas */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            width: 320,
            height: 320,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
          }}
        >
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full particle"
              style={{
                width: p.size,
                height: p.size,
                top: '50%',
                left: '50%',
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                background: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                ['--tx' as string]: `${p.x}px`,
                ['--ty' as string]: `${p.y}px`,
                ['--dur' as string]: '1.2s',
                ['--delay' as string]: `${p.delay}ms`,
              }}
            />
          ))}
        </div>

        {/* Anel de glow */}
        <div
          className="absolute rounded-full animate-[pulseGold_1s_ease-in-out_infinite]"
          style={{
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(201,168,76,0.2), transparent 70%)',
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 space-y-4">
          {/* LEVEL UP header */}
          <div>
            <p className="font-display text-sm tracking-[0.5em] text-gold/70 uppercase mb-1">
              SUBIU DE NÍVEL
            </p>
            <div className="flex items-center gap-4 justify-center">
              <span className="font-display text-6xl text-muted/60">{prevLevel}</span>
              <div className="flex flex-col items-center">
                <span className="text-gold text-2xl">→</span>
                <div
                  className="w-16 h-16 rounded-full border-4 border-gold flex items-center justify-center mt-1"
                  style={{
                    boxShadow: '0 0 30px rgba(201,168,76,0.7), inset 0 0 20px rgba(201,168,76,0.2)',
                  }}
                >
                  <span className="font-display text-4xl gold-text">{level}</span>
                </div>
              </div>
              <span className="font-display text-6xl gold-text">{level}</span>
            </div>
          </div>

          {/* Novo título */}
          <div
            className="px-6 py-3 rounded-2xl border"
            style={{
              background: 'rgba(201,168,76,0.1)',
              borderColor: 'rgba(201,168,76,0.5)',
              boxShadow: '0 0 20px rgba(201,168,76,0.3)',
            }}
          >
            <p className="text-muted text-xs mb-1">Novo título</p>
            <p className="font-display text-2xl gold-text tracking-wider">
              {newTitle.toUpperCase()}
            </p>
          </div>

          {/* Botão */}
          <button
            onClick={dismissLevelUp}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-gold-dim to-gold
                       text-obsidian font-bold text-sm hover:opacity-90 transition-all hover:scale-105"
            style={{ boxShadow: '0 0 20px rgba(201,168,76,0.4)' }}
          >
            ✨ CONTINUAR
          </button>

          <p className="text-muted/50 text-[10px]">ou clique em qualquer lugar</p>
        </div>
      </div>
    </div>
  );
}
