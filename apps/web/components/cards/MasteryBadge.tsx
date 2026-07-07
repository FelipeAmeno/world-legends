'use client';

import type { CardMasteryView } from '@/lib/actions/card-mastery.types';
import { motion } from 'framer-motion';

type Props = {
  mastery: CardMasteryView;
  size?: 'xs' | 'sm' | 'md';
};

const SIZE = {
  xs: { container: 'w-4 h-4 text-[8px]', icon: '7px' },
  sm: { container: 'w-5 h-5 text-[9px]', icon: '9px' },
  md: { container: 'w-6 h-6 text-xs', icon: '11px' },
};

export function MasteryBadge({ mastery, size = 'sm' }: Props) {
  const { levelConfig } = mastery;
  const s = SIZE[size];

  return (
    <motion.div
      className={`${s.container} rounded-full border flex items-center justify-center font-bold shrink-0`}
      style={{
        background: `radial-gradient(circle, ${levelConfig.glowColor}30 0%, rgba(7,8,15,0.9) 70%)`,
        borderColor: `${levelConfig.glowColor}70`,
        boxShadow: `0 0 6px ${levelConfig.glowColor}40`,
        fontSize: s.icon,
      }}
      title={`Maestria ${levelConfig.name} (Nível ${levelConfig.level})`}
    >
      {levelConfig.icon}
    </motion.div>
  );
}
