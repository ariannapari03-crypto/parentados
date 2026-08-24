'use client';

import { useState, useTransition } from 'react';
import type { CorsoElaborabile } from '@/lib/corsi';
import { azElaboraCorso } from './azioni';

export function Elaboratore({ corsi }: { corsi: CorsoElaborabile[] }) {
  const [esiti, setEsiti] = useState<Record<number, { ok: boolean; messaggio: string }>>({});
  const [inCorso, setInCorso] = useState<number | null>(null);
  const [, start] = useTransition();

  function elabora(id: number) {
    setInCorso(id);
    start(async () => {
      const r = await azElaboraCorso(id);
      setEsiti((p) => ({ ...p, [id]: r }));
      setInCorso(null);
    });
  }

  if (corsi.length === 0) {
    return <p style={{ color: '#6b7280' }}>Nessun corso ancora. Scoprine con <a href="/ricognizione">la ricognizione</a>.</p>;
  }

  return (
    <table style={S.tab}>
      <thead>
        <tr><th style={S.th}>Ateneo</th><th style={S.th}>Corso</th><th style={S.th}>Regole</th><th style={S.th}></th></tr>
      </thead>
      <tbody>
        {corsi.map((c) => {
          const e = esiti[c.id];
          return (
            <tr key={c.id}>
              <td style={S.td}>{c.ateneo_nome}</td>
              <td style={S.td}>
                {c.nome}
                {c.url
                  ? <div><a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>pagina</a></div>
                  : <div style={{ fontSize: 12, color: '#b45309' }}>senza URL</div>}
                {e && <div style={{ fontSize: 13, color: e.ok ? '#065f46' : '#b91c1c', marginTop: 4 }}>{e.messaggio}</div>}
              </td>
              <td style={S.td}>{c.regole}</td>
              <td style={S.td}>
                <button type="button" disabled={!c.url || inCorso === c.id} style={S.btn}
                  onClick={() => elabora(c.id)}>
                  {inCorso === c.id ? 'Elaboro…' : 'Elabora'}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const S: Record<string, React.CSSProperties> = {
  tab: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', borderBottom: '1px solid #d1d5db', padding: '6px 8px' },
  td: { borderBottom: '1px solid #eee', padding: '8px', verticalAlign: 'top' },
  btn: { padding: '6px 12px', borderRadius: 6, border: '1px solid #059669', background: '#ecfdf5', color: '#065f46', fontWeight: 600, cursor: 'pointer' },
};
