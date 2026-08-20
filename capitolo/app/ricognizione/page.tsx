import { cookies } from 'next/headers';
import { NOME_COOKIE, haAccesso, revisioneConfigurata } from '@/lib/auth';
import { Login } from '../revisione/Login';
import { Ricognitore } from './Ricognitore';

// Strumento da operatore: protetto dalla stessa password della revisione.
export const dynamic = 'force-dynamic';
// La ricerca sul web può richiedere qualche decina di secondi: alza il limite
// di durata della funzione su Vercel (default troppo basso).
export const maxDuration = 60;

export default async function PaginaRicognizione() {
  const c = await cookies();
  if (!haAccesso(c.get(NOME_COOKIE)?.value)) {
    return <Login configurata={revisioneConfigurata()} />;
  }
  return <Ricognitore />;
}
