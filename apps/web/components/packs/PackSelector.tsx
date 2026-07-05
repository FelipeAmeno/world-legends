'use client';

import { COMING_SOON_DEFS, type ComingSoonPack, type PackDefinitionUI } from '@/lib/pack-logic';
import { motion } from 'framer-motion';

type Props = {
  packs: readonly PackDefinitionUI[];
  balance: number;
  onOpen: (p: PackDefinitionUI) => void;
};

export function PackSelector({ packs, balance, onOpen }: Props) {
  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-parchment tracking-wider">LOJA DE PACKS</h2>
          <p className="text-muted text-xs mt-0.5">Toque num pack para abrir imediatamente</p>
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
            canAfford={balance >= pack.price}
            onClick={() => onOpen(pack)}
          />
        ))}
      </div>

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
  canAfford,
  onClick,
}: {
  pack: PackDefinitionUI;
  canAfford: boolean;
  onClick: () => void;
}) {
  const isExpensive = pack.id === 'goat' || pack.id === 'legend' || pack.id === 'hero';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!canAfford}
      {...(canAfford ? { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } } : {})}
      className={[
        'relative group rounded-2xl border overflow-hidden text-left focus:outline-none',
        !canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
      style={{
        borderColor: pack.borderColor,
        boxShadow: `0 0 20px ${pack.glowColor}`,
      }}
    >
      {/* Art */}
      <div
        className="relative h-48 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${pack.gradientFrom}, ${pack.gradientTo})` }}
      >
        {/* Base glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${pack.glowColor} 0%, transparent 70%)`,
            opacity: 0.3,
          }}
        />

        {/* Shimmer sweep — always visible */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPositionX: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        />

        {/* Holographic overlay for expensive packs */}
        {isExpensive && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 60%, transparent 80%)',
              backgroundSize: '200% 200%',
            }}
            animate={{
              backgroundPositionX: ['-100%', '200%'],
              backgroundPositionY: ['-100%', '200%'],
            }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
        )}

        {/* Inner border glow */}
        <div
          className="absolute inset-0 rounded-t-2xl pointer-events-none"
          style={{
            boxShadow: `inset 0 0 40px ${pack.glowColor.replace(/[\d.]+\)$/, '0.2)')}`,
          }}
        />

        {/* Pack icon */}
        <div
          className="relative z-10 text-6xl mb-3 transition-transform duration-300 group-hover:scale-110"
          style={{ filter: `drop-shadow(0 0 20px ${pack.glowColor})` }}
        >
          {pack.icon}
        </div>

        <p className="relative z-10 font-display text-2xl tracking-wider text-parchment">
          {(pack.name.split(' ')[0] ?? pack.name).toUpperCase()}
        </p>

        {/* Guarantee badge */}
        <div
          className="absolute top-3 right-3 text-[9px] font-bold px-2 py-1 rounded-full"
          style={{
            background: pack.glowColor.replace(/[\d.]+\)$/, '0.2)'),
            border: `1px solid ${pack.borderColor}`,
            color: '#fff',
          }}
        >
          {pack.guarantee}
        </div>

        {/* "TAP TO OPEN" hint on hover */}
        {canAfford && (
          <motion.div
            className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <span
              className="text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full"
              style={{
                background: pack.glowColor.replace(/[\d.]+\)$/, '0.25)'),
                border: `1px solid ${pack.borderColor}`,
                color: '#fff',
              }}
            >
              toque para abrir
            </span>
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-surface border-t" style={{ borderColor: `${pack.borderColor}40` }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-parchment font-bold text-sm">{pack.name}</p>
          <p className="font-display text-lg gold-text">{pack.price.toLocaleString('pt-BR')}c</p>
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
