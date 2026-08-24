'use client';

import { useState, useTransition } from 'react';
import { assistenteScrittura } from './azioni';

const AZIONI_RAPIDE = [
  ['Scaletta', 'Proponimi una scaletta/struttura per la mia tesi.'],
  ['Riscrivi', 'Riscrivi questo paragrafo in modo più chiaro e scorrevole:\n\n'],
  ['Chiarezza', 'Rendi più chiaro e sintetico questo testo, senza cambiarne il senso:\n\n'],
  ['Bibliografia', 'Come imposto bibliografia e citazioni per la mia tesi?'],
] as const;

export function Assistente({ slug }: { slug: string }) {
  const [richiesta, setRichiesta] = useState('');
  const [risposta, setRisposta] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, start] = useTransition();

  function invia(testo: string) {
    setErrore(null);
    setRisposta(null);
    start(async () => {
      const r = await assistenteScrittura(slug, testo);
      if (r.errore) setErrore(r.errore);
      else setRisposta(r.testo ?? '');
    });
  }

  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={S.h2}>Assistente di scrittura</h2>
      <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
        Conosce le regole confermate del tuo corso. Chiedi una scaletta, una riscrittura,
        aiuto con la bibliografia.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
        {AZIONI_RAPIDE.map(([etichetta, prefisso]) => (
          <button key={etichetta} type="button" style={S.chip}
            onClick={() => setRichiesta(prefisso)}>
            {etichetta}
          </button>
        ))}
      </div>
      <textarea
        value={richiesta}
        onChange={(e) => setRichiesta(e.target.value)}
        placeholder="Scrivi cosa ti serve, oppure incolla un paragrafo da migliorare…"
        rows={5}
        style={S.textarea}
      />
      <div style={{ marginTop: 8 }}>
        <button type="button" disabled={inCorso || !richiesta.trim()} style={S.invia}
          onClick={() => invia(richiesta)}>
          {inCorso ? 'Sto pensando…' : 'Chiedi all’assistente'}
        </button>
      </div>
      {errore && <p style={{ color: '#b91c1c' }}>Errore: {errore}</p>}
      {risposta && <div style={S.risposta}>{risposta}</div>}
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  h2: { fontSize: 20, borderBottom: '2px solid #111', paddingBottom: 4 },
  chip: { padding: '6px 12px', borderRadius: 999, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 },
  textarea: { width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit', fontSize: 15 },
  invia: { padding: '10px 16px', borderRadius: 8, border: '1px solid #059669', background: '#ecfdf5', color: '#065f46', fontWeight: 600, cursor: 'pointer' },
  risposta: { marginTop: 12, padding: 14, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', whiteSpace: 'pre-wrap', lineHeight: 1.55 },
};
