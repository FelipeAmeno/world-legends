'use client';

import { claimStarterPack } from '@/lib/actions/profile';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { toast } from '@/lib/wl-toast';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function NewUserWelcome() {
  const { user } = useAuth();
  const { onboard, state } = useGame();
  const router = useRouter();
  const claimed = useRef(false);
  const [status, setStatus] = useState<'claiming' | 'ready'>('claiming');

  const derivedName =
    (user?.user_metadata?.name as string | undefined)?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Treinador';

  useEffect(() => {
    if (claimed.current) return;
    claimed.current = true;

    void claimStarterPack().then(() => {
      if (!state.isOnboarded) {
        onboard(derivedName);
      }
      setStatus('ready');
      toast.reward('Founder Pack desbloqueado! 🎁', '📦', 4000);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenPack = () => {
    router.push('/packs?welcome=1');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{
        background: 'linear-gradient(135deg, #03040a 0%, #07080f 45%, #0d0a00 100%)',
      }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'rgba(201,168,76,0.5)' }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full blur-3xl opacity-8"
          style={{ background: 'rgba(58,110,165,0.35)' }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(201,168,76,0.3) 40px, rgba(201,168,76,0.3) 41px)',
          }}
        />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo */}
        <h1
          className="font-display text-6xl leading-none gold-text mb-2"
          style={{
            letterSpacing: '0.1em',
            filter: 'drop-shadow(0 0 32px rgba(201,168,76,0.45))',
          }}
        >
          WORLD
          <br />
          LEGENDS
        </h1>
        <p className="text-muted text-xs tracking-[0.35em] uppercase mb-10">
          Collectible Football Card Game
        </p>

        {/* Welcome message */}
        <motion.div
          className="mb-8 space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-parchment text-xl font-semibold">Bem-vindo, {derivedName}! 🎉</p>
          <p className="text-muted text-sm leading-relaxed">
            Seu Founder Pack está esperando.
            <br />
            11 lendas do futebol — todas suas.
          </p>
        </motion.div>

        {/* Pack visual */}
        <motion.div
          className="mb-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 160, damping: 14 }}
        >
          <div
            className="w-32 h-44 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #1a0d40, #4c1d95, #6d28d9)',
              boxShadow: '0 0 60px rgba(124,58,237,0.5), 0 16px 40px rgba(0,0,0,0.6)',
              border: '1px solid rgba(167,139,250,0.35)',
            }}
          >
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              className="text-6xl"
            >
              📦
            </motion.div>
            <p className="mt-3 font-display text-sm tracking-widest" style={{ color: '#a78bfa' }}>
              FOUNDER PACK
            </p>
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl"
              style={{ background: 'rgba(167,139,250,0.3)' }}
            />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          type="button"
          onClick={handleOpenPack}
          disabled={status === 'claiming'}
          className="w-full py-4 rounded-2xl font-display text-xl tracking-widest transition-all"
          style={{
            background:
              status === 'claiming'
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a)',
            color: status === 'claiming' ? 'rgba(255,255,255,0.3)' : '#07080f',
            boxShadow:
              status === 'ready'
                ? '0 0 40px rgba(201,168,76,0.5), 0 4px 20px rgba(0,0,0,0.4)'
                : 'none',
            border: status === 'claiming' ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}
          whileHover={status === 'ready' ? { scale: 1.03 } : {}}
          whileTap={status === 'ready' ? { scale: 0.97 } : {}}
        >
          {status === 'claiming' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              Preparando...
            </span>
          ) : (
            'ABRIR FOUNDER PACK →'
          )}
        </motion.button>

        <p className="text-white/20 text-[10px] mt-4">Gratuito · 11 cartas garantidas</p>
      </motion.div>
    </div>
  );
}
