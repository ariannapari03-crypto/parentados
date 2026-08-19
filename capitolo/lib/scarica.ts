import { createHash } from 'node:crypto';
import { parse } from 'node-html-parser';
import { query } from './db';

// Compito ②: scaricare una pagina, conservare il grezzo integrale con l'hash,
// e SEGUIRE gli allegati (i PDF, tipicamente nel riquadro «In evidenza» di
// Plone). Traccia la catena pagina → allegato tramite `origine_id`. [inv. 5, 6]
//
// Nota di rete: gli script di produzione girano dove i siti degli atenei sono
// raggiungibili. La funzione `recupera` è iniettabile, così i test usano un
// server locale e non chiamano mai gli atenei.

export type TipoDocumento = 'html' | 'pdf' | 'altro';

export interface RisorsaRecuperata {
  corpo: Buffer;
  contentType: string | null;
  urlFinale: string; // dopo eventuali redirect
}

export type Recuperatore = (url: string) => Promise<RisorsaRecuperata>;

// Recuperatore predefinito: fetch globale. Segue i redirect.
export const recuperaConFetch: Recuperatore = async (url) => {
  const risposta = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'CapitoloBot/0.1 (+raccoglitore regole tesi)' },
  });
  if (!risposta.ok) {
    throw new Error(`GET ${url} ha risposto ${risposta.status}`);
  }
  const corpo = Buffer.from(await risposta.arrayBuffer());
  return {
    corpo,
    contentType: risposta.headers.get('content-type'),
    urlFinale: risposta.url || url,
  };
};

export function calcolaHash(corpo: Buffer): string {
  return createHash('sha256').update(corpo).digest('hex');
}

// Deduce il tipo dal content-type e, in mancanza, dall'estensione dell'URL.
export function deduciTipo(url: string, contentType: string | null): TipoDocumento {
  const ct = (contentType ?? '').toLowerCase();
  if (ct.includes('application/pdf')) return 'pdf';
  if (ct.includes('text/html')) return 'html';
  const percorso = url.split('?')[0].split('#')[0].toLowerCase();
  if (percorso.endsWith('.pdf') || percorso.includes('/@@download/')) return 'pdf';
  if (percorso.endsWith('.html') || percorso.endsWith('.htm')) return 'html';
  return 'altro';
}

// Un link è un allegato da seguire se punta a un PDF: estensione `.pdf` o
// percorso di download di Plone (`/@@download/`). Ignora ancore vuote, mailto,
// javascript e frammenti.
function eAllegatoPdf(urlAssoluto: string): boolean {
  const percorso = urlAssoluto.split('?')[0].split('#')[0].toLowerCase();
  return percorso.endsWith('.pdf') || percorso.includes('/@@download/');
}

// Estrae dagli `<a href>` gli URL assoluti dei PDF allegati, deduplicati e
// nell'ordine di apparizione. Risolve i link relativi rispetto a `baseUrl`.
// Cattura il riquadro «In evidenza» di Plone senza dipendere dalla sua classe:
// qualunque link a PDF nella pagina è un candidato. [inv. 5]
export function estraiAllegati(html: string, baseUrl: string): string[] {
  const radice = parse(html);
  const visti = new Set<string>();
  const risultato: string[] = [];
  for (const a of radice.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (!href) continue;
    const grezzo = href.trim();
    if (grezzo === '' || grezzo.startsWith('#')) continue;
    if (/^(mailto:|tel:|javascript:)/i.test(grezzo)) continue;
    let assoluto: string;
    try {
      assoluto = new URL(grezzo, baseUrl).toString();
    } catch {
      continue; // href malformato
    }
    if (!/^https?:/i.test(assoluto)) continue;
    if (!eAllegatoPdf(assoluto)) continue;
    const chiave = assoluto.split('#')[0];
    if (visti.has(chiave)) continue;
    visti.add(chiave);
    risultato.push(assoluto);
  }
  return risultato;
}

// Salva un documento conservando il grezzo integrale + hash. [inv. 6]
// Dedup: se esiste già una riga con lo stesso url E lo stesso hash, non ne crea
// una nuova (ri-eseguire lo scaricamento è idempotente). Se l'url c'è ma con
// hash diverso, inserisce comunque: è così che si vede che una pagina è
// cambiata.
export async function salvaDocumento(params: {
  url: string;
  tipo: TipoDocumento;
  corpo: Buffer;
  origineId?: number | null;
}): Promise<{ id: number; giaPresente: boolean }> {
  const hash = calcolaHash(params.corpo);
  const esistente = await query<{ id: string }>(
    'select id from documento where url = $1 and hash = $2 limit 1',
    [params.url, hash]
  );
  if (esistente.rows.length > 0) {
    return { id: Number(esistente.rows[0].id), giaPresente: true };
  }
  const inserito = await query<{ id: string }>(
    `insert into documento (url, tipo, contenuto_grezzo, hash, origine_id)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [params.url, params.tipo, params.corpo, hash, params.origineId ?? null]
  );
  return { id: Number(inserito.rows[0].id), giaPresente: false };
}

export interface EsitoScaricamento {
  paginaId: number;
  allegati: { url: string; documentoId: number }[];
}

// Scarica una pagina e i suoi allegati PDF, salvando tutto con grezzo + hash e
// legando ogni allegato alla pagina di origine. Restituisce gli id creati.
export async function scaricaConAllegati(
  url: string,
  opzioni: { recupera?: Recuperatore } = {}
): Promise<EsitoScaricamento> {
  const recupera = opzioni.recupera ?? recuperaConFetch;

  const pagina = await recupera(url);
  const tipoPagina = deduciTipo(pagina.urlFinale, pagina.contentType);
  const { id: paginaId } = await salvaDocumento({
    url: pagina.urlFinale,
    tipo: tipoPagina,
    corpo: pagina.corpo,
  });

  const allegati: { url: string; documentoId: number }[] = [];

  // Cerchiamo allegati solo se la pagina è HTML.
  if (tipoPagina === 'html') {
    const urlAllegati = estraiAllegati(pagina.corpo.toString('utf8'), pagina.urlFinale);
    for (const urlAllegato of urlAllegati) {
      const risorsa = await recupera(urlAllegato);
      const doc = await salvaDocumento({
        url: risorsa.urlFinale,
        tipo: deduciTipo(risorsa.urlFinale, risorsa.contentType),
        corpo: risorsa.corpo,
        origineId: paginaId,
      });
      allegati.push({ url: risorsa.urlFinale, documentoId: doc.id });
    }
  }

  return { paginaId, allegati };
}
