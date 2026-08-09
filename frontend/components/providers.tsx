'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { CartProvider } from '@/lib/cart-context'
import { ToastProvider } from '@/lib/toast-context'
import { Toaster } from './toaster'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
