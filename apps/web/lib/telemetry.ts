export type TelemetryEvent =
  | 'first_login'
  | 'first_pack_opened'
  | 'first_squad_saved'
  | 'first_match_won'
  | 'first_collection_complete'
  | 'first_goat_card'
  | 'first_mission_completed'
  | 'first_ranking_entered';

const STORAGE_KEY = 'wl:telemetry';

function getEmitted(): Set<TelemetryEvent> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(JSON.parse(raw ?? '[]') as TelemetryEvent[]);
  } catch {
    return new Set();
  }
}

function persist(events: Set<TelemetryEvent>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...events]));
  } catch {
    /* quota exceeded — silent fail */
  }
}

/**
 * Emits a telemetry event exactly once per device.
 * Returns true on the first emission, false if already fired.
 * Ready for future analytics integration (swap console.debug with your provider).
 */
export function emitOnce(event: TelemetryEvent, metadata?: Record<string, unknown>): boolean {
  const emitted = getEmitted();
  if (emitted.has(event)) return false;
  emitted.add(event);
  persist(emitted);
  console.debug('[WL]', event, metadata ?? '');
  return true;
}

export function hasEmitted(event: TelemetryEvent): boolean {
  return getEmitted().has(event);
}
