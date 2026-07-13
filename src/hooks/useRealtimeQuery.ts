import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Ricarica `fetcher` ogni volta che cambia qualcosa nella tabella Postgres indicata,
 * cosi' i dati condivisi (prenotazioni, checklist, guasti...) restano sincronizzati
 * quasi in tempo reale tra i dispositivi della famiglia.
 */
export function useRealtimeQuery<T>(table: string, fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetcher()
      setData(result)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore di caricamento')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`${table}-changes-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load, table])

  return { data, loading, error, refresh: load }
}
