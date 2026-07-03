import type { MatchDisplay, MatchOpponent } from '@/lib/match-data';
import { MatchRewards } from './MatchRewards';
import { MatchStats } from './MatchStats';
import { MatchTimeline } from './MatchTimeline';
import { ScoreBoard } from './ScoreBoard';

type Props = {
  result: MatchDisplay;
  opponent: MatchOpponent;
  onRematch: () => void;
  onBack: () => void;
};

export function MatchResultView({ result, opponent, onRematch, onBack }: Props) {
  return (
    <div className="space-y-4 animate-[slideUp_0.4s_ease-out]">
      {/* Placar principal */}
      <ScoreBoard result={result} opponent={opponent} />

      {/* Grid: timeline + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <MatchTimeline events={result.events} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <MatchStats stats={result.stats} />
        </div>
      </div>

      {/* Recompensas */}
      <MatchRewards rewards={result.rewards} mvp={result.mvp} winner={result.winner} />

      {/* Ações */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-border text-muted text-sm
                     hover:text-parchment hover:bg-white/5 transition-all"
        >
          ← Trocar adversário
        </button>
        <button
          onClick={onRematch}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-dim to-gold
                     text-obsidian font-bold text-sm hover:opacity-90 transition-all"
        >
          🔄 Revanche
        </button>
      </div>
    </div>
  );
}
