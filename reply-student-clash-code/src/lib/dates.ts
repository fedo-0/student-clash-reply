import { APP_CONFIG } from '@/config/app';

/** "Oggi" della demo è fisso (config) così i countdown sono sempre uguali. */
export const today = () => new Date(`${APP_CONFIG.demoToday}T12:00:00+01:00`);

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - today().getTime()) / 86400000);
}

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) =>
  new Date(iso).toLocaleDateString('it-IT', opts);

export const fmtCountdown = (days: number | null) =>
  days == null ? 'nessun appello' : days <= 0 ? 'oggi' : days < 14 ? `tra ${days} giorni` : `tra ${Math.round(days / 7)} settimane`;
