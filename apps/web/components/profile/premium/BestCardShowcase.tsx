'use client';

import { PlayerCard } from '@/components/cards/PlayerCard';
import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import { motion } from 'framer-motion';

type Props = {
  card: CollectionCard | null;
  avgOvr: number;
  legendaryPlus: number;
};

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.4)',
  rare: 'rgba(147,51,234,0.7)',
  elite: 'rgba(59,130,246,0.8)',
  legendary: 'rgba(201,168,76,0.9)',
  ultra: 'rgba(236,72,153,0.9)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

export function BestCardShowcase({ card, avgOvr, legendaryPlus }: Props) {
  if (!card) return null;

  const visual = RARITY_VISUAL[card.rarityCode];
  const glow = RARITY_GLOW[card.rarityCode] ?? 'rgba(201,168,76,0.4)';

  return (
    <section>
      <SectionTitle>🏆 Melhor Carta</SectionTitle>

      <div className="flex gap-4 items-stretch">
        {/* Card 3D-ish */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotateY: -20 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.2 }}
          className="relative shrink-0"
          style={{ perspective: 800 }}
        >
          <PlayerCard card={card} size="lg" glow />

          {/* Pulse rings */}
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-2xl border pointer-events-none"
              style={{ borderColor: glow }}
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 2, delay: i * 0.8, repeat: Number.POSITIVE_INFINITY }}
            />
          ))}
        </motion.div>

        {/* Stats alongside */}
        <motion.div
          className="flex-1 flex flex-col gap-2"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <p className="text-muted text-[10px] uppercase tracking-wider">Jogador</p>
            <p className="text-parchment font-bold text-base leading-tight">{card.displayName}</p>
            <p className="text-white/40 text-[10px] mt-0.5">
              {card.flagEmoji} {card.nationality} · {card.position} · {card.era}
            </p>
          </div>

          <div className="h-px bg-white/5" />

          <StatMini label="OVR Máximo" value={card.overall} color="gold-text" />
          <StatMini label="OVR Médio" value={avgOvr} color="text-blue-400" />
          <StatMini label="Lendárias+" value={legendaryPlus} color="text-purple-400" />
          <StatMini
            label="Raridade"
            value={card.rarityCode === 'world_cup_hero' ? 'WCH' : card.rarityLabel}
            color={visual.textClass}
          />

          {/* Traits */}
          {card.traits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {card.traits.map((t, i) => (
                <span
                  key={i}
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(201,168,76,0.1)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: '#c9a84c',
                  }}
                >
                  {t.name} {'★'.repeat(t.tier)}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function StatMini({
  label,
  value,
  color,
}: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted text-[10px]">{label}</span>
      <span className={`font-display text-lg ${color}`}>{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl text-parchment tracking-wider mb-3">{children}</h2>;
}
