import Link from 'next/link';

// ─── Card config ──────────────────────────────────────────────────────────────

type GameCard = {
  id: string;
  label: string;
  sub: string;
  href: string;
  icon: string;
  from: string;
  via: string;
  to: string;
  glow: string;
  accent: string;
  badge?: { text: string; color: string };
  disabled?: boolean;
  wide?: boolean; // ocupa toda a largura
};

const CARDS: GameCard[] = [
  {
    id: 'play',
    label: 'Jogar',
    sub: 'Partida rápida',
    href: '/match',
    icon: '⚽',
    from: '#001a0f',
    via: '#064e3b',
    to: '#065f46',
    glow: 'rgba(16,185,129,0.35)',
    accent: '#10b981',
    wide: true,
  },
  {
    id: 'packs',
    label: 'Abrir Packs',
    sub: '3 tipos · 16 lendas',
    href: '/packs',
    icon: '📦',
    from: '#0d0020',
    via: '#4c1d95',
    to: '#6d28d9',
    glow: 'rgba(124,58,237,0.3)',
    accent: '#a855f7',
    badge: { text: 'NOVO', color: '#a855f7' },
  },
  {
    id: 'collection',
    label: 'Coleção',
    sub: '16 cartas',
    href: '/collection',
    icon: '🃏',
    from: '#1a0a00',
    via: '#78350f',
    to: '#92400e',
    glow: 'rgba(180,83,9,0.3)',
    accent: '#f59e0b',
  },
  {
    id: 'squad',
    label: 'Squad',
    sub: '4-3-3 · 89 OVR',
    href: '/squad',
    icon: '⚔️',
    from: '#000d2a',
    via: '#1e3a5f',
    to: '#1e40af',
    glow: 'rgba(37,99,235,0.3)',
    accent: '#3b82f6',
  },
  {
    id: 'events',
    label: 'Eventos',
    sub: '2 ativos agora',
    href: '/match',
    icon: '⚡',
    from: '#1a0000',
    via: '#7f1d1d',
    to: '#991b1b',
    glow: 'rgba(220,38,38,0.3)',
    accent: '#ef4444',
    badge: { text: 'AO VIVO', color: '#ef4444' },
  },
  {
    id: 'market',
    label: 'Mercado',
    sub: 'Em breve...',
    href: '#',
    icon: '🏪',
    from: '#0d0f12',
    via: '#1f2937',
    to: '#374151',
    glow: 'rgba(75,85,99,0.15)',
    accent: '#6b7280',
    disabled: true,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function GameGrid() {
  const mainCard = CARDS.find((c) => c.wide)!;
  const gridCards = CARDS.filter((c) => !c.wide);

  const staggerIdx = (i: number) => `stagger-${Math.min(i + 3, 6)}` as string;

  return (
    <section className="px-5 space-y-3">
      {/* Hero card: Jogar (full width) */}
      <div className="stagger-3">
        <GameCardHero card={mainCard} />
      </div>

      {/* 2×3 grid */}
      <div className="grid grid-cols-2 gap-3">
        {gridCards.map((card, i) => (
          <div key={card.id} className={staggerIdx(i)}>
            <GameCardSmall card={card} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Hero card (wide) ─────────────────────────────────────────────────────────

function GameCardHero({ card }: { card: GameCard }) {
  return (
    <Link
      href={card.href}
      className={`relative flex items-center gap-5 h-24 rounded-2xl overflow-hidden card-press noise block ${card.disabled ? 'pointer-events-none opacity-40' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${card.from} 0%, ${card.via} 50%, ${card.to} 100%)`,
        boxShadow: `0 8px 32px ${card.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Glow pulse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 40% 80% at 20% 50%, ${card.accent}20, transparent)`,
        }}
      />

      {/* Icon */}
      <div
        className="pl-6 text-6xl shrink-0"
        style={{
          filter: `drop-shadow(0 0 20px ${card.accent}80)`,
          animation: 'floatY 3s ease-in-out infinite',
        }}
      >
        {card.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-display text-3xl leading-none tracking-wider"
          style={{
            background: `linear-gradient(90deg, #fff, ${card.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {card.label.toUpperCase()}
        </h3>
        <p className="text-white/50 text-xs mt-1">{card.sub}</p>
      </div>

      {/* Arrow */}
      <div
        className="mr-5 w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
        style={{
          background: `${card.accent}20`,
          border: `1px solid ${card.accent}40`,
          color: card.accent,
        }}
      >
        →
      </div>
    </Link>
  );
}

// ─── Small card ───────────────────────────────────────────────────────────────

function GameCardSmall({ card }: { card: GameCard }) {
  return (
    <Link
      href={card.href}
      className={`relative block rounded-2xl overflow-hidden card-press noise h-[130px] ${card.disabled ? 'pointer-events-none opacity-45' : ''}`}
      style={{
        background: `linear-gradient(145deg, ${card.from} 0%, ${card.via} 60%, ${card.to} 100%)`,
        boxShadow: `0 4px 24px ${card.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Gradient accent corner */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl pointer-events-none"
        style={{ background: `${card.accent}35` }}
      />

      {/* Badge */}
      {card.badge && (
        <div
          className="absolute top-2.5 right-2.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
          style={{
            background: `${card.badge.color}20`,
            border: `1px solid ${card.badge.color}50`,
            color: card.badge.color,
          }}
        >
          {card.badge.text}
        </div>
      )}

      {/* Lock icon for disabled */}
      {card.disabled && <div className="absolute top-2.5 right-2.5 text-sm opacity-60">🔒</div>}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <div className="text-3xl mb-2" style={{ filter: `drop-shadow(0 0 10px ${card.accent}60)` }}>
          {card.icon}
        </div>
        <h3
          className="font-display text-base leading-tight tracking-wider"
          style={{
            background: `linear-gradient(90deg, #fff 0%, ${card.accent} 120%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {card.label.toUpperCase()}
        </h3>
        <p className="text-white/35 text-[9px] mt-0.5">{card.sub}</p>
      </div>
    </Link>
  );
}
