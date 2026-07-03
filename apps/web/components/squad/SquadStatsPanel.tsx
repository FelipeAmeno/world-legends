import type { SquadSnapshot } from '@/lib/squad-data';
import { SECTOR_COLORS } from '@/lib/squad-data';

type Props = {
  snapshot: SquadSnapshot;
};

export function SquadStatsPanel({ snapshot }: Props) {
  const { rating: r, chemistry: c } = snapshot;

  const chemColor =
    c.total >= 80
      ? 'text-emerald-400'
      : c.total >= 60
        ? 'text-blue-400'
        : c.total >= 40
          ? 'text-yellow-400'
          : 'text-muted';

  const chemBarColor =
    c.total >= 80
      ? 'from-emerald-500 to-emerald-700'
      : c.total >= 60
        ? 'from-blue-500 to-blue-700'
        : c.total >= 40
          ? 'from-yellow-500 to-yellow-700'
          : 'from-gray-600 to-gray-800';

  return (
    <>
      {/* OVR por setor */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="font-display text-base text-parchment tracking-wider mb-3">AVALIAÇÃO</h3>

        <div className="flex items-end gap-3 mb-4">
          <span className="font-display text-5xl gold-text">{r.overall || '—'}</span>
          <span className="text-muted text-sm mb-1">OVR geral</span>
        </div>

        <div className="space-y-2">
          <SectorBar label="Ataque" value={r.attack} color={SECTOR_COLORS.attack} />
          <SectorBar label="Meio" value={r.midfield} color={SECTOR_COLORS.midfield} />
          <SectorBar label="Defesa" value={r.defense} color={SECTOR_COLORS.defense} />
        </div>

        {r.overall > 0 && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Ataque" value={r.attack} />
            <MiniStat label="Meio" value={r.midfield} />
            <MiniStat label="Defesa" value={r.defense} />
          </div>
        )}
      </div>

      {/* Química */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="font-display text-base text-parchment tracking-wider mb-3">QUÍMICA</h3>

        <div className="flex items-end gap-3 mb-2">
          <span className={`font-display text-4xl ${chemColor}`}>{c.total || '—'}</span>
          {c.total > 0 && <span className="text-muted text-sm mb-1">/ 100</span>}
        </div>

        <div className="h-2 bg-obsidian rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${chemBarColor} transition-all duration-500`}
            style={{ width: `${c.total}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <ChemStat label="Nac." value={c.breakdown.nationalityLinks} color="text-amber-400" />
          <ChemStat label="Comp." value={c.breakdown.competitionLinks} color="text-blue-400" />
          <ChemStat label="Era" value={c.breakdown.eraLinks} color="text-purple-400" />
        </div>

        {c.breakdown.perfectLinks > 0 && (
          <p className="text-[10px] text-gold mt-2">
            ✨ {c.breakdown.perfectLinks} links perfeitos
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="font-display text-base text-parchment tracking-wider mb-2">INSTRUÇÕES</h3>
        <div className="space-y-1.5 text-[11px] text-muted">
          <Tip icon="🎯">Arraste cartas do pool para o campo</Tip>
          <Tip icon="🔄">Arraste entre slots para trocar jogadores</Tip>
          <Tip icon="🪑">Arraste para o banco para reservar</Tip>
          <Tip icon="✕">Clique no × para devolver ao pool</Tip>
          <Tip icon="⚡">OVR e química atualizam em tempo real</Tip>
        </div>
      </div>
    </>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function SectorBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round((value / 99) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="text-parchment font-semibold">{value || '—'}</span>
      </div>
      <div className="h-1.5 bg-obsidian rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-obsidian rounded-lg p-1.5">
      <p className="font-display text-lg text-parchment">{value || '—'}</p>
      <p className="text-muted text-[8px]">{label}</p>
    </div>
  );
}

function ChemStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-obsidian rounded-lg p-2 text-center">
      <p className={`font-display text-lg ${color}`}>{value}</p>
      <p className="text-muted text-[9px]">{label}</p>
    </div>
  );
}

function Tip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span>{icon}</span>
      <span>{children}</span>
    </div>
  );
}
