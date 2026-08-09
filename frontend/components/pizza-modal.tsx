'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Modal } from './modal'
import { QuantityStepper } from './quantity-stepper'
import { useCart } from '@/lib/cart-context'
import { useToast } from '@/lib/toast-context'
import type { Pizza } from '@/lib/types'

interface PizzaModalProps {
  pizza: Pizza | null
  onClose: () => void
}

export function PizzaModal({ pizza, onClose }: PizzaModalProps) {
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()
  const { showToast } = useToast()

  function handleAdd() {
    if (!pizza) return
    addItem(pizza, quantity)
    showToast(`🍕 ${pizza.title} добавлена в корзину!`, 'success')
    setQuantity(1)
    onClose()
  }

  return (
    <Modal
      open={!!pizza}
      onClose={onClose}
      className="max-w-lg"
      labelledBy="pizza-modal-title"
    >
      {pizza && (
        <div className="p-4 sm:p-6">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
            <Image
              src={pizza.image || '/placeholder.svg'}
              alt={pizza.title}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
            />
          </div>

          <div className="mt-5 flex items-start justify-between gap-4">
            <h2
              id="pizza-modal-title"
              className="font-heading text-2xl font-bold text-card-foreground text-balance"
            >
              {pizza.title}
            </h2>
            <span className="shrink-0 text-xl font-extrabold text-accent">
              {pizza.price} MDL
            </span>
          </div>

          <div className="mt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Описание
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
              {pizza.description}
            </p>
          </div>

          <div className="mt-5 max-w-[12rem]">
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <ShoppingCart className="size-5" />
            Добавить в корзину · {pizza.price * quantity} MDL
          </button>
        </div>
      )}
    </Modal>
  )
}
