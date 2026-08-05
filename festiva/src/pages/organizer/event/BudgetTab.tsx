import { useMemo, useState } from 'react'
import { useI18n } from '../../../i18n/I18nContext'
import { Modal } from '../../../components/Modal'
import { CATEGORIES, CATEGORY_COLOR, metaEmoji, metaLabel } from '../../../data/eventMeta'
import { formatDate } from '../../../lib/format'
import type { ExpenseInput } from '../../../lib/expenses'
import type { Expense } from '../../../types/domain'

interface Props {
  budgetTotal: number
  expenses: Expense[]
  onAdd: (input: ExpenseInput) => Promise<void>
  onDelete: (id: string) => void
}

const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 5 }

export function BudgetTab({ budgetTotal, expenses, onAdd, onDelete }: Props) {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)

  const spent = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses])
  const remaining = budgetTotal - spent
  const spentPct = budgetTotal > 0 ? Math.min(100, Math.round((spent / budgetTotal) * 100)) : 0

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount || 0))
    return CATEGORIES.map((c) => ({ cat: c.value, value: map.get(c.value) ?? 0 })).filter((x) => x.value > 0)
  }, [expenses])

  const donut = useMemo(() => {
    if (spent <= 0) return null
    let acc = 0
    const stops = byCategory.map(({ cat, value }) => {
      const start = (acc / spent) * 100
      acc += value
      const end = (acc / spent) * 100
      return `${CATEGORY_COLOR[cat] ?? '#B9AE9C'} ${start}% ${end}%`
    })
    return `conic-gradient(${stops.join(', ')})`
  }, [byCategory, spent])

  return (
    <div>
      <div className="fx-card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)' }}>€{budgetTotal}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)' }}>{t('bTotal')}</div>
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-dk)' }}>€{spent}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)' }}>{t('bSpent')}</div>
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: remaining < 0 ? '#b3453f' : 'var(--color-sage-dk)' }}>€{remaining}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)' }}>{t('bRemaining')}</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-line)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${spentPct}%`, background: remaining < 0 ? '#b3453f' : 'var(--color-sage)', borderRadius: 4 }} />
        </div>
      </div>

      <div className="fx-card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{t('bBreakdown')}</div>
        {donut ? (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 120, height: 120, borderRadius: '50%', background: donut, flex: '0 0 auto' }}>
              <div style={{ position: 'absolute', inset: 22, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)' }}>{spentPct}%</span>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
              {byCategory.map(({ cat, value }) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: 'var(--ink)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLOR[cat], flex: '0 0 auto' }} />
                  {metaLabel(CATEGORIES, cat, lang)} · €{value}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: 0 }}>{t('bNoData')}</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 2px 10px' }}>
        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{t('bExpenses')}</span>
        <button className="fx-btn fx-btn-primary" style={{ padding: '7px 12px', fontSize: '0.8rem' }} onClick={() => setOpen(true)}>
          + {t('bAdd')}
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('bEmpty')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {expenses.map((e) => (
            <div key={e.id} className="fx-card" style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.88rem' }}>{e.description}</div>
                <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', marginTop: 2 }}>
                  {formatDate(e.spent_on, lang)} · {metaEmoji(CATEGORIES, e.category)} {metaLabel(CATEGORIES, e.category, lang)}
                </div>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '0.9rem' }}>€{e.amount}</span>
              <button onClick={() => onDelete(e.id)} aria-label={t('clDelete')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.6, flex: '0 0 auto' }}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <ExpenseForm
          onClose={() => setOpen(false)}
          onSubmit={async (input) => {
            await onAdd(input)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

function ExpenseForm({ onSubmit, onClose }: { onSubmit: (input: ExpenseInput) => Promise<void>; onClose: () => void }) {
  const { t } = useI18n()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('other')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setBusy(true)
    await onSubmit({
      description: description.trim(),
      amount: Number(amount) || 0,
      spent_on: date || null,
      category,
    })
    setBusy(false)
  }

  return (
    <Modal title={t('bAdd')} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label>
          <span style={labelStyle}>{t('bDesc')}</span>
          <input className="fx-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('bDescPh')} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <span style={labelStyle}>{t('bAmount')}</span>
            <input className="fx-input" type="number" min={0} step="1" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label>
            <span style={labelStyle}>{t('clCategory')}</span>
            <select className="fx-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label.it}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span style={labelStyle}>{t('bDate')}</span>
          <input className="fx-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button type="submit" className="fx-btn fx-btn-primary" disabled={busy} style={{ marginTop: 4 }}>
          {t('clSave')}
        </button>
      </form>
    </Modal>
  )
}
