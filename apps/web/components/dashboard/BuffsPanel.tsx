import type { CollectionCard } from '@/lib/collection-data';
import { getEvolutionTag } from '@world-legends/card-evolution';
import { contractStatus } from '@world-legends/contracts';
import { DebugPanel, MonoRow } from './DebugPanel';

type Props = { cards: CollectionCard[] };

const CONTRACT_COLOR: Record<string, string> = {
  active: 'text-emerald-400',
  low: 'text-yellow-400',
  expired: 'text-red-400',
};

export function BuffsPanel({ cards }: Props) {
  // Calcular estados derivados
  const contractStates = cards.map((c) => ({
    name: c.displayName,
    overall: c.overall,
    contracts: c.contracts ?? 10,
    status: contractStatus(c.contracts ?? 10),
    evo: c.evolution ?? 0,
    evoTag: getEvolutionTag(c.evolution ?? 0),
    rarity: c.rarityCode,
  }));

  const expiredCount = contractStates.filter((s) => s.status === 'expired').length;
  const lowCount = contractStates.filter((s) => s.status === 'low').length;
  const evoCount = contractStates.filter((s) => s.evo > 0).length;
  const maxEvo = Math.max(...contractStates.map((s) => s.evo));

  return (
    <DebugPanel
      title="BUFFS & STATE"
      tag={`${cards.length} cards`}
      status={expiredCount > 0 ? `${expiredCount} EXPIRED` : 'ALL ACTIVE'}
      statusOk={expiredCount === 0}
      mono
    >
      {/* Sumário */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <SumCard label="contratos expirados" value={expiredCount} bad={expiredCount > 0} />
        <SumCard label="contratos baixos" value={lowCount} bad={lowCount > 0} />
        <SumCard label="cartas evoluídas" value={evoCount} bad={false} />
        <SumCard label="evolução máxima" value={maxEvo} bad={false} />
      </div>

      {/* Tabela de estado por carta */}
      <p className="text-[9px] text-muted mb-2">CARD STATE MATRIX</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[8px] font-mono">
          <thead>
            <tr className="text-muted border-b border-[#1a2620]">
              <th className="text-left pb-1">CARD</th>
              <th className="text-center pb-1">OVR</th>
              <th className="text-center pb-1">CON</th>
              <th className="text-center pb-1">EVO</th>
              <th className="text-center pb-1">FAT</th>
            </tr>
          </thead>
          <tbody>
            {contractStates
              .sort((a, b) => b.overall - a.overall)
              .map((s, i) => (
                <tr key={i} className="border-b border-[#1a2620]/50 hover:bg-white/[0.02]">
                  <td className="py-0.5 text-parchment max-w-[90px] truncate">{s.name}</td>
                  <td className="py-0.5 text-center text-amber-400">{s.overall}</td>
                  <td className={`py-0.5 text-center ${CONTRACT_COLOR[s.status]}`}>
                    {s.contracts}
                  </td>
                  <td className="py-0.5 text-center text-gold">{s.evo > 0 ? s.evoTag : '—'}</td>
                  {/* Fadiga: sempre fresh (sem estado persistente) */}
                  <td className="py-0.5 text-center text-emerald-400/60">1.00</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="mt-3 pt-2 border-t border-[#1a2620] grid grid-cols-3 gap-1 text-[8px] font-mono">
        <span className="text-muted">CON = contratos</span>
        <span className="text-muted">EVO = nível evolução</span>
        <span className="text-muted">FAT = performance</span>
      </div>
    </DebugPanel>
  );
}

function SumCard({ label, value, bad }: { label: string; value: number; bad: boolean }) {
  return (
    <div className="bg-[#060c08] border border-[#1a2620] rounded p-2">
      <p
        className={`font-mono text-lg font-bold ${bad && value > 0 ? 'text-red-400' : 'text-emerald-400'}`}
      >
        {value}
      </p>
      <p className="text-[8px] text-muted font-mono">{label}</p>
    </div>
  );
}
