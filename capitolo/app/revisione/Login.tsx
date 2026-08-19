'use client';

import { useActionState } from 'react';
import { accedi } from './azioni';

export function Login({ configurata }: { configurata: boolean }) {
  const [stato, azione, inCorso] = useActionState(accedi, {} as { errore?: string });
  return (
    <main style={{ maxWidth: 360, margin: '4rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Revisione</h1>
      {!configurata && (
        <p style={{ color: '#b45309' }}>
          Attenzione: <code>REVISIONE_PASSWORD</code> non è impostata. Configurala
          nell'ambiente per abilitare l'accesso.
        </p>
      )}
      <form action={azione}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Password
          <input
            type="password"
            name="password"
            autoFocus
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        {stato?.errore && <p style={{ color: '#b91c1c' }}>{stato.errore}</p>}
        <button type="submit" disabled={inCorso} style={{ padding: '8px 16px' }}>
          {inCorso ? 'Verifica…' : 'Entra'}
        </button>
      </form>
    </main>
  );
}
