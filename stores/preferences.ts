import {defineStore} from 'pinia'

export type ThemeMode = 'dark' | 'light'
export type Locale = 'en' | 'vi'

interface PreferencesState {
  theme: ThemeMode
  locale: Locale
}

export const usePreferencesStore = defineStore('preferences', {
  state: (): PreferencesState => ({
    theme: 'dark',
    locale: 'en',
  }),

  actions: {
    setTheme(theme: ThemeMode) {
      this.theme = theme
      if (import.meta.client) {
        localStorage.setItem('shoppay-theme', theme)
        // Tailwind dark mode is class-based; toggle on <html>
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }
    },

    toggleTheme() {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark')
    },

    setLocale(locale: Locale) {
      this.locale = locale
      if (import.meta.client) {
        localStorage.setItem('shoppay-locale', locale)
      }
    },

    loadFromStorage() {
      if (!import.meta.client) return
      const theme = localStorage.getItem('shoppay-theme') as ThemeMode | null
      const locale = localStorage.getItem('shoppay-locale') as Locale | null
      if (theme === 'dark' || theme === 'light') this.setTheme(theme)
      if (locale === 'en' || locale === 'vi') this.locale = locale
    },
  },
})
