'use client';

import { useActionState } from 'react';
import { avviaRicognizione, type EsitoUi } from './azioni';

// Il campo di testo da cui entra QUALUNQUE ateneo: uno per riga, cercato sul
// momento. Nessun elenco fisso. [vedi CLAUDE.md]

export function Ricognitore() {
  const [stato, azione, inCorso] = useActionState(avviaRicognizione, undefined as EsitoUi | undefined);
  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Ricognizione atenei</h1>
      <p style={{ color: '#374151' }}>
        Scrivi uno o più atenei, <strong>uno per riga</strong>. Ognuno viene cercato sul
        momento sul web e i suoi corsi vengono scoperti e salvati come <em>da verificare</em>.
      </p>
      <form action={azione}>
        <textarea
          name="atenei"
          rows={5}
          placeholder={'Università di Bologna\nUniversità di Torino\nUniversità Bocconi'}
          style={{ width: '100%', padding: 10, fontFamily: 'inherit', border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={inCorso} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #059669', background: '#ecfdf5', color: '#065f46', fontWeight: 600 }}>
            {inCorso ? 'Cerco sul web…' : 'Cerca e scopri i corsi'}
          </button>
        </div>
      </form>

      {stato && stato.righe.length > 0 && (
        <table style={{ width: '100%', marginTop: 20, borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={th}>Ateneo</th><th style={th}>Catalogo</th><th style={th}>Scoperti</th><th style={th}>Nuovi</th>
            </tr>
          </thead>
          <tbody>
            {stato.righe.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.ateneo}</td>
                <td style={td}>
                  {r.errore ? <span style={{ color: '#b91c1c' }}>{r.errore}</span>
                    : r.catalogo ? <a href={r.catalogo} target="_blank" rel="noreferrer">apri</a> : '—'}
                </td>
                <td style={td}>{r.scoperti}</td>
                <td style={td}>{r.nuovi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 24, fontSize: 13, color: '#6b7280' }}>
        Poi vai a <a href="/elabora">elaborare i corsi</a> (scarica + estrai) e a
        <a href="/revisione"> confermare</a> le proposte: solo allora compaiono nella
        scrivania dello studente e sulle pagine pubbliche.
      </p>
    </main>
  );
}

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #d1d5db', padding: '6px 8px' };
const td: React.CSSProperties = { borderBottom: '1px solid #eee', padding: '6px 8px' };
