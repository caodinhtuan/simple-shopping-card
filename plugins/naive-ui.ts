import {setup} from '@css-render/vue3-ssr'
import * as naive from 'naive-ui'
import {defineNuxtPlugin} from '#app'

/**
 * Nuxt plugin that:
 *  1. Registers every Naive UI component globally so kebab-case tags
 *     (<n-button>, <n-input>, <n-modal>, ...) resolve in all templates.
 *  2. Wires the CSS-render SSR collector so server-rendered HTML carries
 *     the Naive UI generated CSS.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Register all Naive UI components globally.
  for (const key of Object.keys(naive)) {
    const value = (naive as any)[key]
    // Naive UI components are objects/functions whose key starts with "N",
    // (NButton, NInput, NMessageProvider, ...). Skip composables, themes, etc.
    if (
      typeof key === 'string' &&
      key.startsWith('N') &&
      value &&
      (typeof value === 'object' || typeof value === 'function') &&
      (value.name || value.__name || value.render || value.setup)
    ) {
      nuxtApp.vueApp.component(key, value)
    }
  }

  // SSR style collection
  if (import.meta.server) {
    const { collect } = setup(nuxtApp.vueApp)
    nuxtApp.ssrContext!.head = nuxtApp.ssrContext!.head || []
    nuxtApp.hooks.hook('app:rendered', () => {
      const cssContent = collect()
      ;(nuxtApp.ssrContext!.head as any).push(cssContent)
    })
  }
})
