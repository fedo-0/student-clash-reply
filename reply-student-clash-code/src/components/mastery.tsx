import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BAND_LABEL, type Band } from '@/lib/mastery';
import { cn, fmt } from '@/lib/utils';

export const BAND_BG: Record<Band, string> = {
  gap: 'bg-band-gap',
  consolidating: 'bg-band-consolidating',
  mastered: 'bg-band-mastered',
  unverified: 'bg-band-unverified',
};
export const BAND_TEXT: Record<Band, string> = {
  gap: 'text-band-gap',
  consolidating: 'text-band-consolidating',
  mastered: 'text-band-mastered',
  unverified: 'text-muted-foreground',
};
/** Colori per Recharts (leggono le variabili CSS del tema). */
export const BAND_FILL: Record<Band, string> = {
  gap: 'hsl(var(--band-gap))',
  consolidating: 'hsl(var(--band-consolidating))',
  mastered: 'hsl(var(--band-mastered))',
  unverified: 'hsl(var(--band-unverified))',
};

export function BandBadge({ band, className }: { band: Band; className?: string }) {
  return <Badge variant={band} className={className}>{BAND_LABEL[band]}</Badge>;
}

export function BandLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground', className)}>
      {(['gap', 'consolidating', 'mastered', 'unverified'] as Band[]).map((b) => (
        <span key={b} className="flex items-center gap-1.5">
          <span className={cn('h-2.5 w-2.5 rounded-sm', BAND_BG[b])} />
          {BAND_LABEL[b]}
        </span>
      ))}
    </div>
  );
}

export function MasteryBar({ score, band, className }: { score: number; band: Band; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}>
      <div className={cn('h-full rounded-full transition-all', BAND_BG[band], band === 'unverified' && 'opacity-60')} style={{ width: `${Math.max(2, score)}%` }} />
    </div>
  );
}

export function readinessBand(r: number): Band {
  return r < 40 ? 'gap' : r < 70 ? 'consolidating' : 'mastered';
}

export function ReadinessRing({ value, size = 88, stroke = 9, label = 'pronto' }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const band = readinessBand(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-secondary" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeLinecap="round"
          className={cn('fill-none transition-all duration-700', band === 'gap' ? 'stroke-band-gap' : band === 'consolidating' ? 'stroke-band-consolidating' : 'stroke-band-mastered')}
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums leading-none" style={{ fontSize: size / 4.4 }}>{Math.round(value)}%</span>
        {label && <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

export function TrendBadge({ delta: raw, suffix = ' pt', period }: { delta: number; suffix?: string; period?: string }) {
  const delta = Math.round(raw) || 0; // evita "-0"
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', delta > 0 ? 'text-band-mastered' : delta < 0 ? 'text-band-gap' : 'text-muted-foreground')}>
      <Icon className="h-3.5 w-3.5" />
      {delta > 0 ? '+' : ''}{fmt(delta, 0)}{suffix}{period && <span className="font-normal text-muted-foreground"> {period}</span>}
    </span>
  );
}
