import type { RarityCode } from '@world-legends/types';
import { DebugPanel } from './DebugPanel';

type TraitEntry = {
  name: string;
  tier: 1 | 2 | 3;
  cardName: string;
  rarityCode: RarityCode;
  overall: number;
};

type Props = { traits: TraitEntry[] };

const RARITY_COLOR: Record<RarityCode, string> = {
  common: 'text-gray-400',
  rare: 'text-purple-400',
  elite: 'text-blue-400',
  legendary: 'text-amber-400',
  ultra: 'text-pink-400',
  world_cup_hero: 'text-slate-200',
};

const TIER_STAR = ['', '★', '★★', '★★★'] as const;
const TIER_COLOR = ['', 'text-muted', 'text-gold', 'text-amber-300'] as const;

export function TraitsPanel({ traits }: Props) {
  // Agrupar por nome de trait
  const grouped = traits.reduce<Record<string, TraitEntry[]>>((acc, t) => {
    acc[t.name] = [...(acc[t.name] ?? []), t];
    return acc;
  }, {});

  const sorted = Object.entries(grouped).sort(([, a], [, b]) => b.length - a.length);

  return (
    <DebugPanel
      title="ACTIVE TRAITS"
      tag={`${traits.length} assignments`}
      status={`${Object.keys(grouped).length} unique`}
      statusOk
      mono
    >
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {sorted.map(([traitName, entries]) => {
          const maxTier = Math.max(...entries.map((e) => e.tier));
          return (
            <div key={traitName}>
              {/* Trait header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-parchment">{traitName}</span>
                <span className={`text-[10px] font-mono ${TIER_COLOR[maxTier as 1 | 2 | 3]}`}>
                  {TIER_STAR[maxTier as 1 | 2 | 3]}
                </span>
                <span className="text-[8px] text-muted ml-auto">×{entries.length}</span>
              </div>

              {/* Cards com este trait */}
              <div className="space-y-0.5 pl-2 border-l border-[#1a2620]">
                {entries
                  .sort((a, b) => b.tier - a.tier || b.overall - a.overall)
                  .map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] font-mono">
                      <span className={TIER_COLOR[e.tier as 1 | 2 | 3] || 'text-muted'}>
                        {TIER_STAR[e.tier as 1 | 2 | 3]}
                      </span>
                      <span className={`${RARITY_COLOR[e.rarityCode]}`}>{e.cardName}</span>
                      <span className="text-muted ml-auto">{e.overall}</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </DebugPanel>
  );
}
