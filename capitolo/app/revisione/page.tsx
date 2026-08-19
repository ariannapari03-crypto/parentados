import { cookies } from 'next/headers';
import { NOME_COOKIE, haAccesso, revisioneConfigurata } from '@/lib/auth';
import { prossimeScadenze, prossimeRegole, contaProposte } from '@/lib/revisione';
import { Login } from './Login';
import { Revisore } from './Revisore';

// Sempre dinamica: legge cookie e database a ogni richiesta, niente cache.
export const dynamic = 'force-dynamic';

export default async function PaginaRevisione() {
  const c = await cookies();
  if (!haAccesso(c.get(NOME_COOKIE)?.value)) {
    return <Login configurata={revisioneConfigurata()} />;
  }
  const [scadenze, regole, conteggi] = await Promise.all([
    prossimeScadenze(500),
    prossimeRegole(500),
    contaProposte(),
  ]);
  return <Revisore scadenze={scadenze} regole={regole} conteggi={conteggi} />;
}
