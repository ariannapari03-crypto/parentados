import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { deleteEvent, getEvent } from '../../lib/events'
import { createTask, deleteTask, listTasks, updateTask, type TaskInput } from '../../lib/tasks'
import { createExpense, deleteExpense, listExpenses, type ExpenseInput } from '../../lib/expenses'
import { formatDate } from '../../lib/format'
import {
  AREAS,
  EVENT_TYPES,
  VENUE_TYPES,
  budgetAllocation,
  metaEmoji,
  metaLabel,
  setupProgress,
} from '../../data/eventMeta'
import { ProgressRing } from '../../components/ProgressRing'
import { ChecklistTab } from './event/ChecklistTab'
import { BudgetTab } from './event/BudgetTab'
import type { EventRecord, Expense, Task } from '../../types/domain'

type Tab = 'summary' | 'checklist' | 'budget'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderTop: '1px solid var(--surface-line)' }}>
      <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ color: 'var(--ink)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [ev, setEv] = useState<EventRecord | null | undefined>(undefined)
  const [tasks, setTasks] = useState<Task[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [tab, setTab] = useState<Tab>('summary')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    Promise.all([getEvent(id), listTasks(id), listExpenses(id)])
      .then(([event, ts, exp]) => {
        if (!active) return
        setEv(event)
        setTasks(ts)
        setExpenses(exp)
      })
      .catch(() => active && setEv(null))
    return () => {
      active = false
    }
  }, [id])

  // ----- handlers checklist -----
  async function addTask(input: TaskInput) {
    if (!id) return
    const created = await createTask(id, input)
    if (created) setTasks((prev) => [...prev, created])
  }
  async function editTask(taskId: string, input: TaskInput) {
    await updateTask(taskId, input)
    setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, ...input } : x)))
  }
  async function toggleTask(taskId: string, completed: boolean) {
    setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, completed } : x)))
    try {
      await updateTask(taskId, { completed })
    } catch {
      setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, completed: !completed } : x)))
    }
  }
  async function removeTask(taskId: string) {
    await deleteTask(taskId)
    setTasks((prev) => prev.filter((x) => x.id !== taskId))
  }

  // ----- handlers budget -----
  async function addExpense(input: ExpenseInput) {
    if (!id) return
    const created = await createExpense(id, input)
    if (created) setExpenses((prev) => [created, ...prev])
  }
  async function removeExpense(expenseId: string) {
    await deleteExpense(expenseId)
    setExpenses((prev) => prev.filter((x) => x.id !== expenseId))
  }

  async function onDeleteEvent() {
    if (!id || !window.confirm(t('eConfirmDelete'))) return
    setBusy(true)
    const { error } = await deleteEvent(id)
    setBusy(false)
    if (!error) navigate('/app', { replace: true })
  }

  if (ev === undefined) {
    return <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('loading')}</div>
  }
  if (ev === null) {
    return (
      <div style={{ paddingTop: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-soft)' }}>—</p>
        <button className="fx-btn fx-btn-ghost" onClick={() => navigate('/app')}>{t('eBackHome')}</button>
      </div>
    )
  }

  const doneCount = tasks.filter((x) => x.completed).length
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : setupProgress(ev)
  const alloc = budgetAllocation(ev.type, ev.budget_total)

  const tabBtn = (value: Tab, label: string) => {
    const on = tab === value
    return (
      <button
        key={value}
        onClick={() => setTab(value)}
        style={{
          flex: 1,
          fontFamily: 'inherit',
          fontWeight: 700,
          fontSize: '0.82rem',
          padding: '9px 6px',
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          background: on ? 'var(--color-sage)' : 'transparent',
          color: on ? '#fff' : 'var(--ink-soft)',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div style={{ paddingTop: 8, paddingBottom: 8 }}>
      <button
        onClick={() => navigate('/app')}
        aria-label={t('eBackHome')}
        style={{ background: 'var(--surface)', border: '1px solid var(--surface-line)', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'var(--ink)', fontSize: 16, marginBottom: 12 }}
      >
        ←
      </button>

      <div className="fx-card" style={{ padding: 18, display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
        <ProgressRing percent={pct} size={64} color={pct >= 100 ? 'var(--color-gold)' : 'var(--color-sage)'} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>{metaEmoji(EVENT_TYPES, ev.type)}</span>
            <h1 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--ink)' }}>{ev.title || metaLabel(EVENT_TYPES, ev.type, lang)}</h1>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
            📅 {formatDate(ev.event_date, lang)} · 👥 {ev.guest_count}
          </p>
        </div>
      </div>

      <div className="fx-card" style={{ padding: 5, display: 'flex', gap: 4, marginBottom: 14 }}>
        {tabBtn('summary', t('tabSummary'))}
        {tabBtn('checklist', t('tabChecklist'))}
        {tabBtn('budget', t('tabBudget'))}
      </div>

      {tab === 'summary' && (
        <>
          <div className="fx-card" style={{ padding: '4px 16px 12px', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1.05rem', color: 'var(--ink)', margin: '12px 0 2px' }}>{t('eSummary')}</h2>
            <Row label={t('wDate')} value={`${formatDate(ev.event_date, lang)}${ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ''}`} />
            <Row label={t('wDuration')} value={`${ev.duration_h} ${t('wHours')}`} />
            <Row label={t('wGuestCount')} value={`${ev.guest_count}`} />
            <Row label={t('wTotalBudget')} value={`€${ev.budget_total}`} />
            <Row label={t('wCity')} value={[ev.city, metaLabel(AREAS, ev.area, lang)].filter(Boolean).join(' · ')} />
            <Row label={t('wVenueType')} value={metaLabel(VENUE_TYPES, ev.venue_type, lang) || '—'} />
          </div>

          <div className="fx-card" style={{ padding: 16, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 8, fontSize: '0.95rem' }}>{t('wAllocation')}</div>
            <div style={{ display: 'grid', gap: 7 }}>
              {[
                { k: t('wCatVenue'), e: '🏛️', v: alloc.venue },
                { k: t('wCatCatering'), e: '🍽️', v: alloc.catering },
                { k: t('wCatDecor'), e: '🎨', v: alloc.decorations },
                { k: t('wCatPhoto'), e: '📸', v: alloc.photography },
              ].map((row) => (
                <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--color-champagne)', borderRadius: 10, padding: '8px 12px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-charcoal)' }}>{row.e} {row.k}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>€{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="fx-btn fx-btn-ghost" onClick={onDeleteEvent} disabled={busy} style={{ width: '100%', borderColor: '#d8a3a0', color: '#b3453f' }}>
            {t('eDelete')}
          </button>
        </>
      )}

      {tab === 'checklist' && (
        <ChecklistTab tasks={tasks} onAdd={addTask} onEdit={editTask} onToggle={toggleTask} onDelete={removeTask} />
      )}

      {tab === 'budget' && (
        <BudgetTab budgetTotal={ev.budget_total} expenses={expenses} onAdd={addExpense} onDelete={removeExpense} />
      )}
    </div>
  )
}
