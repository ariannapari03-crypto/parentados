import { supabase } from './supabase'
import type { Priority, Task } from '../types/domain'

export interface TaskInput {
  title: string
  category: string
  due_date: string | null
  priority: Priority
  notes: string | null
}

export async function listTasks(eventId: string): Promise<Task[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('event_id', eventId)
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function createTask(eventId: string, input: TaskInput): Promise<Task | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...input, event_id: eventId })
    .select('*')
    .single()
  if (error) throw error
  return (data as Task) ?? null
}

export async function updateTask(id: string, patch: Partial<TaskInput> & { completed?: boolean }): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('tasks').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

/** Conteggio task (totali / completate) per una lista di eventi, in una sola query. */
export async function taskStatsForEvents(
  eventIds: string[],
): Promise<Record<string, { total: number; done: number }>> {
  const stats: Record<string, { total: number; done: number }> = {}
  if (!supabase || eventIds.length === 0) return stats
  const { data, error } = await supabase
    .from('tasks')
    .select('event_id, completed')
    .in('event_id', eventIds)
  if (error) throw error
  for (const row of (data ?? []) as { event_id: string; completed: boolean }[]) {
    const s = (stats[row.event_id] ??= { total: 0, done: 0 })
    s.total += 1
    if (row.completed) s.done += 1
  }
  return stats
}
