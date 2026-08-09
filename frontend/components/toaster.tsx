'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useToast, type ToastVariant } from '@/lib/toast-context'

const iconFor: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const accentFor: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-destructive',
  info: 'text-accent',
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconFor[toast.variant]
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl"
              role="status"
            >
              <Icon className={`size-5 shrink-0 ${accentFor[toast.variant]}`} />
              <p className="text-pretty text-sm font-semibold text-card-foreground">
                {toast.message}
              </p>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
