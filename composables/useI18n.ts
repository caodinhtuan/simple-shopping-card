import {usePreferencesStore} from '~/stores/preferences'
import en from '~/locales/en.json'
import vi from '~/locales/vi.json'

type Dict = Record<string, string>

const messages: Record<string, Dict> = {en, vi}

export function useI18n() {
  const prefs = usePreferencesStore()

  function t(key: string, params?: Record<string, string | number>): string {
    const dict = messages[prefs.locale] || en
    let str = dict[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return str
  }

  return {t, locale: computed(() => prefs.locale)}
}
