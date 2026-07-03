'use client';

import { motion } from 'framer-motion';

type Props = {
  home: number; // 0–100
  homeName: string;
  awayName: string;
};

export function MomentumBar({ home, homeName, awayName }: Props) {
  const awayVal = 100 - home;

  const homeColor =
    home >= 70
      ? '#10b981'
      : home >= 55
        ? '#34d399'
        : home >= 45
          ? '#6b7280'
          : home >= 30
            ? '#f87171'
            : '#ef4444';

  const awayColor =
    awayVal >= 70
      ? '#ef4444'
      : awayVal >= 55
        ? '#f87171'
        : awayVal >= 45
          ? '#6b7280'
          : awayVal >= 30
            ? '#34d399'
            : '#10b981';

  return (
    <div>
      <div className="flex items-center justify-between text-[9px] text-white/30 mb-1">
        <span>{homeName}</span>
        <span className="uppercase tracking-widest">MOMENTUM</span>
        <span>{awayName}</span>
      </div>

      {/* Bar */}
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-l-full"
          animate={{ width: `${home}%`, backgroundColor: homeColor }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ boxShadow: `0 0 8px ${homeColor}80` }}
        />
        <motion.div
          className="absolute right-0 top-0 h-full rounded-r-full"
          animate={{ width: `${awayVal}%`, backgroundColor: awayColor }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ boxShadow: `0 0 8px ${awayColor}80`, right: 0 }}
        />
        {/* Divider */}
        <motion.div
          className="absolute top-0 h-full w-0.5 bg-white/30 -translate-x-1/2"
          animate={{ left: `${home}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between text-[8px] mt-1">
        <span style={{ color: homeColor }} className="font-bold">
          {home}%
        </span>
        <span style={{ color: awayColor }} className="font-bold">
          {awayVal}%
        </span>
      </div>
    </div>
  );
}
