import { supabase } from './supabase'
import type { Expense } from '../types/domain'

export interface ExpenseInput {
  description: string
  amount: number
  spent_on: string | null
  category: string
}

export async function listExpenses(eventId: string): Promise<Expense[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('event_id', eventId)
    .order('spent_on', { ascending: false, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as Expense[]
}

export async function createExpense(eventId: string, input: ExpenseInput): Promise<Expense | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...input, event_id: eventId })
    .select('*')
    .single()
  if (error) throw error
  return (data as Expense) ?? null
}

export async function deleteExpense(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
