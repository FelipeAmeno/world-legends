import type { EventDisplay } from '@/lib/match-data';

type Props = { events: EventDisplay[] };

const SIDE_COLOR = {
  home: 'text-gold border-gold/40',
  away: 'text-parchment border-border',
  neutral: 'text-muted border-border/50',
};

const TYPE_LABEL: Record<string, string> = {
  kickoff: 'Início',
  half_time: 'Intervalo',
  full_time: 'Fim',
  goal: 'Gol',
  card: 'Cartão',
  injury: 'Lesão',
  substitution: 'Sub.',
  penalty: 'Pênalti',
  walkover: 'W.O.',
};

export function MatchTimeline({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="font-display text-lg text-parchment tracking-wider mb-3">TIMELINE</h3>

      <div className="space-y-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
        {events.map((ev, i) => (
          <TimelineRow key={i} event={ev} />
        ))}
      </div>
    </div>
  );
}

function TimelineRow({ event: ev }: { event: EventDisplay }) {
  const sideClass = SIDE_COLOR[ev.side];
  const isGoal = ev.type === 'goal';
  const isPhase = ev.type === 'kickoff' || ev.type === 'half_time' || ev.type === 'full_time';

  if (isPhase) {
    return (
      <div className="flex items-center gap-2 py-1.5 my-1">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-muted text-[10px] px-2 shrink-0">{ev.text}</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>
    );
  }

  return (
    <div
      className={[
        'flex items-start gap-2.5 py-1.5 px-2 rounded-lg transition-colors',
        isGoal ? 'bg-gold/5 border border-gold/20' : 'hover:bg-white/3',
      ].join(' ')}
    >
      {/* Minuto */}
      <span className="text-muted font-mono text-[10px] w-6 shrink-0 pt-0.5 text-right">
        {ev.minute}'
      </span>

      {/* Ícone */}
      <span className="text-sm shrink-0 mt-0.5">{ev.icon}</span>

      {/* Texto */}
      <span
        className={`text-[11px] leading-snug flex-1 ${isGoal ? 'font-semibold text-parchment' : 'text-muted'}`}
      >
        {ev.text}
      </span>

      {/* Tag do lado */}
      {ev.side !== 'neutral' && (
        <span
          className={`text-[8px] font-bold uppercase shrink-0 border rounded px-1 py-0.5 ${sideClass}`}
        >
          {ev.side === 'home' ? 'CASA' : 'FORA'}
        </span>
      )}
    </div>
  );
}
