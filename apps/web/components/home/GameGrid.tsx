'use client';

import type { FormationKey } from '@/lib/squad-data';
import { motion } from 'framer-motion';
import Link from 'next/link';

type Props = {
  collectionCount?: number;
  squadFormation?: FormationKey | null | undefined;
  activeEventCount?: number;
};

export function GameGrid({ collectionCount = 0, squadFormation, activeEventCount = 0 }: Props) {
  const collectionSub = collectionCount === 1 ? '1 carta' : `${collectionCount} cartas`;
  const squadSub = squadFormation ? squadFormation : 'Construir squad';
  const eventsSub = activeEventCount > 0
    ? `${activeEventCount} ativo${activeEventCount > 1 ? 's' : ''} agora`
    : 'Ver temporada';

  return (
    <section className="px-4 space-y-3">
      {/* 1. JOGAR — Hero principal */}
      <JogarHero />

      {/* 2. ABRIR PACK + MONTAR TIME */}
      <div className="grid grid-cols-2 gap-3">
        <SecondaryCard
          href="/packs"
          icon="📦"
          label="ABRIR PACK"
          sub="Founder Pack · Grátis"
          from="#0d0020"
          via="#4c1d95"
          to="#6d28d9"
          accent="#a855f7"
          badge="NOVO"
        />
        <SecondaryCard
          href="/squad"
          icon="⚔️"
          label="MONTAR TIME"
          sub={squadSub}
          from="#000d2a"
          via="#1e3a5f"
          to="#1e40af"
          accent="#3b82f6"
        />
      </div>

      {/* 3. Eventos + Coleção — acesso rápido */}
      <div className="grid grid-cols-2 gap-2.5">
        <TertiaryCard
          href="/events"
          icon="⚡"
          label="Eventos"
          sub={eventsSub}
          accent="#ef4444"
          {...(activeEventCount > 0 ? { badge: 'AO VIVO' } : {})}
        />
        <TertiaryCard
          href="/collection"
          icon="🃏"
          label="Coleção"
          sub={collectionSub}
          accent="#f59e0b"
        />
      </div>
    </section>
  );
}

// ─── JOGAR hero (estilo Clash Royale) ─────────────────────────────────────────

function JogarHero() {
  return (
    <Link href="/match" className="block">
      <motion.div
        className="relative h-[144px] rounded-3xl overflow-hidden cursor-pointer"
        style={{
          background: 'linear-gradient(145deg, #001a0f 0%, #023d1a 35%, #065f46 70%, #059669 100%)',
          boxShadow: '0 12px 48px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      >
        {/* Outer pulse ring */}
        <motion.div
          className="absolute -inset-0.5 rounded-3xl pointer-events-none"
          style={{ border: '2px solid rgba(52,211,153,0.45)' }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />

        {/* Far outer ring */}
        <motion.div
          className="absolute -inset-1.5 rounded-[28px] pointer-events-none"
          style={{ border: '1px solid rgba(52,211,153,0.18)' }}
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut', delay: 0.6 }}
        />

        {/* Noise texture */}
        <div className="absolute inset-0 noise pointer-events-none opacity-25" />

        {/* Center radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 90% at 50% 50%, rgba(16,185,129,0.22) 0%, transparent 70%)',
          }}
        />

        {/* Top-right corner glow */}
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full blur-2xl pointer-events-none"
          style={{ background: 'rgba(52,211,153,0.28)' }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center h-full px-6 gap-5">
          {/* ⚽ floating */}
          <motion.div
            className="text-7xl shrink-0"
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 28px rgba(52,211,153,0.9))' }}
          >
            ⚽
          </motion.div>

          {/* Text block */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] uppercase tracking-[0.22em] mb-1 font-semibold"
              style={{ color: 'rgba(52,211,153,0.65)' }}
            >
              Pronto para jogar?
            </p>
            <h2
              className="font-display leading-none tracking-wider"
              style={{
                fontSize: 52,
                background: 'linear-gradient(90deg, #ffffff 0%, #6ee7b7 55%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              JOGAR
            </h2>
            <p
              className="text-[11px] mt-1.5"
              style={{ color: 'rgba(255,255,255,0.38)' }}
            >
              Partida rápida · Arena das Lendas
            </p>
          </div>

          {/* Arrow circle */}
          <motion.div
            className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 0 24px rgba(16,185,129,0.55)',
            }}
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            →
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Secondary card (Pack + Squad) ───────────────────────────────────────────

function SecondaryCard({
  href,
  icon,
  label,
  sub,
  from,
  via,
  to,
  accent,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  sub: string;
  from: string;
  via: string;
  to: string;
  accent: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="block">
      <motion.div
        className="relative h-[112px] rounded-2xl overflow-hidden noise"
        style={{
          background: `linear-gradient(145deg, ${from} 0%, ${via} 55%, ${to} 100%)`,
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: `0 6px 28px ${accent}25`,
        }}
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      >
        {/* Corner glow */}
        <div
          className="absolute -top-5 -right-5 w-24 h-24 rounded-full blur-2xl pointer-events-none"
          style={{ background: `${accent}38` }}
        />

        {/* Badge */}
        {badge && (
          <div
            className="absolute top-2.5 right-2.5 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{
              background: `${accent}20`,
              border: `1px solid ${accent}50`,
              color: accent,
            }}
          >
            {badge}
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <div
            className="text-3xl mb-1.5"
            style={{ filter: `drop-shadow(0 0 12px ${accent}70)` }}
          >
            {icon}
          </div>
          <h3
            className="font-display text-[15px] leading-tight tracking-wider"
            style={{
              background: `linear-gradient(90deg, #ffffff 0%, ${accent} 130%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {label}
          </h3>
          <p className="text-white/35 text-[9px] mt-0.5 truncate">{sub}</p>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Tertiary card (Eventos + Coleção) ───────────────────────────────────────

function TertiaryCard({
  href,
  icon,
  label,
  sub,
  accent,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  sub: string;
  accent: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="block">
      <motion.div
        className="relative h-[64px] rounded-2xl flex items-center gap-3 px-3.5 overflow-hidden"
        style={{
          background: `rgba(255,255,255,0.025)`,
          border: `1px solid ${accent}22`,
          boxShadow: `0 2px 14px ${accent}10`,
        }}
        whileHover={{ scale: 1.02, backgroundColor: `${accent}08` as never }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      >
        <span
          className="text-2xl shrink-0"
          style={{ filter: `drop-shadow(0 0 8px ${accent}60)` }}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-parchment text-xs font-bold">{label}</p>
            {badge && (
              <span
                className="text-[7px] font-black px-1 py-0.5 rounded-full leading-none"
                style={{
                  background: `${accent}20`,
                  color: accent,
                  border: `1px solid ${accent}40`,
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-white/30 text-[9px] truncate">{sub}</p>
        </div>
        <span style={{ color: `${accent}70`, fontSize: 16 }}>›</span>
      </motion.div>
    </Link>
  );
}
