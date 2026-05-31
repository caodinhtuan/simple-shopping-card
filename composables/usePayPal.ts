import {ref} from 'vue'

export function usePayPal() {
  const isLoaded = ref(false)
  const isLoading = ref(false)

  async function loadPayPal(): Promise<boolean> {
    if (isLoaded.value) return true

    const config = useRuntimeConfig()
    const clientId = config.public.paypalClientId as string

    if (!clientId) {
      console.warn('PayPal client ID is not configured')
      return false
    }

    // Check if already loaded
    if ((window as any).paypal) {
      isLoaded.value = true
      return true
    }

    isLoading.value = true

    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`
      script.async = true

      script.onload = () => {
        isLoaded.value = true
        isLoading.value = false
        resolve(true)
      }

      script.onerror = () => {
        isLoading.value = false
        console.error('Failed to load PayPal SDK')
        resolve(false)
      }

      document.head.appendChild(script)
    })
  }

  return {
    isLoaded,
    isLoading,
    loadPayPal,
  }
}
