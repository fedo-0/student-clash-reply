/**
 * Annunci d'esame ("job posting"): il docente è l'azienda, l'esame è l'offerta, lo studente il candidato.
 * I requisiti di tipo `competence` puntano a topic (anche di altri corsi) tramite chiavi `corso.topic`:
 * le mastery su quei topic fanno da evidenza nella corrispondenza.
 */
import type { ExamFormat, ExamMaterial, ExamRequirementImportance, ExamRequirementKind } from '@/types/database';

export interface RequirementFixture {
  kind: ExamRequirementKind;
  label: string;
  description?: string;
  importance?: ExamRequirementImportance;
  weight?: number;
  topics?: string[]; // chiavi `corso.topic`
  exam_name?: string;
}

export interface ExamPostingFixture {
  course: string;
  title: string;
  about: string;
  level: 'base' | 'intermediate' | 'advanced';
  format: ExamFormat;
  learning_outcomes: string[];
  requirements: RequirementFixture[];
  materials: Omit<ExamMaterial, 'id'>[];
  published_at: string;
}

export const EXAM_POSTINGS: ExamPostingFixture[] = [
  {
    course: 'ro',
    title: 'Ricerca Operativa – scritto + orale',
    about:
      "Cerchiamo studenti capaci di trasformare un problema decisionale reale in un modello matematico e di risolverlo. Lo scritto contiene 5 esercizi (modellazione, simplesso, dualità, PLI, reti); all'orale si discute lo scritto e l'interpretazione economica dei risultati.",
    level: 'intermediate',
    format: { type: 'written_oral', duration_min: 150, allowed_materials: 'Calcolatrice non programmabile', grading: '5 esercizi per 30 punti; orale facoltativo ±3 punti' },
    learning_outcomes: [
      'Formulare un problema decisionale come modello di programmazione lineare o intera',
      'Applicare il metodo del simplesso e interpretare il tableau ottimo',
      'Costruire il duale e usarlo per l’analisi economica (prezzi ombra)',
      'Risolvere problemi di cammino minimo e di flusso su reti',
    ],
    requirements: [
      { kind: 'competence', label: 'Modellazione di problemi di PL', weight: 0.15, topics: ['ro.modellazione'] },
      { kind: 'competence', label: 'Metodo del simplesso', weight: 0.2, topics: ['ro.simplesso'] },
      { kind: 'competence', label: 'Teoria della dualità e scarti complementari', weight: 0.2, topics: ['ro.dualita'] },
      { kind: 'competence', label: 'Analisi di sensitività e prezzi ombra', weight: 0.1, topics: ['ro.sensitivita'] },
      { kind: 'competence', label: 'Programmazione lineare intera e branch and bound', weight: 0.15, topics: ['ro.pli'] },
      { kind: 'competence', label: 'Ottimizzazione su grafi e reti', weight: 0.2, topics: ['ro.grafi', 'ro.flussi'] },
      { kind: 'skill', label: 'Algebra lineare', description: 'Matrici, basi, sistemi lineari', importance: 'required' },
      { kind: 'tool', label: 'Excel', description: 'Solver di Excel per verificare i modelli', importance: 'nice_to_have' },
      { kind: 'tool', label: 'Python', description: 'Librerie di ottimizzazione (es. PuLP) per il progetto facoltativo', importance: 'nice_to_have' },
      { kind: 'prerequisite', label: 'Analisi Matematica I', exam_name: 'Analisi Matematica I', importance: 'required' },
      { kind: 'prerequisite', label: 'Geometria e Algebra Lineare', exam_name: 'Geometria e Algebra Lineare', importance: 'required' },
    ],
    materials: [
      { kind: 'past_exam', title: 'Prova scritta – 12 giugno 2025', date: '2025-06-12', pages: 4 },
      { kind: 'solutions', title: 'Soluzioni – 12 giugno 2025', date: '2025-06-12', pages: 6 },
      { kind: 'past_exam', title: 'Prova scritta – 15 settembre 2025', date: '2025-09-15', pages: 4 },
      { kind: 'mockup', title: 'Simulazione d’esame – dicembre 2026', date: '2026-11-02', pages: 3 },
    ],
    published_at: '2026-10-01T09:00:00Z',
  },
  {
    course: 'stat',
    title: 'Statistica – scritto',
    about:
      "L'esame verifica la capacità di usare probabilità e inferenza su dati reali: calcolo, scelta del metodo giusto e interpretazione. Prova scritta con esercizi numerici e una domanda di interpretazione di un output statistico.",
    level: 'intermediate',
    format: { type: 'written', duration_min: 120, allowed_materials: 'Calcolatrice e formulario ufficiale', grading: '4 esercizi + 1 domanda di interpretazione, 30 punti' },
    learning_outcomes: [
      'Descrivere un insieme di dati con indici e grafici',
      'Calcolare probabilità e usare le distribuzioni notevoli',
      'Costruire intervalli di confidenza e condurre test d’ipotesi',
      'Stimare e interpretare un modello di regressione lineare',
    ],
    requirements: [
      { kind: 'competence', label: 'Statistica descrittiva', weight: 0.1, topics: ['stat.descrittiva'] },
      { kind: 'competence', label: 'Calcolo delle probabilità', weight: 0.2, topics: ['stat.probabilita', 'stat.va'] },
      { kind: 'competence', label: 'Distribuzioni notevoli', weight: 0.15, topics: ['stat.distribuzioni'] },
      { kind: 'competence', label: 'Stima e intervalli di confidenza', weight: 0.2, topics: ['stat.stima'] },
      { kind: 'competence', label: "Test d'ipotesi", weight: 0.2, topics: ['stat.test'] },
      { kind: 'competence', label: 'Regressione lineare', weight: 0.15, topics: ['stat.regressione'] },
      { kind: 'tool', label: 'Excel', description: 'Analisi dati e funzioni statistiche', importance: 'nice_to_have' },
      { kind: 'tool', label: 'R', description: 'Usato nelle esercitazioni', importance: 'nice_to_have' },
      { kind: 'prerequisite', label: 'Analisi Matematica I', exam_name: 'Analisi Matematica I', importance: 'required' },
    ],
    materials: [
      { kind: 'past_exam', title: 'Prova scritta – 30 gennaio 2026', date: '2026-01-30', pages: 3 },
      { kind: 'past_exam', title: 'Prova scritta – 20 febbraio 2026', date: '2026-02-20', pages: 3 },
      { kind: 'mockup', title: 'Esercizi tipo d’esame su test e intervalli', pages: 5 },
    ],
    published_at: '2026-10-05T09:00:00Z',
  },
  {
    course: 'gp',
    title: 'Gestione dei Progetti – project work + orale',
    about:
      "L'esame simula il lavoro di un project manager: in gruppo si pianifica un progetto reale (WBS, reticolo, budget, rischi) e lo si presenta all'orale. Si cercano capacità di pianificazione, uso degli strumenti e comunicazione.",
    level: 'base',
    format: { type: 'project_oral', duration_min: 30, allowed_materials: 'Project work consegnato una settimana prima', grading: 'Project work 60%, orale 40%' },
    learning_outcomes: [
      'Scomporre un progetto in WBS e stimare durate e risorse',
      'Calcolare il cammino critico con CPM/PERT',
      'Controllare costi e avanzamento con l’Earned Value',
      'Identificare e gestire i rischi di progetto',
    ],
    requirements: [
      { kind: 'competence', label: 'WBS e pianificazione', weight: 0.25 },
      { kind: 'competence', label: 'Reticoli e cammino critico (CPM/PERT)', description: 'Basato sui cammini su grafo', weight: 0.25, topics: ['ro.grafi'] },
      { kind: 'competence', label: 'Controllo dei costi (Earned Value)', weight: 0.2 },
      { kind: 'competence', label: 'Gestione del rischio', description: 'Valutazioni di probabilità e impatto', weight: 0.15, topics: ['stat.probabilita'] },
      { kind: 'competence', label: 'Metodologie Agile e Scrum', weight: 0.15 },
      { kind: 'skill', label: 'Project management', importance: 'required' },
      { kind: 'skill', label: 'Lavoro in team e presentazione', importance: 'required' },
      { kind: 'tool', label: 'Excel', importance: 'required' },
      { kind: 'tool', label: 'MS Project', description: 'O strumento equivalente (GanttProject)', importance: 'nice_to_have' },
      { kind: 'prerequisite', label: 'Economia e Organizzazione Aziendale', exam_name: 'Economia e Organizzazione Aziendale', importance: 'required' },
    ],
    materials: [
      { kind: 'past_exam', title: 'Esempio di project work valutato 30/30 (2025)', date: '2025-06-20', pages: 18 },
      { kind: 'mockup', title: 'Traccia di project work 2027', pages: 2 },
    ],
    published_at: '2026-10-20T09:00:00Z',
  },
  {
    course: 'log',
    title: 'Logistica Industriale – scritto + caso aziendale',
    about:
      'Esame per chi vuole progettare sistemi logistici efficienti: gestione delle scorte, distribuzione e magazzini. Lo scritto contiene esercizi numerici e un caso aziendale da risolvere con modelli quantitativi.',
    level: 'advanced',
    format: { type: 'written', duration_min: 180, allowed_materials: 'Calcolatrice, PC con Excel per il caso aziendale', grading: 'Esercizi 18 punti, caso aziendale 12 punti' },
    learning_outcomes: [
      'Dimensionare politiche di gestione delle scorte (EOQ, punto di riordino)',
      'Prevedere la domanda con modelli statistici',
      'Risolvere problemi di localizzazione e di instradamento dei veicoli',
      'Progettare il layout di un magazzino',
    ],
    requirements: [
      { kind: 'competence', label: 'Gestione delle scorte (EOQ, punto di riordino)', weight: 0.2 },
      { kind: 'competence', label: 'Previsione della domanda', description: 'Regressione e serie storiche', weight: 0.2, topics: ['stat.regressione', 'stat.stima'] },
      { kind: 'competence', label: 'Routing dei veicoli e localizzazione', description: 'Modelli di programmazione lineare e intera su reti', weight: 0.3, topics: ['ro.modellazione', 'ro.pli', 'ro.grafi'] },
      { kind: 'competence', label: 'Layout e gestione del magazzino', weight: 0.15 },
      { kind: 'competence', label: 'Valutazione economica delle alternative', description: 'Costi marginali e prezzi ombra', weight: 0.15, topics: ['ro.dualita', 'ro.sensitivita'] },
      { kind: 'tool', label: 'Excel', description: 'Obbligatorio per il caso aziendale', importance: 'required' },
      { kind: 'tool', label: 'Python', importance: 'nice_to_have' },
      { kind: 'skill', label: 'Lean Manufacturing', importance: 'nice_to_have' },
      { kind: 'prerequisite', label: 'Ricerca Operativa', exam_name: 'Ricerca Operativa', importance: 'required' },
      { kind: 'prerequisite', label: 'Statistica', exam_name: 'Statistica', importance: 'nice_to_have' },
    ],
    materials: [
      { kind: 'past_exam', title: 'Prova scritta – 26 giugno 2025', date: '2025-06-26', pages: 5 },
      { kind: 'past_exam', title: 'Caso aziendale – magazzino ricambi (2025)', date: '2025-07-10', pages: 8 },
      { kind: 'mockup', title: 'Mockup del caso aziendale 2027', pages: 4 },
    ],
    published_at: '2026-10-25T09:00:00Z',
  },
  {
    course: 'imp',
    title: 'Impianti Industriali – scritto + orale',
    about:
      "L'esame richiede di dimensionare e valutare un impianto produttivo: scelta del layout, affidabilità dei macchinari, servizi e analisi economica dell'investimento. Scritto con esercizi progettuali, orale di discussione.",
    level: 'advanced',
    format: { type: 'written_oral', duration_min: 180, allowed_materials: 'Calcolatrice, tabelle tecniche fornite', grading: 'Scritto ammissione ≥ 18, orale per il voto finale' },
    learning_outcomes: [
      'Scegliere e progettare il layout di un impianto',
      'Valutare affidabilità e politiche di manutenzione',
      'Dimensionare i servizi di impianto',
      'Valutare un investimento industriale (VAN, TIR)',
    ],
    requirements: [
      { kind: 'competence', label: 'Layout e flussi produttivi', weight: 0.25 },
      { kind: 'competence', label: 'Affidabilità e manutenzione', description: 'Distribuzioni di guasto', weight: 0.25, topics: ['stat.distribuzioni', 'stat.va'] },
      { kind: 'competence', label: 'Dimensionamento dei servizi di impianto', weight: 0.25 },
      { kind: 'competence', label: 'Analisi economica degli investimenti', weight: 0.25 },
      { kind: 'tool', label: 'AutoCAD', description: 'Per le tavole di layout', importance: 'nice_to_have' },
      { kind: 'tool', label: 'Excel', importance: 'required' },
      { kind: 'skill', label: 'Lean Manufacturing', importance: 'nice_to_have' },
      { kind: 'prerequisite', label: 'Fisica Tecnica', exam_name: 'Fisica Tecnica', importance: 'required' },
      { kind: 'prerequisite', label: 'Sistemi di Produzione', exam_name: 'Sistemi di Produzione', importance: 'required' },
    ],
    materials: [
      { kind: 'past_exam', title: 'Prova scritta – 8 luglio 2025', date: '2025-07-08', pages: 4 },
      { kind: 'solutions', title: 'Soluzioni commentate – 8 luglio 2025', date: '2025-07-08', pages: 7 },
    ],
    published_at: '2026-10-28T09:00:00Z',
  },
];
