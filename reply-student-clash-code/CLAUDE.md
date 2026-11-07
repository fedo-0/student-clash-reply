# CLAUDE.md — Memoria di progetto

> Prototipo da hackathon (mondo universitario). Nome definitivo, logo e palette **non ancora decisi**:
> il nome segnaposto è `AppName` ed è definito **solo** in `src/config/app.ts`; il tema è in variabili
> CSS in `src/index.css` (token mappati in `tailwind.config.ts`).

## 1. Sintesi
Piattaforma educativa **bidirezionale** potenziata dall'AI che collega in tempo reale lo studio degli
studenti con la didattica dei docenti. Si affianca ai gestionali (ESSE3, Moodle), non li sostituisce:
i dati ufficiali (iscrizioni, voti, appelli) arrivano da lì; noi aggiungiamo misura della preparazione,
AI e predizione. Obiettivo: ciclo di feedback da un semestre a pochi giorni.

## 2. Modello di competenze (base dati comune)
- **Course → Topic** con `exam_weight` (0..1, somma ≈ 1 per corso) e `topic_prerequisites`.
- Ogni attività genera un **learning_event** `(student, topic, score 0-100, difficulty, weight, source)`.
  Sorgenti: `quiz | ai_grading | simulation | self_assessment | official_grade`.
- **mastery** per coppia studente×topic: `score 0-100`, `confidence 0-1`, `events_count`.
  Aggiornamento EMA: `new = old + k * weight * (score - old)`, `k = max(0.15, 1/(n+1))`
  (k decresce con il numero di eventi). Confidence = `1 - exp(-n/4)`.
  Implementato in `src/lib/mastery.ts` **e** nel trigger SQL `apply_learning_event()` (stessa formula).
- **Fasce**: 0-39 `gap` (rosso), 40-69 `consolidating` (giallo), 70-100 `mastered` (verde),
  confidence < 0.35 → `unverified` (grigio).
- **Readiness** esame = media dei mastery del corso pesata per `exam_weight` (topic non praticati = 0).
- **Affinità** = 0.6·readiness + 0.25·voti propedeutici + 0.15·skill del profilo, sempre con spiegazione
  (✅ a favore, ⚠️ topic non praticati, ❌ lacune su prerequisiti). `src/lib/affinity.ts`.
- Il docente vede **solo aggregati** di classe (distribuzioni per topic), mai il singolo studente.

## 3. Ruoli e tenancy
`student`, `teacher`, `admin` (ateneo). Multi-tenant: ogni ateneo è un tenant, ogni tabella
(tranne `tenants`) ha `tenant_id`. RLS base per tenant + proprietà sulle tabelle personali.

## 4. Feature
**Studente**: Home (prossimi esami, readiness, media vs obiettivo, "Oggi ti consiglio", opportunità,
gruppo) · Profilo competenze (libretto, CV+skill AI, progetti, radar) · Affinità esame "alla LinkedIn"
con CTA "Colma con il tutor"/"Fai un quiz" · Tutor AI (RAG con citazioni; libera, guidata su lacuna,
interrogazione orale) · Simulatore roleplay (persona, fatti nascosti, rubrica, report) · Libretto
boostato (media ponderata/aritmetica, base di laurea, obiettivo, slider what-if) · Opportunità filtrate.
**Docente**: Home corsi · Overview classe (heatmap topic×fasce, istogramma readiness, trend,
engagement) · Checkpoint + suggerimenti AI · Generatore quiz da PDF stile NotebookLM · Predizione voti
(logistica mastery−difficoltà + Monte Carlo; **i numeri li calcola il codice, l'LLM spiega**) · FAQ
(cluster di domande anonime + risposta ufficiale).
**Ponte**: matchmaking gruppi di studio (greedy su complementarità, gruppi 3-5, disponibilità) ·
loop di feedback quiz→mastery→mappa docente, domande→FAQ→risposta ufficiale→tutor.

## 5. Vincoli del prototipo
- Demo navigabile prima di tutto. Niente GDPR/AI Act/SSO/mobile/integrazioni ESSE3-Moodle reali.
- **Dati mock** in memoria, deterministici (seed fisso `20261107`), dietro `src/data/api.ts`.
  `VITE_DATA_SOURCE=mock|supabase` seleziona l'implementazione (supabase = stub da completare).
- **AI mock** dietro `src/ai/client.ts` (ritardo simulato, streaming finto). In futuro → Supabase
  Edge Functions. **Nessuna chiave API nel frontend.**
- **Calcoli deterministici veri** come funzioni pure in `src/lib/` (mastery, readiness, affinità,
  libretto, Monte Carlo, matchmaking). Mai mockarli.
- Login demo senza password (scelta utente), utente corrente in `AuthContext`.

## 6. Stack
React 18 + Vite + TypeScript · React Router 6 · Tailwind 3 + componenti stile shadcn/ui
(in `src/components/ui`, scritti a mano, Radix sotto) · Recharts · TanStack Query · lucide-react.
Backend futuro: Supabase (Postgres + pgvector, Auth, Storage, Edge Functions). Schema in
`supabase/schema.sql`, tipi coerenti in `src/types/database.ts` (i mock li usano).

## 7. Struttura
```
supabase/schema.sql        schema completo (idempotente), RLS, trigger mastery, viste docente
src/config/app.ts          nome app, tagline, soglie fasce  ← UNICO punto per il nome
src/index.css              token del tema (variabili CSS, light/dark)
src/types/database.ts      tipi riga DB (snake_case, come lo schema)
src/types/domain.ts        tipi derivati per la UI (readiness, affinità, ...)
src/lib/                   funzioni pure: mastery, readiness, affinity, grades, prediction,
                           matchmaking, random (PRNG seed), utils (cn)
src/data/api.ts            interfaccia DataApi + selezione implementazione
src/data/mock/             generatore dati deterministico + implementazione mock
src/data/supabase/         stub implementazione Supabase
src/data/hooks.ts          hook TanStack Query sopra l'api
src/ai/client.ts           interfaccia AiClient + mock (chat stream, generateQuiz, gradeAnswer,
                           explainPrediction, clusterQuestions, recommendations, ...)
src/app/                   router, AuthContext, layout con sidebar per ruolo
src/components/ui/         primitive shadcn-like
src/components/            componenti di dominio (MasteryBadge, ReadinessRing, ...)
src/pages/student|teacher  pagine
```

## 8. Convenzioni
- UI e testi in **italiano**; codice, nomi tabelle/campi in **inglese**. DB in snake_case.
- Colori sempre via token (`bg-primary`, `text-band-gap`, ...), mai hex nelle pagine.
- Le pagine leggono dati solo tramite gli hook in `src/data/hooks.ts`, l'AI solo tramite `ai`.
- Nuove logiche numeriche → `src/lib/` come funzioni pure, testabili.
- Comandi: `npm install`, `npm run dev` (http://localhost:5173), `npm run build`, `npm run typecheck`.

## 9. Gotcha noti
- Negli `useEffect` usare sempre le graffe: in Chromium recente `scrollIntoView()` restituisce una Promise
  e un'arrow function senza graffe la ritorna come cleanup → crash "destroy is not a function".
- `vite.config.ts` pre-bundla tutte le dipendenze (`optimizeDeps.entries`): senza, il re-bundling a runtime
  può caricare due copie di React. Se succede: `rm -rf node_modules/.vite` e riavvia.
- Modificare i file mock con il dev server attivo può rompere l'HMR del context (errore "useAuth fuori da
  AuthProvider"): basta ricaricare la pagina.
- "Oggi" della demo è fisso: `APP_CONFIG.demoToday` = 2026-11-07 (in `src/config/app.ts`).

## 10. Storia demo (dati mock)
Giulia Ferri (Ing. Gestionale, 3° anno): media 26,41 → 96,8/110, obiettivo 27,5. Ricerca Operativa
il 12/12 (tra 5 settimane), readiness ~58%, lacuna Dualità (23/100), PLI da verificare, Flussi non praticato.
Classe RO: 22 studenti, ~59% in rosso su Dualità, domanda 4 del quiz sbagliata dal 61%.
Predizione scritto 12/12: media ~18,8, ~57% promossi, esercizi critici su Dualità e PLI.
Loop live: rispondere al "Quiz settimana 3 – Dualità" alza la readiness (58% → 67% con 4 risposte giuste).

## 11. Stato
- [x] Passo 0 CLAUDE.md · [x] Passo 1 schema SQL + tipi · [x] Passo 2 setup + mock · [x] Passo 3 shell + schermate core
- Schermate complete: Studente Home, Dettaglio esame (readiness+affinità), Libretto; Docente Home, Overview classe.
- Schermate impostate ma semplificate: tutor, roleplay, profilo, opportunità, gruppo, quiz, checkpoint,
  generatore quiz, predizione, FAQ.
