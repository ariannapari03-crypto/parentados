import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  corsiPubblicabili, corsoPerId, idDaSlug, slugCorso,
  scadenzeConfermatePerDipartimento, regoleConfermatePerCorso, ultimaVerifica,
  type ScadenzaPubblica, type RegolaPubblica,
} from '@/lib/pubbliche';

// Pagine pubbliche, una per corso, generate staticamente (SEO). [compito ⑥]
// Mostrano solo dati confermati [inv. 4], con la fonte accanto a ogni
// affermazione [inv. 2], le lacune in chiaro [inv. 1] e i consigli come tali
// [inv. 9].

// Generazione statica: una pagina per ogni corso pubblicabile.
export async function generateStaticParams() {
  const corsi = await corsiPubblicabili();
  return corsi.map((c) => ({ slug: slugCorso(c) }));
}

// Rigenera al più ogni ora se usata in modalità ISR; con dati statici resta
// comunque servita dalla build.
export const revalidate = 3600;
export const dynamicParams = true;

async function caricaCorso(slug: string) {
  const id = idDaSlug(slug);
  if (id == null) return null;
  const corso = await corsoPerId(id);
  if (!corso) return null;
  const [scadenze, regole] = await Promise.all([
    corso.dipartimento_id ? scadenzeConfermatePerDipartimento(corso.dipartimento_id) : Promise.resolve([]),
    regoleConfermatePerCorso(corso.id),
  ]);
  return { corso, scadenze, regole };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dati = await caricaCorso(slug);
  if (!dati) return { title: 'Corso non trovato' };
  const { corso } = dati;
  const titolo = `Tesi e prova finale — ${corso.nome}${corso.ateneo_nome ? ` · ${corso.ateneo_nome}` : ''}`;
  return {
    title: titolo,
    description: `Regole e scadenze della prova finale per ${corso.nome}${corso.ateneo_nome ? ` (${corso.ateneo_nome})` : ''}: date delle sessioni, requisiti e vincoli, con la fonte ufficiale accanto a ogni dato.`,
    alternates: { canonical: `/corso/${slug}` },
  };
}

export default async function PaginaCorso({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dati = await caricaCorso(slug);
  if (!dati) notFound();
  const { corso, scadenze, regole } = dati;
  const verifica = ultimaVerifica(scadenze, regole);

  const perSessione = raggruppaPerSessione(scadenze);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: corso.nome,
    provider: { '@type': 'CollegeOrUniversity', name: corso.ateneo_nome },
    ...(corso.url_prova_finale ? { url: corso.url_prova_finale } : {}),
    ...(verifica ? { dateModified: verifica } : {}),
  };

  return (
    <main style={S.main}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={S.crumb}><a href="/corsi">Tutti i corsi</a></nav>

      <header>
        <div style={S.contesto}>
          {corso.ateneo_nome}
          {corso.dipartimento_nome ? ` · ${corso.dipartimento_nome}` : ''}
          {corso.livello ? ` · ${corso.livello}` : ''}
          {corso.classe ? ` · ${corso.classe}` : ''}
        </div>
        <h1 style={S.h1}>Tesi e prova finale — {corso.nome}</h1>
        <p style={S.verifica}>
          {verifica
            ? <>Ultima verifica: <strong>{formattaData(verifica)}</strong>.</>
            : <>Dati in corso di verifica.</>}
          {corso.url_prova_finale && (
            <> Pagina ufficiale del corso: <a href={corso.url_prova_finale} target="_blank" rel="noreferrer">fonte</a>.</>
          )}
        </p>
      </header>

      <section>
        <h2 style={S.h2}>Scadenze delle sessioni</h2>
        {scadenze.length === 0 ? (
          <p style={S.vuoto}>Nessuna scadenza confermata per questo dipartimento.</p>
        ) : (
          perSessione.map(({ chiave, titolo, righe }) => (
            <div key={chiave} style={S.blocco}>
              <h3 style={S.h3}>{titolo}</h3>
              <table style={S.tabella}>
                <thead>
                  <tr><th style={S.th}>Adempimento</th><th style={S.th}>Data</th><th style={S.th}>Fonte</th></tr>
                </thead>
                <tbody>
                  {righe.map((sc) => (
                    <tr key={sc.id}>
                      <td style={S.td}>
                        {sc.nome ?? etichettaTipo(sc.tipo)}
                        {sc.blocca && <span style={S.perentoria}>perentoria</span>}
                      </td>
                      <td style={S.td}>{renderData(sc)}</td>
                      <td style={S.td}><Fonte url={sc.fonte_url} citazione={sc.fonte_citazione} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      <section>
        <h2 style={S.h2}>Regole della prova finale</h2>
        {regole.length === 0 ? (
          <p style={S.vuoto}>Nessuna regola confermata per questo corso.</p>
        ) : (
          <ul style={S.listaRegole}>
            {regole.map((r) => (
              <li key={r.id} style={S.regola}>
                <div style={S.regolaTesto}>
                  {r.testo}
                  {r.vincolante
                    ? <span style={S.vincolante}>vincolante</span>
                    : <span style={S.consiglio}>indicazione, non vincolante</span>}
                </div>
                <Fonte url={r.fonte_url} citazione={r.fonte_citazione} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer style={S.footer}>
        <p>
          I dati sono raccolti dalle pagine ufficiali dei corsi e verificati a mano prima
          della pubblicazione. Ogni affermazione riporta la fonte da cui è tratta. In caso di
          discordanza, fa fede quanto pubblicato dall'ateneo.
        </p>
      </footer>
    </main>
  );
}

function Fonte({ url, citazione }: { url: string; citazione: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" title={citazione} style={S.fonte}>
      fonte
    </a>
  );
}

function renderData(sc: ScadenzaPubblica) {
  if (!sc.data_da) return <em style={S.lacuna}>non pubblicata</em>;
  return sc.data_a && sc.data_a !== sc.data_da
    ? `${formattaData(sc.data_da)} – ${formattaData(sc.data_a)}`
    : formattaData(sc.data_da);
}

function raggruppaPerSessione(scadenze: ScadenzaPubblica[]) {
  const mappa = new Map<string, { chiave: string; titolo: string; righe: ScadenzaPubblica[] }>();
  for (const sc of scadenze) {
    const chiave = `${sc.anno_accademico}·${sc.sessione_nome}`;
    if (!mappa.has(chiave)) {
      mappa.set(chiave, { chiave, titolo: `${sc.sessione_nome} — a.a. ${sc.anno_accademico}`, righe: [] });
    }
    mappa.get(chiave)!.righe.push(sc);
  }
  return [...mappa.values()];
}

function etichettaTipo(tipo: string): string {
  const m: Record<string, string> = {
    domanda_laurea: 'Domanda di laurea',
    consegna_tesi: 'Consegna dell’elaborato',
    seduta: 'Seduta di laurea',
  };
  return m[tipo] ?? tipo;
}

function formattaData(iso: string): string {
  const [a, m, g] = iso.split('-');
  return `${g}/${m}/${a}`;
}

const S: Record<string, React.CSSProperties> = {
  main: { maxWidth: 760, margin: '2rem auto', padding: '0 1rem', fontFamily: 'Georgia, "Times New Roman", serif', color: '#1a1a1a', lineHeight: 1.5 },
  crumb: { fontSize: 13, marginBottom: 16, fontFamily: 'system-ui, sans-serif' },
  contesto: { fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'system-ui, sans-serif' },
  h1: { fontSize: 30, margin: '6px 0 8px', lineHeight: 1.2 },
  verifica: { fontSize: 14, color: '#374151', fontFamily: 'system-ui, sans-serif' },
  h2: { fontSize: 22, marginTop: 32, borderBottom: '2px solid #111', paddingBottom: 4 },
  h3: { fontSize: 17, marginTop: 20, marginBottom: 6 },
  blocco: { marginBottom: 8 },
  tabella: { width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui, sans-serif', fontSize: 14 },
  th: { textAlign: 'left', borderBottom: '1px solid #d1d5db', padding: '6px 8px', color: '#374151', fontWeight: 600 },
  td: { borderBottom: '1px solid #eee', padding: '6px 8px', verticalAlign: 'top' },
  perentoria: { fontSize: 11, color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 4, padding: '0 5px', marginLeft: 6 },
  lacuna: { color: '#b45309' },
  listaRegole: { listStyle: 'none', padding: 0, fontFamily: 'system-ui, sans-serif' },
  regola: { padding: '10px 0', borderBottom: '1px solid #eee', fontSize: 15 },
  regolaTesto: { marginBottom: 4 },
  vincolante: { fontSize: 11, color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 4, padding: '0 5px', marginLeft: 6 },
  consiglio: { fontSize: 11, color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, padding: '0 5px', marginLeft: 6 },
  fonte: { fontSize: 13, color: '#2563eb', fontFamily: 'system-ui, sans-serif' },
  vuoto: { color: '#6b7280', fontStyle: 'italic' },
  footer: { marginTop: 40, paddingTop: 16, borderTop: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280', fontFamily: 'system-ui, sans-serif' },
};
