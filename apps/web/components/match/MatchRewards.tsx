import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import type { MatchDisplay } from '@/lib/match-data';

type Props = {
  rewards: MatchDisplay['rewards'];
  mvp: CollectionCard | null;
  winner: 'home' | 'away' | 'draw';
};

const WINNER_HEADER = {
  home: { label: 'RECOMPENSAS DE VITÓRIA', color: 'text-emerald-400', icon: '🏆' },
  draw: { label: 'RECOMPENSAS DE EMPATE', color: 'text-yellow-400', icon: '🤝' },
  away: { label: 'RECOMPENSAS DE DERROTA', color: 'text-muted', icon: '💔' },
};

export function MatchRewards({ rewards, mvp, winner }: Props) {
  const header = WINNER_HEADER[winner];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{header.icon}</span>
        <h3 className={`font-display text-lg tracking-wider ${header.color}`}>{header.label}</h3>
      </div>

      {/* Totais em destaque */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <TotalBox
          icon="💰"
          label="Créditos"
          value={`+${rewards.credits.toLocaleString('pt-BR')}c`}
          color="text-gold"
        />
        <TotalBox icon="⭐" label="XP ganho" value={`+${rewards.xp} XP`} color="text-steel" />
      </div>

      {/* Bônus detalhados */}
      {rewards.bonuses.length > 0 && (
        <div className="space-y-1.5 mb-4">
          <p className="text-muted text-[10px] uppercase tracking-wider">Bônus obtidos</p>
          {rewards.bonuses.map((b, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-obsidian border border-border/60"
            >
              <span className="text-parchment text-xs">{b.label}</span>
              <div className="flex gap-3 text-[10px]">
                <span className="text-gold">+{b.credits}c</span>
                <span className="text-steel">+{b.xp} XP</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MVP */}
      {mvp && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-muted text-[10px] uppercase tracking-wider mb-2">MVP da Partida</p>
          <div
            className={[
              'flex items-center gap-3 p-3 rounded-xl border',
              RARITY_VISUAL[mvp.rarityCode].bgClass,
              RARITY_VISUAL[mvp.rarityCode].borderClass,
              RARITY_VISUAL[mvp.rarityCode].glowClass,
            ].join(' ')}
          >
            <div
              className={[
                'w-10 h-10 rounded-full border-2 flex items-center justify-center',
                'bg-obsidian/80',
                RARITY_VISUAL[mvp.rarityCode].borderClass,
              ].join(' ')}
            >
              <span className={`font-display text-sm ${RARITY_VISUAL[mvp.rarityCode].textClass}`}>
                {mvp.overall}
              </span>
            </div>
            <div>
              <p className="text-parchment font-bold text-sm">{mvp.displayName}</p>
              <p className="text-muted text-[10px]">
                {mvp.flagEmoji} {mvp.position} · {mvp.rarityLabel}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-gold text-xs font-bold">+100c</p>
              <p className="text-muted text-[9px]">bônus MVP</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TotalBox ─────────────────────────────────────────────────────────────────

function TotalBox({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-obsidian border border-border rounded-xl p-3 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-muted text-[10px]">{label}</p>
        <p className={`font-display text-xl ${color}`}>{value}</p>
      </div>
    </div>
  );
}
