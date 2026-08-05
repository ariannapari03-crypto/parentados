export function SetupNeededPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div className="fx-card" style={{ maxWidth: 460, padding: 26 }}>
        <div style={{ fontSize: 34, marginBottom: 6 }}>🔌</div>
        <h1 style={{ margin: '0 0 6px', fontSize: '1.6rem', color: 'var(--ink)' }}>
          Collega Supabase
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', marginTop: 0 }}>
          FESTIVA ha bisogno di un progetto Supabase per salvare eventi, promozioni e prenotazioni.
        </p>
        <ol style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', paddingLeft: 18, lineHeight: 1.7 }}>
          <li>
            Crea un progetto gratuito su <strong>supabase.com</strong>.
          </li>
          <li>
            Nell’<em>SQL editor</em> esegui il contenuto di{' '}
            <code>supabase/schema.sql</code>.
          </li>
          <li>
            Copia <code>Project URL</code> e <code>anon key</code> da{' '}
            <em>Project Settings → API</em>.
          </li>
          <li>
            Crea <code>.env.local</code> partendo da <code>.env.example</code> e incolla i valori.
          </li>
        </ol>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', marginBottom: 0 }}>
          Poi riavvia <code>npm run dev</code>.
        </p>
      </div>
    </div>
  )
}
