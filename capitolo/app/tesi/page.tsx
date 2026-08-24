import type { Metadata } from 'next';
import { corsiPubblicabili, slugCorso } from '@/lib/pubbliche';

// Scrivania della tesi — scelta del corso. Area pubblica per lo studente (Fase 2).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'La tua tesi — scegli il corso',
  description:
    'Regole, scadenze e aiuto alla stesura della tesi, per il tuo corso di laurea, con la fonte accanto a ogni dato.',
  alternates: { canonical: '/tesi' },
};

export default async function ScegliCorso() {
  const corsi = await corsiPubblicabili();
  const perAteneo = new Map<string, typeof corsi>();
  for (const c of corsi) {
    if (!perAteneo.has(c.ateneo_nome)) perAteneo.set(c.ateneo_nome, []);
    perAteneo.get(c.ateneo_nome)!.push(c);
  }

  return (
    <main style={S.main}>
      <h1 style={{ fontSize: 30, marginBottom: 4 }}>La tua tesi, tutto in un posto</h1>
      <p style={{ color: '#374151', fontSize: 17 }}>
        Scegli il tuo corso: trovi regole, scadenze, una checklist e un assistente di
        scrittura — con la fonte ufficiale accanto a ogni dato.
      </p>

      {corsi.length === 0 ? (
        <div style={S.vuoto}>
          <p>Nessun corso ancora disponibile.</p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            I corsi compaiono qui man mano che i dati vengono raccolti e confermati.
          </p>
        </div>
      ) : (
        [...perAteneo.entries()].map(([ateneo, lista]) => (
          <section key={ateneo}>
            <h2 style={S.h2}>{ateneo}</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {lista.map((c) => (
                <li key={c.id} style={{ margin: '4px 0' }}>
                  <a href={`/tesi/${slugCorso(c)}`} style={S.link}>
                    {c.nome}
                    {c.livello ? <span style={{ color: '#6b7280' }}> · {c.livello}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: { maxWidth: 720, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif', color: '#111' },
  h2: { fontSize: 18, borderBottom: '1px solid #d1d5db', paddingBottom: 4, marginTop: 24 },
  link: { color: '#1d4ed8', textDecoration: 'none', fontSize: 16 },
  vuoto: { marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' },
};
