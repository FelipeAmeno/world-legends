import type { SquadChemistry } from '@world-legends/chemistry';
import type { SquadRating } from '@world-legends/squad-rating';
import { DebugPanel, InlineBar, MonoRow } from './DebugPanel';

type PlayerEntry = {
  userCardId: string;
  nationality: string;
  competition: string;
  era: string;
  name: string;
};

type Props = {
  chemistry: SquadChemistry;
  squadRating: SquadRating;
  players: PlayerEntry[];
};

export function ChemDebugPanel({ chemistry: c, squadRating: r, players }: Props) {
  const chemPct = c.total;

  return (
    <DebugPanel
      title="CHEMISTRY DEBUG"
      tag="calculateChemistry()"
      status={`${c.total}/100`}
      statusOk={c.total >= 70}
      mono
    >
      {/* Score + barra */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="font-display text-4xl text-emerald-400">{c.total}</span>
          <span className="text-muted text-xs">/ 100</span>
        </div>
        <div className="h-2 bg-[#060c08] rounded-full overflow-hidden mb-1">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${chemPct}%`,
              background:
                chemPct >= 80
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : chemPct >= 60
                    ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                    : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <p className="text-[9px] text-muted font-mono mb-2">BREAKDOWN</p>
      <div className="space-y-1 mb-4">
        <MonoRow label="nationality_links" value={c.breakdown.nationalityLinks} />
        <MonoRow label="competition_links" value={c.breakdown.competitionLinks} />
        <MonoRow label="era_links" value={c.breakdown.eraLinks} />
        <MonoRow label="perfect_links" value={c.breakdown.perfectLinks} color="text-amber-400" />
        <MonoRow label="total_links" value={c.breakdown.totalLinks} />
        <MonoRow label="total_link_bonus" value={c.breakdown.totalLinkBonus.toFixed(2)} />
      </div>

      {/* Squad Rating breakdown */}
      <div className="border-t border-[#1a2620] pt-3 mb-3">
        <p className="text-[9px] text-muted font-mono mb-2">SQUAD RATING</p>
        <MonoRow label="overall" value={r.overall} color="text-amber-400" />
        <MonoRow label="attack" value={r.attack} color="text-red-400" />
        <MonoRow label="midfield" value={r.midfield} color="text-emerald-400" />
        <MonoRow label="defense" value={r.defense} color="text-blue-400" />
        <MonoRow label="chem_mult" value={r.breakdown.chemistryMultiplier.toFixed(4)} />
      </div>

      {/* Players na seleção */}
      <div className="border-t border-[#1a2620] pt-3">
        <p className="text-[9px] text-muted font-mono mb-2">PLAYERS ({players.length})</p>
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {players.map((p, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span className="text-muted text-[8px] font-mono w-4">{i}</span>
              <span className="text-[9px] font-mono text-parchment truncate flex-1">{p.name}</span>
              <span className="text-[8px] font-mono text-yellow-600">{p.nationality}</span>
              <span className="text-[8px] font-mono text-blue-400">{p.era}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Links de quíca top */}
      {c.links.length > 0 && (
        <div className="border-t border-[#1a2620] pt-3 mt-3">
          <p className="text-[9px] text-muted font-mono mb-2">TOP LINKS</p>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            {[...c.links]
              .filter((l) => l.total > 0)
              .sort((a, b) => b.total - a.total)
              .slice(0, 10)
              .map((link, i) => {
                const pA =
                  players.find((p) => p.userCardId === link.playerAId)?.name ??
                  link.playerAId.slice(0, 8);
                const pB =
                  players.find((p) => p.userCardId === link.playerBId)?.name ??
                  link.playerBId.slice(0, 8);
                return (
                  <div key={i} className="flex items-center gap-1 text-[8px] font-mono">
                    <span className="text-emerald-400 font-bold">+{link.total}</span>
                    <span className="text-parchment truncate">{pA}</span>
                    <span className="text-muted">↔</span>
                    <span className="text-parchment truncate">{pB}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </DebugPanel>
  );
}
