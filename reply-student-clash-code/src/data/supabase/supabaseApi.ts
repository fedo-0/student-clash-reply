/**
 * Implementazione Supabase — STUB.
 * Quando il backend sarà pronto:
 *   1. npm i @supabase/supabase-js
 *   2. creare il client con VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (mai la service_role!)
 *   3. implementare i metodi leggendo tabelle e viste (v_course_topic_mastery, v_course_readiness)
 *      e riusando le funzioni pure di src/lib per i calcoli derivati.
 * I metodi AI passano da Edge Functions (vedi src/ai/client.ts).
 */
import type { DataApi } from '../api';

export function createSupabaseApi(): DataApi {
  const notImplemented = (name: string) => () => {
    throw new Error(`[supabase] ${name} non ancora implementato: usa VITE_DATA_SOURCE=mock`);
  };
  return new Proxy({} as DataApi, {
    get: (_t, prop: string) => notImplemented(prop),
  });
}
