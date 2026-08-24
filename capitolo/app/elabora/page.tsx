import { cookies } from 'next/headers';
import { NOME_COOKIE, haAccesso, revisioneConfigurata } from '@/lib/auth';
import { elencaCorsi } from '@/lib/corsi';
import { Login } from '../revisione/Login';
import { Elaboratore } from './Elaboratore';

// Strumento da operatore: protetto dalla stessa password della revisione.
export const dynamic = 'force-dynamic';
// Scarica + estrai possono richiedere qualche decina di secondi.
export const maxDuration = 60;

export default async function PaginaElabora() {
  const c = await cookies();
  if (!haAccesso(c.get(NOME_COOKIE)?.value)) {
    return <Login configurata={revisioneConfigurata()} />;
  }
  const corsi = await elencaCorsi();
  return (
    <main style={{ maxWidth: 760, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif', color: '#111' }}>
      <h1>Elabora i corsi</h1>
      <p style={{ color: '#374151' }}>
        Per ogni corso scoperto, «Elabora» scarica la sua pagina, la ritaglia ed estrae le
        regole come <em>proposte</em>. Poi vai in <a href="/revisione">revisione</a> per
        confermarle: solo allora compaiono sulle pagine pubbliche e nella scrivania dello studente.
      </p>
      <Elaboratore corsi={corsi} />
    </main>
  );
}
