/**
 * Dynamic proxy wrappers for Naive UI's message, dialog, and notification APIs.
 * These do NOT use the inject context during component setup, preventing any Nuxt 3 SSR
 * and client-side hydration boot order errors.
 * They dynamically access the globally registered window.$message / window.$dialog / window.$notification APIs at runtime.
 */

export function useAppMessage() {
  return {
    success: (content: string, options?: any) => {
      if (import.meta.client && (window as any).$message) {
        return (window as any).$message.success(content, options)
      }
      return { id: 'ssr-proxy-dummy' }
    },
    error: (content: string, options?: any) => {
      if (import.meta.client && (window as any).$message) {
        return (window as any).$message.error(content, options)
      }
      return { id: 'ssr-proxy-dummy' }
    },
    warning: (content: string, options?: any) => {
      if (import.meta.client && (window as any).$message) {
        return (window as any).$message.warning(content, options)
      }
      return { id: 'ssr-proxy-dummy' }
    },
    info: (content: string, options?: any) => {
      if (import.meta.client && (window as any).$message) {
        return (window as any).$message.info(content, options)
      }
      return { id: 'ssr-proxy-dummy' }
    },
    loading: (content: string, options?: any) => {
      if (import.meta.client && (window as any).$message) {
        return (window as any).$message.loading(content, options)
      }
      return { id: 'ssr-proxy-dummy' }
    }
  }
}

export function useAppDialog() {
  return {
    success: (options: any) => {
      if (import.meta.client && (window as any).$dialog) {
        return (window as any).$dialog.success(options)
      }
      return { id: 'ssr-proxy-dummy' }
    },
    error: (options: any) => {
      if (import.meta.client && (window as any).$dialog) {
        return (window as any).$dialog.error(options)
      }
      return { id: 'ssr-proxy-dummy' }
    },
    warning: (options: any) => {
      if (import.meta.client && (window as any).$dialog) {
        return (window as any).$dialog.warning(options)
      }
      return { id: 'ssr-proxy-dummy' }
    },
    info: (options: any) => {
      if (import.meta.client && (window as any).$dialog) {
        return (window as any).$dialog.info(options)
      }
      return { id: 'ssr-proxy-dummy' }
    }
  }
}

export function useAppNotification() {
  return {
    success: (options: any) => {
      if (import.meta.client && (window as any).$notification) {
        return (window as any).$notification.success(options)
      }
      return { id: 'ssr-proxy-dummy' }
    },
    error: (options: any) => {
      if (import.meta.client && (window as any).$notification) {
        return (window as any).$notification.error(options)
      }
      return { id: 'ssr-proxy-dummy' }
    },
    warning: (options: any) => {
      if (import.meta.client && (window as any).$notification) {
        return (window as any).$notification.warning(options)
      }
      return { id: 'ssr-proxy-dummy' }
    },
    info: (options: any) => {
      if (import.meta.client && (window as any).$notification) {
        return (window as any).$notification.info(options)
      }
      return { id: 'ssr-proxy-dummy' }
    }
  }
}
