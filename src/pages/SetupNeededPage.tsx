export default function SetupNeededPage() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-4xl">🏡🔌</p>
        <h1 className="text-xl font-bold">Configura Supabase per iniziare</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          L’app ha bisogno di un progetto Supabase per sincronizzare i dati tra i telefoni della famiglia. Crea un
          progetto gratuito su{' '}
          <a className="underline text-teal-700 dark:text-teal-400" href="https://supabase.com" target="_blank" rel="noreferrer">
            supabase.com
          </a>
          , esegui <code className="rounded bg-slate-200 dark:bg-slate-800 px-1">supabase/schema.sql</code> nello SQL
          editor, poi imposta <code className="rounded bg-slate-200 dark:bg-slate-800 px-1">VITE_SUPABASE_URL</code> e{' '}
          <code className="rounded bg-slate-200 dark:bg-slate-800 px-1">VITE_SUPABASE_ANON_KEY</code> (vedi il file{' '}
          <code className="rounded bg-slate-200 dark:bg-slate-800 px-1">.env.example</code> e il README).
        </p>
      </div>
    </div>
  )
}
