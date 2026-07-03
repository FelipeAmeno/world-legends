import type { Pack } from '@world-legends/packs';
import type { RarityWeights } from '@world-legends/packs';
import { DebugPanel, InlineBar } from './DebugPanel';

type PackEntry = {
  pack: Pack;
  id: string;
  slots: readonly any[];
};

type Props = {
  packs: PackEntry[];
  baseWeights: RarityWeights;
};

const RARITY_COLOR: Record<string, string> = {
  common: 'bg-gray-500',
  rare: 'bg-purple-600',
  elite: 'bg-blue-600',
  legendary: 'bg-amber-500',
  ultra: 'bg-pink-600',
  world_cup_hero: 'bg-slate-300',
};
const RARITY_TEXT: Record<string, string> = {
  common: 'text-gray-400',
  rare: 'text-purple-400',
  elite: 'text-blue-400',
  legendary: 'text-amber-400',
  ultra: 'text-pink-400',
  world_cup_hero: 'text-slate-200',
};
const RARITY_ABBR: Record<string, string> = {
  common: 'COM',
  rare: 'RAR',
  elite: 'ELI',
  legendary: 'LEG',
  ultra: 'ULT',
  world_cup_hero: 'WCH',
};

// Calcular probabilidade normalizada de cada raridade dado os pesos
function normalizeWeights(weights: Partial<RarityWeights>): Record<string, number> {
  const entries = Object.entries(weights).filter(([, v]) => (v ?? 0) > 0);
  const total = entries.reduce((s, [, v]) => s + (v ?? 0), 0);
  if (total === 0) return {};
  return Object.fromEntries(entries.map(([k, v]) => [k, ((v ?? 0) / total) * 100]));
}

// Probabilidade efetiva média de um pack (média dos slots)
function effectiveProbability(slots: readonly any[]): Record<string, number> {
  const acc: Record<string, number> = {};
  const n = slots.length;
  for (const slot of slots) {
    const w = normalizeWeights(slot.rarityWeights ?? {});
    for (const [rarity, pct] of Object.entries(w)) {
      acc[rarity] = (acc[rarity] ?? 0) + pct / n;
    }
  }
  return acc;
}

const RARITY_ORDER = ['world_cup_hero', 'ultra', 'legendary', 'elite', 'rare', 'common'] as const;

export function DropRatesPanel({ packs, baseWeights }: Props) {
  return (
    <DebugPanel title="DROP RATES" tag={`${packs.length} packs`} statusOk mono>
      <div className="space-y-5">
        {/* Base weights */}
        <div>
          <p className="text-[9px] text-muted font-mono mb-2">BASE_RARITY_WEIGHTS</p>
          {RARITY_ORDER.map((rarity) => {
            const w = baseWeights[rarity] ?? 0;
            const total = Object.values(baseWeights).reduce((s, v) => s + v, 0);
            const pct = (w / total) * 100;
            return (
              <InlineBar
                key={rarity}
                label={RARITY_ABBR[rarity] ?? rarity}
                pct={pct}
                color={RARITY_COLOR[rarity] ?? 'bg-zinc-500'}
                value={`${pct.toFixed(2)}%`}
              />
            );
          })}
        </div>

        <div className="border-t border-[#1a2620]" />

        {/* Por pack */}
        {packs.map(({ pack, id, slots }) => {
          const effective = effectiveProbability(slots);
          return (
            <div key={id}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-mono font-bold text-parchment">
                  {pack.name.toUpperCase()}
                </p>
                <span className="text-[8px] text-muted">{slots.length} slots</span>
              </div>

              {/* Probabilidades efetivas */}
              {RARITY_ORDER.filter((r) => (effective[r] ?? 0) > 0.01).map((rarity) => {
                const pct = effective[rarity] ?? 0;
                return (
                  <InlineBar
                    key={rarity}
                    label={RARITY_ABBR[rarity] ?? rarity}
                    pct={pct}
                    color={RARITY_COLOR[rarity] ?? 'bg-zinc-500'}
                    value={`${pct.toFixed(2)}%`}
                  />
                );
              })}

              {/* Slots individuais */}
              <div className="mt-2 space-y-0.5">
                {slots.map((slot, si) => {
                  const guaranteed = slot.guaranteedMinRarity;
                  const hasWeights = Object.values(slot.rarityWeights ?? {}).some(
                    (v: any) => v > 0,
                  );
                  return (
                    <div key={si} className="flex items-center gap-2 text-[8px] font-mono">
                      <span className="text-muted w-8">s{si}</span>
                      {guaranteed && (
                        <span
                          className={`${RARITY_TEXT[guaranteed]} border border-current/30 px-1 rounded`}
                        >
                          ≥{RARITY_ABBR[guaranteed]}
                        </span>
                      )}
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(slot.rarityWeights ?? {})
                          .filter(([, v]: any) => v > 0)
                          .map(([r, v]: any) => (
                            <span key={r} className={`${RARITY_TEXT[r]}`}>
                              {RARITY_ABBR[r]}:{v}
                            </span>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </DebugPanel>
  );
}
