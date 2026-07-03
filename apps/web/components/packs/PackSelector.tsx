'use client';

import type { PackDefinitionUI } from '@/lib/pack-logic';

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
      {/* Header */}
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

      {/* Grade de packs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
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

      {/* Botão de abrir */}
      {selected && (
        <div className="flex justify-center">
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
    </div>
  );
}

// ─── PackCard ─────────────────────────────────────────────────────────────────

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
    <button
      onClick={onClick}
      disabled={!canAfford}
      className={[
        'relative group rounded-2xl border overflow-hidden text-left transition-all duration-300',
        'focus:outline-none hover:scale-[1.03]',
        isSelected
          ? 'scale-[1.03] ring-2 ring-offset-2 ring-offset-obsidian'
          : 'hover:border-opacity-60',
        !canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
      style={
        {
          borderColor: pack.borderColor,
          boxShadow: isSelected
            ? `0 0 32px ${pack.glowColor}, 0 0 8px ${pack.glowColor}`
            : undefined,
          '--ring-color': pack.borderColor,
        } as React.CSSProperties
      }
    >
      {/* Pack art area */}
      <div
        className="relative h-48 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${pack.gradientFrom}, ${pack.gradientTo})` }}
      >
        {/* Shimmer de fundo */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${pack.glowColor} 0%, transparent 70%)`,
          }}
        />

        {/* Ícone do pack */}
        <div
          className="relative z-10 text-6xl mb-3 transition-transform duration-300 group-hover:scale-110"
          style={{ filter: `drop-shadow(0 0 16px ${pack.glowColor})` }}
        >
          {pack.icon}
        </div>

        {/* Nome */}
        <p
          className="relative z-10 font-display text-2xl tracking-wider"
          style={{
            color: pack.borderColor.replace('0.', '').replace(')', ',1)').replace('rgba(', 'rgb('),
          }}
        >
          {(pack.name.split(' ')[0] ?? pack.name).toUpperCase()}
        </p>

        {/* Garantia badge */}
        <div
          className="absolute top-3 right-3 text-[9px] font-bold px-2 py-1 rounded-full"
          style={{
            background: pack.glowColor,
            color: '#fff',
          }}
        >
          {pack.guarantee}
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div
            className="absolute inset-0 border-2 rounded-2xl pointer-events-none"
            style={{ borderColor: pack.borderColor }}
          />
        )}
      </div>

      {/* Info area */}
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
    </button>
  );
}
