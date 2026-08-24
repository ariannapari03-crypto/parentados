import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Capitolo — regole e scadenze della tesi, per corso',
  description:
    'Le regole della prova finale e le scadenze delle sessioni di laurea, raccolte per singolo corso e verificate a mano, con la fonte ufficiale accanto a ogni dato.',
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: '3rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a', lineHeight: 1.6 }}>
      <h1>Capitolo</h1>
      <p style={{ fontSize: 18 }}>
        Le regole della tesi non stanno nel regolamento d'ateneo: stanno nella pagina di
        ogni singolo corso, e cambiano molto. Qui le raccogliamo per corso — lunghezza,
        formato, criteri di voto e scadenze delle sessioni — verificate a mano, con la
        <strong> fonte ufficiale accanto a ogni dato</strong>.
      </p>
      <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a href="/tesi" style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 8, background: '#111', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
          Apri la tua tesi →
        </a>
        <a href="/corsi" style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 8, background: '#fff', color: '#111', border: '1px solid #d1d5db', textDecoration: 'none', fontWeight: 600 }}>
          Sfoglia i corsi
        </a>
      </p>
    </main>
  );
}
