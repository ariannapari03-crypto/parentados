import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { LanguageToggle } from '../components/LanguageToggle'
import { AuthCanvas } from './AuthCanvas'

export function LoginPage() {
  const { t } = useI18n()
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setError(t('authError'))
    else navigate('/app', { replace: true })
  }

  return (
    <AuthCanvas>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <LanguageToggle />
      </div>
      <h1 style={{ margin: '0 0 4px', fontSize: '2rem', color: 'var(--ink)' }}>{t('appName')}</h1>
      <p style={{ margin: '0 0 20px', color: 'var(--ink-soft)' }}>{t('tagline')}</p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
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
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>{t('password')}</span>
          <input
            className="fx-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p style={{ color: '#b3453f', fontSize: '0.85rem', margin: 0 }}>{error}</p>
        )}

        <button className="fx-btn fx-btn-primary" type="submit" disabled={busy}>
          {busy ? t('loading') : t('signIn')}
        </button>
      </form>

      <p style={{ marginTop: 18, fontSize: '0.9rem', color: 'var(--ink-soft)', textAlign: 'center' }}>
        {t('noAccount')}{' '}
        <Link to="/register" style={{ color: 'var(--color-sage-dk)', fontWeight: 700 }}>
          {t('signUp')}
        </Link>
      </p>
    </AuthCanvas>
  )
}
