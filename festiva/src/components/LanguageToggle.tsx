import { useI18n } from '../i18n/I18nContext'

export function LanguageToggle() {
  const { lang, toggle } = useI18n()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambia lingua / Switch language"
      style={{
        fontFamily: 'inherit',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        color: 'var(--color-sage-dk)',
        border: '1.5px solid var(--color-sage)',
        borderRadius: '999px',
        padding: '4px 10px',
        background: 'transparent',
        cursor: 'pointer',
      }}
    >
      <span style={{ color: lang === 'it' ? 'var(--ink)' : undefined }}>IT</span>
      <span style={{ opacity: 0.5 }}> · </span>
      <span style={{ color: lang === 'en' ? 'var(--ink)' : undefined }}>EN</span>
    </button>
  )
}
