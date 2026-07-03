import type { MatchDisplay, MatchOpponent } from '@/lib/match-data';

type Props = {
  result: MatchDisplay;
  opponent: MatchOpponent;
};

const OUTCOME = {
  home: {
    label: 'VITÓRIA',
    emoji: '🏆',
    bg: 'from-emerald-950/80 to-obsidian',
    border: 'border-emerald-800',
    color: 'text-emerald-400',
  },
  draw: {
    label: 'EMPATE',
    emoji: '⚖️',
    bg: 'from-yellow-950/80 to-obsidian',
    border: 'border-yellow-800',
    color: 'text-yellow-400',
  },
  away: {
    label: 'DERROTA',
    emoji: '💔',
    bg: 'from-red-950/80    to-obsidian',
    border: 'border-red-800',
    color: 'text-red-400',
  },
};

export function ScoreBoard({ result, opponent }: Props) {
  const oc = OUTCOME[result.winner];

  return (
    <div className={`bg-gradient-to-br ${oc.bg} border ${oc.border} rounded-2xl p-6 text-center`}>
      {/* Resultado */}
      <p className={`font-display text-2xl tracking-[0.2em] ${oc.color}`}>
        {oc.emoji} {oc.label}
      </p>

      {/* Placar */}
      <div className="flex items-center justify-center gap-6 mt-4 mb-4">
        <TeamScore name="🇧🇷 Seleção BR" score={result.homeScore} primary />
        <span className="font-display text-4xl text-muted">×</span>
        <TeamScore name={`${opponent.flag} ${opponent.name}`} score={result.awayScore} />
      </div>

      {/* Metadados */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted flex-wrap">
        <MetaTag icon="🌤" value={result.weather} />
        <MetaTag icon="⚖️" value={result.referee} />
        {result.mvp && <MetaTag icon="⭐" value={`MVP: ${result.mvp.displayName}`} highlight />}
      </div>
    </div>
  );
}

function TeamScore({ name, score, primary }: { name: string; score: number; primary?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-xs font-semibold mb-1 ${primary ? 'text-gold' : 'text-parchment'}`}>
        {name}
      </p>
      <span
        className={`font-display text-7xl leading-none ${primary ? 'gold-text' : 'text-parchment'}`}
      >
        {score}
      </span>
    </div>
  );
}

function MetaTag({ icon, value, highlight }: { icon: string; value: string; highlight?: boolean }) {
  return (
    <span
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10
                      ${highlight ? 'text-gold border-gold/30' : ''}`}
    >
      <span>{icon}</span>
      <span>{value}</span>
    </span>
  );
}
