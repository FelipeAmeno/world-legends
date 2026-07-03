'use client';

import type { BonusItem } from '@/lib/rewards-data';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Partículas de moedas determinísticas
const COINS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i / 12) * 360,
  r: 50 + (i % 4) * 20,
  delay: i * 0.07,
  size: 10 + (i % 4) * 3,
}));

type Props = {
  prevCredits: number;
  creditsGained: number;
  newCredits: number;
  bonuses: BonusItem[];
  onComplete: () => void;
};

export function CreditsSection({
  prevCredits,
  creditsGained,
  newCredits,
  bonuses,
  onComplete,
}: Props) {
  const [count, setCount] = useState(prevCredits);
  const [showCoins, setShowCoins] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCoins(true), 100);

    const t2 = setTimeout(() => {
      const start = prevCredits;
      const end = newCredits;
      const dur = 1500;
      const t0 = Date.now();

      const tick = () => {
        const pct = Math.min(1, (Date.now() - t0) / dur);
        const eased = 1 - (1 - pct) ** 3;
        setCount(Math.round(start + (end - start) * eased));
        if (pct < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 300);

    const t3 = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onComplete();
      }
    }, 2500);

    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Moedas voando */}
      {showCoins && (
        <div className="relative" style={{ width: 160, height: 160 }}>
          {COINS.map((c) => {
            const rad = (c.angle * Math.PI) / 180;
            const tx = Math.round(Math.cos(rad) * c.r);
            const ty = Math.round(Math.sin(rad) * c.r);
            return (
              <motion.div
                key={c.id}
                className="absolute rounded-full font-bold text-xs flex items-center justify-center"
                style={{
                  width: c.size,
                  height: c.size,
                  top: '50%',
                  left: '50%',
                  marginLeft: -c.size / 2,
                  marginTop: -c.size / 2,
                  background: 'linear-gradient(135deg, #c9a84c, #e6c85a)',
                  boxShadow: '0 0 8px rgba(201,168,76,0.6)',
                  fontSize: c.size > 14 ? 8 : 6,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: [0, tx * 0.5, tx, tx],
                  y: [0, ty * 0.5, ty, 100],
                  scale: [0, 1, 1, 0],
                  opacity: [0, 1, 1, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 1.0,
                  delay: c.delay,
                  ease: 'easeOut',
                }}
              >
                💰
              </motion.div>
            );
          })}

          {/* Créditos no centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p
              className="font-display text-3xl gold-text leading-none"
              key={count}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.2 }}
            >
              {count.toLocaleString('pt-BR')}c
            </motion.p>
            <p className="text-white/30 text-[9px] mt-1">créditos</p>
          </div>
        </div>
      )}

      {/* Ganho total */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="font-display text-4xl text-gold">+{creditsGained.toLocaleString('pt-BR')}c</p>
        <p className="text-white/30 text-xs mt-1">créditos ganhos</p>
      </motion.div>

      {/* Detalhamento de bônus */}
      <div className="w-full max-w-xs space-y-1.5">
        {bonuses
          .filter((b) => b.credits)
          .map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center justify-between px-3 py-2 rounded-xl glass border border-white/5"
            >
              <div className="flex items-center gap-2">
                <span>{b.icon}</span>
                <span className="text-white/60 text-xs">{b.label}</span>
              </div>
              <span className="text-gold text-xs font-bold">+{b.credits}c</span>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
