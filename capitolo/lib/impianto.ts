// L'impianto della tesi (Fase 2, § 3 Momento 2). La spina dorsale del prodotto:
// domanda di ricerca in cima, indice ad albero con numerazione decimale (max 3
// livelli), ogni sezione con un peso in pagine e uno stato, e avvisi che
// guidano senza bloccare.
//
// Invarianti in gioco:
//   * [inv. 9] Tutto qui è consiglio: gli avvisi non impediscono nulla.
//   * [inv. 2] Il template è una *consuetudine metodologica*, non una regola
//     d'ateneo: non gli si attribuisce una fonte istituzionale che non ha. La
//     sola affermazione con fonte reale è la lunghezza del corso, che arriva
//     dalle regole confermate (con il loro fonte_url) — non da qui.
//   * Nessuna data: [inv. 1] non è in gioco in questo modulo.
//
// Funzioni pure: niente DB, niente browser. Lo stato personale vive nel
// localStorage del client (vedi Impianto.tsx).

export type Disciplina = 'umanistica' | 'stem';

// Il ciclo di vita di una sezione, dall'idea alla chiusura. L'ordine conta:
// serve a misurare l'avanzamento e a difendere l'ordine di stesura.
export type StatoSezione =
  | 'vuota'
  | 'in_bozza'
  | 'prima_stesura'
  | 'revisionata'
  | 'chiusa';

export const STATI: StatoSezione[] = [
  'vuota',
  'in_bozza',
  'prima_stesura',
  'revisionata',
  'chiusa',
];

const ETICHETTE_STATO: Record<StatoSezione, string> = {
  vuota: 'vuota',
  in_bozza: 'in bozza',
  prima_stesura: 'prima stesura',
  revisionata: 'revisionata',
  chiusa: 'chiusa',
};

export function etichettaStato(s: StatoSezione): string {
  return ETICHETTE_STATO[s];
}

export function ordineStato(s: StatoSezione): number {
  return STATI.indexOf(s);
}

// Avanza / arretra di uno stato, senza uscire dagli estremi.
export function statoSuccessivo(s: StatoSezione): StatoSezione {
  return STATI[Math.min(ordineStato(s) + 1, STATI.length - 1)];
}
export function statoPrecedente(s: StatoSezione): StatoSezione {
  return STATI[Math.max(ordineStato(s) - 1, 0)];
}

export interface Sezione {
  id: string;
  titolo: string;
  // Cosa deve contenere la sezione e quando conviene scriverla. Dal template,
  // ma editabile: è una guida, non un vincolo. [inv. 9]
  guida?: string;
  pagineDa?: number | null;
  pagineA?: number | null;
  stato: StatoSezione;
  figli: Sezione[];
}

export interface Impianto {
  disciplina: Disciplina | null;
  domandaRicerca: string;
  briefing: string;
  sezioni: Sezione[];
}

// --- numerazione decimale (max 3 livelli) ---------------------------------

// Da una posizione nell'albero (indici 0-based) alla stringa «2.1.3».
export function numeroDecimale(indici: number[]): string {
  return indici.map((i) => i + 1).join('.');
}

export const LIVELLO_MAX = 3;

// --- profilo di disciplina -------------------------------------------------

export interface ProfiloDisciplina {
  nome: string;
  descrizione: string; // in una riga, cosa cambia
  stileCitazionale: string;
  personaVerbale: string;
  editorConsigliato: string;
  databaseBibliografici: string;
  // Orientamento di lunghezza *generico*: dichiarato come consuetudine, mai
  // come regola. La lunghezza vera del corso arriva dalle regole confermate.
  lunghezzaOrientativa: string;
}

const PROFILI: Record<Disciplina, ProfiloDisciplina> = {
  umanistica: {
    nome: 'Umanistica e sociale',
    descrizione: 'struttura tematica, tesi spesso compilativa',
    stileCitazionale: 'note a piè di pagina (Chicago o stile del corso)',
    personaVerbale: 'forma impersonale; plurale ammesso, prima persona quasi mai',
    editorConsigliato: 'Word o LibreOffice',
    databaseBibliografici: 'cataloghi di biblioteca, JSTOR, Google Scholar',
    lunghezzaOrientativa: 'molto variabile per corso — spesso 50.000–300.000 battute',
  },
  stem: {
    nome: 'STEM',
    descrizione: 'struttura IMRAD, tesi sperimentale',
    stileCitazionale: 'autore-anno o numerico (APA, IEEE)',
    personaVerbale: 'forma impersonale o passiva',
    editorConsigliato: 'LaTeX (Overleaf)',
    databaseBibliografici: 'Scopus, Web of Science, PubMed, arXiv',
    lunghezzaOrientativa: 'variabile per corso — spesso più breve, ~15.000–40.000 parole',
  },
};

export function profiloDisciplina(d: Disciplina): ProfiloDisciplina {
  return PROFILI[d];
}

// --- indice iniziale per disciplina ---------------------------------------

let contatore = 0;
// id stabile ma solo per la sessione di generazione; nel browser lo stato
// salvato conserva gli id già assegnati.
function nuovoId(prefisso = 's'): string {
  contatore += 1;
  return `${prefisso}${Date.now().toString(36)}-${contatore}`;
}

function sez(titolo: string, guida: string): Sezione {
  return { id: nuovoId(), titolo, guida, pagineDa: null, pagineA: null, stato: 'vuota', figli: [] };
}

// Le sezioni «cornice» (introduzione, abstract, conclusioni) si scrivono per
// ultime: lo si riconosce dal titolo, per l'avviso sull'ordine di stesura.
const RE_CORNICE = /introduzione|abstract|conclusion/i;
const RE_BIBLIO = /bibliografia|riferimenti/i;

export function eCornice(titolo: string): boolean {
  return RE_CORNICE.test(titolo);
}
export function eBibliografia(titolo: string): boolean {
  return RE_BIBLIO.test(titolo);
}

export function indiceIniziale(d: Disciplina): Sezione[] {
  if (d === 'stem') {
    return [
      sez('Introduzione', 'Problema, domanda o ipotesi, obiettivi. Si scrive per ultima: prima devi sapere cosa hai dimostrato.'),
      sez('Stato dell’arte', 'Lavori correlati e la lacuna che colmi. Si aggiorna in continuo.'),
      sez('Materiali e metodi', 'Come hai fatto, in modo riproducibile. Si scrive presto, mentre lo fai.'),
      sez('Risultati', 'Cosa hai trovato, senza interpretarlo.'),
      sez('Discussione', 'Interpretazione, confronto con la letteratura, limiti.'),
      sez('Conclusioni', 'Sintesi e sviluppi futuri. Si scrive per ultima.'),
      sez('Bibliografia', 'Si costruisce dal primo giorno, non alla fine.'),
    ];
  }
  return [
    sez('Introduzione', 'Domanda di ricerca, contesto, struttura del lavoro. Si scrive per ultima.'),
    sez('Stato dell’arte', 'Cosa è già stato detto sul tema; individua la lacuna che colmi. Si aggiorna in continuo.'),
    sez('Primo nucleo tematico', 'Il primo blocco argomentativo, legato alla domanda di ricerca.'),
    sez('Secondo nucleo tematico', 'Sviluppa o contrappone; porta avanti l’argomento.'),
    sez('Conclusioni', 'Cosa hai mostrato, i limiti, le aperture. Si scrive per ultima.'),
    sez('Bibliografia', 'Si costruisce dal primo giorno, non alla fine.'),
  ];
}

export function impiantoIniziale(d: Disciplina): Impianto {
  return { disciplina: d, domandaRicerca: '', briefing: '', sezioni: indiceIniziale(d) };
}

// --- peso in pagine e avanzamento -----------------------------------------

// Pagine di una sezione: se ha un range proprio lo usa, altrimenti somma i
// figli. null se non c'è alcuna informazione (la sezione è «senza peso»).
export function paginesSezione(s: Sezione): number | null {
  if (s.pagineDa != null && s.pagineA != null && s.pagineA >= s.pagineDa) {
    return s.pagineA - s.pagineDa + 1;
  }
  let somma = 0;
  let trovato = false;
  for (const f of s.figli) {
    const p = paginesSezione(f);
    if (p != null) {
      somma += p;
      trovato = true;
    }
  }
  return trovato ? somma : null;
}

export interface Avanzamento {
  totali: number;
  chiuse: number;
  percentuale: number; // 0..100, arrotondata
}

export function avanzamento(sezioni: Sezione[]): Avanzamento {
  let totali = 0;
  let chiuse = 0;
  const visita = (elenco: Sezione[]) => {
    for (const s of elenco) {
      totali += 1;
      if (s.stato === 'chiusa') chiuse += 1;
      visita(s.figli);
    }
  };
  visita(sezioni);
  const percentuale = totali === 0 ? 0 : Math.round((chiuse / totali) * 100);
  return { totali, chiuse, percentuale };
}

// --- avvisi (guidano, non bloccano) [inv. 9] -------------------------------

export type ToneAvviso = 'attenzione' | 'nota';
export interface Avviso {
  id: string;
  testo: string;
  tono: ToneAvviso;
}

export function avvisiImpianto(imp: Impianto): Avviso[] {
  const out: Avviso[] = [];

  // 1. La domanda di ricerca regge tutto l'impianto.
  if (imp.domandaRicerca.trim().length === 0) {
    out.push({
      id: 'domanda-mancante',
      tono: 'attenzione',
      testo: 'Manca la domanda di ricerca. Tutto l’impianto si regge su di lei: scrivila in cima, anche provvisoria.',
    });
  }

  const primoLivello = imp.sezioni;
  const centrali = primoLivello.filter((s) => !eCornice(s.titolo) && !eBibliografia(s.titolo));

  // 2. Sezioni senza peso in pagine: senza non si vedono gli squilibri.
  const senzaPagine = primoLivello.filter(
    (s) => !eBibliografia(s.titolo) && paginesSezione(s) == null
  );
  if (senzaPagine.length > 0 && primoLivello.length > 0) {
    out.push({
      id: 'pagine-mancanti',
      tono: 'nota',
      testo:
        senzaPagine.length === primoLivello.length
          ? 'Nessuna sezione ha un peso in pagine. Assegnane uno anche approssimativo: serve a vedere gli squilibri.'
          : `${senzaPagine.length} sezioni non hanno un peso in pagine: finché mancano, gli squilibri restano invisibili.`,
    });
  }

  // 3. Squilibrio: una sezione centrale che pesa più della metà del totale.
  const pesi = primoLivello
    .map((s) => ({ s, p: paginesSezione(s) }))
    .filter((x) => x.p != null) as { s: Sezione; p: number }[];
  const totale = pesi.reduce((a, x) => a + x.p, 0);
  if (totale > 0 && pesi.length >= 3) {
    for (const { s, p } of pesi) {
      if (!eBibliografia(s.titolo) && p > totale * 0.5) {
        out.push({
          id: `squilibrio-${s.id}`,
          tono: 'nota',
          testo: `«${s.titolo}» pesa più della metà della tesi. Valuta se spezzarla: un capitolo che vale metà del lavoro è difficile da tenere insieme.`,
        });
      }
    }
  }

  // 4. Ordine di stesura difeso: introduzione/conclusioni avviate mentre i
  // capitoli centrali sono ancora vuoti. Non blocca: avverte. (§ Momento 5)
  const centraliVuote = centrali.filter((s) => s.stato === 'vuota').length;
  if (centrali.length > 0 && centraliVuote > 0) {
    for (const s of primoLivello) {
      if (eCornice(s.titolo) && ordineStato(s.stato) >= ordineStato('in_bozza')) {
        out.push({
          id: `ordine-${s.id}`,
          tono: 'nota',
          testo: `Stai lavorando su «${s.titolo}» mentre alcuni capitoli centrali sono ancora vuoti. Puoi farlo, ma la riscriverai: racconta ciò che avrai dimostrato, e per saperlo conviene aspettare.`,
        });
        break; // un solo avviso d'ordine per volta, basta il promemoria
      }
    }
  }

  return out;
}
