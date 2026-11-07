/**
 * UNICO punto di configurazione del brand. Nome, logo e palette sono segnaposto:
 * cambia qui il nome; la palette sta in src/index.css.
 */
export const APP_CONFIG = {
  name: 'A.T.L.A.S',
  tagline: 'Sai sempre quanto sei pronto. Insegni sapendo cosa serve.',
  tenantName: 'Università Demo',
  /** Data "oggi" della demo: fissa per rendere la demo sempre uguale. */
  demoToday: '2026-11-07',
  dataSource: (import.meta.env.VITE_DATA_SOURCE ?? 'mock') as 'mock' | 'supabase',
} as const;

/** Soglie delle fasce di mastery (vedi CLAUDE.md §2). */
export const BANDS = {
  gapMax: 40, // 0-39 lacuna
  consolidatingMax: 70, // 40-69 in consolidamento, 70-100 padroneggiato
  minConfidence: 0.35, // sotto = da verificare
} as const;
