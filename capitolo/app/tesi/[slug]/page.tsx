import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  corsoPerId, idDaSlug,
  scadenzeConfermatePerDipartimento, regoleConfermatePerCorso, ultimaVerifica,
  type ScadenzaPubblica,
} from '@/lib/pubbliche';
import { giorniA, testoCountdown, etichettaTipoScadenza } from '@/lib/tesi';
import { Checklist } from './Checklist';
import { Assistente } from './Assistente';
import { Impianto } from './Impianto';
import { Bibliografia } from './Bibliografia';
import { Modelli } from './Modelli';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // l'assistente chiama il modello

async function carica(slug: string) {
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
  const dati = await carica(slug);
  if (!dati) return { title: 'Corso non trovato' };
  return { title: `La tua tesi — ${dati.corso.nome}`, alternates: { canonical: `/tesi/${slug}` } };
}

function formatta(iso: string): string {
  const [a, m, g] = iso.split('-');
  return `${g}/${m}/${a}`;
}

function Fonte({ url, citazione }: { url: string; citazione: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" title={citazione} style={{ fontSize: 13, color: '#1d4ed8' }}>
      fonte
    </a>
  );
}

export default async function ScrivaniaTesi({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dati = await carica(slug);
  if (!dati) notFound();
  const { corso, scadenze, regole } = dati;
  const verifica = ultimaVerifica(scadenze, regole);

  // le scadenze con data, ordinate per vicinanza; le lacune a parte
  const conData = scadenze.filter((s) => s.data_da) as ScadenzaPubblica[];
  const lacune = scadenze.filter((s) => !s.data_da);
  const prossime = [...conData].sort((a, b) => (a.data_da! < b.data_da! ? -1 : 1));

  const puntiRegole = regole.map((r) => r.testo);

  // La regola di lunghezza del corso, se confermata: entra nell'impianto con la
  // sua fonte reale. Il template dell'impianto è invece una consuetudine, e come
  // tale è dichiarato — non gli si attribuisce una fonte d'ateneo. [inv. 2, 9]
  const rl = regole.find(
    (r) => r.tipo === 'lunghezza' || /lunghezz|battut|pagine|parole|cartelle/i.test(r.testo)
  );
  const regolaLunghezza = rl
    ? { testo: rl.testo, vincolante: rl.vincolante, fonte_url: rl.fonte_url, fonte_citazione: rl.fonte_citazione }
    : null;

  return (
    <main style={S.main}>
      <nav style={{ fontSize: 13, marginBottom: 12 }}><a href="/tesi">← Cambia corso</a></nav>
      <div style={S.contesto}>
        {corso.ateneo_nome}
        {corso.dipartimento_nome ? ` · ${corso.dipartimento_nome}` : ''}
        {corso.livello ? ` · ${corso.livello}` : ''}
      </div>
      <h1 style={{ fontSize: 28, margin: '4px 0 6px' }}>La tua tesi — {corso.nome}</h1>
      <p style={{ fontSize: 14, color: '#374151' }}>
        {verifica ? <>Ultima verifica: <strong>{formatta(verifica)}</strong>. </> : 'Dati in corso di verifica. '}
        I dati sono verificati a mano e ogni riga porta la sua fonte.
      </p>

      {/* L'IMPIANTO — la spina dorsale (§ 3 Momento 2) */}
      <section style={{ marginTop: 24 }}>
        <h2 style={S.h2}>L’impianto</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          La domanda di ricerca in cima, l’indice sotto. Il template è una consuetudine, non una
          regola: guida, non blocca. Tutto resta sul tuo dispositivo.
        </p>
        <Impianto slug={slug} regolaLunghezza={regolaLunghezza} />
      </section>

      {/* MODELLI — tesi simili, solo l'ossatura (§ 3 Momento 2) */}
      <section style={{ marginTop: 28 }}>
        <h2 style={S.h2}>Modelli</h2>
        <Modelli slug={slug} />
      </section>

      {/* BIBLIOGRAFIA + SCOUT (§ 4) */}
      <section style={{ marginTop: 28 }}>
        <h2 style={S.h2}>Bibliografia</h2>
        <Bibliografia slug={slug} />
      </section>

      {/* SCADENZE */}
      <section style={{ marginTop: 24 }}>
        <div style={S.rigaTitolo}>
          <h2 style={S.h2}>Scadenze</h2>
          {prossime.length > 0 && (
            <a href={`/tesi/${slug}/calendario`} style={S.btnCal}>Aggiungi al calendario (.ics)</a>
          )}
        </div>
        {scadenze.length === 0 ? (
          <p style={S.vuoto}>Nessuna scadenza confermata per ora.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {prossime.map((s) => {
              const g = giorniA(s.data_da);
              const passata = g !== null && g < 0;
              return (
                <li key={s.id} style={{ ...S.scadenza, opacity: passata ? 0.55 : 1 }}>
                  <div>
                    <strong>{s.nome ?? etichettaTipoScadenza(s.tipo)}</strong>
                    {s.blocca && <span style={S.perentoria}>perentoria</span>}
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{s.sessione_nome} · a.a. {s.anno_accademico}</div>
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div>{formatta(s.data_da!)}</div>
                    <div style={{ fontSize: 13, color: passata ? '#9ca3af' : '#059669' }}>{testoCountdown(g)}</div>
                    <Fonte url={s.fonte_url} citazione={s.fonte_citazione} />
                  </div>
                </li>
              );
            })}
            {lacune.map((s) => (
              <li key={s.id} style={S.scadenza}>
                <div><strong>{s.nome ?? etichettaTipoScadenza(s.tipo)}</strong>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{s.sessione_nome} · a.a. {s.anno_accademico}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <em style={{ color: '#b45309' }}>data non pubblicata</em><br />
                  <Fonte url={s.fonte_url} citazione={s.fonte_citazione} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* REGOLE */}
      <section style={{ marginTop: 28 }}>
        <h2 style={S.h2}>Regole del corso</h2>
        {regole.length === 0 ? (
          <p style={S.vuoto}>Nessuna regola confermata per ora.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {regole.map((r) => (
              <li key={r.id} style={S.regola}>
                <div>{r.testo}
                  {r.vincolante ? <span style={S.vincolante}>vincolante</span> : <span style={S.consiglio}>indicazione</span>}
                </div>
                <Fonte url={r.fonte_url} citazione={r.fonte_citazione} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* CHECKLIST */}
      <section style={{ marginTop: 28 }}>
        <h2 style={S.h2}>Checklist</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Struttura tipica + i punti del tuo corso. È una guida: non blocca nulla, le spunte restano sul tuo dispositivo.
        </p>
        <Checklist slug={slug} puntiRegole={puntiRegole} />
      </section>

      {/* ASSISTENTE */}
      <Assistente slug={slug} />

      <footer style={S.footer}>
        In caso di dubbio fa fede quanto pubblicato dall'ateneo. Ogni dato qui riporta la fonte ufficiale.
      </footer>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: { maxWidth: 720, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif', color: '#111', lineHeight: 1.5 },
  contesto: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  rigaTitolo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  h2: { fontSize: 20, borderBottom: '2px solid #111', paddingBottom: 4, margin: 0 },
  btnCal: { fontSize: 13, padding: '6px 12px', border: '1px solid #059669', borderRadius: 8, color: '#065f46', background: '#ecfdf5', textDecoration: 'none' },
  scadenza: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid #eee' },
  perentoria: { fontSize: 11, color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 4, padding: '0 5px', marginLeft: 6 },
  regola: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid #eee' },
  vincolante: { fontSize: 11, color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 4, padding: '0 5px', marginLeft: 6 },
  consiglio: { fontSize: 11, color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, padding: '0 5px', marginLeft: 6 },
  vuoto: { color: '#6b7280', fontStyle: 'italic' },
  footer: { marginTop: 40, paddingTop: 16, borderTop: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280' },
};
