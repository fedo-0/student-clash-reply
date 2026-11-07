import { APP_CONFIG } from '@/config/app';
import { cn } from '@/lib/utils';

/** Logo segnaposto: sostituire quando il brand sarà deciso. */
export function Logo({ className, size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex items-center justify-center rounded-lg bg-primary text-primary-foreground', size === 'lg' ? 'h-11 w-11' : 'h-8 w-8')}>
        <svg viewBox="0 0 32 32" className={size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 22l8-13 8 13" />
        </svg>
      </div>
      <span className={cn('font-semibold tracking-tight', size === 'lg' ? 'text-2xl' : 'text-lg')}>{APP_CONFIG.name}</span>
    </div>
  );
}
