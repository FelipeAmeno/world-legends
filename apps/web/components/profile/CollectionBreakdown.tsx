import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import type { RarityCode } from '@world-legends/types';

type Props = { cards: CollectionCard[] };

const RARITY_ORDER: RarityCode[] = [
  'world_cup_hero',
  'ultra',
  'legendary',
  'elite',
  'rare',
  'common',
];

const RARITY_NAME: Record<RarityCode, string> = {
  world_cup_hero: 'WCH',
  ultra: 'Ultra',
  legendary: 'Lendária',
  elite: 'Elite',
  rare: 'Rara',
  common: 'Comum',
};

export function CollectionBreakdown({ cards }: Props) {
  const total = cards.length;

  // Contar por raridade
  const counts = cards.reduce<Partial<Record<RarityCode, number>>>((acc, c) => {
    acc[c.rarityCode] = (acc[c.rarityCode] ?? 0) + 1;
    return acc;
  }, {});

  // OVR médio
  const avgOvr = total > 0 ? Math.round(cards.reduce((s, c) => s + c.overall, 0) / total) : 0;

  // Melhor OVR
  const bestOvr = total > 0 ? Math.max(...cards.map((c) => c.overall)) : 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-parchment tracking-wider">COLEÇÃO</h2>
        <span className="font-display text-2xl gold-text">{total}</span>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <MiniStat label="OVR médio" value={avgOvr} color="text-gold" />
        <MiniStat label="Melhor OVR" value={bestOvr} color="text-emerald-400" />
      </div>

      {/* Barras por raridade */}
      <div className="space-y-2.5">
        {RARITY_ORDER.map((rarity) => {
          const count = counts[rarity] ?? 0;
          if (count === 0) return null;
          const pct = Math.round((count / total) * 100);
          const visual = RARITY_VISUAL[rarity];

          return (
            <div key={rarity}>
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className={`font-bold ${visual.textClass}`}>{RARITY_NAME[rarity]}</span>
                <span className="text-muted">
                  {count} · {pct}%
                </span>
              </div>
              <div className="h-2 bg-obsidian rounded-full overflow-hidden border border-border/30">
                <div
                  className={'h-full rounded-full transition-all duration-700'}
                  style={{
                    width: `${pct}%`,
                    background: visual.textClass.replace('text-', '').includes('slate')
                      ? 'linear-gradient(90deg, #94a3b8, #e2e8f0)'
                      : undefined,
                    backgroundColor: !visual.textClass.includes('slate')
                      ? getBarColor(rarity)
                      : undefined,
                    boxShadow: `0 0 4px ${getGlowHex(rarity)}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: posições */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-muted text-[10px] uppercase tracking-wider mb-2">Por posição</p>
        <PositionDots cards={cards} />
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBarColor(rarity: RarityCode): string {
  const map: Record<RarityCode, string> = {
    common: '#6b7280',
    rare: '#a855f7',
    elite: '#3b82f6',
    legendary: '#c9a84c',
    ultra: '#ec4899',
    world_cup_hero: '#e2e8f0',
  };
  return map[rarity];
}

function getGlowHex(rarity: RarityCode): string {
  const map: Record<RarityCode, string> = {
    common: '#6b728050',
    rare: '#a855f780',
    elite: '#3b82f680',
    legendary: '#c9a84c80',
    ultra: '#ec489980',
    world_cup_hero: '#e2e8f080',
  };
  return map[rarity];
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-obsidian rounded-lg p-2.5 text-center border border-border/50">
      <p className={`font-display text-2xl ${color}`}>{value}</p>
      <p className="text-muted text-[9px] mt-0.5">{label}</p>
    </div>
  );
}

function PositionDots({ cards }: { cards: CollectionCard[] }) {
  const positions = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.position] = (acc[c.position] ?? 0) + 1;
    return acc;
  }, {});

  const POS_COLOR: Record<string, string> = {
    GK: 'bg-amber-700',
    CB: 'bg-blue-800',
    LB: 'bg-blue-800',
    RB: 'bg-blue-800',
    CDM: 'bg-green-800',
    CM: 'bg-green-800',
    CAM: 'bg-green-800',
    LW: 'bg-red-800',
    RW: 'bg-red-800',
    ST: 'bg-red-800',
    CF: 'bg-red-800',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(positions)
        .sort(([, a], [, b]) => b - a)
        .map(([pos, count]) => (
          <span
            key={pos}
            className={`${POS_COLOR[pos] ?? 'bg-gray-700'} text-white text-[8px] font-bold px-1.5 py-0.5 rounded`}
          >
            {pos} ×{count}
          </span>
        ))}
    </div>
  );
}
