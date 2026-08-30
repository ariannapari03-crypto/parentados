// I modelli (§ 3 Momento 2): lo studente carica tesi già discusse del suo corso
// e il sito ne estrae SOLO l'ossatura — albero dei capitoli, numerazione, peso
// relativo, posto di abstract/introduzione/metodo/conclusioni. Mai il testo.
//
// Vincolo non negoziabile: nessuna frase dei documenti caricati finisce nella
// tesi dello studente. Il modello mostra come si costruisce un capitolo, non
// cosa scriverci. Perciò da qui esce una STRUTTURA, mai contenuto.
//
// Funzioni pure: niente rete, niente PDF. La lettura del PDF sta nella route,
// che passa qui il testo grezzo e riceve indietro solo la struttura.

export type RuoloSezione =
  | 'abstract'
  | 'introduzione'
  | 'letteratura'
  | 'metodo'
  | 'risultati'
  | 'discussione'
  | 'conclusioni'
  | 'bibliografia'
  | 'altro';

export interface SezioneModello {
  numero?: string;
  titolo: string;
  pagina: number;
  livello: number;
  pagine?: number | null; // peso: pagine fino alla sezione successiva
  ruolo: RuoloSezione;
}

export interface ProfiloModello {
  pagineTotali: number | null;
  sezioni: SezioneModello[];
  note: string[];
}

export function classificaRuolo(titolo: string): RuoloSezione {
  const t = titolo.toLowerCase();
  if (/\babstract\b|sommario|sintesi/.test(t)) return 'abstract';
  if (/introduc|introduzione/.test(t)) return 'introduzione';
  if (/literature|letteratura|stato dell|state of the art|background|theoretical|teoric|quadro/.test(t)) return 'letteratura';
  if (/method|metodo|materiali|research design|dati e metod|disegno/.test(t)) return 'metodo';
  if (/result|risultat|findings|empiric|analisi|analysis/.test(t)) return 'risultati';
  if (/discussion|discussione/.test(t)) return 'discussione';
  if (/conclus/.test(t)) return 'conclusioni';
  if (/bibliograf|references|riferimenti|sitografia/.test(t)) return 'bibliografia';
  return 'altro';
}

// Una riga d'indice: «2.1 Titolo .... 12» oppure «2 Titolo    12».
const RE_LEADER = /^\s*(?:(\d+(?:\.\d+){0,2})\.?\s+)?(.{2,80}?)\s*[.·•…]{2,}\s*(\d{1,4})\s*$/;
const RE_NUMERO = /^\s*(\d+(?:\.\d+){0,2})\.?\s+(.{2,80}?)\s+(\d{1,4})\s*$/;

function pulisci(titolo: string): string {
  return titolo.replace(/\s+/g, ' ').replace(/[.·•…\s]+$/, '').trim();
}

// Estrae la struttura dal testo grezzo del PDF. Si appoggia all'indice, la
// fonte più affidabile; se non c'è, lo dichiara e non inventa capitoli.
export function estraiStruttura(testo: string, pagineTotaliNote?: number): ProfiloModello {
  const righe = testo.split(/\r?\n/);
  const grezze: { numero?: string; titolo: string; pagina: number; livello: number }[] = [];

  for (const riga of righe) {
    let m = RE_LEADER.exec(riga);
    if (!m) m = RE_NUMERO.exec(riga);
    if (!m) continue;
    const numero = m[1];
    const titolo = pulisci(m[2]);
    const pagina = Number(m[3]);
    if (!titolo || !/[A-Za-zÀ-ÿ]/.test(titolo)) continue;
    if (pagina < 1 || pagina > 3000) continue;
    // scarta righe che sono solo numeri o troppo corte
    if (titolo.length < 3) continue;
    const livello = numero ? numero.split('.').length : 1;
    grezze.push({ numero, titolo, pagina, livello });
  }

  // Tiene solo una sequenza con pagine non decrescenti (l'indice vero). Filtra i
  // rientri sparsi (es. "Tabella 3 ... 40" fuori sequenza).
  const sezioniOrdinate = grezze.filter((s, i) => i === 0 || s.pagina >= grezze[i - 1].pagina);

  // Dedup per titolo (a volte l'indice compare due volte).
  const viste = new Set<string>();
  const uniche = sezioniOrdinate.filter((s) => {
    const k = `${s.titolo.toLowerCase()}|${s.pagina}`;
    if (viste.has(k)) return false;
    viste.add(k);
    return true;
  });

  const pagineTotali =
    pagineTotaliNote ?? (uniche.length ? Math.max(...uniche.map((s) => s.pagina)) : null);

  const sezioni: SezioneModello[] = uniche.map((s, i) => {
    const succ = uniche.slice(i + 1).find((x) => x.livello <= s.livello);
    const fine = succ ? succ.pagina : pagineTotali ?? s.pagina;
    const pagine = fine >= s.pagina ? fine - s.pagina : null;
    return { ...s, pagine: pagine && pagine > 0 ? pagine : null, ruolo: classificaRuolo(s.titolo) };
  });

  const note: string[] = [];
  if (sezioni.length === 0) {
    note.push('Nessun indice riconoscibile in questo PDF: forse è scansionato o senza sommario. Prova con un altro modello.');
  } else if (sezioni.length < 3) {
    note.push('Indice riconosciuto solo in parte: controlla che il PDF abbia un sommario con i numeri di pagina.');
  }
  return { pagineTotali, sezioni, note };
}

// Da più modelli dello stesso corso emerge un profilo del dipartimento: cosa si
// ripete. Osservazioni prudenti, non regole.
export function profiloComune(modelli: ProfiloModello[]): string[] {
  const validi = modelli.filter((m) => m.sezioni.length >= 3);
  if (validi.length < 2) return [];
  const oss: string[] = [];

  const ha = (m: ProfiloModello, r: RuoloSezione) => m.sezioni.some((s) => s.ruolo === r);
  const primaDi = (m: ProfiloModello, a: RuoloSezione, b: RuoloSezione) => {
    const pa = m.sezioni.find((s) => s.ruolo === a)?.pagina;
    const pb = m.sezioni.find((s) => s.ruolo === b)?.pagina;
    return pa != null && pb != null && pa < pb;
  };

  if (validi.every((m) => ha(m, 'abstract'))) oss.push('L’abstract è sempre presente, in apertura.');
  if (validi.every((m) => ha(m, 'metodo') && ha(m, 'risultati'))) {
    if (validi.every((m) => primaDi(m, 'metodo', 'risultati')))
      oss.push('Il metodo viene sempre prima dei risultati.');
  }
  if (validi.every((m) => ha(m, 'letteratura')))
    oss.push('C’è sempre un capitolo di rassegna della letteratura.');

  const capitoliL1 = validi.map((m) => m.sezioni.filter((s) => s.livello === 1).length);
  const media = Math.round(capitoliL1.reduce((a, b) => a + b, 0) / capitoliL1.length);
  if (media > 0) oss.push(`In media ${media} capitoli di primo livello.`);

  return oss;
}
