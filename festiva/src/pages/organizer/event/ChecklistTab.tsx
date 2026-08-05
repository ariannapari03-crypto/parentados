import { useState } from 'react'
import { useI18n } from '../../../i18n/I18nContext'
import { Modal } from '../../../components/Modal'
import { CATEGORIES, PRIORITIES, metaEmoji, metaLabel } from '../../../data/eventMeta'
import { formatDate } from '../../../lib/format'
import type { TaskInput } from '../../../lib/tasks'
import type { Priority, Task } from '../../../types/domain'

interface Props {
  tasks: Task[]
  onAdd: (input: TaskInput) => Promise<void>
  onEdit: (id: string, input: TaskInput) => Promise<void>
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 5 }

export function ChecklistTab({ tasks, onAdd, onEdit, onToggle, onDelete }: Props) {
  const { t, lang } = useI18n()
  const [editing, setEditing] = useState<Task | null>(null)
  const [open, setOpen] = useState(false)

  const done = tasks.filter((x) => x.completed).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  function openNew() {
    setEditing(null)
    setOpen(true)
  }
  function openEdit(task: Task) {
    setEditing(task)
    setOpen(true)
  }

  return (
    <div>
      <div className="fx-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{done}/{tasks.length} · {pct}%</span>
          <button className="fx-btn fx-btn-primary" style={{ padding: '7px 12px', fontSize: '0.8rem' }} onClick={openNew}>
            + {t('clAdd')}
          </button>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-line)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-sage)', borderRadius: 4, transition: 'width .4s' }} />
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', margin: '6px 0 0' }}>{t('clProgress')}</p>
      </div>

      {tasks.length === 0 ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('clEmpty')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 9 }}>
          {tasks.map((task) => {
            const overdue = Boolean(task.due_date) && !task.completed && new Date(task.due_date as string) < startOfToday()
            return (
              <div
                key={task.id}
                className="fx-card"
                style={{
                  padding: '11px 13px',
                  borderLeft: `4px solid ${task.completed ? 'var(--color-gold)' : overdue ? '#d8a3a0' : 'var(--color-sage)'}`,
                  opacity: task.completed ? 0.82 : 1,
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggle(task.id, !task.completed)}
                    style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--color-gold)', flex: '0 0 auto' }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem', textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.title}
                      </span>
                      <span style={{ fontSize: '0.72rem' }}>{metaEmoji(PRIORITIES, task.priority)}</span>
                    </div>
                    {task.notes && <p style={{ margin: '3px 0 0', color: 'var(--ink-soft)', fontSize: '0.75rem' }}>{task.notes}</p>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: '0.72rem', color: overdue ? '#b3453f' : 'var(--ink-soft)', flexWrap: 'wrap' }}>
                      <span>📅 {formatDate(task.due_date, lang)}{overdue ? ` · ${t('clOverdue')}` : ''}</span>
                      <span>{metaEmoji(CATEGORIES, task.category)} {metaLabel(CATEGORIES, task.category, lang)}</span>
                    </div>
                  </div>
                  <button onClick={() => openEdit(task)} aria-label={t('clEdit')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.7, flex: '0 0 auto' }}>
                    ⚙️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {open && (
        <TaskForm
          initial={editing}
          onClose={() => setOpen(false)}
          onDelete={
            editing
              ? () => {
                  onDelete(editing.id)
                  setOpen(false)
                }
              : undefined
          }
          onSubmit={async (input) => {
            if (editing) await onEdit(editing.id, input)
            else await onAdd(input)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

function TaskForm({
  initial,
  onSubmit,
  onClose,
  onDelete,
}: {
  initial: Task | null
  onSubmit: (input: TaskInput) => Promise<void>
  onClose: () => void
  onDelete?: () => void
}) {
  const { t } = useI18n()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'other')
  const [due, setDue] = useState(initial?.due_date ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    await onSubmit({
      title: title.trim(),
      category,
      due_date: due || null,
      priority,
      notes: notes.trim() || null,
    })
    setBusy(false)
  }

  return (
    <Modal title={initial ? t('clEdit') : t('clAdd')} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label>
          <span style={labelStyle}>{t('clTitle')}</span>
          <input className="fx-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('clTitlePh')} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <span style={labelStyle}>{t('clCategory')}</span>
            <select className="fx-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label.it}</option>
              ))}
            </select>
          </label>
          <label>
            <span style={labelStyle}>{t('clPriority')}</span>
            <select className="fx-input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.emoji} {p.label.it}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span style={labelStyle}>{t('clDue')}</span>
          <input className="fx-input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <label>
          <span style={labelStyle}>{t('clNotes')}</span>
          <textarea className="fx-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('clNotesPh')} rows={2} style={{ resize: 'none' }} />
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {onDelete && (
            <button type="button" className="fx-btn fx-btn-ghost" onClick={onDelete} style={{ borderColor: '#d8a3a0', color: '#b3453f' }}>
              {t('clDelete')}
            </button>
          )}
          <button type="submit" className="fx-btn fx-btn-primary" disabled={busy} style={{ marginLeft: 'auto' }}>
            {t('clSave')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
