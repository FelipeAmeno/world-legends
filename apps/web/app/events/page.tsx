import { EventsExperience } from '@/components/events/EventsExperience';
import { getEvents } from '@/lib/events/mock-events';

export default function EventsPage() {
  const events = getEvents();
  const active = events.filter((e) => {
    const now = Date.now();
    return now >= new Date(e.startsAt).getTime() && now < new Date(e.endsAt).getTime();
  });

  return (
    <div className="flex flex-col h-full">
      <div className="page-header shrink-0">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.22em] mb-1.5"
          style={{ color: '#6a7090' }}
        >
          Temporada
        </p>
        <div className="flex items-end gap-3">
          <h1 className="font-display text-4xl gold-text tracking-wider leading-none">EVENTOS</h1>
          <p className="text-muted text-xs pb-0.5">
            {active.length} ativo{active.length !== 1 ? 's' : ''} agora
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <EventsExperience events={events} />
      </div>
    </div>
  );
}
