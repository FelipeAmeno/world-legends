import { OvrDisplay } from '@/components/ui/OvrDisplay';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { RARITY_VISUAL } from '@/lib/collection-data';
import type { DrawnCard } from '@/lib/pack-logic';
import type { PackDefinitionUI } from '@/lib/pack-logic';
import type { RarityCode } from '@world-legends/types';
import Link from 'next/link';

type Props = {
  cards: DrawnCard[];
  pack: PackDefinitionUI;
  fragmentsGained?: number;
  onOpenAnother: () => void;
  onBack: () => void;
  isWelcome?: boolean;
};

export function RevealSummary({
  cards,
  pack,
  fragmentsGained = 0,
  onOpenAnother,
  onBack,
  isWelcome,
}: Props) {
  const best = [...cards].sort((a, b) => b.card.overall - a.card.overall)[0]!;
  const avgOvr = Math.round(cards.reduce((s, c) => s + c.card.overall, 0) / cards.length);
  const rarities = cards.map((c) => c.card.rarityCode);
  const hasLegendary = rarities.some(
    (r) => r === 'legendary' || r === 'ultra' || r === 'world_cup_hero',
  );

  return (
    <div className="space-y-5 animate-[slideUp_0.4s_ease-out]">
      {/* Header */}
      <div className="text-center">
        {hasLegendary ? (
          <>
            <p className="font-display text-4xl gold-text tracking-wider">INCRÍVEL! 🎉</p>
            <p className="text-muted text-sm mt-1">Você encontrou cartas especiais</p>
          </>
        ) : (
          <>
            <p className="font-display text-3xl text-parchment tracking-wider">PACK ABERTO</p>
            <p className="text-muted text-sm mt-1">Cartas adicionadas à coleção</p>
          </>
        )}
      </div>

      {/* Fragmentos ganhos com duplicatas */}
      {fragmentsGained > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm"
          style={{
            background: 'rgba(168,85,247,0.08)',
            borderColor: 'rgba(168,85,247,0.25)',
          }}
        >
          <span className="text-lg">💜</span>
          <div>
            <p className="text-purple-400 font-bold text-xs">+{fragmentsGained} Fragmentos</p>
            <p className="text-white/40 text-[10px]">
              Cartas repetidas convertidas automaticamente
            </p>
          </div>
        </div>
      )}

      {/* Best card em destaque */}
      <div
        className="flex items-center gap-4 p-4 rounded-2xl border"
        style={{
          background: `linear-gradient(135deg, ${pack.gradientFrom}, ${pack.gradientTo})`,
          borderColor: pack.borderColor,
          boxShadow: `0 0 24px ${pack.glowColor}`,
        }}
      >
        <div
          className={[
            'w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center',
            RARITY_VISUAL[best.card.rarityCode].bgClass,
            RARITY_VISUAL[best.card.rarityCode].borderClass,
            RARITY_VISUAL[best.card.rarityCode].glowClass,
          ].join(' ')}
        >
          <OvrDisplay value={best.card.overall} size="md" />
          <p
            className={`text-[7px] font-bold mt-0.5 ${RARITY_VISUAL[best.card.rarityCode].textClass}`}
          >
            {best.card.position}
          </p>
        </div>
        <div>
          <p className="text-muted text-[10px] uppercase tracking-widest">Melhor carta</p>
          <p className="text-parchment font-bold text-lg leading-tight">{best.card.displayName}</p>
          <div className="mt-1">
            <RarityBadge code={best.card.rarityCode} label={best.card.rarityLabel} size="sm" />
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="text-muted text-[9px]">OVR médio</p>
          <OvrDisplay value={avgOvr} size="md" />
        </div>
      </div>

      {/* Raridade breakdown */}
      <RarityBreakdown cards={cards} />

      {/* Grade completa das cartas */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-muted text-[10px] uppercase tracking-wider mb-3">Todas as cartas</p>
        <div className="flex flex-wrap gap-2">
          {cards.map((drawn, i) => {
            const v = RARITY_VISUAL[drawn.card.rarityCode];
            return (
              <div
                key={i}
                className={[
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border',
                  drawn.isDuplicate ? 'opacity-60' : '',
                  v.bgClass,
                  v.borderClass,
                ].join(' ')}
              >
                <span className={`font-display text-base ${v.textClass}`}>
                  {drawn.card.overall}
                </span>
                <div>
                  <p className="text-parchment text-[10px] font-medium leading-tight">
                    {drawn.card.displayName}
                  </p>
                  <p className={`text-[8px] font-bold ${v.textClass}`}>
                    {drawn.card.rarityCode === 'world_cup_hero' ? 'WCH' : drawn.card.rarityLabel}
                    {drawn.wasForced && ' ★'}
                    {drawn.isDuplicate && ` → +${drawn.fragmentsGained ?? 0}💜`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ações */}
      {isWelcome ? (
        <div className="space-y-3">
          <Link
            href="/squad"
            className="block w-full py-4 rounded-2xl font-display text-xl tracking-wider text-center
                       transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a)',
              color: '#07080f',
              boxShadow: '0 0 32px rgba(201,168,76,0.45), 0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            ⚽ MONTAR MEU SQUAD →
          </Link>
          <Link
            href="/collection"
            className="block w-full py-2.5 rounded-xl text-center text-sm text-white/40
                       border border-white/8 hover:text-parchment hover:bg-white/5 transition-all"
          >
            Ver minha coleção →
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          <button
            onClick={onOpenAnother}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${pack.gradientFrom.replace('1a', '2a')}, ${pack.borderColor.replace(/[\d.]+\)$/, '0.3)')})`,
              border: `1px solid ${pack.borderColor}`,
              color: pack.borderColor.replace(/[\d.]+\)$/, '1)'),
              boxShadow: `0 0 16px ${pack.glowColor}`,
            }}
          >
            📦 Abrir Outro {pack.name}
          </button>
          <div className="flex gap-2.5">
            <Link
              href="/collection"
              className="flex-1 py-2.5 rounded-xl text-center text-sm font-medium transition-all
                         hover:scale-[1.02]"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.2)',
                color: '#c9a84c',
              }}
            >
              🃏 Ver Coleção
            </Link>
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-border text-muted text-sm
                         hover:text-parchment hover:bg-white/5 transition-all"
            >
              ← Loja
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rarity Breakdown ────────────────────────────────────────────────────────

const RARITY_META: Record<RarityCode, { label: string; color: string; bg: string }> = {
  world_cup_hero: { label: 'WCH', color: '#e2e8f0', bg: 'rgba(226,232,240,0.12)' },
  ultra: { label: 'Ultra', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  legendary: { label: 'Lendária', color: '#c9a84c', bg: 'rgba(201,168,76,0.12)' },
  elite: { label: 'Elite', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  rare: { label: 'Rara', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  common: { label: 'Comum', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const RARITY_ORDER: RarityCode[] = [
  'world_cup_hero',
  'ultra',
  'legendary',
  'elite',
  'rare',
  'common',
];

function RarityBreakdown({ cards }: { cards: DrawnCard[] }) {
  const counts = new Map<RarityCode, number>();
  for (const c of cards) {
    counts.set(c.card.rarityCode, (counts.get(c.card.rarityCode) ?? 0) + 1);
  }

  const present = RARITY_ORDER.filter((r) => (counts.get(r) ?? 0) > 0);
  if (present.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-muted text-[10px] uppercase tracking-wider mb-3">Por raridade</p>
      <div className="flex flex-wrap gap-2">
        {present.map((rarity) => {
          const meta = RARITY_META[rarity];
          const count = counts.get(rarity) ?? 0;
          return (
            <div
              key={rarity}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold"
              style={{
                background: meta.bg,
                borderColor: `${meta.color}40`,
                color: meta.color,
              }}
            >
              <span>{count}×</span>
              <span>{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
