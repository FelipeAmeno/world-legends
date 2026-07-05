'use client';

/**
 * components/ui/EmptyState.tsx — Sprint 3
 *
 * Estados vazios premium para todas as páginas.
 * Substitui "nenhum dado" por experiências que motivam ação.
 *
 * Variantes:
 *   collection  — sem cartas na coleção
 *   squad       — squad vazio
 *   matches     — sem partidas jogadas
 *   leaderboard — ranking sem dados
 *   missions    — sem missões ativas
 *   notifications — caixa de notificações vazia
 *   generic     — fallback genérico
 *
 * Uso:
 *   <EmptyState variant="collection" />
 *   <EmptyState variant="matches" cta={{ label: 'Jogar agora', href: '/match' }} />
 */

import { SPRING, VARIANTS } from '@/lib/motion-tokens';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type CTA = {
  label: string;
  href: string;
  style?: 'gold' | 'ghost';
};

type EmptyVariant =
  | 'collection'
  | 'squad'
  | 'matches'
  | 'leaderboard'
  | 'missions'
  | 'notifications'
  | 'generic';

type Props = {
  variant?: EmptyVariant;
  icon?: string;
  title?: string;
  body?: string;
  cta?: CTA;
  cta2?: CTA;
  className?: string;
};

// ─── Preset configs ───────────────────────────────────────────────────────────

type PresetConfig = {
  icon: string;
  title: string;
  body: string;
  cta?: CTA;
  glow: string;
};

const PRESETS: Record<EmptyVariant, PresetConfig> = {
  collection: {
    icon: '🃏',
    title: 'Sua coleção está vazia',
    body: 'Abra packs para descobrir lendas do futebol e construir seu time dos sonhos.',
    cta: { label: 'Abrir Packs', href: '/packs', style: 'gold' },
    glow: 'rgba(201,168,76,0.2)',
  },
  squad: {
    icon: '⚽',
    title: 'Nenhum squad montado',
    body: 'Arraste suas cartas para o campo e monte o time ideal com química real.',
    cta: { label: 'Montar Squad', href: '/squad', style: 'gold' },
    glow: 'rgba(16,185,129,0.18)',
  },
  matches: {
    icon: '🏟',
    title: 'Nenhuma partida jogada',
    body: 'Monte seu squad e dispute sua primeira partida contra adversários de todo o mundo.',
    cta: { label: 'Jogar Agora', href: '/match', style: 'gold' },
    glow: 'rgba(59,130,246,0.18)',
  },
  leaderboard: {
    icon: '🏆',
    title: 'Ranking ainda vazio',
    body: 'Jogue partidas para aparecer no ranking global e mostrar sua força.',
    cta: { label: 'Jogar', href: '/match', style: 'gold' },
    glow: 'rgba(201,168,76,0.15)',
  },
  missions: {
    icon: '🎯',
    title: 'Sem missões ativas',
    body: 'Novas missões aparecem todo dia. Volte amanhã para novos desafios.',
    glow: 'rgba(251,146,60,0.15)',
  },
  notifications: {
    icon: '🔔',
    title: 'Nenhuma notificação',
    body: 'Suas novidades, conquistas e recompensas aparecem aqui.',
    glow: 'rgba(96,165,250,0.12)',
  },
  generic: {
    icon: '✦',
    title: 'Nada por aqui ainda',
    body: 'Conteúdo será exibido assim que disponível.',
    glow: 'rgba(106,112,144,0.15)',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyState({
  variant = 'generic',
  icon,
  title,
  body,
  cta,
  cta2,
  className = '',
}: Props) {
  const preset = PRESETS[variant];
  const displayIcon = icon ?? preset.icon;
  const displayTitle = title ?? preset.title;
  const displayBody = body ?? preset.body;
  const displayCta = cta ?? preset.cta;

  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center px-8 py-16 ${className}`}
      initial="hidden"
      animate="visible"
      variants={VARIANTS.fade}
    >
      {/* Icon with glow */}
      <motion.div
        className="mb-6 relative"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING.bouncy, delay: 0.1 }}
      >
        {/* Glow blob */}
        <div
          className="absolute inset-0 rounded-full blur-2xl scale-150"
          style={{ background: preset.glow }}
        />
        <div
          className="relative w-24 h-24 rounded-3xl flex items-center justify-center text-5xl border"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${preset.glow}`,
          }}
        >
          <motion.span
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            {displayIcon}
          </motion.span>
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        className="space-y-2 max-w-xs"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.3 }}
      >
        <h3 className="font-display text-2xl text-parchment tracking-wider">
          {displayTitle.toUpperCase()}
        </h3>
        <p className="text-muted text-sm leading-relaxed">{displayBody}</p>
      </motion.div>

      {/* CTAs */}
      {(displayCta || cta2) && (
        <motion.div
          className="flex gap-3 mt-8 flex-wrap justify-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.3 }}
        >
          {displayCta && <CTAButton cta={displayCta} primary />}
          {cta2 && <CTAButton cta={cta2} />}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── CTA Button ───────────────────────────────────────────────────────────────

function CTAButton({ cta, primary = false }: { cta: CTA; primary?: boolean }) {
  const isGold = cta.style === 'gold' || primary;

  return (
    <Link
      href={cta.href}
      className="px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
      style={
        isGold
          ? {
              background: 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a)',
              color: '#07080f',
              boxShadow: '0 0 20px rgba(201,168,76,0.35)',
            }
          : {
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2ddd4',
            }
      }
    >
      {cta.label} {isGold ? '→' : ''}
    </Link>
  );
}
