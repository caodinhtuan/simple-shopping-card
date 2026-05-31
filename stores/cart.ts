import { defineStore } from 'pinia'

export interface CartItem {
  id: number
  name: string
  price: number // in cents
  image: string
  quantity: number
}

interface CartState {
  items: CartItem[]
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
  }),

  getters: {
    totalItems(state): number {
      return state.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    totalPrice(state): number {
      return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },

    cartItems(state): CartItem[] {
      return state.items
    },
  },

  actions: {
    addItem(product: Omit<CartItem, 'quantity'>, quantity: number = 1) {
      const existing = this.items.find((item) => item.id === product.id)
      if (existing) {
        existing.quantity += quantity
      } else {
        this.items.push({ ...product, quantity })
      }
      this._saveToStorage()
    },

    removeItem(id: number) {
      this.items = this.items.filter((item) => item.id !== id)
      this._saveToStorage()
    },

    updateQuantity(id: number, quantity: number) {
      const item = this.items.find((item) => item.id === id)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(id)
        } else {
          item.quantity = quantity
          this._saveToStorage()
        }
      }
    },

    clearCart() {
      this.items = []
      this._saveToStorage()
    },

    loadFromStorage() {
      if (import.meta.client) {
        try {
          const stored = localStorage.getItem('cart-items')
          if (stored) {
            this.items = JSON.parse(stored)
          }
        } catch {
          // ignore parse errors
        }
      }
    },

    _saveToStorage() {
      if (import.meta.client) {
        localStorage.setItem('cart-items', JSON.stringify(this.items))
      }
    },
  },
})
