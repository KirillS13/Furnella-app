'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import type { Pizza } from '@/lib/types'
import { PizzaCard } from './pizza-card'
import { PizzaModal } from './pizza-modal'

export function MenuGrid() {
  const { data: pizzas, isLoading, error } = useSWR<Pizza[]>('menus', () => api.getMenus())
  const [selected, setSelected] = useState<Pizza | null>(null)

  if (error) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        Не удалось загрузить меню. Попробуйте обновить страницу.
      </p>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card"
              >
                <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
                <div className="space-y-3 p-6">
                  <div className="h-6 w-2/3 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            ))
          : pizzas?.map((pizza) => (
              <PizzaCard key={pizza.id} pizza={pizza} onClick={() => setSelected(pizza)} />
            ))}
      </div>

      <PizzaModal pizza={selected} onClose={() => setSelected(null)} />
    </>
  )
}
