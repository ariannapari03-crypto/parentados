import type { Metadata } from 'next';
import { corsiPubblicabili, slugCorso } from '@/lib/pubbliche';

// Indice dei corsi pubblicati: dà ai crawler un punto da cui raggiungere ogni
// pagina, e alle persone un elenco navigabile. Statica. [compito ⑥]

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Regole e scadenze della tesi, per corso',
  description: 'Elenco dei corsi di laurea con le regole e le scadenze della prova finale verificate, ciascuna con la fonte ufficiale.',
  alternates: { canonical: '/corsi' },
};

export default async function PaginaCorsi() {
  const corsi = await corsiPubblicabili();
  // Raggruppa per ateneo.
  const perAteneo = new Map<string, typeof corsi>();
  for (const c of corsi) {
    const k = c.ateneo_nome;
    if (!perAteneo.has(k)) perAteneo.set(k, []);
    perAteneo.get(k)!.push(c);
  }

  return (
    <main style={{ maxWidth: 760, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a' }}>
      <h1>Regole e scadenze della tesi</h1>
      <p style={{ color: '#374151' }}>
        {corsi.length} cors{corsi.length === 1 ? 'o' : 'i'} con dati verificati. Ogni pagina
        riporta la fonte ufficiale accanto a ogni dato.
      </p>
      {corsi.length === 0 && <p style={{ color: '#6b7280' }}>Nessun corso pubblicato per ora.</p>}
      {[...perAteneo.entries()].map(([ateneo, lista]) => (
        <section key={ateneo}>
          <h2 style={{ fontSize: 18, borderBottom: '1px solid #d1d5db', paddingBottom: 4, marginTop: 24 }}>{ateneo}</h2>
          <ul>
            {lista.map((c) => (
              <li key={c.id} style={{ margin: '6px 0' }}>
                <a href={`/corso/${slugCorso(c)}`}>{c.nome}</a>
                {c.livello ? <span style={{ color: '#6b7280' }}> · {c.livello}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
