'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, Pizza } from './types'

interface CartContextValue {
  items: CartItem[]
  addItem: (pizza: Pizza, quantity?: number) => void
  removeItem: (id: string) => void
  setQuantity: (id: string, quantity: number) => void
  clear: () => void
  totalCount: number
  totalPrice: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  function addItem(pizza: Pizza, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === pizza.id)
      if (existing) {
        return prev.map((i) =>
          i.id === pizza.id ? { ...i, quantity: i.quantity + quantity } : i,
        )
      }
      return [...prev, { ...pizza, quantity }]
    })
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function setQuantity(id: string, quantity: number) {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity } : i)),
    )
  }

  function clear() {
    setItems([])
  }

  const totalCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const totalPrice = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items],
  )

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, setQuantity, clear, totalCount, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
