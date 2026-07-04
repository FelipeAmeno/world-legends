'use client';

/**
 * components/ui/LoadingScreen.tsx — Sprint 3
 *
 * Tela de carregamento oficial do World Legends.
 * Usada como fallback de Suspense e em transições pesadas.
 *
 * Variantes:
 *   'full'    — tela inteira com logo animado (splash screen)
 *   'inline'  — bloco de loading dentro de um container
 *   'overlay' — sobreposição sobre conteúdo existente
 */

import { motion, AnimatePresence } from 'framer-motion';
import { SPRING, EASE } from '@/lib/motion-tokens';

type Variant = 'full' | 'inline' | 'overlay';

type Props = {
  variant?: Variant;
  message?: string;
  visible?: boolean; // para overlay com AnimatePresence
};

export function LoadingScreen({ variant = 'full', message, visible = true }: Props) {
  if (variant === 'inline') {
    return <InlineLoader message={message ?? undefined} />;
  }

  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: 'rgba(7,8,15,0.85)', backdropFilter: 'blur(12px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <InlineLoader message={message ?? undefined} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // 'full'
  return <FullScreenLoader message={message ?? undefined} />;
}

// ─── Full Screen ──────────────────────────────────────────────────────────────

function FullScreenLoader({ message }: { message?: string | undefined }) {
  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #03040a 0%, #07080f 45%, #0d0a00 100%)',
      }}
    >
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'rgba(201,168,76,0.06)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full blur-3xl"
          style={{ background: 'rgba(58,110,165,0.05)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      {/* Logo */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING.bouncy}
      >
        {/* WL Icon */}
        <motion.div
          className="mb-6"
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center border"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))',
              borderColor: 'rgba(201,168,76,0.3)',
              boxShadow: '0 0 40px rgba(201,168,76,0.2), inset 0 1px 0 rgba(201,168,76,0.15)',
            }}
          >
            <span
              className="font-display text-4xl leading-none"
              style={{
                background: 'linear-gradient(135deg, #c9a84c, #e6c85a, #f5e098)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              WL
            </span>
          </div>
        </motion.div>

        {/* Logotype */}
        <motion.h1
          className="font-display text-5xl leading-none tracking-[0.12em] mb-2"
          style={{
            background: 'linear-gradient(135deg, #c9a84c 0%, #e6c85a 45%, #f5e098 70%, #c9a84c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 24px rgba(201,168,76,0.4))',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: EASE.out as [number,number,number,number] }}
        >
          WORLD LEGENDS
        </motion.h1>

        <motion.p
          className="text-muted text-[10px] tracking-[0.45em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Collectible Football Card Game
        </motion.p>

        {/* Progress bar */}
        <motion.div
          className="mt-10 w-48 h-0.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #8c6f27, #c9a84c, #e6c85a)',
              boxShadow: '0 0 8px rgba(201,168,76,0.6)',
            }}
            initial={{ width: '0%', x: '-100%' }}
            animate={{ width: '100%', x: '0%' }}
            transition={{ duration: 1.4, delay: 0.5, ease: EASE.smooth as [number,number,number,number] }}
          />
        </motion.div>

        {message && (
          <motion.p
            className="mt-4 text-muted/60 text-[11px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {message}
          </motion.p>
        )}
      </motion.div>

      {/* Corner decoration */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div
          className="flex gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'rgba(201,168,76,0.5)' }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Inline Loader ────────────────────────────────────────────────────────────

function InlineLoader({ message }: { message?: string | undefined }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      {/* Spinner ring */}
      <motion.div
        className="w-10 h-10 rounded-full border-2"
        style={{
          borderColor: 'rgba(201,168,76,0.2)',
          borderTopColor: '#c9a84c',
          boxShadow: '0 0 12px rgba(201,168,76,0.3)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
      {message && (
        <p className="text-muted text-xs tracking-wider">{message}</p>
      )}
    </div>
  );
}
