/**
 * Definizioni statiche della storia demo (nomi, corsi, topic, libretto di Giulia, ...).
 * La parte "statistica" (learning events, mastery) è in generate.ts, con seed fisso.
 */

export const TENANT = { slug: 'unidemo', name: 'Università Demo' };

export const GIULIA_KEY = 'giulia';
export const ROSSI_KEY = 'rossi';
export const BIANCHI_KEY = 'bianchi';

export const TEACHERS = [
  { key: ROSSI_KEY, full_name: 'Prof. Marco Rossi', email: 'marco.rossi@unidemo.it', department: 'Dipartimento di Ingegneria' },
  { key: BIANCHI_KEY, full_name: 'Prof.ssa Laura Bianchi', email: 'laura.bianchi@unidemo.it', department: 'Dipartimento di Medicina Clinica' },
];

const ING_NAMES = [
  'Giulia Ferri', 'Luca Moretti', 'Sara Colombo', 'Matteo Ricci', 'Chiara Galli', 'Alessandro Conti',
  'Francesca Marino', 'Davide Greco', 'Martina Bruno', 'Andrea Costa', 'Elisa Fontana', 'Simone Rinaldi',
  'Valentina Caruso', 'Federico Mancini', 'Alice Lombardi', 'Lorenzo Barbieri', 'Giorgia Santoro',
  'Riccardo Vitale', 'Beatrice Leone', 'Tommaso Longo', 'Sofia De Luca', 'Pietro Serra',
];
const MED_NAMES = [
  'Anna Ferraro', 'Marco Testa', 'Ilaria Pellegrini', 'Gabriele Fabbri', 'Noemi Marchetti',
  'Edoardo Bianco', 'Camilla Gentile', 'Nicolò Villa', 'Aurora Cattaneo',
];

export const STUDENTS = [
  ...ING_NAMES.map((full_name, i) => ({
    key: i === 0 ? GIULIA_KEY : `ing-${i}`,
    full_name,
    degree_program: 'Ingegneria Gestionale',
    year: i === 0 ? 3 : 2 + (i % 2),
    external_id: `S${(318200 + i * 37).toString()}`,
  })),
  ...MED_NAMES.map((full_name, i) => ({
    key: `med-${i}`,
    full_name,
    degree_program: 'Medicina e Chirurgia',
    year: 3,
    external_id: `M${(402100 + i * 41).toString()}`,
  })),
];

export interface TopicDef {
  key: string;
  name: string;
  weight: number;
  module: string;
  description: string;
  /** settimana (0..5) in cui il topic viene introdotto a lezione */
  startWeek: number;
  /** offset di difficoltà per la classe (negativo = più difficile) */
  classOffset: number;
  prereqs?: string[];
}

export interface CourseDef {
  key: string;
  code: string;
  name: string;
  degree_program: string;
  cfu: number;
  year: number;
  semester: number;
  description: string;
  teacher: string;
  studentsFilter: 'ing' | 'med' | 'none';
  examDate: string | null; // appello
  relevantSkills: string[];
  prerequisiteCourses: string[];
  topics: TopicDef[];
}

export const COURSES: CourseDef[] = [
  {
    key: 'ro',
    code: 'ING-RO',
    name: 'Ricerca Operativa',
    degree_program: 'Ingegneria Gestionale',
    cfu: 9,
    year: 3,
    semester: 1,
    description: 'Modelli e algoritmi di ottimizzazione: programmazione lineare e intera, dualità, ottimizzazione su reti.',
    teacher: ROSSI_KEY,
    studentsFilter: 'ing',
    examDate: '2026-12-12T09:00:00+01:00',
    relevantSkills: ['Python', 'Excel', 'Modellazione matematica', 'Algebra lineare'],
    prerequisiteCourses: ['an1', 'gal'],
    topics: [
      { key: 'modellazione', name: 'Modellazione PL', weight: 0.15, module: 'Modulo 1 – Programmazione lineare', description: 'Formulare problemi decisionali come modelli di programmazione lineare.', startWeek: 0, classOffset: 8 },
      { key: 'simplesso', name: 'Metodo del Simplesso', weight: 0.2, module: 'Modulo 1 – Programmazione lineare', description: 'Forma standard, basi, tableau, scelta di variabile entrante e uscente.', startWeek: 1, classOffset: 2, prereqs: ['modellazione'] },
      { key: 'dualita', name: 'Dualità', weight: 0.2, module: 'Modulo 2 – Dualità e sensitività', description: 'Costruzione del duale, teoremi di dualità debole/forte, scarti complementari.', startWeek: 2, classOffset: -24, prereqs: ['simplesso'] },
      { key: 'sensitivita', name: 'Analisi di sensitività', weight: 0.1, module: 'Modulo 2 – Dualità e sensitività', description: 'Prezzi ombra, intervalli di ottimalità, variazione dei termini noti.', startWeek: 3, classOffset: -12, prereqs: ['dualita'] },
      { key: 'pli', name: 'Programmazione Lineare Intera', weight: 0.15, module: 'Modulo 3 – PLI e reti', description: 'Rilassamento continuo, branch and bound, piani di taglio.', startWeek: 4, classOffset: -4, prereqs: ['simplesso'] },
      { key: 'grafi', name: 'Grafi e cammini minimi', weight: 0.1, module: 'Modulo 3 – PLI e reti', description: 'Definizioni, visite, Dijkstra e Bellman-Ford.', startWeek: 4, classOffset: 6 },
      { key: 'flussi', name: 'Flussi su reti', weight: 0.1, module: 'Modulo 3 – PLI e reti', description: 'Flusso massimo, taglio minimo, flusso di costo minimo.', startWeek: 5, classOffset: -2, prereqs: ['grafi'] },
    ],
  },
  {
    key: 'stat',
    code: 'ING-STAT',
    name: 'Statistica',
    degree_program: 'Ingegneria Gestionale',
    cfu: 6,
    year: 3,
    semester: 1,
    description: 'Probabilità, variabili aleatorie, inferenza statistica e regressione.',
    teacher: ROSSI_KEY,
    studentsFilter: 'ing',
    examDate: '2027-01-20T14:00:00+01:00',
    relevantSkills: ['Python', 'Excel', 'R'],
    prerequisiteCourses: ['an1'],
    topics: [
      { key: 'descrittiva', name: 'Statistica descrittiva', weight: 0.1, module: 'Modulo 1 – Probabilità', description: 'Indici di posizione e dispersione, grafici.', startWeek: 0, classOffset: 12 },
      { key: 'probabilita', name: 'Probabilità', weight: 0.2, module: 'Modulo 1 – Probabilità', description: 'Assiomi, probabilità condizionata, Bayes.', startWeek: 0, classOffset: 0 },
      { key: 'va', name: 'Variabili aleatorie', weight: 0.15, module: 'Modulo 1 – Probabilità', description: 'Discrete e continue, valore atteso, varianza.', startWeek: 1, classOffset: -4, prereqs: ['probabilita'] },
      { key: 'distribuzioni', name: 'Distribuzioni notevoli', weight: 0.15, module: 'Modulo 2 – Inferenza', description: 'Binomiale, Poisson, normale, esponenziale.', startWeek: 2, classOffset: 2, prereqs: ['va'] },
      { key: 'stima', name: 'Stima e intervalli di confidenza', weight: 0.15, module: 'Modulo 2 – Inferenza', description: 'Stimatori, intervalli per media e proporzione.', startWeek: 3, classOffset: -6, prereqs: ['distribuzioni'] },
      { key: 'test', name: "Test d'ipotesi", weight: 0.15, module: 'Modulo 2 – Inferenza', description: 'Ipotesi nulla, p-value, errori di I e II tipo.', startWeek: 4, classOffset: -10, prereqs: ['stima'] },
      { key: 'regressione', name: 'Regressione lineare', weight: 0.1, module: 'Modulo 3 – Modelli', description: 'Minimi quadrati, R², interpretazione dei coefficienti.', startWeek: 5, classOffset: 0 },
    ],
  },
  {
    key: 'sem',
    code: 'MED-SEM',
    name: 'Semeiotica Medica',
    degree_program: 'Medicina e Chirurgia',
    cfu: 8,
    year: 3,
    semester: 1,
    description: "Metodologia clinica: anamnesi ed esame obiettivo per apparati.",
    teacher: BIANCHI_KEY,
    studentsFilter: 'med',
    examDate: '2026-12-18T09:00:00+01:00',
    relevantSkills: ['Comunicazione', 'Anatomia', 'Fisiologia'],
    prerequisiteCourses: [],
    topics: [
      { key: 'anamnesi', name: 'Anamnesi', weight: 0.2, module: 'Modulo 1 – Metodologia', description: 'Raccolta strutturata della storia clinica.', startWeek: 0, classOffset: 10 },
      { key: 'eog', name: 'Esame obiettivo generale', weight: 0.15, module: 'Modulo 1 – Metodologia', description: 'Ispezione, palpazione, percussione, auscultazione.', startWeek: 1, classOffset: 4 },
      { key: 'cardio', name: 'Semeiotica cardiovascolare', weight: 0.2, module: 'Modulo 2 – Apparati', description: 'Toni, soffi, polsi, pressione arteriosa.', startWeek: 2, classOffset: -14 },
      { key: 'respiratoria', name: 'Semeiotica respiratoria', weight: 0.15, module: 'Modulo 2 – Apparati', description: 'Murmure vescicolare, rumori aggiunti, FVT.', startWeek: 3, classOffset: -2 },
      { key: 'addome', name: 'Semeiotica addominale', weight: 0.15, module: 'Modulo 2 – Apparati', description: 'Segni peritoneali, organomegalie, manovre.', startWeek: 4, classOffset: 0 },
      { key: 'neuro', name: 'Semeiotica neurologica', weight: 0.15, module: 'Modulo 3 – Neurologia', description: 'Riflessi, nervi cranici, coordinazione.', startWeek: 5, classOffset: -6 },
    ],
  },
  // Corsi già conclusi (servono come propedeutici, senza topic)
  { key: 'an1', code: 'ING-AN1', name: 'Analisi Matematica I', degree_program: 'Ingegneria Gestionale', cfu: 12, year: 1, semester: 1, description: 'Limiti, derivate, integrali.', teacher: ROSSI_KEY, studentsFilter: 'none', examDate: null, relevantSkills: [], prerequisiteCourses: [], topics: [] },
  { key: 'gal', code: 'ING-GAL', name: 'Geometria e Algebra Lineare', degree_program: 'Ingegneria Gestionale', cfu: 9, year: 1, semester: 2, description: 'Spazi vettoriali, matrici, sistemi lineari.', teacher: ROSSI_KEY, studentsFilter: 'none', examDate: null, relevantSkills: [], prerequisiteCourses: [], topics: [] },
];

/** Libretto di Giulia: media ponderata 26,41 → 96,8/110 di partenza. */
export const GIULIA_RECORDS: { name: string; cfu: number; grade: number | null; honors?: boolean; date: string | null; courseKey?: string }[] = [
  { name: 'Analisi Matematica I', cfu: 12, grade: 25, date: '2024-02-12', courseKey: 'an1' },
  { name: 'Geometria e Algebra Lineare', cfu: 9, grade: 27, date: '2024-06-24', courseKey: 'gal' },
  { name: 'Fisica Generale', cfu: 12, grade: 24, date: '2024-07-15' },
  { name: 'Fondamenti di Informatica', cfu: 9, grade: 30, honors: true, date: '2024-02-26' },
  { name: 'Chimica', cfu: 6, grade: 26, date: '2024-09-16' },
  { name: 'Lingua Inglese B2', cfu: 3, grade: null, date: '2024-05-10' },
  { name: 'Economia e Organizzazione Aziendale', cfu: 9, grade: 28, date: '2025-02-10' },
  { name: 'Analisi Matematica II', cfu: 9, grade: 25, date: '2025-02-24' },
  { name: 'Fisica Tecnica', cfu: 6, grade: 26, date: '2025-06-30' },
  { name: 'Elettrotecnica', cfu: 9, grade: 24, date: '2025-07-14' },
  { name: 'Sistemi di Produzione', cfu: 9, grade: 28, date: '2026-01-26' },
  { name: 'Basi di Dati', cfu: 6, grade: 29, date: '2026-02-16' },
  { name: "Economia Applicata all'Ingegneria", cfu: 6, grade: 27, date: '2026-07-06' },
  // Da sostenere
  { name: 'Ricerca Operativa', cfu: 9, grade: null, date: null, courseKey: 'ro' },
  { name: 'Statistica', cfu: 6, grade: null, date: null, courseKey: 'stat' },
  { name: 'Impianti Industriali', cfu: 9, grade: null, date: null },
  { name: 'Gestione dei Progetti', cfu: 6, grade: null, date: null },
  { name: 'Logistica Industriale', cfu: 6, grade: null, date: null },
];

export const GIULIA_SKILLS = [
  { name: 'Excel', level: 4, source: 'cv_ai' as const },
  { name: 'Python', level: 3, source: 'cv_ai' as const },
  { name: 'SQL', level: 4, source: 'cv_ai' as const },
  { name: 'Lean Manufacturing', level: 2, source: 'project' as const },
  { name: 'Project management', level: 3, source: 'manual' as const },
  { name: 'Algebra lineare', level: 4, source: 'manual' as const },
  { name: 'Inglese B2', level: 4, source: 'cv_ai' as const },
];

export const GIULIA_PROJECTS = [
  { title: 'Ottimizzazione magazzino – progetto Sistemi di Produzione', description: 'Analisi ABC e layout del magazzino di un\'azienda di componentistica, con simulazione in Excel.', skills: ['Excel', 'Lean Manufacturing'] },
  { title: 'Dashboard vendite con SQL e Python', description: 'Pipeline dati da database relazionale a dashboard interattiva per il corso di Basi di Dati.', skills: ['SQL', 'Python'] },
];

export const DOCUMENTS: Record<string, { title: string; kind: 'slides' | 'notes' | 'exercises' | 'book'; pages: number }[]> = {
  ro: [
    { title: 'Slide – Programmazione lineare e simplesso', kind: 'slides', pages: 86 },
    { title: 'Dispensa – Teoria della dualità', kind: 'notes', pages: 34 },
    { title: 'Eserciziario d\'esame 2023-2025', kind: 'exercises', pages: 52 },
  ],
  stat: [
    { title: 'Slide – Probabilità e variabili aleatorie', kind: 'slides', pages: 64 },
    { title: 'Dispensa – Inferenza statistica', kind: 'notes', pages: 41 },
  ],
  sem: [
    { title: 'Manuale di Semeiotica – estratto', kind: 'book', pages: 120 },
    { title: 'Slide – Esame obiettivo cardiovascolare', kind: 'slides', pages: 48 },
    { title: 'Casi clinici commentati', kind: 'notes', pages: 30 },
  ],
};

/** Chunk dei documenti usati per le citazioni del tutor (RAG mock). */
export const CHUNKS: { course: string; doc: number; page: number; topic: string; content: string }[] = [
  { course: 'ro', doc: 1, page: 4, topic: 'dualita', content: 'A ogni problema di PL (primale) è associato un problema duale: a ogni vincolo del primale corrisponde una variabile duale, a ogni variabile del primale un vincolo duale.' },
  { course: 'ro', doc: 1, page: 7, topic: 'dualita', content: 'Regole di costruzione: se il primale è di max con vincoli ≤, il duale è di min con vincoli ≥; il vettore dei termini noti diventa il vettore dei costi.' },
  { course: 'ro', doc: 1, page: 12, topic: 'dualita', content: 'Teorema della dualità forte: se il primale ha ottimo finito, anche il duale lo ha e i valori ottimi coincidono.' },
  { course: 'ro', doc: 1, page: 15, topic: 'dualita', content: 'Scarti complementari: in una coppia di soluzioni ottime, se una variabile duale è positiva il vincolo primale corrispondente è attivo.' },
  { course: 'ro', doc: 0, page: 41, topic: 'simplesso', content: 'Scelta della variabile entrante: si sceglie una variabile con costo ridotto negativo (per un problema di min); la regola di Bland evita i cicli.' },
  { course: 'ro', doc: 0, page: 63, topic: 'sensitivita', content: 'Il prezzo ombra di un vincolo indica di quanto migliora la funzione obiettivo aumentando di una unità il termine noto, entro l\'intervallo di validità.' },
  { course: 'ro', doc: 2, page: 18, topic: 'pli', content: 'Nel branch and bound un nodo si pota se il rilassamento è inammissibile, se il bound non migliora l\'incumbent o se la soluzione è intera.' },
  { course: 'stat', doc: 1, page: 9, topic: 'test', content: 'Il p-value è la probabilità, sotto H0, di osservare un valore della statistica test almeno così estremo da quello osservato.' },
  { course: 'sem', doc: 1, page: 22, topic: 'cardio', content: 'Il soffio sistolico eiettivo da stenosi aortica si ausculta al focolaio aortico e si irradia ai vasi del collo.' },
];

/** ~40 domande al tutor (anonime), già raggruppabili in cluster semantici. */
export const QUESTION_CLUSTERS: { course: string; topic: string; title: string; summary: string; questions: string[]; officialAnswer?: string }[] = [
  {
    course: 'ro', topic: 'dualita', title: 'Come si costruisce il problema duale',
    summary: 'Molti studenti confondono il verso dei vincoli duali e il segno delle variabili quando il primale ha vincoli misti.',
    questions: [
      'Come faccio a scrivere il duale se il primale ha vincoli sia ≤ che ≥?',
      'Nel duale le variabili sono sempre ≥ 0?',
      'Se il primale è di minimo il duale è di massimo con vincoli ≤?',
      'Non capisco come trasformare un vincolo di uguaglianza nel duale',
      'Quando una variabile duale è libera in segno?',
      'Il vettore dei costi diventa i termini noti del duale, giusto?',
      'Esiste una tabella con tutte le regole primale-duale?',
      'Perché il duale del duale è il primale?',
      'Come si scrive il duale di un problema con variabili non positive?',
      'Sbaglio sempre il verso dei vincoli del duale, c\'è un trucco?',
      'Il numero di vincoli del duale è uguale al numero di variabili del primale?',
      'Posso costruire il duale direttamente dal tableau?',
    ],
  },
  {
    course: 'ro', topic: 'dualita', title: 'Teorema degli scarti complementari',
    summary: 'Dubbi su come usare gli scarti complementari per verificare l\'ottimalità e ricavare la soluzione duale.',
    questions: [
      'Come uso gli scarti complementari per trovare la soluzione duale?',
      'Se un vincolo non è attivo la variabile duale è zero?',
      'Come verifico che una soluzione è ottima con gli scarti complementari?',
      'Gli scarti complementari valgono anche se la soluzione è degenere?',
      'Che differenza c\'è tra dualità forte e scarti complementari?',
      'In un esercizio d\'esame mi danno x* e chiedono di verificarne l\'ottimalità, da dove parto?',
    ],
  },
  {
    course: 'ro', topic: 'sensitivita', title: 'Significato dei prezzi ombra',
    summary: 'Gli studenti calcolano i prezzi ombra ma faticano a interpretarli economicamente e a trovare l\'intervallo di validità.',
    questions: [
      'Cosa rappresenta economicamente un prezzo ombra?',
      'Il prezzo ombra è uguale alla variabile duale ottima?',
      'Come trovo l\'intervallo in cui il prezzo ombra resta valido?',
      'Se il prezzo ombra è zero vuol dire che la risorsa è in eccesso?',
      'Come leggo i prezzi ombra dall\'output del solver Excel?',
      'Aumentando una risorsa oltre l\'intervallo cosa succede alla base?',
      'Che differenza c\'è tra costo ridotto e prezzo ombra?',
      'Nel caso di minimo il prezzo ombra ha segno opposto?',
    ],
  },
  {
    course: 'ro', topic: 'simplesso', title: 'Scelta della variabile entrante e cicli',
    summary: 'Dubbi su criteri di scelta della variabile entrante, regola di Bland e casi degeneri.',
    questions: [
      'Quale variabile faccio entrare se ci sono più costi ridotti negativi?',
      'Cos\'è la regola di Bland e quando serve?',
      'Cosa succede se il rapporto minimo è uguale per due righe?',
      'Come capisco che il problema è illimitato dal tableau?',
      'Il simplesso può ciclare all\'infinito?',
    ],
  },
  {
    course: 'ro', topic: 'pli', title: 'Branch and bound: quando potare un nodo',
    summary: 'Confusione sui criteri di potatura e sull\'aggiornamento dell\'incumbent.',
    questions: [
      'Quando posso chiudere un nodo nel branch and bound?',
      'Su quale variabile conviene fare branching?',
      'Il bound del nodo figlio può essere migliore di quello del padre?',
      'Cos\'è l\'incumbent e quando lo aggiorno?',
      'Meglio visitare in profondità o in ampiezza?',
    ],
  },
  {
    course: 'ro', topic: 'modellazione', title: "Formato e struttura dell'esame",
    summary: "Domande organizzative sul formato dello scritto e sul peso degli esercizi.",
    questions: [
      "Nello scritto c'è sempre un esercizio sul duale?",
      "Si può usare la calcolatrice all'esame?",
      'Quanto pesa l\'esercizio di modellazione sul voto?',
      "Le domande di teoria all'orale sono sugli stessi argomenti dello scritto?",
    ],
    officialAnswer: "Lo scritto ha 5 esercizi (modellazione, simplesso, dualità, PLI, reti) per un totale di 30 punti; la calcolatrice non programmabile è ammessa. L'orale parte dalla correzione dello scritto.",
  },
];

export const ROLEPLAY = [
  {
    course: 'sem',
    title: 'Paziente con dolore toracico',
    description: 'Pronto soccorso: raccogli l\'anamnesi di un paziente di 58 anni con dolore toracico e imposta l\'esame obiettivo.',
    persona: { name: 'Sig. Franco Dossi', age: 58, role: 'Paziente', personality: 'Ansioso, minimizza i sintomi, risponde in modo vago se non incalzato.', opening_line: 'Dottore, guardi, sarà la solita digestione… però stamattina mi ha preso proprio qui, al petto.' },
    hidden_facts: ['Il dolore si irradia al braccio sinistro', 'È fumatore da 30 anni (20 sigarette/die)', 'Il padre è morto di infarto a 60 anni', 'Ha sudato freddo durante l\'episodio', 'Assume un antipertensivo ma lo dimentica spesso'],
    rubric: [
      { criterion: 'Anamnesi del dolore (OPQRST)', weight: 0.3, description: 'Insorgenza, qualità, irradiazione, durata, fattori scatenanti.' },
      { criterion: 'Fattori di rischio', weight: 0.25, description: 'Fumo, familiarità, ipertensione, dislipidemia, diabete.' },
      { criterion: 'Comunicazione ed empatia', weight: 0.2, description: 'Domande aperte, rassicurazione, linguaggio chiaro.' },
      { criterion: 'Ragionamento clinico', weight: 0.25, description: 'Ipotesi diagnostiche e priorità degli accertamenti.' },
    ],
  },
  {
    course: 'ro',
    title: 'Cliente: ottimizzare le consegne',
    description: 'Sei un consulente: il titolare di un\'azienda di distribuzione vuole ridurre i costi di consegna. Fai emergere i vincoli e proponi un modello.',
    persona: { name: 'Dott. Paolo Venturi', age: 49, role: 'Titolare di Venturi Logistica', personality: 'Pragmatico, impaziente, poco tecnico; vuole numeri e non formule.', opening_line: 'Allora, mi hanno detto che lei con la matematica mi fa risparmiare. Ho 4 furgoni e i costi del gasolio mi stanno uccidendo.' },
    hidden_facts: ['I furgoni hanno capacità diverse (2 grandi, 2 piccoli)', 'Alcuni clienti accettano consegne solo al mattino', 'Gli autisti non possono superare 8 ore', 'Un deposito secondario è sottoutilizzato'],
    rubric: [
      { criterion: 'Raccolta dei requisiti', weight: 0.3, description: 'Obiettivo, vincoli, dati disponibili.' },
      { criterion: 'Modellazione', weight: 0.3, description: 'Variabili decisionali, funzione obiettivo e vincoli corretti.' },
      { criterion: 'Comunicazione al cliente', weight: 0.2, description: 'Spiegazione chiara e non tecnica.' },
      { criterion: 'Proposta di valore', weight: 0.2, description: 'Stima del risparmio e prossimi passi.' },
    ],
  },
];

export const OPPORTUNITIES = [
  { kind: 'internship', title: 'Stage Supply Chain Analyst', organization: 'Logistica Nord S.p.A.', location: 'Milano (ibrido)', skills: ['Excel', 'Python', 'Ricerca Operativa'], degree: ['Ingegneria Gestionale'], deadline: '2026-12-15', description: 'Ottimizzazione delle rotte di distribuzione e analisi dei livelli di scorta.' },
  { kind: 'internship', title: 'Tirocinio Operations Excellence', organization: 'MeccaParts', location: 'Bologna', skills: ['Lean Manufacturing', 'Excel'], degree: ['Ingegneria Gestionale'], deadline: '2027-01-10', description: 'Progetti di miglioramento continuo sulle linee di assemblaggio.' },
  { kind: 'job', title: 'Junior Data Analyst', organization: 'RetailCo Italia', location: 'Torino', skills: ['SQL', 'Python', 'Statistica'], degree: ['Ingegneria Gestionale', 'Statistica'], deadline: '2026-12-31', description: 'Analisi delle vendite e modelli di previsione della domanda.' },
  { kind: 'event', title: 'Hackathon "Optimize the City"', organization: 'Comune di Milano & Politecnico', location: 'Milano', skills: ['Python', 'Ricerca Operativa'], degree: ['Ingegneria Gestionale', 'Informatica'], deadline: '2026-11-28', description: '48 ore per ottimizzare la mobilità urbana con dati aperti.' },
  { kind: 'scholarship', title: 'Borsa di studio Women in Engineering', organization: 'Fondazione Futuro', location: 'Online', skills: [], degree: ['Ingegneria Gestionale', 'Ingegneria Meccanica'], deadline: '2026-12-05', description: '5.000 € per studentesse magistrali in ingegneria con media ≥ 26.' },
  { kind: 'event', title: 'Career Day Ingegneria', organization: 'Università Demo', location: 'Campus centrale', skills: [], degree: ['Ingegneria Gestionale'], deadline: '2026-11-20', description: 'Incontri con 40 aziende del territorio.' },
  { kind: 'internship', title: 'Tirocinio Project Management Office', organization: 'Energia Verde', location: 'Roma', skills: ['Project management', 'Excel'], degree: ['Ingegneria Gestionale'], deadline: '2027-02-01', description: 'Supporto al PMO nella pianificazione di progetti di impianti rinnovabili.' },
  { kind: 'job', title: 'Graduate Program Consulting', organization: 'Advisory Partners', location: 'Milano', skills: ['Excel', 'Problem solving', 'Inglese B2'], degree: ['Ingegneria Gestionale', 'Economia'], deadline: '2027-01-31', description: 'Programma di 18 mesi su progetti di strategia e operations.' },
  { kind: 'internship', title: 'Tirocinio reparto Cardiologia', organization: 'Ospedale Universitario', location: 'Campus Medicina', skills: ['Semeiotica'], degree: ['Medicina e Chirurgia'], deadline: '2026-12-10', description: 'Frequenza in reparto con tutor clinico.' },
  { kind: 'event', title: 'Workshop: Excel avanzato e Solver', organization: 'Student Office', location: 'Aula Magna', skills: ['Excel', 'Ricerca Operativa'], degree: ['Ingegneria Gestionale'], deadline: '2026-11-18', description: 'Modelli di ottimizzazione con il Solver di Excel, ideale prima dell\'esame di RO.' },
];
