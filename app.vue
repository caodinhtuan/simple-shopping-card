<template>
  <n-config-provider :theme="currentNaiveTheme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <MessageApi/>
          <NuxtLoadingIndicator :height="1.5" color="linear-gradient(90deg,#8b5cf6,#06b6d4,#ec4899)"/>
          <n-layout :style="{ background: layoutBg }" class="min-h-screen">
            <AppHeader/>
            <n-layout-content class="min-h-[calc(100vh-140px)]">
              <NuxtPage/>
            </n-layout-content>
            <AppFooter/>
          </n-layout>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
import type {GlobalThemeOverrides} from 'naive-ui'
import {
  darkTheme,
  NConfigProvider,
  NDialogProvider,
  NLayout,
  NLayoutContent,
  NMessageProvider,
  NNotificationProvider,
} from 'naive-ui'
import {useCartStore} from '~/stores/cart'
import {usePreferencesStore} from '~/stores/preferences'
import AppHeader from '~/components/layout/AppHeader.vue'
import AppFooter from '~/components/layout/AppFooter.vue'
import MessageApi from '~/components/MessageApi.vue'

const cartStore = useCartStore()
const prefs = usePreferencesStore()
const colorMode = useColorMode()

const isLight = computed(() => colorMode.value === 'light')
const currentNaiveTheme = computed(() => (isLight.value ? null : darkTheme))
// Light: subtle grey body so white cards stand out (Naive UI pattern)
const layoutBg = computed(() => (isLight.value ? '#f8fafc' : '#0a0a1a'))

const themeOverrides = computed<GlobalThemeOverrides | undefined>(() => {
  // Light → undefined so Naive UI uses its native light theme. Only keep brand primary.
  if (isLight.value) {
    return {
      common: {
        primaryColor: '#8b5cf6',
        primaryColorHover: '#a78bfa',
        primaryColorPressed: '#7c3aed',
        primaryColorSuppl: '#8b5cf6',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
    }
  }

  return {
    common: {
      primaryColor: '#8b5cf6',
      primaryColorHover: '#a78bfa',
      primaryColorPressed: '#7c3aed',
      primaryColorSuppl: '#8b5cf6',
      bodyColor: '#0a0a1a',
      cardColor: 'rgba(255, 255, 255, 0.04)',
      modalColor: '#1a1a2e',
      popoverColor: '#1a1a2e',
      tableColor: 'rgba(255, 255, 255, 0.02)',
      inputColor: 'rgba(255, 255, 255, 0.06)',
      actionColor: 'rgba(255, 255, 255, 0.04)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      dividerColor: 'rgba(255, 255, 255, 0.06)',
      hoverColor: 'rgba(139, 92, 246, 0.1)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      borderRadius: '12px',
      borderRadiusSmall: '8px',
      fontSize: '14px',
      textColorBase: '#f1f5f9',
      textColor1: '#f1f5f9',
      textColor2: '#cbd5e1',
      textColor3: '#94a3b8',
    },
    Card: {
      color: 'rgba(255, 255, 255, 0.04)',
      borderColor: 'rgba(255, 255, 255, 0.06)',
      borderRadius: '16px',
      titleTextColor: '#f1f5f9',
      textColor: '#cbd5e1',
    },
    Button: {
      borderRadiusMedium: '10px',
      borderRadiusLarge: '12px',
    },
    Tag: {borderRadius: '8px'},
    Menu: {
      itemTextColor: '#94a3b8',
      itemTextColorHover: '#f1f5f9',
      itemTextColorActive: '#8b5cf6',
      itemTextColorActiveHover: '#a78bfa',
      itemColorActive: 'rgba(139, 92, 246, 0.1)',
      itemColorActiveHover: 'rgba(139, 92, 246, 0.15)',
      color: 'transparent',
    },
    Input: {
      color: 'rgba(255, 255, 255, 0.06)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textColor: '#f1f5f9',
    },
    InputNumber: {
      color: 'rgba(255, 255, 255, 0.06)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textColor: '#f1f5f9',
    },
    Tabs: {
      tabTextColorLine: '#94a3b8',
      tabTextColorActiveLine: '#8b5cf6',
      tabTextColorHoverLine: '#a78bfa',
      barColor: '#8b5cf6',
      tabColor: 'transparent',
    },
    Result: {titleTextColor: '#f1f5f9', textColor: '#cbd5e1'},
    Empty: {textColor: '#94a3b8'},
    Statistic: {labelTextColor: '#94a3b8', valueTextColor: '#f1f5f9'},
  }
})

onMounted(() => {
  prefs.loadFromStorage()
  cartStore.loadFromStorage()
})
</script>
