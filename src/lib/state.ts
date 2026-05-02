/**
 * State helpers. Reads content/_state.json (the source of truth maintained
 * by /log-call) and exposes derived values to components at build time.
 */
import state from '../../content/_state.json';

export interface State {
  day: number;
  totalCalls: number;
  targetCalls: number;
  totalDays: number;
  startDate: string;
  endDate: string;
  lastUpdated: string;
  byVertical: Record<string, number>;
  byCountry: Record<string, number>;
  pilotsBooked: number;
}

export function getState(): State {
  return state as State;
}

export interface Progress {
  callsComplete: number;
  callsTarget: number;
  callsPercent: number;
  dayCurrent: number;
  dayTotal: number;
  dayPercent: number;
  lastUpdated: Date;
  lastUpdatedRelative: string;
  remainingDays: number;
  pilotsBooked: number;
}

export function getProgress(): Progress {
  const s = getState();
  const lastUpdated = new Date(s.lastUpdated);
  return {
    callsComplete: s.totalCalls,
    callsTarget: s.targetCalls,
    callsPercent: Math.min(100, Math.round((s.totalCalls / s.targetCalls) * 100)),
    dayCurrent: s.day,
    dayTotal: s.totalDays,
    dayPercent: Math.min(100, Math.round((s.day / s.totalDays) * 100)),
    lastUpdated,
    lastUpdatedRelative: formatRelative(lastUpdated),
    remainingDays: Math.max(0, s.totalDays - s.day),
    pilotsBooked: s.pilotsBooked ?? 0,
  };
}

/**
 * Relative time at build start. Acceptable resolution for a daily-updating
 * lab notebook — every push triggers a rebuild, so the timestamp is fresh.
 */
export function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'moments ago';
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
    timeZoneName: 'short',
  });
}
