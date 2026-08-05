import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'

export function PartnerDashboardPage() {
  const { t } = useI18n()
  const { profile } = useAuth()

  return (
    <div style={{ paddingTop: 12 }}>
      <p style={{ margin: '0 0 2px', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
        Area Locale · Alba
      </p>
      <h1 style={{ margin: '0 0 16px', fontSize: '1.6rem', color: 'var(--ink)' }}>
        {t('partnerHi')} {profile?.display_name?.split(' ')[0] ?? ''} 🏪
      </h1>

      <div
        className="fx-card"
        style={{
          padding: 16,
          marginBottom: 14,
          background: 'var(--color-champagne)',
          border: '1px dashed var(--color-gold)',
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
          🎁 {t('trialActive')}
        </div>
        <p style={{ color: 'var(--color-charcoal)', fontSize: '0.85rem', margin: '4px 0 0' }}>
          {t('trialBody')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { n: '—', l: 'Visite scheda' },
          { n: '—', l: 'Riscatti' },
          { n: '—', l: 'Valutazione' },
        ].map((k) => (
          <div key={k.l} className="fx-card" style={{ padding: '14px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)' }}>{k.n}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)', marginTop: 3 }}>{k.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
