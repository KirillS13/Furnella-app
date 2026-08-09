'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { ShoppingBag, ShoppingCart, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { OrderModal } from './order-modal'
import { QuantityStepper } from './quantity-stepper'
import { useCart } from '@/lib/cart-context'

export function CartLauncher() {
  const { items, totalCount, totalPrice, setQuantity, removeItem } = useCart()
  const [open, setOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть корзину"
        className="fixed bottom-6 right-6 z-40 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        <ShoppingCart className="size-6" />
        <AnimatePresence>
          {totalCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 inline-flex min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground"
            >
              {totalCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Slide-over panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-card shadow-2xl"
              role="dialog"
              aria-label="Корзина"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <h2 className="font-heading text-xl font-bold text-card-foreground">Корзина</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Закрыть корзину"
                  className="inline-flex size-9 items-center justify-center rounded-full text-foreground/60 transition-colors hover:text-destructive"
                >
                  <X className="size-5" />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                  <ShoppingBag className="size-12 text-muted-foreground/50" />
                  <p className="font-semibold text-foreground">Корзина пуста</p>
                  <p className="text-sm text-muted-foreground">
                    Добавьте пиццу из меню, чтобы оформить заказ.
                  </p>
                </div>
              ) : (
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-3 rounded-2xl border border-border/70 bg-background p-3"
                      >
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={item.image || '/placeholder.svg'}
                            alt={item.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-foreground">{item.title}</p>
                              <p className="text-sm font-semibold text-accent">
                                {item.price} MDL
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              aria-label={`Удалить ${item.title}`}
                              className="text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <div className="max-w-[9rem]">
                            <QuantityStepper
                              value={item.quantity}
                              onChange={(q) => setQuantity(item.id, q)}
                              min={0}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {items.length > 0 && (
                <div className="border-t border-border px-6 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Итоговая цена:
                    </span>
                    <span className="text-2xl font-extrabold text-accent">{totalPrice} MDL</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      setOrderOpen(true)
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
                  >
                    Оформить заказ
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} />
    </>
  )
}
