'use client';

import { COMING_SOON_DEFS, type ComingSoonPack, type PackDefinitionUI } from '@/lib/pack-logic';
import { motion } from 'framer-motion';

type Props = {
  packs: readonly PackDefinitionUI[];
  selected: PackDefinitionUI | null;
  balance: number;
  onSelect: (p: PackDefinitionUI) => void;
  onOpen: () => void;
};

export function PackSelector({ packs, selected, balance, onSelect, onOpen }: Props) {
  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-parchment tracking-wider">LOJA DE PACKS</h2>
          <p className="text-muted text-xs mt-0.5">Escolha seu pack e descubra as lendas</p>
        </div>
        <div className="bg-surface border border-border rounded-xl px-4 py-2.5 text-center">
          <p className="text-[10px] text-muted uppercase tracking-wider">Saldo</p>
          <p className="font-display text-xl gold-text">{balance.toLocaleString('pt-BR')}c</p>
        </div>
      </div>

      {/* ── Packs disponíveis ──────────────────────────────────────────── */}
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3">Disponíveis</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
        {packs.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            isSelected={selected?.id === pack.id}
            canAfford={balance >= pack.price}
            onClick={() => onSelect(pack)}
          />
        ))}
      </div>

      {/* ── Botão de abrir ─────────────────────────────────────────────── */}
      {selected && (
        <div className="flex justify-center mb-8">
          <button
            onClick={onOpen}
            disabled={balance < selected.price}
            className={[
              'px-12 py-4 rounded-2xl font-display text-xl tracking-widest transition-all duration-300',
              balance >= selected.price
                ? 'bg-gradient-to-r from-gold-dim to-gold text-obsidian hover:scale-105 hover:shadow-gold'
                : 'bg-surface text-muted border border-border cursor-not-allowed',
            ].join(' ')}
          >
            {balance >= selected.price
              ? `ABRIR ${selected.name.toUpperCase()}`
              : 'SALDO INSUFICIENTE'}
          </button>
        </div>
      )}

      {/* ── Em breve ───────────────────────────────────────────────────── */}
      <div className="mt-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-white/6" />
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/25 shrink-0">Em Breve</p>
          <div className="flex-1 h-px bg-white/6" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COMING_SOON_DEFS.map((pack, i) => (
            <ComingSoonCard key={pack.id} pack={pack} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PackCard (disponível) ────────────────────────────────────────────────────

function PackCard({
  pack,
  isSelected,
  canAfford,
  onClick,
}: {
  pack: PackDefinitionUI;
  isSelected: boolean;
  canAfford: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={!canAfford}
      {...(canAfford ? { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } } : {})}
      className={[
        'relative group rounded-2xl border overflow-hidden text-left focus:outline-none',
        isSelected ? 'scale-[1.03]' : '',
        !canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
      style={{
        borderColor: pack.borderColor,
        boxShadow: isSelected ? `0 0 32px ${pack.glowColor}, 0 0 8px ${pack.glowColor}` : undefined,
      }}
    >
      {/* Art */}
      <div
        className="relative h-48 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${pack.gradientFrom}, ${pack.gradientTo})` }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${pack.glowColor} 0%, transparent 70%)`,
          }}
        />
        <div
          className="relative z-10 text-6xl mb-3 transition-transform duration-300 group-hover:scale-110"
          style={{ filter: `drop-shadow(0 0 16px ${pack.glowColor})` }}
        >
          {pack.icon}
        </div>
        <p className="relative z-10 font-display text-2xl tracking-wider text-parchment">
          {(pack.name.split(' ')[0] ?? pack.name).toUpperCase()}
        </p>

        {/* Guarantee badge */}
        <div
          className="absolute top-3 right-3 text-[9px] font-bold px-2 py-1 rounded-full"
          style={{ background: pack.glowColor, color: '#fff' }}
        >
          {pack.guarantee}
        </div>

        {isSelected && (
          <div
            className="absolute inset-0 border-2 rounded-2xl pointer-events-none"
            style={{ borderColor: pack.borderColor }}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-surface border-t" style={{ borderColor: `${pack.borderColor}40` }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-parchment font-bold text-sm">{pack.name}</p>
          <p className="font-display text-lg gold-text">{pack.price.toLocaleString()}c</p>
        </div>
        <p className="text-muted text-[10px] mb-2">{pack.tagline}</p>
        <div className="flex items-center gap-3 text-[9px] text-muted">
          <span>📦 {pack.cardCount} cartas</span>
          <span>✨ {pack.guarantee}</span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── ComingSoonCard ───────────────────────────────────────────────────────────

function ComingSoonCard({ pack, index }: { pack: ComingSoonPack; index: number }) {
  return (
    <motion.div
      className="relative rounded-2xl border overflow-hidden cursor-not-allowed"
      style={{ borderColor: pack.borderColor, opacity: 0.6 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 0.6, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      {/* Art area */}
      <div
        className="relative h-28 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${pack.gradientFrom}, ${pack.gradientTo})` }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${pack.glowColor} 0%, transparent 70%)`,
          }}
        />

        {/* Lock overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 z-20">
          <span className="text-2xl">🔒</span>
          <span
            className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
            style={{
              background: `${pack.glowColor}30`,
              border: `1px solid ${pack.borderColor}`,
              color: pack.borderColor
                .replace('0.38)', '0.9)')
                .replace('0.35)', '0.9)')
                .replace('0.45)', '0.9)'),
            }}
          >
            Em Breve
          </span>
        </div>

        <div
          className="relative z-10 text-4xl"
          style={{ filter: `drop-shadow(0 0 12px ${pack.glowColor})` }}
        >
          {pack.icon}
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5" style={{ background: `${pack.gradientFrom}cc` }}>
        <p className="text-parchment/70 font-bold text-xs truncate">{pack.name}</p>
        <p className="text-white/30 text-[9px] truncate mt-0.5">{pack.tagline}</p>
        <p
          className="text-[10px] mt-1"
          style={{
            color: pack.borderColor
              .replace('0.38)', '0.7)')
              .replace('0.35)', '0.7)')
              .replace('0.45)', '0.7)'),
          }}
        >
          {pack.priceLabel}
        </p>
      </div>
    </motion.div>
  );
}
