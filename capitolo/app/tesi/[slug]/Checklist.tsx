'use client';

import { useEffect, useState } from 'react';

// Checklist della tesi: struttura generica + i punti che derivano dalle regole
// del corso. Lo stato (spuntato/no) resta nel browser dello studente. Non blocca
// nulla: è una guida. [inv. 9]

const STRUTTURA = [
  'Frontespizio con dati del corso e del relatore',
  'Indice',
  'Introduzione (domanda di ricerca e obiettivi)',
  'Capitoli centrali',
  'Conclusioni',
  'Bibliografia',
];

export function Checklist({ slug, puntiRegole }: { slug: string; puntiRegole: string[] }) {
  const voci = [...STRUTTURA, ...puntiRegole];
  const chiave = `capitolo-checklist-${slug}`;
  const [fatti, setFatti] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(chiave);
      if (raw) setFatti(JSON.parse(raw));
    } catch {
      /* localStorage non disponibile: si parte da vuoto */
    }
  }, [chiave]);

  function alterna(voce: string) {
    setFatti((prec) => {
      const nuovo = { ...prec, [voce]: !prec[voce] };
      try {
        localStorage.setItem(chiave, JSON.stringify(nuovo));
      } catch {
        /* ignora */
      }
      return nuovo;
    });
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {voci.map((voce) => (
        <li key={voce} style={{ margin: '6px 0' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!fatti[voce]} onChange={() => alterna(voce)} />
            <span style={{ textDecoration: fatti[voce] ? 'line-through' : 'none', color: fatti[voce] ? '#9ca3af' : '#111' }}>
              {voce}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
