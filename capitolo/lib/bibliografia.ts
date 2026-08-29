// Gestore bibliografico dello studente (§ 4 del brief). La cosa che nessun
// gestore fa: legare ogni fonte al capitolo in cui verrà usata.
//
// Lo «scout» cerca su un catalogo VERIFICABILE (Crossref) e non genera mai
// riferimenti: propone solo voci reali, ognuna con un DOI cliccabile. Niente
// entra da solo, e ogni fonte porta il flag «letta» — una bibliografia che
// cresce senza che tu l'abbia letta ti affonda in sede di discussione.

export type RifTipo = 'articolo' | 'libro' | 'capitolo' | 'report' | 'dataset' | 'altro';

export interface Riferimento {
  id: string;
  titolo: string;
  autori: string;
  anno: string;
  rivista?: string; // rivista o editore
  doi?: string;
  url?: string;
  tipo?: RifTipo;
  capitoloId?: string | null; // id della sezione dell'impianto, o null = non assegnata
  letta: boolean; // niente si cita senza averla aperta
  note?: string;
}

// Voce grezza da Crossref (solo i campi che usiamo).
export interface VoceCrossref {
  DOI?: string;
  title?: string[];
  author?: { given?: string; family?: string; name?: string }[];
  issued?: { 'date-parts'?: number[][] };
  'container-title'?: string[];
  publisher?: string;
  type?: string;
}

const TIPO_DA_CROSSREF: Record<string, RifTipo> = {
  'journal-article': 'articolo',
  book: 'libro',
  'book-chapter': 'capitolo',
  monograph: 'libro',
  report: 'report',
  dataset: 'dataset',
};

// «Rossi, M.» da {given:'Mario', family:'Rossi'}. Iniziali dai nomi propri.
function autore(a: { given?: string; family?: string; name?: string }): string {
  if (a.family) {
    const iniziali = (a.given ?? '')
      .split(/[\s.-]+/)
      .filter(Boolean)
      .map((p) => p[0].toUpperCase() + '.')
      .join(' ');
    return iniziali ? `${a.family}, ${iniziali}` : a.family;
  }
  return a.name ?? '';
}

// Fino a 3 autori uniti da «&»; oltre, «Primo et al.».
export function formattaAutori(autori?: { given?: string; family?: string; name?: string }[]): string {
  if (!autori || autori.length === 0) return '—';
  const nomi = autori.map(autore).filter(Boolean);
  if (nomi.length === 0) return '—';
  if (nomi.length <= 3) return nomi.join(' & ');
  return `${nomi[0]} et al.`;
}

// Converte una voce Crossref in un riferimento (senza id/capitolo/letta: quelli
// si assegnano al momento dell'aggiunta). Mai inventa: se un campo manca, resta
// vuoto.
export function rifDaCrossref(v: VoceCrossref): Omit<Riferimento, 'id' | 'capitoloId' | 'letta'> {
  const anno = v.issued?.['date-parts']?.[0]?.[0];
  return {
    titolo: v.title?.[0]?.trim() ?? '(senza titolo)',
    autori: formattaAutori(v.author),
    anno: anno ? String(anno) : '',
    rivista: v['container-title']?.[0] ?? v.publisher,
    doi: v.DOI,
    tipo: v.type ? TIPO_DA_CROSSREF[v.type] ?? 'altro' : undefined,
  };
}

// Citazione breve e leggibile, per la lista.
export function citazioneBreve(r: Riferimento): string {
  const parti = [r.autori];
  if (r.anno) parti.push(`(${r.anno})`);
  let s = `${parti.join(' ')}. ${r.titolo}.`;
  if (r.rivista) s += ` ${r.rivista}.`;
  return s;
}

export function linkFonte(r: Riferimento): string | null {
  if (r.doi) return `https://doi.org/${r.doi}`;
  return r.url ?? null;
}

// URL dello scout: cerca su Crossref (catalogo verificabile, CORS aperto).
export function urlRicercaCrossref(query: string, righe = 8): string {
  const q = encodeURIComponent(query.trim());
  return `https://api.crossref.org/works?rows=${righe}&select=DOI,title,author,issued,container-title,publisher,type&query=${q}`;
}

export function urlDaDoi(doi: string): string {
  const pulito = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  return `https://api.crossref.org/works/${encodeURIComponent(pulito)}`;
}

// Fonti di partenza verificate per la tesi (dual-SaaS / conjoint / mixed methods).
// Sono proposte: vanno lette prima di citarle (letta:false).
export function fontiDiPartenza(): Omit<Riferimento, 'id'>[] {
  const r = (
    autori: string, anno: string, titolo: string, rivista: string, doi?: string, tipo: RifTipo = 'articolo'
  ): Omit<Riferimento, 'id'> => ({ autori, anno, titolo, rivista, doi, tipo, capitoloId: null, letta: false });
  return [
    r('Rochet, J.-C. & Tirole, J.', '2003', 'Platform Competition in Two-Sided Markets', 'Journal of the European Economic Association', '10.1162/154247603322493212'),
    r('Parker, G. G. & Van Alstyne, M. W.', '2005', 'Two-Sided Network Effects: A Theory of Information Product Design', 'Management Science', '10.1287/mnsc.1050.0400'),
    r('Hagiu, A. & Wright, J.', '2015', 'Multi-Sided Platforms', 'International Journal of Industrial Organization'),
    r('Rysman, M.', '2009', 'The Economics of Two-Sided Markets', 'Journal of Economic Perspectives'),
    r('Eisenmann, T., Parker, G. & Van Alstyne, M. W.', '2006', 'Strategies for Two-Sided Markets', 'Harvard Business Review'),
    r('Zeithaml, V. A.', '1988', 'Consumer Perceptions of Price, Quality, and Value', 'Journal of Marketing'),
    r('Sweeney, J. C. & Soutar, G. N.', '2001', 'Consumer Perceived Value: The Development of a Multiple Item Scale', 'Journal of Retailing'),
    r('Davis, F. D.', '1989', 'Perceived Usefulness, Perceived Ease of Use, and User Acceptance of Information Technology', 'MIS Quarterly'),
    r('Venkatesh, V., Thong, J. Y. L. & Xu, X.', '2012', 'Consumer Acceptance and Use of Information Technology: Extending UTAUT2', 'MIS Quarterly'),
    r('Venkatesh, V., Brown, S. A. & Bala, H.', '2013', 'Bridging the Qualitative–Quantitative Divide', 'MIS Quarterly', '10.25300/MISQ/2013/37.1.02'),
    r('Creswell, J. W. & Plano Clark, V. L.', '2018', 'Designing and Conducting Mixed Methods Research', 'SAGE', undefined, 'libro'),
    r('Green, P. E. & Srinivasan, V.', '1978', 'Conjoint Analysis in Consumer Research: Issues and Outlook', 'Journal of Consumer Research'),
    r('Green, P. E. & Srinivasan, V.', '1990', 'Conjoint Analysis in Marketing: New Developments', 'Journal of Marketing'),
    r('Miller, K. M., Hofstetter, R., Krohmer, H. & Zhang, Z. J.', '2011', "How Should Consumers' Willingness to Pay Be Measured?", 'Journal of Marketing Research', '10.1509/jmkr.48.1.172'),
    r('Wedel, M. & Kamakura, W. A.', '2000', 'Market Segmentation: Conceptual and Methodological Foundations', 'Springer', undefined, 'libro'),
    r('Reichheld, F. F.', '2003', 'The One Number You Need to Grow', 'Harvard Business Review'),
  ];
}
