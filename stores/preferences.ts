import {defineStore} from 'pinia'

export type Locale = 'en' | 'vi'

interface PreferencesState {
  locale: Locale
}

/**
 * Preferences store — only handles locale.
 * Theme (dark/light) is managed by @nuxtjs/color-mode via useColorMode().
 */
export const usePreferencesStore = defineStore('preferences', {
  state: (): PreferencesState => ({locale: 'en'}),

  actions: {
    setLocale(locale: Locale) {
      this.locale = locale
      if (import.meta.client) {
        localStorage.setItem('shoppay-locale', locale)
      }
    },

    loadFromStorage() {
      if (!import.meta.client) return
      const locale = localStorage.getItem('shoppay-locale') as Locale | null
      if (locale === 'en' || locale === 'vi') this.locale = locale
    },
  },
})
