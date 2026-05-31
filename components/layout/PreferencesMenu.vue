<template>
  <div class="relative">
    <button
      class="btn-reset p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
      :aria-label="t('pref.theme')"
      @click="open = !open"
      @blur="onBlur"
    >
      <!-- Sun / Moon icon -->
      <svg v-if="prefs.theme === 'dark'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>

      <span class="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
        {{ prefs.locale.toUpperCase() }}
      </span>
      <svg class="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition name="slide">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50 shadow-2xl backdrop-blur-2xl bg-white border border-slate-200 shadow-slate-900/15 dark:bg-[#1a1a2e] dark:border-white/[0.08] dark:shadow-black/40"
        @mousedown.prevent
      >
        <!-- Theme section -->
        <div class="px-3 py-2 border-b border-white/[0.06]">
          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 px-2">
            {{ t('pref.theme') }}
          </p>
          <button
            class="btn-reset w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors"
            :class="prefs.theme === 'dark' ? 'bg-purple-500/15 text-purple-200' : 'text-slate-300 hover:bg-white/5'"
            @click="setTheme('dark')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
            <span class="flex-1 text-left">{{ t('pref.theme_dark') }}</span>
            <svg v-if="prefs.theme === 'dark'" class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
          <button
            class="btn-reset w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors"
            :class="prefs.theme === 'light' ? 'bg-purple-500/15 text-purple-200' : 'text-slate-300 hover:bg-white/5'"
            @click="setTheme('light')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
            <span class="flex-1 text-left">{{ t('pref.theme_light') }}</span>
            <svg v-if="prefs.theme === 'light'" class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
        </div>

        <!-- Language section -->
        <div class="px-3 py-2">
          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 px-2">
            {{ t('pref.language') }}
          </p>
          <button
            class="btn-reset w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors"
            :class="prefs.locale === 'en' ? 'bg-purple-500/15 text-purple-200' : 'text-slate-300 hover:bg-white/5'"
            @click="setLocale('en')"
          >
            <span class="text-lg leading-none">🇬🇧</span>
            <span class="flex-1 text-left">{{ t('pref.language_en') }}</span>
            <svg v-if="prefs.locale === 'en'" class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
          <button
            class="btn-reset w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors"
            :class="prefs.locale === 'vi' ? 'bg-purple-500/15 text-purple-200' : 'text-slate-300 hover:bg-white/5'"
            @click="setLocale('vi')"
          >
            <span class="text-lg leading-none">🇻🇳</span>
            <span class="flex-1 text-left">{{ t('pref.language_vi') }}</span>
            <svg v-if="prefs.locale === 'vi'" class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {type Locale, type ThemeMode, usePreferencesStore} from '~/stores/preferences'

const prefs = usePreferencesStore()
const { t } = useI18n()
const open = ref(false)

function setTheme(t: ThemeMode) {
  prefs.setTheme(t)
}
function setLocale(l: Locale) {
  prefs.setLocale(l)
  open.value = false
}
function onBlur() {
  // small delay so click-through to dropdown buttons still fires
  setTimeout(() => { open.value = false }, 150)
}
</script>
