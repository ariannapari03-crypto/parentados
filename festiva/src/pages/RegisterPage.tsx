import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { LanguageToggle } from '../components/LanguageToggle'
import { AuthCanvas } from './AuthCanvas'

type Role = 'organizer' | 'partner'

export function RegisterPage() {
  const { t } = useI18n()
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState<Role>('organizer')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    const { error, needsConfirmation } = await signUp({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      role,
    })
    setBusy(false)
    if (error) {
      setError(t('authError'))
      return
    }
    if (needsConfirmation) setInfo(t('checkEmail'))
    else navigate('/app', { replace: true })
  }

  const roleCard = (value: Role, title: string, hint: string, emoji: string) => {
    const selected = role === value
    return (
      <button
        type="button"
        onClick={() => setRole(value)}
        style={{
          textAlign: 'left',
          borderRadius: 13,
          padding: 13,
          cursor: 'pointer',
          fontFamily: 'inherit',
          border: `2px solid ${selected ? 'var(--color-sage)' : 'var(--surface-line)'}`,
          background: selected
            ? 'linear-gradient(135deg, var(--color-sage), var(--color-sage-dk))'
            : 'var(--surface)',
          color: selected ? '#fff' : 'var(--ink)',
        }}
      >
        <div style={{ fontSize: 22 }}>{emoji}</div>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: 4 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 2 }}>{hint}</div>
      </button>
    )
  }

  return (
    <AuthCanvas>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <LanguageToggle />
      </div>
      <h1 style={{ margin: '0 0 16px', fontSize: '1.7rem', color: 'var(--ink)' }}>
        {t('createAccount')}
      </h1>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>
            {t('chooseRole')}
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
            {roleCard('organizer', t('iAmOrganizer'), t('iAmOrganizerHint'), '🎉')}
            {roleCard('partner', t('iAmPartner'), t('iAmPartnerHint'), '🏪')}
          </div>
        </div>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>
            {t('displayName')}
          </span>
          <input
            className="fx-input"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>{t('email')}</span>
          <input
            className="fx-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>
            {t('password')}
          </span>
          <input
            className="fx-input"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p style={{ color: '#b3453f', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
        {info && (
          <p style={{ color: 'var(--color-sage-dk)', fontSize: '0.85rem', margin: 0 }}>{info}</p>
        )}

        <button className="fx-btn fx-btn-primary" type="submit" disabled={busy}>
          {busy ? t('loading') : t('createAccount')}
        </button>
      </form>

      <p style={{ marginTop: 18, fontSize: '0.9rem', color: 'var(--ink-soft)', textAlign: 'center' }}>
        {t('haveAccount')}{' '}
        <Link to="/login" style={{ color: 'var(--color-sage-dk)', fontWeight: 700 }}>
          {t('signIn')}
        </Link>
      </p>
    </AuthCanvas>
  )
}
