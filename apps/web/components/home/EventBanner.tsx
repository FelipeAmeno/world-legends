'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type BannerSlide = {
  id: string;
  title: string;
  sub: string;
  badge: string;
  badgeColor: string;
  cta: string;
  href: string;
  icon: string;
  from: string;
  to: string;
  accent: string;
};

const SLIDES: BannerSlide[] = [
  {
    id: 's1',
    title: 'Copa das Lendas',
    sub: 'Torneio semanal em andamento',
    badge: 'AO VIVO',
    badgeColor: '#ef4444',
    cta: 'Participar',
    href: '/match',
    icon: '🏆',
    from: '#1a0060',
    to: '#4c1d95',
    accent: '#a855f7',
  },
  {
    id: 's2',
    title: 'Pack Ouro da Semana',
    sub: 'Chance 3× de Ultra por 48h',
    badge: 'LIMITADO',
    badgeColor: '#f59e0b',
    cta: 'Abrir Pack',
    href: '/packs',
    icon: '✨',
    from: '#3d1500',
    to: '#92400e',
    accent: '#f59e0b',
  },
  {
    id: 's3',
    title: 'Desafio das Lendas',
    sub: 'Complete missões e ganhe XP duplo',
    badge: 'DIÁRIO',
    badgeColor: '#10b981',
    cta: 'Jogar',
    href: '/match',
    icon: '⚡',
    from: '#001a12',
    to: '#065f46',
    accent: '#10b981',
  },
];

const AUTO_INTERVAL = 4000;

export function EventBanner() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === current || animating) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent(idx);
        setAnimating(false);
      }, 200);
    },
    [current, animating],
  );

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length);
  }, [current, goTo]);

  useEffect(() => {
    const t = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(t);
  }, [next]);

  const slide = SLIDES[current]!;

  return (
    <div className="px-4 stagger-2">
      <div
        className="relative h-36 rounded-2xl overflow-hidden cursor-pointer noise"
        style={{
          background: `linear-gradient(135deg, ${slide.from} 0%, ${slide.to} 100%)`,
          transition: 'background 0.4s ease',
          boxShadow: `0 8px 32px ${slide.accent}30`,
        }}
      >
        {/* Glow orb */}
        <div
          className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-2xl pointer-events-none"
          style={{ background: `${slide.accent}40` }}
        />

        {/* Radial overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 80% 50%, transparent, rgba(0,0,0,0.5))',
          }}
        />

        {/* Content */}
        <div
          className="absolute inset-0 flex items-center px-5 gap-5"
          style={{ opacity: animating ? 0 : 1, transition: 'opacity 0.2s ease' }}
        >
          {/* Icon */}
          <div
            className="text-5xl shrink-0"
            style={{
              filter: `drop-shadow(0 0 16px ${slide.accent}80)`,
              animation: 'floatY 3s ease-in-out infinite',
            }}
          >
            {slide.icon}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <span
              className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1.5"
              style={{
                background: `${slide.badgeColor}25`,
                color: slide.badgeColor,
                border: `1px solid ${slide.badgeColor}50`,
              }}
            >
              ● {slide.badge}
            </span>
            <h2 className="font-display text-2xl text-white leading-tight tracking-wide">
              {slide.title}
            </h2>
            <p className="text-white/50 text-[11px] mt-0.5">{slide.sub}</p>
          </div>

          {/* CTA */}
          <Link
            href={slide.href}
            className="shrink-0 px-3 py-2 rounded-xl font-bold text-xs text-obsidian transition-all hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${slide.accent}, ${slide.accent}cc)`,
              boxShadow: `0 0 12px ${slide.accent}60`,
            }}
          >
            {slide.cta}
          </Link>
        </div>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 16 : 6,
                height: 6,
                background: i === current ? slide.accent : 'rgba(255,255,255,0.25)',
                boxShadow: i === current ? `0 0 6px ${slide.accent}` : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
