import { useI18n } from '../i18n/I18nContext'

export function PlaceholderPage({ title, emoji }: { title: string; emoji: string }) {
  const { t } = useI18n()
  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 30 }}>{emoji}</span>
        <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--ink)' }}>{title}</h1>
      </div>
      <div className="fx-card" style={{ padding: 22, textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>🚧</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--ink)' }}>
          {t('comingSoon')}
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', margin: '8px 0 0' }}>
          {t('comingSoonBody')}
        </p>
      </div>
    </div>
  )
}
