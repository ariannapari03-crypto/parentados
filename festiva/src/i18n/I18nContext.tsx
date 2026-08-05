import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { strings, type Lang, type StringKey } from './strings'

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggle: () => void
  t: (key: StringKey) => string
}

const I18nContext = createContext<I18nValue | null>(null)

const STORAGE_KEY = 'festiva_lang'

function initialLang(): Lang {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'it' || saved === 'en') return saved
  }
  return 'it'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const setLang = useCallback((next: Lang) => setLangState(next), [])
  const toggle = useCallback(() => setLangState((l) => (l === 'it' ? 'en' : 'it')), [])
  const t = useCallback((key: StringKey) => strings[lang][key], [lang])

  const value = useMemo<I18nValue>(() => ({ lang, setLang, toggle, t }), [lang, setLang, toggle, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n deve essere usato dentro <I18nProvider>')
  return ctx
}
