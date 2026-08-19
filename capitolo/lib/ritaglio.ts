import { parse, type HTMLElement } from 'node-html-parser';

// Compito ③: ritaglio del contenuto prima della chiamata al modello.
//
// Il contenuto utile di queste pagine è spesso sotto il 5%: il resto è
// navigazione, piè di pagina, riquadri di servizio, script. Ritagliare riduce
// il costo di un ordine di grandezza. [inv. 7]
//
// Vincolo assoluto: NON perdere le tabelle di scadenze. Qualunque elemento che
// contiene una `<table>` è protetto dalla rimozione, anche se sta dentro un
// `<aside>` o un riquadro marcato come «di servizio». [convenzione: nessuna
// tabella persa]

// Tag che non contengono mai contenuto utile: si rimuovono sempre.
const TAG_RIMUOVI_SEMPRE = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'IFRAME', 'CANVAS',
  'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LINK', 'META',
]);

// Tag strutturali di navigazione/servizio: rumore, ma solo se non custodiscono
// una tabella.
const TAG_RUMORE = new Set(['NAV', 'HEADER', 'FOOTER', 'ASIDE', 'FORM']);

// Token di class/id che segnalano rumore. Confronto per token, non per
// sottostringa: 'header' sì, 'sub-header-of-content' no.
const TOKEN_RUMORE = new Set([
  'menu', 'nav', 'navbar', 'navigation', 'mainmenu', 'megamenu', 'mega-menu',
  'breadcrumb', 'breadcrumbs', 'cookie', 'cookiebar', 'cookie-banner', 'banner',
  'footer', 'header', 'topbar', 'social', 'share', 'condividi', 'sidebar',
  'toolbar', 'skiplink', 'skip-link', 'skip', 'search', 'ricerca', 'offcanvas',
  'widget', 'utility', 'utilities', 'language', 'lingua', 'lingue',
  'portletnavigationtree', 'portlet-navigation', 'sr-only', 'screen-reader',
]);

function tokenClasseId(el: HTMLElement): string[] {
  const classe = el.getAttribute('class') ?? '';
  const id = el.getAttribute('id') ?? '';
  return `${classe} ${id}`.split(/[\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
}

function contieneTabella(el: HTMLElement): boolean {
  return el.querySelector('table') !== null;
}

function deveRimuovere(el: HTMLElement): boolean {
  const tag = el.tagName?.toUpperCase();
  if (!tag) return false;
  if (TAG_RIMUOVI_SEMPRE.has(tag)) return true;
  // Protezione delle tabelle di scadenze: non toccare nulla che ne contenga una.
  if (contieneTabella(el)) return false;
  if (TAG_RUMORE.has(tag)) return true;
  if (el.getAttribute('role') === 'navigation' || el.getAttribute('role') === 'search') {
    return true;
  }
  if (el.getAttribute('aria-hidden') === 'true') return true;
  for (const token of tokenClasseId(el)) {
    if (TOKEN_RUMORE.has(token)) return true;
  }
  return false;
}

function normalizzaSpazi(testo: string): string {
  return testo.replace(/[ \t\r\f\v]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function normalizzaLinea(testo: string): string {
  return testo.replace(/\s+/g, ' ').trim();
}

// Rende una tabella come testo con separatori, così le celle non si fondono e
// il modello (e i test) vedono ogni data distintamente.
function tabellaInTesto(t: HTMLElement): string {
  const righe: string[] = [];
  for (const tr of t.querySelectorAll('tr')) {
    const celle = tr.querySelectorAll('td, th').map((c) => normalizzaLinea(c.text));
    if (celle.some((c) => c.length > 0)) righe.push(celle.join(' | '));
  }
  return righe.join('\n');
}

export interface EsitoRitaglio {
  testo: string;
  lunghezzaOriginale: number;
  lunghezzaRitagliata: number;
  frazione: number; // ritagliata / originale (0..1)
  tabelle: number; // quante tabelle conservate
}

export function ritaglia(html: string): EsitoRitaglio {
  const radice = parse(html, { comment: false });

  // 1. Rimuovi il rumore, proteggendo le tabelle.
  const daRimuovere: HTMLElement[] = [];
  for (const el of radice.querySelectorAll('*')) {
    if (deveRimuovere(el)) daRimuovere.push(el);
  }
  for (const el of daRimuovere) {
    if (el.parentNode) el.remove(); // salta i nodi già staccati con l'antenato
  }

  // 2. Estrai le tabelle come testo strutturato, poi toglile dall'albero per
  //    non contarle due volte nel testo di contorno.
  const testoTabelle: string[] = [];
  for (const t of radice.querySelectorAll('table')) {
    const reso = tabellaInTesto(t);
    if (reso.trim().length > 0) testoTabelle.push(reso);
    t.remove();
  }

  // 3. Componi: prosa ritagliata + tabelle rese.
  const testoResto = normalizzaSpazi(radice.text);
  const testo = [testoResto, ...testoTabelle].join('\n\n').trim();

  const lunghezzaOriginale = html.length;
  const lunghezzaRitagliata = testo.length;
  return {
    testo,
    lunghezzaOriginale,
    lunghezzaRitagliata,
    frazione: lunghezzaOriginale === 0 ? 0 : lunghezzaRitagliata / lunghezzaOriginale,
    tabelle: testoTabelle.length,
  };
}
