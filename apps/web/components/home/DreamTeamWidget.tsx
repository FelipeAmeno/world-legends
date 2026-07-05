'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const DREAM_KEY = 'wl:dream-team';
const SLOTS = 11;

function readDreamTeam(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DREAM_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function DreamTeamWidget() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readDreamTeam());
    const onStorage = (e: StorageEvent) => {
      if (e.key === DREAM_KEY) setIds(readDreamTeam());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const filled = ids.length;
  const missing = SLOTS - filled;

  if (filled === 0) return null;

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Link
        href="/collection"
        className="block rounded-2xl border overflow-hidden transition-all hover:brightness-105 active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, #18120a 0%, #241c0c 100%)',
          borderColor: 'rgba(201,168,76,0.2)',
          boxShadow: '0 0 16px rgba(201,168,76,0.1)',
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/25 mb-0.5">
              Dream Team
            </p>
            <p className="text-parchment font-bold text-sm">
              {filled === SLOTS ? '⭐ Time completo!' : `${filled} de ${SLOTS} jogadores`}
            </p>
            {missing > 0 && (
              <p className="text-white/35 text-[10px] mt-0.5">
                Faltam {missing} {missing === 1 ? 'jogador' : 'jogadores'}
              </p>
            )}
          </div>

          {/* Slot dots */}
          <div className="flex flex-wrap gap-1 max-w-[88px] justify-end">
            {Array.from({ length: SLOTS }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  background:
                    i < filled
                      ? 'linear-gradient(135deg, #8c6f27, #c9a84c)'
                      : 'rgba(255,255,255,0.07)',
                  boxShadow: i < filled ? '0 0 6px rgba(201,168,76,0.5)' : 'none',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              />
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-black/30">
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(90deg, #8c6f27, #c9a84c)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${(filled / SLOTS) * 100}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
      </Link>
    </motion.div>
  );
}
