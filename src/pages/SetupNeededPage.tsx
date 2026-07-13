export default function SetupNeededPage() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-bg text-ink font-sans px-4">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-4xl">🏡🔌</p>
        <h1 className="font-display font-extrabold text-xl">Configura Supabase per iniziare</h1>
        <p className="text-sm text-ink-soft">
          L’app ha bisogno di un progetto Supabase per sincronizzare i dati tra i telefoni della famiglia. Crea un
          progetto gratuito su{' '}
          <a className="underline text-shutter" href="https://supabase.com" target="_blank" rel="noreferrer">
            supabase.com
          </a>
          , esegui <code className="rounded bg-surface-2 px-1 font-mono">supabase/schema.sql</code> nello SQL editor,
          poi imposta <code className="rounded bg-surface-2 px-1 font-mono">VITE_SUPABASE_URL</code> e{' '}
          <code className="rounded bg-surface-2 px-1 font-mono">VITE_SUPABASE_ANON_KEY</code> (vedi il file{' '}
          <code className="rounded bg-surface-2 px-1 font-mono">.env.example</code> e il README).
        </p>
      </div>
    </div>
  )
}
