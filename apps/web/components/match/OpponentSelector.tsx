import type { MatchOpponent } from '@/lib/match-data';

type Props = {
  opponents: readonly MatchOpponent[];
  selected: MatchOpponent | null;
  onSelect: (o: MatchOpponent) => void;
};

const DIFF_LABEL = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };
const DIFF_COLOR = {
  easy: 'text-emerald-400 border-emerald-700/60 bg-emerald-900/20',
  medium: 'text-yellow-400  border-yellow-700/60  bg-yellow-900/20',
  hard: 'text-red-400     border-red-700/60     bg-red-900/20',
};

export function OpponentSelector({ opponents, selected, onSelect }: Props) {
  return (
    <section>
      <h2 className="font-display text-xl text-parchment tracking-wider mb-3">
        SELECIONE O ADVERSÁRIO
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {opponents.map((opp) => {
          const isSelected = selected?.id === opp.id;
          return (
            <button
              key={opp.id}
              onClick={() => onSelect(opp)}
              className={[
                'relative text-left p-4 rounded-xl border transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-card focus:outline-none',
                isSelected
                  ? 'border-gold-dim bg-[rgba(201,168,76,0.1)] shadow-gold'
                  : 'border-border bg-surface hover:border-border/80',
              ].join(' ')}
            >
              {/* Selecionado */}
              {isSelected && <span className="absolute top-2 right-2 text-gold text-xs">✓</span>}

              {/* Flag + nome */}
              <p className="text-xl mb-1">{opp.flag}</p>
              <p className={`font-semibold text-sm leading-tight ${opp.color}`}>{opp.name}</p>

              {/* OVR + formação */}
              <div className="flex items-center gap-2 mt-2">
                <span className="font-display text-2xl gold-text">{opp.avgOvr}</span>
                <div>
                  <p className="text-muted text-[9px] leading-none">OVR médio</p>
                  <p className="text-muted text-[9px]">{opp.formation}</p>
                </div>
              </div>

              {/* Dificuldade */}
              <span
                className={[
                  'inline-block mt-2 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide',
                  DIFF_COLOR[opp.difficulty],
                ].join(' ')}
              >
                {DIFF_LABEL[opp.difficulty]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
