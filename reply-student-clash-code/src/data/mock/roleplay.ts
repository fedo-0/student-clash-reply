/**
 * Scenari del simulatore di consulenza: UNO PER MATERIA.
 * Il caso è costruito sui topic del corso: ogni informazione nascosta è legata a un topic, così
 * la simulazione allena (e misura) le stesse competenze del modello di mastery.
 * A fine sessione il punteggio per topic diventa un learning_event con source 'simulation'.
 */
import type { RoleplayPersona, RubricCriterion, RoleplayDifficulty } from '@/types/database';

export interface RoleplayFactFixture {
  id: string;
  topic: string; // chiave topic del corso (vedi fixtures.ts)
  fact: string;
  reply: string;
  keywords: string[];
  level: RoleplayDifficulty;
  hint: string;
}

export interface RoleplayFixture {
  key: string;
  course: string; // chiave corso
  title: string;
  description: string;
  counterpart_label: string;
  skills: string[];
  prepares_for: string;
  persona: RoleplayPersona;
  hidden_facts: RoleplayFactFixture[];
  objections: string[];
  solution_keywords: string[];
  rubric: RubricCriterion[];
}

const rubric = (discovery: string, communication: string, relationship: string, solution: string): RubricCriterion[] => [
  { criterion: 'Raccolta delle informazioni', weight: 0.35, description: discovery, focus: 'discovery' },
  { criterion: 'Qualità delle domande', weight: 0.2, description: communication, focus: 'communication' },
  { criterion: 'Gestione della relazione', weight: 0.2, description: relationship, focus: 'relationship' },
  { criterion: 'Proposta / ragionamento', weight: 0.25, description: solution, focus: 'solution' },
];

export const ROLEPLAY: RoleplayFixture[] = [
  {
    key: 'ro-logistica',
    course: 'ro',
    title: 'Consulenza: ottimizzare le consegne di Venturi Logistica',
    description: "Il titolare di un'azienda di distribuzione vuole tagliare i costi. Traduci il suo problema in un modello di Ricerca Operativa: obiettivo, vincoli, variabili intere, rete di distribuzione e valore delle risorse.",
    counterpart_label: 'Cliente',
    skills: ['Tradurre un problema reale in un modello', 'Riconoscere vincoli e variabili intere', 'Interpretare il valore marginale delle risorse', 'Spiegare la RO a chi non è tecnico'],
    prepares_for: "L'esercizio di modellazione dello scritto, le domande dell'orale sull'interpretazione economica (dualità, prezzi ombra) e i colloqui da supply chain analyst.",
    persona: {
      name: 'Dott. Paolo Venturi',
      age: 49,
      role: 'Titolare di Venturi Logistica',
      context: '4 furgoni, 60 clienti in provincia, due magazzini e costi del carburante in crescita del 30% in un anno.',
      opening_lines: {
        gentle: 'Buongiorno, grazie di essere venuto. Le spiego: ho 4 furgoni e i costi delle consegne stanno salendo troppo. Spero che lei possa aiutarmi.',
        moderate: 'Allora, mi hanno detto che lei con la matematica mi fa risparmiare. Ho 4 furgoni e i costi del gasolio mi stanno uccidendo.',
        aggressive: 'Senta, ho già pagato due consulenti e non è cambiato niente. Ho 4 furgoni e spendo una follia in gasolio. Mi dica subito cosa sa fare.',
      },
    },
    hidden_facts: [
      { id: 'ro1', topic: 'modellazione', level: 1, fact: 'Obiettivo: ridurre i costi di trasporto del 15%', reply: "L'obiettivo è chiaro: voglio spendere almeno il 15% in meno in trasporti entro l'anno prossimo.", keywords: ['obiettivo', 'risparm', 'ridurre', 'minimizz', 'target', 'costi'], hint: "Chiedi qual è l'obiettivo da ottimizzare (funzione obiettivo)" },
      { id: 'ro2', topic: 'modellazione', level: 1, fact: 'Furgoni con capacità diverse (2 da 1.200 kg, 2 da 600 kg)', reply: 'I furgoni non sono uguali: due grandi da 1.200 kg e due piccoli da 600 kg.', keywords: ['furgon', 'capacit', 'mezzi', 'flotta', 'carico', 'veicol'], hint: 'Chiedi delle capacità dei mezzi (vincoli)' },
      { id: 'ro3', topic: 'grafi', level: 1, fact: 'Esiste una mappa con i tempi di percorrenza tra clienti', reply: 'Ho una mappa con tutti i clienti e i tempi tra uno e l’altro, ma gli autisti vanno un po’ a occhio.', keywords: ['distanz', 'strad', 'percors', 'mappa', 'tragitt', 'km', 'tempi di'], hint: 'Chiedi delle distanze tra i clienti (grafo dei percorsi)' },
      { id: 'ro4', topic: 'pli', level: 2, fact: 'Ogni furgone che esce ha un costo fisso di 80 €', reply: 'Ogni furgone che esce mi costa 80 euro fissi tra assicurazione e manutenzione, anche se fa due consegne.', keywords: ['fiss', 'uscit', 'esce', 'attiv', 'quanti furgon', 'usare', 'costo per'], hint: 'Chiedi dei costi fissi di utilizzo (variabili binarie)' },
      { id: 'ro5', topic: 'flussi', level: 2, fact: 'Il magazzino di Lodi può spedire al massimo 300 casse al giorno', reply: 'Poi ho il magazzino di Lodi, che però può spedire al massimo 300 casse al giorno. Quello principale non ha limiti.', keywords: ['deposit', 'magazzin', 'sede', 'partenz', 'hub', 'spedi', 'merce'], hint: 'Chiedi da dove parte la merce e con che capacità (rete di flusso)' },
      { id: 'ro6', topic: 'dualita', level: 2, fact: 'Valutare se affittare un quinto furgone a 150 €/giorno', reply: 'Un fornitore mi propone di affittare un quinto furgone a 150 euro al giorno. Conviene o no?', keywords: ['affitt', 'aggiunt', 'in più', 'investire', 'conviene', 'nuovo furgone', 'capacità extra'], hint: 'Chiedi se sta valutando di aumentare le risorse (valore marginale → dualità)' },
      { id: 'ro7', topic: 'sensitivita', level: 3, fact: "Gli autisti fanno max 8 ore; un'ora di straordinario costa 35 €", reply: "Gli autisti fanno massimo 8 ore. Un'ora di straordinario mi costa 35 euro: ogni tanto mi chiedo se vale la pena.", keywords: ['autist', 'ore', 'turn', 'straordinar', 'personale'], hint: "Chiedi dei turni degli autisti (prezzo ombra dell'ora in più)" },
      { id: 'ro8', topic: 'pli', level: 3, fact: '15 ristoranti vogliono la consegna entro le 11', reply: 'E i ristoranti: almeno 15 clienti vogliono la merce entro le 11, o tutto o niente.', keywords: ['orari', 'mattin', 'finestr', 'entro', 'ristorant', 'client'], hint: 'Chiedi dei vincoli di orario (vincoli logici)' },
    ],
    objections: ['E quanto mi costa tutto questo?', 'Sì, ma i miei autisti le strade le conoscono meglio di qualsiasi algoritmo.', 'Mi dia un numero: quanto risparmio?'],
    solution_keywords: ['modello', 'ottimizz', 'variabil', 'vincol', 'programmazione lineare', 'intera', 'binari', 'cammin', 'flusso', 'prezzo ombra', 'duale', 'sensitiv', 'simplesso', 'solver'],
    rubric: rubric('Obiettivo, capacità, percorsi, costi fissi, rete dei magazzini, valore delle risorse.', 'Domande aperte e mirate, senza gergo tecnico.', 'Ascolto, gestione delle obiezioni e del tono del cliente.', 'Impostare il modello (variabili, vincoli, obiettivo) e interpretare il valore delle risorse.'),
  },
  {
    key: 'stat-campagna',
    course: 'stat',
    title: 'Consulenza: la campagna marketing ha funzionato?',
    description: "La responsabile marketing di un e-commerce vuole sapere se la nuova campagna ha aumentato le vendite. Usa la statistica per capire cosa dicono davvero i dati e cosa serve per rispondere.",
    counterpart_label: 'Cliente',
    skills: ['Leggere dati descrittivi', 'Ragionare su campioni e incertezza', "Impostare un test d'ipotesi", 'Riconoscere fattori confondenti'],
    prepares_for: "Gli esercizi d'esame su intervalli di confidenza e test d'ipotesi, e i colloqui da data analyst.",
    persona: {
      name: 'Chiara Monti',
      age: 36,
      role: 'Marketing manager di ShopNow',
      context: 'Due settimane fa è partita una nuova campagna pubblicitaria; il capo vuole sapere se rinnovarla.',
      opening_lines: {
        gentle: 'Ciao, grazie! Abbiamo lanciato una campagna nuova e mi sembra che le vendite siano salite, ma vorrei esserne sicura prima di rinnovarla.',
        moderate: 'Allora, la campagna è partita da due settimane e le vendite sono salite. Mi serve solo la conferma che funziona.',
        aggressive: 'Ho speso 40.000 euro in questa campagna e il mio capo mi chiede se ha funzionato. Mi serve un sì entro venerdì, chiaro?',
      },
    },
    hidden_facts: [
      { id: 'st1', topic: 'descrittiva', level: 1, fact: 'Lo scontrino medio è passato da 42 € a 46 €', reply: 'Lo scontrino medio è passato da 42 a 46 euro.', keywords: ['medi', 'scontrino', 'dati', 'numeri', 'vendite', 'quanto'], hint: 'Chiedi quali numeri descrivono il cambiamento' },
      { id: 'st2', topic: 'probabilita', level: 1, fact: 'Tasso di conversione salito dal 3% al 3,6%', reply: 'Prima comprava il 3% dei visitatori, adesso il 3,6%.', keywords: ['percentual', 'convers', 'visitator', 'comprano', 'tasso', 'probabil', 'quanti clienti'], hint: 'Chiedi la percentuale di visitatori che acquista' },
      { id: 'st3', topic: 'stima', level: 2, fact: 'Dati di sole 2 settimane, circa 800 ordini', reply: 'Abbiamo guardato solo le ultime due settimane, saranno circa 800 ordini.', keywords: ['campion', 'quanti ordini', 'periodo', 'settiman', 'dimension', 'quanti dati', 'intervallo'], hint: 'Chiedi quanti dati ci sono (dimensione del campione)' },
      { id: 'st4', topic: 'distribuzioni', level: 2, fact: 'Scontrini molto variabili: tanti piccoli, pochi enormi', reply: 'Gli scontrini sono molto diversi: tanti acquisti da 20 euro e qualche ordine da 1.000.', keywords: ['variabil', 'distribuz', 'dispers', 'deviaz', 'outlier', 'divers', 'forma'], hint: 'Chiedi quanto sono variabili gli acquisti' },
      { id: 'st5', topic: 'test', level: 2, fact: 'Nessun gruppo di controllo: campagna partita per tutti', reply: 'No, la campagna l’hanno vista tutti, non abbiamo tenuto fuori nessuno.', keywords: ['controllo', 'confront', 'gruppo', 'a/b', 'ab test', 'tutti', 'senza campagna'], hint: 'Chiedi se c’è un gruppo di confronto' },
      { id: 'st6', topic: 'regressione', level: 3, fact: 'Nelle stesse settimane: saldi e +20% di budget pubblicitario', reply: 'Ah, nelle stesse settimane sono partiti anche i saldi e abbiamo aumentato del 20% il budget sui social.', keywords: ['altri fattori', 'saldi', 'contemporan', 'stagional', 'budget', 'cambiato', 'stesso periodo', 'altro'], hint: 'Chiedi cos’altro è cambiato nello stesso periodo (confondenti)' },
      { id: 'st7', topic: 'test', level: 3, fact: 'Il capo vuole una risposta "sicura al 95%"', reply: 'Il mio capo dice che vuole una risposta sicura al 95%, qualunque cosa voglia dire.', keywords: ['sicur', 'confidenz', 'certezz', 'significativ', 'errore', 'rischio', 'livello'], hint: 'Chiedi che livello di certezza serve (significatività)' },
    ],
    objections: ['Ma le vendite sono salite, cosa c’è da dimostrare?', 'Non ho tempo per un esperimento, mi serve una risposta adesso.', 'Il 95% di cosa, esattamente?'],
    solution_keywords: ['test', 'ipotesi', 'intervallo', 'confidenz', 'a/b', 'gruppo di controllo', 'regressione', 'campione', 'p-value', 'significativ', 'variabilit', 'media'],
    rubric: rubric('Indicatori, dimensione del campione, variabilità, gruppo di controllo, confondenti, livello di significatività.', 'Domande chiare e orientate ai dati.', 'Gestire la pressione della cliente e le sue aspettative.', "Proporre un'analisi corretta (intervallo, test A/B, controllo dei confondenti)."),
  },
  {
    key: 'sem-toracico',
    course: 'sem',
    title: 'Paziente con dolore toracico',
    description: "Pronto soccorso: raccogli l'anamnesi e imposta l'esame obiettivo di un paziente di 58 anni con dolore toracico.",
    counterpart_label: 'Paziente',
    skills: ['Anamnesi strutturata (OPQRST)', 'Esame obiettivo mirato', 'Identificazione dei fattori di rischio', 'Comunicazione empatica'],
    prepares_for: "L'esame pratico di Semeiotica, gli OSCE con paziente simulato e il tirocinio al pronto soccorso.",
    persona: {
      name: 'Sig. Franco Dossi',
      age: 58,
      role: 'Paziente',
      context: 'Si presenta al pronto soccorso per un dolore al petto iniziato due ore fa.',
      opening_lines: {
        gentle: 'Buongiorno dottore… mi scusi se la disturbo, sarà la digestione, però stamattina ho sentito un dolore qui al petto.',
        moderate: 'Dottore, guardi, sarà la solita digestione… però stamattina mi ha preso proprio qui, al petto.',
        aggressive: "Sono qui da un'ora e nessuno mi dice niente! Ho un dolore al petto, mi visitate o no?",
      },
    },
    hidden_facts: [
      { id: 'se1', topic: 'anamnesi', level: 1, fact: 'Dolore oppressivo iniziato a riposo due ore fa', reply: 'È come un peso, mi è venuto due ore fa mentre ero seduto a leggere il giornale.', keywords: ['come', 'tipo', 'quando', 'inizi', 'descriv', 'dolore', 'caratter'], hint: 'Chiedi caratteristiche e inizio del dolore' },
      { id: 'se2', topic: 'cardio', level: 1, fact: 'Il dolore si irradia al braccio sinistro', reply: 'Il dolore va anche verso il braccio sinistro, a dire il vero.', keywords: ['braccio', 'irradi', 'spost', 'dove', 'collo', 'mandibol'], hint: 'Chiedi se il dolore si irradia' },
      { id: 'se3', topic: 'eog', level: 1, fact: 'PA 160/95, FC 105, cute pallida e sudata', reply: '(All’esame obiettivo) Pressione 160/95, frequenza 105, il paziente è pallido e sudato.', keywords: ['misur', 'visit', 'polso', 'frequenz', 'esame obiettivo', 'parametri', 'pressione arteriosa', 'auscult'], hint: 'Rileva i parametri vitali e osserva il paziente' },
      { id: 'se4', topic: 'anamnesi', level: 2, fact: 'Fumatore da 30 anni (20 sigarette al giorno)', reply: 'Fumo da trent’anni, un pacchetto al giorno. Lo so, lo so…', keywords: ['fum', 'sigarett', 'abitud', 'stile di vita', 'alcol'], hint: 'Indaga le abitudini' },
      { id: 'se5', topic: 'anamnesi', level: 2, fact: 'Il padre è morto di infarto a 60 anni', reply: 'Mio padre è morto di infarto a 60 anni. Non ci avevo pensato…', keywords: ['famil', 'padre', 'madre', 'genitor', 'parent', 'ereditar'], hint: 'Chiedi della familiarità' },
      { id: 'se6', topic: 'respiratoria', level: 2, fact: 'Dispnea da sforzo nelle ultime settimane', reply: 'Ultimamente mi manca un po’ il fiato quando salgo le scale.', keywords: ['fiato', 'respir', 'dispnea', 'affann', 'tosse', 'scale'], hint: 'Indaga i sintomi respiratori' },
      { id: 'se7', topic: 'cardio', level: 3, fact: 'Sudorazione fredda e nausea durante l’episodio', reply: 'Sì, ho sudato freddo e mi veniva da vomitare, mi sono spaventato.', keywords: ['sud', 'nausea', 'sintom', 'vomit', 'altro'], hint: 'Chiedi dei sintomi associati' },
      { id: 'se8', topic: 'anamnesi', level: 3, fact: 'Antipertensivo assunto in modo irregolare', reply: 'Dovrei prendere una pastiglia per la pressione, ma spesso me la dimentico.', keywords: ['farmac', 'pastigli', 'terapi', 'medicin', 'malatt', 'prende'], hint: 'Chiedi di terapie e patologie note' },
    ],
    objections: ['Ma è grave? Mi dica la verità.', 'Non voglio fare troppi esami, devo tornare al lavoro.', 'Mia moglie dice che è solo ansia.'],
    solution_keywords: ['ecg', 'elettrocardiogramma', 'troponin', 'sindrome coronarica', 'infarto', 'aspirina', 'monitor', 'cardiolog', 'auscult'],
    rubric: rubric('Caratteristiche del dolore, irradiazione, parametri vitali, fattori di rischio, sintomi associati, terapie.', 'Domande aperte e sequenza OPQRST.', 'Empatia, rassicurazione, gestione dell’ansia o della rabbia del paziente.', 'Ipotesi diagnostiche e priorità degli accertamenti (ECG, troponina).'),
  },
];
