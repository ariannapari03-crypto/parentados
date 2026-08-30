'use client';

import { useEffect, useState } from 'react';
import { type ProfiloModello, type SezioneModello, type RuoloSezione, profiloComune } from '@/lib/modelli';
import type { Impianto, Sezione } from '@/lib/impianto';

// I modelli: carichi tesi già discusse, il sito ne mostra SOLO l'ossatura e —
// se vuoi — la adotta come indice del tuo impianto. Il PDF non lascia mai il
// tuo dispositivo se non per un istante, e il testo non viene salvato: torna
// solo la struttura. Le strutture stanno nel tuo browser.

interface ModelloSalvato {
  id: string;
  nome: string;
  profilo: ProfiloModello;
}

const COLORE_RUOLO: Record<RuoloSezione, string> = {
  abstract: '#7A7C82', introduzione: '#2E4A7D', letteratura: '#2E4A7D',
  metodo: '#3B6B4F', risultati: '#3B6B4F', discussione: '#A98B3E',
  conclusioni: '#A98B3E', bibliografia: '#7A7C82', altro: '#9ca3af',
};

const GUIDA_RUOLO: Record<RuoloSezione, string> = {
  abstract: 'Sintesi del lavoro. Si scrive per ultima.',
  introduzione: 'Problema, domanda di ricerca, obiettivi, struttura. Si scrive per ultima.',
  letteratura: 'Cosa è già stato detto; il gap che colmi. Si aggiorna in continuo.',
  metodo: 'Come hai fatto, in modo riproducibile. Si scrive presto.',
  risultati: 'Cosa hai trovato, senza interpretarlo.',
  discussione: 'Interpretazione, confronto con la letteratura, limiti.',
  conclusioni: 'Sintesi del contributo e sviluppi futuri. Si scrive per ultima.',
  bibliografia: 'Si costruisce dal primo giorno.',
  altro: '',
};

function idNuovo(): string {
  return `m${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function Modelli({ slug }: { slug: string }) {
  const chiave = `capitolo-modelli-${slug}`;
  const chiaveImpianto = `capitolo-impianto-${slug}`;
  const [modelli, setModelli] = useState<ModelloSalvato[]>([]);
  const [caricato, setCaricato] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(chiave);
      if (raw) setModelli(JSON.parse(raw));
    } catch { /* vuoto */ }
    setCaricato(true);
  }, [chiave]);

  function salva(nuovi: ModelloSalvato[]) {
    setModelli(nuovi);
    try { localStorage.setItem(chiave, JSON.stringify(nuovi)); } catch { /* ignora */ }
  }

  async function carica(files: FileList | null) {
    if (!files || files.length === 0) return;
    setInCorso(true); setErrore(null);
    const aggiunti: ModelloSalvato[] = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`/tesi/${slug}/modelli`, { method: 'POST', body: fd });
        const dati = await res.json();
        if (!res.ok) { setErrore(dati?.errore ?? 'Lettura non riuscita.'); continue; }
        aggiunti.push({ id: idNuovo(), nome: dati.nome ?? file.name, profilo: dati.profilo });
      } catch {
        setErrore('Caricamento non riuscito. Riprova.');
      }
    }
    if (aggiunti.length) salva([...modelli, ...aggiunti]);
    setInCorso(false);
  }

  function elimina(id: string) {
    salva(modelli.filter((m) => m.id !== id));
  }

  // Adotta i capitoli di primo livello del modello come indice dell'impianto.
  function adotta(m: ModelloSalvato) {
    const l1 = m.profilo.sezioni.filter((s) => s.livello === 1);
    if (l1.length === 0) return;
    if (!confirm(`Sostituire l’indice del tuo impianto con l’ossatura di «${m.nome}» (${l1.length} capitoli)? La domanda di ricerca e il briefing restano. Prendi la struttura, mai il testo.`)) return;
    let da = 1;
    const sezioni: Sezione[] = l1.map((s) => {
      const pagine = s.pagine && s.pagine > 0 ? s.pagine : 5;
      const sez: Sezione = {
        id: `s${idNuovo()}`, titolo: s.titolo, guida: GUIDA_RUOLO[s.ruolo] || '',
        pagineDa: da, pagineA: da + pagine - 1, stato: 'vuota', figli: [],
      };
      da += pagine;
      return sez;
    });
    let imp: Impianto = { disciplina: 'stem', domandaRicerca: '', briefing: '', sezioni: [] };
    try {
      const raw = localStorage.getItem(chiaveImpianto);
      if (raw) imp = JSON.parse(raw);
    } catch { /* parte da vuoto */ }
    imp.sezioni = sezioni;
    if (!imp.disciplina) imp.disciplina = 'stem';
    try {
      localStorage.setItem(chiaveImpianto, JSON.stringify(imp));
      alert('Ossatura adottata. Ricarico la pagina per aggiornare l’impianto.');
      location.reload();
    } catch { /* ignora */ }
  }

  if (!caricato) return null;

  const validi = modelli.map((m) => m.profilo);
  const comune = profiloComune(validi);

  return (
    <div>
      <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
        Carica una o più tesi già discusse del tuo corso: il sito ne estrae <strong>solo l’ossatura</strong>
        {' '}(indice, numerazione, pesi), <em>mai il testo</em>. Nessuna frase dei documenti caricati finisce nella tua tesi.
      </p>

      <label style={S.dropzone}>
        <input
          type="file" accept="application/pdf" multiple
          onChange={(e) => carica(e.target.files)}
          style={{ display: 'none' }}
        />
        {inCorso ? 'Leggo l’ossatura…' : '+ Carica tesi in PDF (max ~4 MB l’una)'}
      </label>
      {errore && <p style={{ color: '#7A1E32', fontSize: 13, marginTop: 6 }}>{errore}</p>}

      {comune.length > 0 && (
        <div style={S.profilo}>
          <span style={S.etichetta}>Profilo del corso — cosa si ripete</span>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 14 }}>
            {comune.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </div>
      )}

      {modelli.map((m) => (
        <div key={m.id} style={S.modello}>
          <div style={S.rigaTitolo}>
            <strong style={{ fontSize: 15 }}>{m.nome}</strong>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {m.profilo.pagineTotali && <span style={{ fontSize: 13, color: '#6b7280' }}>{m.profilo.pagineTotali} pp.</span>}
              {m.profilo.sezioni.some((s) => s.livello === 1) && (
                <button onClick={() => adotta(m)} style={S.btnMini}>Adotta l’ossatura</button>
              )}
              <button onClick={() => elimina(m.id)} style={{ ...S.btnMini, color: '#7A1E32' }} title="Rimuovi">×</button>
            </span>
          </div>
          {m.profilo.note.map((n, i) => (
            <p key={i} style={{ fontSize: 13, color: '#b45309', fontStyle: 'italic', margin: '4px 0' }}>{n}</p>
          ))}
          {m.profilo.sezioni.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0' }}>
              {m.profilo.sezioni.map((s, i) => <RigaSez key={i} s={s} />)}
            </ul>
          )}
        </div>
      ))}

      {modelli.length === 0 && !inCorso && (
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 10, fontStyle: 'italic' }}>
          Da tre o quattro tesi dello stesso corso emerge il profilo strutturale del dipartimento —
          ciò che il relatore si aspetta e non scrive da nessuna parte.
        </p>
      )}
    </div>
  );
}

function RigaSez({ s }: { s: SezioneModello }) {
  return (
    <li style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '3px 0', marginLeft: (s.livello - 1) * 16 }}>
      {s.numero && <span style={{ color: '#7A7C82', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{s.numero}</span>}
      <span style={{ flex: 1, fontSize: 14 }}>{s.titolo}</span>
      {s.ruolo !== 'altro' && (
        <span style={{ fontSize: 11, color: COLORE_RUOLO[s.ruolo], border: `1px solid ${COLORE_RUOLO[s.ruolo]}55`, borderRadius: 4, padding: '0 5px' }}>{s.ruolo}</span>
      )}
      {s.pagine != null && <span style={{ fontSize: 12, color: '#6b7280', minWidth: 42, textAlign: 'right' }}>{s.pagine} pp.</span>}
    </li>
  );
}

const S: Record<string, React.CSSProperties> = {
  dropzone: {
    display: 'block', marginTop: 10, padding: '14px 12px', textAlign: 'center',
    border: '1px dashed #14161A44', borderRadius: 8, cursor: 'pointer', color: '#2E4A7D',
    fontSize: 14, background: '#FDFCFA',
  },
  etichetta: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#7A7C82' },
  profilo: { marginTop: 14, background: '#FDFCFA', border: '1px solid #14161A22', borderRadius: 8, padding: '10px 12px' },
  modello: { marginTop: 14, borderTop: '1px solid #14161A22', paddingTop: 10 },
  rigaTitolo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  btnMini: { fontSize: 12, border: '1px solid #14161A22', background: '#fff', borderRadius: 6, cursor: 'pointer', padding: '3px 8px' },
};
