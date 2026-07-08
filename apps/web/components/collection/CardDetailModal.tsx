'use client';

import { PlayerCard } from '@/components/cards/PlayerCard';
import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import { motion } from 'framer-motion';

type Props = {
  card: CollectionCard;
  isFav: boolean;
  isComparing: boolean;
  onClose: () => void;
  onFav: (cardId: string) => void;
  onCompare: (card: CollectionCard) => void;
};

const TIER_LABEL = ['', '★', '★★', '★★★'] as const;
const TIER_COLOR = ['', 'text-muted', 'text-gold', 'text-amber-300'] as const;

const ATTR_LABELS: Array<{
  key: keyof CollectionCard['attributes'];
  label: string;
  sector: 'atk' | 'mid' | 'def' | 'gk';
}> = [
  { key: 'pace', label: 'Ritmo', sector: 'atk' },
  { key: 'finishing', label: 'Finalização', sector: 'atk' },
  { key: 'passing', label: 'Passe', sector: 'mid' },
  { key: 'dribbling', label: 'Drible', sector: 'mid' },
  { key: 'defending', label: 'Defesa', sector: 'def' },
  { key: 'physical', label: 'Físico', sector: 'def' },
];

const SECTOR_COLOR: Record<string, string> = {
  atk: '#ef4444',
  mid: '#10b981',
  def: '#3b82f6',
  gk: '#f59e0b',
};

const CONTRACT_STATUS = (c: number) =>
  c === 0
    ? { label: 'Expirado', color: 'text-red-400' }
    : c <= 2
      ? { label: 'Baixo', color: 'text-yellow-400' }
      : { label: 'Ativo', color: 'text-emerald-400' };

export function CardDetailModal({ card, isFav, isComparing, onClose, onFav, onCompare }: Props) {
  const visual = RARITY_VISUAL[card.rarityCode];
  const status = CONTRACT_STATUS(10);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[61] p-0 sm:p-4"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only — prevents overlay close, not a user interaction */}
        <div
          className={[
            'relative w-full sm:max-w-md bg-midnight border overflow-hidden',
            'rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto',
            visual.borderClass,
          ].join(' ')}
          style={{
            boxShadow: `0 0 60px ${RARITY_COLORS[card.rarityCode] ?? 'rgba(201,168,76,0.2)'}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Hero section */}
          <div
            className={`relative px-6 pt-4 pb-6 ${visual.bgClass}`}
            style={{
              background: `linear-gradient(135deg, ${RARITY_BG[card.rarityCode]})`,
              borderBottom: `1px solid ${visual.borderClass}`,
            }}
          >
            {/* Glow orb */}
            <div
              className="absolute -top-10 right-0 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ background: RARITY_COLORS[card.rarityCode] }}
            />

            {/* Header: fechar + ações */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <button onClick={onClose} className="text-white/50 hover:text-white text-sm">
                ✕ Fechar
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => onFav(card.cardId)}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-sm hover:scale-110 transition-transform"
                >
                  {isFav ? '❤️' : '🤍'}
                </button>
                <button
                  onClick={() => onCompare(card)}
                  className={`w-8 h-8 rounded-full glass flex items-center justify-center text-sm transition-all
                              ${isComparing ? 'text-blue-400 ring-1 ring-blue-400' : 'text-white/50 hover:text-parchment'}`}
                >
                  ⚖
                </button>
              </div>
            </div>

            {/* Carta (Card Preview — mesmo PlayerCard usado em toda a Sprint 18.5) + nome */}
            <div className="flex items-end gap-4 relative z-10">
              <PlayerCard card={card} size="lg" glow />
              <div className="pb-1 min-w-0">
                <p
                  className={`text-[10px] font-black uppercase tracking-widest mb-1 ${visual.textClass}`}
                >
                  {card.rarityCode === 'world_cup_hero' ? 'World Cup Hero' : card.rarityLabel}
                </p>
                <h2 className="font-display text-2xl text-white leading-tight tracking-wider">
                  {card.displayName.toUpperCase()}
                </h2>
                <p className="text-white/50 text-xs mt-0.5">
                  {card.flagEmoji} {card.nationality} · {card.position} · {card.era}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-5">
            {/* Atributos */}
            <section>
              <p className="text-muted text-[9px] uppercase tracking-wider mb-3">Atributos</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {ATTR_LABELS.map(({ key, label, sector }) => {
                  const val = card.attributes[key] ?? 0;
                  const pct = Math.round((val / 99) * 100);
                  const col = SECTOR_COLOR[sector]!;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted">{label}</span>
                        <span className="font-bold" style={{ color: col }}>
                          {val}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${col}aa, ${col})` }}
                          initial={{ width: '0%' }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Traits */}
            {card.traits.length > 0 && (
              <section>
                <p className="text-muted text-[9px] uppercase tracking-wider mb-2">Traits</p>
                <div className="flex flex-wrap gap-2">
                  {card.traits.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                      style={{
                        borderColor: `rgba(201,168,76,${0.2 + t.tier * 0.15})`,
                        background: `rgba(201,168,76,${t.tier * 0.04})`,
                      }}
                    >
                      <span className="text-parchment text-xs font-semibold">{t.name}</span>
                      <span className={`text-[10px] ${TIER_COLOR[t.tier]}`}>
                        {TIER_LABEL[t.tier]}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Status */}
            <section className="grid grid-cols-3 gap-3">
              <StatusCard
                label="Contratos"
                value={10}
                sub={status.label}
                valueColor={status.color}
              />
              <StatusCard label="Evolução" value="+0" sub="Nível 0" valueColor="text-gold" />
              <StatusCard
                label="Raridade"
                value={
                  card.rarityCode === 'world_cup_hero'
                    ? 'WCH'
                    : card.rarityLabel.slice(0, 3).toUpperCase()
                }
                sub={card.rarityLabel}
                valueColor={visual.textClass}
              />
            </section>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function StatusCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string | number;
  sub: string;
  valueColor: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-2.5 text-center">
      <p className="text-muted text-[8px] uppercase tracking-wider">{label}</p>
      <p className={`font-display text-xl mt-0.5 ${valueColor}`}>{value}</p>
      <p className="text-muted text-[8px] mt-0.5">{sub}</p>
    </div>
  );
}

const RARITY_COLORS: Record<string, string> = {
  common: 'rgba(107,114,128,0.4)',
  rare: 'rgba(147,51,234,0.5)',
  elite: 'rgba(59,130,246,0.5)',
  legendary: 'rgba(201,168,76,0.6)',
  ultra: 'rgba(236,72,153,0.6)',
  world_cup_hero: 'rgba(240,244,255,0.7)',
};

const RARITY_BG: Record<string, string> = {
  common: '#0c0d10, #13151a',
  rare: '#0a0018, #1a0040',
  elite: '#000d20, #001840',
  legendary: '#120900, #2d1800',
  ultra: '#1a0012, #330024',
  world_cup_hero: '#04040a, #0a0818',
};
