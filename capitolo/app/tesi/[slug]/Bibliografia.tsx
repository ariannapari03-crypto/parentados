'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  type Riferimento,
  type VoceCrossref,
  rifDaCrossref,
  citazioneBreve,
  linkFonte,
  urlRicercaCrossref,
  urlDaDoi,
  fontiDiPartenza,
} from '@/lib/bibliografia';
import { sezioniPiatte, type Impianto, type SezionePiatta } from '@/lib/impianto';

// Il gestore bibliografico + lo scout. Ogni fonte si lega a un capitolo
// dell'impianto (la cosa che nessun gestore fa). Lo scout cerca su Crossref
// (catalogo verificabile) e non genera mai riferimenti. Stato nel browser.

function idNuovo(): string {
  return `r${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function Bibliografia({ slug }: { slug: string }) {
  const chiave = `capitolo-biblio-${slug}`;
  const chiaveImpianto = `capitolo-impianto-${slug}`;
  const [rifs, setRifs] = useState<Riferimento[]>([]);
  const [caricato, setCaricato] = useState(false);
  const [capitoli, setCapitoli] = useState<SezionePiatta[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(chiave);
      if (raw) setRifs(JSON.parse(raw));
    } catch { /* si parte vuoti */ }
    try {
      const rawImp = localStorage.getItem(chiaveImpianto);
      if (rawImp) {
        const imp = JSON.parse(rawImp) as Impianto;
        setCapitoli(sezioniPiatte(imp.sezioni ?? []));
      }
    } catch { /* niente impianto: le fonti restano non assegnate */ }
    setCaricato(true);
  }, [chiave, chiaveImpianto]);

  function salva(nuovi: Riferimento[]) {
    setRifs(nuovi);
    try { localStorage.setItem(chiave, JSON.stringify(nuovi)); } catch { /* ignora */ }
  }
  const aggiungi = (r: Omit<Riferimento, 'id'>) => {
    // niente doppioni sullo stesso DOI
    if (r.doi && rifs.some((x) => x.doi && x.doi.toLowerCase() === r.doi!.toLowerCase())) return;
    salva([...rifs, { ...r, id: idNuovo() }]);
  };
  const modifica = (id: string, patch: Partial<Riferimento>) =>
    salva(rifs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const elimina = (id: string) => salva(rifs.filter((r) => r.id !== id));

  const nomeCapitolo = (id: string | null | undefined) => {
    if (!id) return null;
    const c = capitoli.find((x) => x.id === id);
    return c ? `${c.numero} ${c.titolo}` : null;
  };

  // raggruppa per capitolo, nell'ordine dell'indice; le non assegnate in fondo
  const gruppi = useMemo(() => {
    const perCap = new Map<string, Riferimento[]>();
    for (const c of capitoli) perCap.set(c.id, []);
    const nonAssegnate: Riferimento[] = [];
    for (const r of rifs) {
      if (r.capitoloId && perCap.has(r.capitoloId)) perCap.get(r.capitoloId)!.push(r);
      else nonAssegnate.push(r);
    }
    const out: { chiave: string; etichetta: string; voci: Riferimento[] }[] = [];
    for (const c of capitoli) {
      const voci = perCap.get(c.id)!;
      if (voci.length) out.push({ chiave: c.id, etichetta: `${c.numero} ${c.titolo}`, voci });
    }
    if (nonAssegnate.length) out.push({ chiave: '·', etichetta: 'Non assegnate a un capitolo', voci: nonAssegnate });
    return out;
  }, [rifs, capitoli]);

  const daLeggere = rifs.filter((r) => !r.letta).length;

  if (!caricato) return null;

  return (
    <div>
      <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
        Cerca su Crossref e lega ogni fonte a un capitolo. Lo scout propone solo voci reali con
        DOI: <em>niente entra da solo e niente si cita senza averlo aperto.</em>
      </p>

      {/* SCOUT */}
      <Scout capitoli={capitoli} onAggiungi={aggiungi} />

      {/* AGGIUNTA MANUALE / DA DOI */}
      <Manuale capitoli={capitoli} onAggiungi={aggiungi} />

      {/* ELENCO per capitolo */}
      <div style={{ marginTop: 18 }}>
        <div style={S.rigaTitolo}>
          <span style={S.etichetta}>La tua bibliografia · {rifs.length} fonti</span>
          {daLeggere > 0 && <span style={{ fontSize: 13, color: '#7A1E32' }}>{daLeggere} da leggere</span>}
        </div>

        {rifs.length === 0 ? (
          <div style={{ marginTop: 8 }}>
            <p style={S.vuoto}>Nessuna fonte per ora. La bibliografia si costruisce dal primo giorno.</p>
            <button onClick={() => salva(fontiDiPartenza().map((r) => ({ ...r, id: idNuovo() })))} style={S.btn}>
              Carica 16 fonti di partenza (da leggere)
            </button>
          </div>
        ) : (
          gruppi.map((g) => (
            <div key={g.chiave} style={{ marginTop: 14 }}>
              <div style={S.capTitolo}>{g.etichetta}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {g.voci.map((r) => (
                  <li key={r.id} style={S.voce}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', flex: 1 }}>
                      <input
                        type="checkbox" checked={r.letta}
                        onChange={(e) => modifica(r.id, { letta: e.target.checked })}
                        title="Segna come letta"
                      />
                      <span style={{ fontSize: 14, color: r.letta ? '#14161A' : '#6b7280' }}>
                        {citazioneBreve(r)}{' '}
                        {linkFonte(r) && (
                          <a href={linkFonte(r)!} target="_blank" rel="noreferrer" style={S.link}>
                            {r.doi ? `doi:${r.doi}` : 'link'}
                          </a>
                        )}
                        {!r.letta && <em style={{ color: '#7A1E32', fontSize: 12 }}> · da leggere</em>}
                      </span>
                    </label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                      <SelectCapitolo
                        capitoli={capitoli}
                        valore={r.capitoloId ?? ''}
                        onChange={(v) => modifica(r.id, { capitoloId: v || null })}
                      />
                      <button onClick={() => elimina(r.id)} style={S.btnMini} title="Rimuovi">×</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* CONTROLLO citate/non citate: possibile solo col testo della tesi, che non abbiamo qui */}
    </div>
  );
}

// --- lo scout ---------------------------------------------------------------

function Scout({ capitoli, onAggiungi }: { capitoli: SezionePiatta[]; onAggiungi: (r: Omit<Riferimento, 'id'>) => void }) {
  const [q, setQ] = useState('');
  const [cerco, setCerco] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [risultati, setRisultati] = useState<Omit<Riferimento, 'id' | 'capitoloId' | 'letta'>[] | null>(null);

  async function cerca() {
    if (!q.trim()) return;
    setCerco(true); setErrore(null); setRisultati(null);
    try {
      const res = await fetch(urlRicercaCrossref(q), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Crossref ha risposto ${res.status}`);
      const dati = await res.json();
      const voci: VoceCrossref[] = dati?.message?.items ?? [];
      setRisultati(voci.map(rifDaCrossref));
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'ricerca non riuscita');
    } finally {
      setCerco(false);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <span style={S.etichetta}>Cerca una fonte</span>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && cerca()}
          placeholder="es. two-sided markets, conjoint willingness to pay…"
          style={S.input}
        />
        <button onClick={cerca} disabled={cerco} style={S.btn}>{cerco ? 'cerco…' : 'Cerca'}</button>
      </div>
      {errore && <p style={{ color: '#7A1E32', fontSize: 13, marginTop: 6 }}>Ricerca non riuscita: {errore}. Riprova fra poco.</p>}
      {risultati && risultati.length === 0 && <p style={S.vuoto}>Nessun risultato su Crossref.</p>}
      {risultati && risultati.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
          {risultati.map((r, i) => (
            <RigaRisultato key={r.doi ?? i} rif={r} capitoli={capitoli} onAggiungi={onAggiungi} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RigaRisultato({
  rif, capitoli, onAggiungi,
}: {
  rif: Omit<Riferimento, 'id' | 'capitoloId' | 'letta'>;
  capitoli: SezionePiatta[];
  onAggiungi: (r: Omit<Riferimento, 'id'>) => void;
}) {
  const [cap, setCap] = useState('');
  const [aggiunto, setAggiunto] = useState(false);
  const finto: Riferimento = { ...rif, id: 'x', capitoloId: null, letta: false };
  return (
    <li style={S.voce}>
      <span style={{ fontSize: 14, flex: 1 }}>
        {citazioneBreve(finto)}{' '}
        {rif.doi && <a href={`https://doi.org/${rif.doi}`} target="_blank" rel="noreferrer" style={S.link}>doi:{rif.doi}</a>}
      </span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <SelectCapitolo capitoli={capitoli} valore={cap} onChange={setCap} />
        <button
          onClick={() => { onAggiungi({ ...rif, capitoloId: cap || null, letta: false }); setAggiunto(true); }}
          disabled={aggiunto}
          style={S.btnMini}
        >
          {aggiunto ? '✓ aggiunta' : '+ aggiungi'}
        </button>
      </div>
    </li>
  );
}

// --- aggiunta manuale / da DOI ---------------------------------------------

function Manuale({ capitoli, onAggiungi }: { capitoli: SezionePiatta[]; onAggiungi: (r: Omit<Riferimento, 'id'>) => void }) {
  const [doi, setDoi] = useState('');
  const [statoDoi, setStatoDoi] = useState<string | null>(null);

  async function daDoi() {
    if (!doi.trim()) return;
    setStatoDoi('cerco…');
    try {
      const res = await fetch(urlDaDoi(doi), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      const dati = await res.json();
      if (!dati?.message) throw new Error('non trovato');
      onAggiungi({ ...rifDaCrossref(dati.message), capitoloId: null, letta: false });
      setDoi(''); setStatoDoi(null);
    } catch (e) {
      setStatoDoi(`DOI non trovato (${e instanceof Error ? e.message : 'errore'})`);
    }
  }

  return (
    <details style={{ marginTop: 12 }}>
      <summary style={S.summary}>Aggiungi da un DOI (o a mano)</summary>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.1287/mnsc.1050.0400" style={S.input} />
        <button onClick={daDoi} style={S.btn}>Cerca il DOI</button>
      </div>
      {statoDoi && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{statoDoi}</p>}
      <FormManuale capitoli={capitoli} onAggiungi={onAggiungi} />
    </details>
  );
}

function FormManuale({ capitoli, onAggiungi }: { capitoli: SezionePiatta[]; onAggiungi: (r: Omit<Riferimento, 'id'>) => void }) {
  const [f, setF] = useState({ autori: '', anno: '', titolo: '', rivista: '', cap: '' });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      <input value={f.titolo} onChange={(e) => set('titolo', e.target.value)} placeholder="Titolo" style={{ ...S.input, gridColumn: '1 / -1' }} />
      <input value={f.autori} onChange={(e) => set('autori', e.target.value)} placeholder="Autori (Rossi, M. & …)" style={S.input} />
      <input value={f.anno} onChange={(e) => set('anno', e.target.value)} placeholder="Anno" style={S.input} />
      <input value={f.rivista} onChange={(e) => set('rivista', e.target.value)} placeholder="Rivista o editore" style={S.input} />
      <div style={{ display: 'flex', gap: 6 }}>
        <SelectCapitolo capitoli={capitoli} valore={f.cap} onChange={(v) => set('cap', v)} />
        <button
          onClick={() => {
            if (!f.titolo.trim()) return;
            onAggiungi({ titolo: f.titolo, autori: f.autori || '—', anno: f.anno, rivista: f.rivista || undefined, capitoloId: f.cap || null, letta: false });
            setF({ autori: '', anno: '', titolo: '', rivista: '', cap: '' });
          }}
          style={S.btn}
        >
          Aggiungi
        </button>
      </div>
    </div>
  );
}

function SelectCapitolo({ capitoli, valore, onChange }: { capitoli: SezionePiatta[]; valore: string; onChange: (v: string) => void }) {
  return (
    <select value={valore} onChange={(e) => onChange(e.target.value)} style={S.select} title="Capitolo">
      <option value="">— capitolo —</option>
      {capitoli.map((c) => (
        <option key={c.id} value={c.id}>{c.numero} {c.titolo}</option>
      ))}
    </select>
  );
}

const S: Record<string, React.CSSProperties> = {
  etichetta: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#7A7C82' },
  rigaTitolo: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  input: { flex: 1, padding: '6px 8px', fontFamily: 'inherit', fontSize: 14, border: '1px solid #14161A22', borderRadius: 6, minWidth: 0 },
  select: { fontSize: 12, padding: '4px 6px', border: '1px solid #14161A22', borderRadius: 6, background: '#fff', maxWidth: 160 },
  btn: { padding: '6px 12px', fontSize: 14, background: '#2E4A7D', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnMini: { fontSize: 12, border: '1px solid #14161A22', background: '#fff', borderRadius: 6, cursor: 'pointer', padding: '3px 8px', whiteSpace: 'nowrap' },
  summary: { fontSize: 14, cursor: 'pointer', color: '#2E4A7D' },
  capTitolo: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#2E4A7D', borderBottom: '1px solid #14161A22', paddingBottom: 3 },
  voce: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #eee', flexWrap: 'wrap' },
  link: { fontSize: 13, color: '#2E4A7D' },
  vuoto: { color: '#6b7280', fontStyle: 'italic', fontSize: 14 },
};
