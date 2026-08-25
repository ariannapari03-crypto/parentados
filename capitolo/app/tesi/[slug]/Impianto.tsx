'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  type Disciplina,
  type Impianto as ImpiantoStato,
  type Sezione,
  type StatoSezione,
  STATI,
  LIVELLO_MAX,
  etichettaStato,
  statoSuccessivo,
  profiloDisciplina,
  impiantoIniziale,
  indiceIniziale,
  numeroDecimale,
  paginesSezione,
  avanzamento,
  avvisiImpianto,
} from '@/lib/impianto';

// L'impianto della tesi (§ 3 Momento 2). Domanda di ricerca in cima, indice ad
// albero con stati e pagine, avvisi che guidano senza bloccare [inv. 9].
// Tutto lo stato personale vive nel browser: niente account, niente DB.

type RegolaLunghezza = {
  testo: string;
  vincolante: boolean;
  fonte_url: string;
  fonte_citazione: string;
} | null;

const COLORI: Record<StatoSezione, string> = {
  vuota: '#9ca3af',
  in_bozza: '#7A7C82',
  prima_stesura: '#2E4A7D',
  revisionata: '#3B6B4F',
  chiusa: '#A98B3E',
};

function idNuovo(): string {
  return `s${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function sezioneVuota(titolo = 'Nuova sezione'): Sezione {
  return { id: idNuovo(), titolo, guida: '', pagineDa: null, pagineA: null, stato: 'vuota', figli: [] };
}

// --- operazioni immutabili sull'albero ------------------------------------

function mappa(sezioni: Sezione[], id: string, f: (s: Sezione) => Sezione): Sezione[] {
  return sezioni.map((s) =>
    s.id === id ? f(s) : { ...s, figli: mappa(s.figli, id, f) }
  );
}

function elimina(sezioni: Sezione[], id: string): Sezione[] {
  return sezioni
    .filter((s) => s.id !== id)
    .map((s) => ({ ...s, figli: elimina(s.figli, id) }));
}

// Inserisce una nuova sotto-sezione come figlia di `id`, se non si supera il
// livello massimo. Il livello lo passa il chiamante (conta la profondità).
function aggiungiFiglio(sezioni: Sezione[], id: string): Sezione[] {
  return mappa(sezioni, id, (s) => ({ ...s, figli: [...s.figli, sezioneVuota()] }));
}

// Sposta su/giù una sezione tra i suoi fratelli.
function sposta(sezioni: Sezione[], id: string, delta: -1 | 1): Sezione[] {
  const i = sezioni.findIndex((s) => s.id === id);
  if (i !== -1) {
    const j = i + delta;
    if (j < 0 || j >= sezioni.length) return sezioni;
    const copia = [...sezioni];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    return copia;
  }
  return sezioni.map((s) => ({ ...s, figli: sposta(s.figli, id, delta) }));
}

export function Impianto({ slug, regolaLunghezza }: { slug: string; regolaLunghezza: RegolaLunghezza }) {
  const chiave = `capitolo-impianto-${slug}`;
  const [imp, setImp] = useState<ImpiantoStato | null>(null);
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(chiave);
      if (raw) setImp(JSON.parse(raw));
    } catch {
      /* localStorage non disponibile: si resta senza impianto salvato */
    }
    setCaricato(true);
  }, [chiave]);

  function salva(nuovo: ImpiantoStato) {
    setImp(nuovo);
    try {
      localStorage.setItem(chiave, JSON.stringify(nuovo));
    } catch {
      /* ignora: la sessione resta comunque coerente in memoria */
    }
  }

  const avvisi = useMemo(() => (imp ? avvisiImpianto(imp) : []), [imp]);
  const prog = useMemo(() => (imp ? avanzamento(imp.sezioni) : null), [imp]);

  if (!caricato) return null;

  // --- schermata iniziale: scelta della disciplina -------------------------
  if (!imp || !imp.disciplina) {
    return (
      <div>
        <p style={{ color: '#374151', fontSize: 14 }}>
          Un flag all’inizio: riscrive l’indice, lo stile citazionale, l’editor consigliato e
          la persona verbale. Lo puoi cambiare dopo.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          {(['umanistica', 'stem'] as Disciplina[]).map((d) => {
            const p = profiloDisciplina(d);
            return (
              <button key={d} onClick={() => salva(impiantoIniziale(d))} style={S.cardDisciplina}>
                <strong style={{ fontSize: 16 }}>{p.nome}</strong>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{p.descrizione}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const profilo = profiloDisciplina(imp.disciplina);

  function cambiaDisciplina(d: Disciplina) {
    if (d === imp!.disciplina) return;
    const ok = confirm(
      `Passare a «${profiloDisciplina(d).nome}» ricarica l’indice del template e sostituisce le sezioni attuali. La domanda di ricerca e il briefing restano. Procedere?`
    );
    if (ok) salva({ ...imp!, disciplina: d, sezioni: indiceIniziale(d) });
  }

  return (
    <div>
      {/* profilo di disciplina */}
      <div style={S.profilo}>
        <div>
          <span style={S.etichetta}>Impostazione</span>{' '}
          {(['umanistica', 'stem'] as Disciplina[]).map((d) => (
            <button
              key={d}
              onClick={() => cambiaDisciplina(d)}
              style={{ ...S.pillDisc, ...(d === imp.disciplina ? S.pillDiscAttiva : {}) }}
            >
              {profiloDisciplina(d).nome}
            </button>
          ))}
        </div>
        <dl style={S.dl}>
          <Riga k="Stile citazionale" v={profilo.stileCitazionale} />
          <Riga k="Persona verbale" v={profilo.personaVerbale} />
          <Riga k="Editor" v={profilo.editorConsigliato} />
          <Riga k="Database" v={profilo.databaseBibliografici} />
          <Riga
            k="Lunghezza"
            v={
              regolaLunghezza ? (
                <>
                  {regolaLunghezza.testo}{' '}
                  <a href={regolaLunghezza.fonte_url} target="_blank" rel="noreferrer" title={regolaLunghezza.fonte_citazione} style={S.fonte}>
                    fonte
                  </a>{' '}
                  <em style={{ color: '#6b7280' }}>({regolaLunghezza.vincolante ? 'vincolante' : 'indicazione'})</em>
                </>
              ) : (
                <em style={{ color: '#6b7280' }}>{profilo.lunghezzaOrientativa} — consuetudine, verifica col tuo corso</em>
              )
            }
          />
        </dl>
      </div>

      {/* domanda di ricerca, in cima e fissa */}
      <div style={{ marginTop: 20 }}>
        <span style={S.etichetta}>La domanda di ricerca</span>
        <textarea
          value={imp.domandaRicerca}
          onChange={(e) => salva({ ...imp, domandaRicerca: e.target.value })}
          placeholder="Una domanda, non un’area. «Se l’adozione di AI nei call center ha ridotto l’occupazione entry-level», non «l’AI e il lavoro»."
          style={S.textareaGrande}
          rows={2}
        />
      </div>

      {/* briefing vivo */}
      <details style={{ marginTop: 16 }}>
        <summary style={S.summary}>Il briefing — di cosa vuoi occuparti, a parole tue</summary>
        <textarea
          value={imp.briefing}
          onChange={(e) => salva({ ...imp, briefing: e.target.value })}
          placeholder="Cosa ti interessa, cosa ti ha detto il relatore, cosa non ti è chiaro. Resta vivo per tutta la tesi: quando l’idea cambia, aggiornalo."
          style={S.textarea}
          rows={4}
        />
      </details>

      {/* avanzamento */}
      {prog && (
        <div style={{ marginTop: 20 }}>
          <span style={S.etichetta}>Avanzamento</span>
          <div style={S.barra}>
            <div style={{ ...S.barraPiena, width: `${prog.percentuale}%` }} />
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {prog.chiuse} di {prog.totali} sezioni chiuse — chiudere un capitolo è un passo verso l’aula.
          </div>
        </div>
      )}

      {/* avvisi */}
      {avvisi.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
          {avvisi.map((a) => (
            <li key={a.id} style={{ ...S.avviso, borderLeftColor: a.tono === 'attenzione' ? '#7A1E32' : '#A98B3E' }}>
              {a.testo}
            </li>
          ))}
        </ul>
      )}

      {/* l'indice ad albero */}
      <div style={{ marginTop: 20 }}>
        <span style={S.etichetta}>L’indice</span>
        <div style={{ marginTop: 8 }}>
          {imp.sezioni.map((s, i) => (
            <NodoSezione
              key={s.id}
              sezione={s}
              indici={[i]}
              livello={1}
              fratelli={imp.sezioni.length}
              onModifica={(id, f) => salva({ ...imp, sezioni: mappa(imp.sezioni, id, f) })}
              onElimina={(id) => salva({ ...imp, sezioni: elimina(imp.sezioni, id) })}
              onAggiungiFiglio={(id) => salva({ ...imp, sezioni: aggiungiFiglio(imp.sezioni, id) })}
              onSposta={(id, d) => salva({ ...imp, sezioni: sposta(imp.sezioni, id, d) })}
            />
          ))}
        </div>
        <button
          onClick={() => salva({ ...imp, sezioni: [...imp.sezioni, sezioneVuota('Nuovo capitolo')] })}
          style={S.btnAggiungi}
        >
          + Aggiungi capitolo
        </button>
      </div>
    </div>
  );
}

function Riga({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt style={{ color: '#6b7280' }}>{k}</dt>
      <dd style={{ margin: 0 }}>{v}</dd>
    </>
  );
}

function NodoSezione({
  sezione,
  indici,
  livello,
  fratelli,
  onModifica,
  onElimina,
  onAggiungiFiglio,
  onSposta,
}: {
  sezione: Sezione;
  indici: number[];
  livello: number;
  fratelli: number;
  onModifica: (id: string, f: (s: Sezione) => Sezione) => void;
  onElimina: (id: string) => void;
  onAggiungiFiglio: (id: string) => void;
  onSposta: (id: string, d: -1 | 1) => void;
}) {
  const numero = numeroDecimale(indici);
  const pagine = paginesSezione(sezione);
  const idx = indici[indici.length - 1];

  return (
    <div style={{ marginLeft: (livello - 1) * 20, borderLeft: livello > 1 ? '1px solid #14161A22' : 'none', paddingLeft: livello > 1 ? 12 : 0 }}>
      <div style={S.nodo}>
        <span style={S.numero}>{numero}</span>
        <input
          value={sezione.titolo}
          onChange={(e) => onModifica(sezione.id, (s) => ({ ...s, titolo: e.target.value }))}
          style={S.inputTitolo}
        />
        {/* stato: un tocco avanza; il menu per scegliere */}
        <select
          value={sezione.stato}
          onChange={(e) => onModifica(sezione.id, (s) => ({ ...s, stato: e.target.value as StatoSezione }))}
          style={{ ...S.selectStato, color: COLORI[sezione.stato], borderColor: COLORI[sezione.stato] }}
          title="Stato della sezione"
        >
          {STATI.map((st) => (
            <option key={st} value={st}>{etichettaStato(st)}</option>
          ))}
        </select>
        <button
          onClick={() => onModifica(sezione.id, (s) => ({ ...s, stato: statoSuccessivo(s.stato) }))}
          style={S.btnAvanza}
          title="Avanza di uno stato"
        >
          →
        </button>
      </div>

      <div style={S.rigaMeta}>
        <span style={{ color: '#6b7280' }}>pagine</span>
        <input
          type="number" min={1}
          value={sezione.pagineDa ?? ''}
          onChange={(e) => onModifica(sezione.id, (s) => ({ ...s, pagineDa: e.target.value ? Number(e.target.value) : null }))}
          style={S.inputPagina}
          placeholder="da"
        />
        <span style={{ color: '#6b7280' }}>–</span>
        <input
          type="number" min={1}
          value={sezione.pagineA ?? ''}
          onChange={(e) => onModifica(sezione.id, (s) => ({ ...s, pagineA: e.target.value ? Number(e.target.value) : null }))}
          style={S.inputPagina}
          placeholder="a"
        />
        {pagine != null && <span style={{ color: '#6b7280', fontStyle: 'italic' }}>{pagine} pp.</span>}

        <span style={{ flex: 1 }} />
        {idx > 0 && <button onClick={() => onSposta(sezione.id, -1)} style={S.btnMini} title="Su">↑</button>}
        {idx < fratelli - 1 && <button onClick={() => onSposta(sezione.id, 1)} style={S.btnMini} title="Giù">↓</button>}
        {livello < LIVELLO_MAX && (
          <button onClick={() => onAggiungiFiglio(sezione.id)} style={S.btnMini} title="Aggiungi sotto-sezione">+ sotto</button>
        )}
        <button onClick={() => onElimina(sezione.id)} style={{ ...S.btnMini, color: '#7A1E32' }} title="Elimina">×</button>
      </div>

      {/* la guida: come una nota a margine, in corsivo */}
      <input
        value={sezione.guida ?? ''}
        onChange={(e) => onModifica(sezione.id, (s) => ({ ...s, guida: e.target.value }))}
        style={S.guida}
        placeholder="Cosa deve contenere questa sezione, e quando conviene scriverla"
      />

      {sezione.figli.map((f, i) => (
        <NodoSezione
          key={f.id}
          sezione={f}
          indici={[...indici, i]}
          livello={livello + 1}
          fratelli={sezione.figli.length}
          onModifica={onModifica}
          onElimina={onElimina}
          onAggiungiFiglio={onAggiungiFiglio}
          onSposta={onSposta}
        />
      ))}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  cardDisciplina: {
    flex: '1 1 220px', textAlign: 'left', padding: 16, background: '#fff',
    border: '1px solid #14161A22', borderRadius: 10, cursor: 'pointer',
  },
  profilo: { background: '#FDFCFA', border: '1px solid #14161A22', borderRadius: 10, padding: 14 },
  etichetta: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#7A7C82' },
  pillDisc: {
    fontSize: 13, padding: '3px 10px', margin: '0 4px', borderRadius: 999,
    border: '1px solid #14161A22', background: '#fff', cursor: 'pointer', color: '#14161A',
  },
  pillDiscAttiva: { background: '#2E4A7D', color: '#fff', borderColor: '#2E4A7D' },
  dl: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', margin: '12px 0 0', fontSize: 14 },
  fonte: { fontSize: 13, color: '#2E4A7D' },
  textareaGrande: {
    width: '100%', marginTop: 6, padding: 10, fontFamily: 'inherit', fontSize: 16,
    border: '1px solid #14161A22', borderRadius: 8, resize: 'vertical', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', marginTop: 6, padding: 10, fontFamily: 'inherit', fontSize: 14,
    border: '1px solid #14161A22', borderRadius: 8, resize: 'vertical', boxSizing: 'border-box',
  },
  summary: { fontSize: 14, cursor: 'pointer', color: '#2E4A7D' },
  barra: { height: 8, background: '#eee', borderRadius: 999, overflow: 'hidden', marginTop: 6 },
  barraPiena: { height: '100%', background: '#A98B3E', transition: 'width .2s' },
  avviso: {
    fontSize: 14, padding: '8px 12px', margin: '6px 0', background: '#FDFCFA',
    borderLeft: '3px solid #A98B3E', color: '#14161A',
  },
  nodo: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 },
  numero: { fontVariantNumeric: 'tabular-nums', color: '#7A7C82', fontSize: 14, minWidth: 34 },
  inputTitolo: {
    flex: 1, padding: '5px 8px', fontFamily: 'inherit', fontSize: 15,
    border: '1px solid #14161A22', borderRadius: 6,
  },
  selectStato: { fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid', background: '#fff' },
  btnAvanza: { border: '1px solid #14161A22', background: '#fff', borderRadius: 6, cursor: 'pointer', padding: '4px 8px' },
  rigaMeta: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, marginTop: 4, marginLeft: 42, flexWrap: 'wrap' },
  inputPagina: { width: 52, padding: '2px 4px', border: '1px solid #14161A22', borderRadius: 4, fontFamily: 'inherit' },
  btnMini: { fontSize: 12, border: '1px solid #14161A22', background: '#fff', borderRadius: 6, cursor: 'pointer', padding: '2px 7px' },
  guida: {
    display: 'block', width: '100%', marginTop: 4, marginLeft: 42, padding: '2px 0',
    fontFamily: 'inherit', fontStyle: 'italic', fontSize: 13, color: '#6b7280',
    border: 'none', borderBottom: '1px dotted #14161A22', background: 'transparent',
    boxSizing: 'border-box', maxWidth: 'calc(100% - 42px)',
  },
  btnAggiungi: {
    marginTop: 14, padding: '6px 12px', fontSize: 14, background: '#fff',
    border: '1px dashed #14161A44', borderRadius: 8, cursor: 'pointer', color: '#2E4A7D',
  },
};
