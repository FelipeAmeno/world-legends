import { RARITY_VISUAL } from '@/lib/collection-data';
import type { LineupPlayer, MatchOpponent } from '@/lib/match-data';
import { computeWinProbability } from '@/lib/match-data';
import { SQUAD_RATING } from '@/lib/mock-data';
import type { RarityCode } from '@world-legends/types';

type Props = {
  opponent: MatchOpponent;
  userLineup: LineupPlayer[];
  awayLineup: LineupPlayer[];
  onPlay: () => void;
  onBack: () => void;
};

export function PreMatchView({ opponent, userLineup, awayLineup, onPlay, onBack }: Props) {
  const prob = computeWinProbability(SQUAD_RATING.overall, opponent.avgOvr);
  const userOvr = SQUAD_RATING.overall;
  const awayOvr = opponent.avgOvr;

  const diff = userOvr - awayOvr;
  const matchup =
    diff >= 5
      ? { label: '🔥 Grande favorito', color: 'text-emerald-400' }
      : diff >= 1
        ? { label: '📊 Leve favorito', color: 'text-blue-400' }
        : diff === 0
          ? { label: '⚖️ Equilíbrio total', color: 'text-yellow-400' }
          : diff >= -4
            ? { label: '⚡ Underdog', color: 'text-orange-400' }
            : { label: '💀 Enorme desafio', color: 'text-red-400' };

  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      {/* Confronto principal */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Time da casa */}
          <div className="text-center">
            <p className="text-parchment font-bold text-sm">🇧🇷 Seleção BR</p>
            <p className="font-display text-6xl gold-text mt-1">{userOvr}</p>
            <p className="text-muted text-[10px] mt-0.5">OVR · 4-3-3</p>
          </div>

          {/* VS */}
          <div className="text-center">
            <p className="font-display text-4xl text-border">VS</p>
            <p className={`text-xs mt-2 font-semibold ${matchup.color}`}>{matchup.label}</p>
          </div>

          {/* Time adversário */}
          <div className="text-center">
            <p className={`font-bold text-sm ${opponent.color}`}>
              {opponent.flag} {opponent.name}
            </p>
            <p className={`font-display text-6xl mt-1 ${opponent.color}`}>{awayOvr}</p>
            <p className="text-muted text-[10px] mt-0.5">OVR · {opponent.formation}</p>
          </div>
        </div>

        {/* Barra de probabilidade */}
        <div className="mt-5">
          <p className="text-muted text-[10px] uppercase tracking-wider text-center mb-2">
            Probabilidade
          </p>
          <div className="flex rounded-full overflow-hidden h-3">
            <div
              className="bg-emerald-600 transition-all duration-700"
              style={{ width: `${prob.home}%` }}
            />
            <div
              className="bg-yellow-600/80 transition-all duration-700"
              style={{ width: `${prob.draw}%` }}
            />
            <div
              className="bg-red-700 transition-all duration-700"
              style={{ width: `${prob.away}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] mt-1">
            <span className="text-emerald-400 font-bold">{prob.home}% vitória</span>
            <span className="text-yellow-400">{prob.draw}% empate</span>
            <span className="text-red-400">{prob.away}% derrota</span>
          </div>
        </div>
      </div>

      {/* Escalações */}
      <div className="grid grid-cols-2 gap-3">
        <LineupColumn title="Seleção BR Lendas" players={userLineup} side="home" />
        <LineupColumn
          title={opponent.name}
          players={awayLineup}
          side="away"
          color={opponent.color}
        />
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-border text-muted text-sm
                     hover:text-parchment hover:bg-white/5 transition-all"
        >
          ← Voltar
        </button>
        <button
          onClick={onPlay}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-dim to-gold
                     text-obsidian font-bold text-base hover:opacity-90 transition-all
                     shadow-gold animate-[pulseGold_2s_ease-in-out_infinite]"
        >
          ▶ JOGAR AGORA
        </button>
      </div>
    </div>
  );
}

// ─── LineupColumn ─────────────────────────────────────────────────────────────

function LineupColumn({
  title,
  players,
  side,
  color,
}: {
  title: string;
  players: LineupPlayer[];
  side: 'home' | 'away';
  color?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      <p className={`font-bold text-xs mb-3 truncate ${color ?? 'text-gold'}`}>{title}</p>
      <div className="space-y-1">
        {players.map((p, i) => {
          const rarityVisual = p.rarity ? RARITY_VISUAL[p.rarity as RarityCode] : null;
          return (
            <div
              key={i}
              className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-white/3"
            >
              <span
                className={[
                  'text-[8px] font-bold w-7 text-center shrink-0 py-0.5 rounded',
                  rarityVisual?.textClass ?? 'text-muted',
                ].join(' ')}
              >
                {p.position}
              </span>
              <span className="text-parchment text-[10px] font-medium flex-1 truncate">
                {p.name}
              </span>
              <span className="font-display text-xs gold-text shrink-0">{p.ovr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
