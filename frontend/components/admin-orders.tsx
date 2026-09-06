'use client'

import { motion } from 'framer-motion'
import { Check, Clock, CreditCard, MapPin, Phone, X } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { Modal } from './modal'
import { StatusBadge } from './status-badge'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import type { Order, OrderStatus } from '@/lib/types'

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminOrders() {
  const { data: orders, isLoading, mutate } = useSWR<Order[]>('orders', () => api.getOrders())
  const { showToast } = useToast()
  const [selected, setSelected] = useState<Order | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function changeStatus(order: Order, status: OrderStatus) {
    setBusy(order.id)
    try {
      await api.updateOrderStatus(order.id, status)
      await mutate()
      showToast(
        status === 'ACCEPTED' ? `Заказ ${order.id} принят` : `Заказ ${order.id} отклонён`,
        status === 'ACCEPTED' ? 'success' : 'info',
      )
      setSelected((prev) => (prev && prev.id === order.id ? { ...prev, status } : prev))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Не удалось обновить статус', 'error')
    } finally {
      setBusy(null)
    }
  }

  const STATUS_ORDER: Record<string, number> = {
    PENDING: 1,
    ACCEPTED: 2,
    REJECTED: 3,
  }

  const sortedOrders = orders
    ? [...orders].sort((a, b) => {
        const priorityA = STATUS_ORDER[a.status] ?? 99
        const priorityB = STATUS_ORDER[b.status] ?? 99

        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }

        const timeA = new Date(a.createdAt || 0).getTime()
        const timeB = new Date(b.createdAt || 0).getTime()

        return timeB - timeA
      })
    : []

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    )
  }

  if (!orders?.length) {
    return (
      <p className="rounded-3xl border border-dashed border-border py-16 text-center text-muted-foreground">
        Заказов пока нет.
      </p>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sortedOrders.map((order) => (
          <motion.article
            key={order.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setSelected(order)}
              className="flex flex-col gap-3 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-lg font-bold text-card-foreground">
                  {order.customerName}
                </span>
                <StatusBadge status={order.status} />
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p className="font-mono font-semibold text-foreground">ID: {order.id}</p>
                <p className="flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {order.phoneNumber}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" /> {order.address}
                </p>
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                  <CreditCard className="size-3.5 shrink-0 text-muted-foreground" />
                  Оплата: {order.paymentMethod === 'card' ? 'Картой' : 'Наличными'}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="size-3.5" /> {formatTime(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">
                  {order.items.reduce((s, i) => s + i.quantity, 0)} шт.
                </span>
                <span className="text-lg font-extrabold text-accent">{order.total} MDL</span>
              </div>
            </button>

            {order.status === 'PENDING' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy === order.id}
                  onClick={() => changeStatus(order, 'ACCEPTED')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-success px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                >
                  <Check className="size-4" /> Принять
                </button>
                <button
                  type="button"
                  disabled={busy === order.id}
                  onClick={() => changeStatus(order, 'REJECTED')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-destructive px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                >
                  <X className="size-4" /> Отклонить
                </button>
              </div>
            )}
          </motion.article>
        ))}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        className="max-w-md"
        labelledBy="order-detail-title"
      >
        {selected && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="order-detail-title"
                className="font-heading text-2xl font-bold text-card-foreground"
              >
                {selected.customerName}
              </h2>
              <StatusBadge status={selected.status} />
            </div>

            <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <p className="font-mono font-semibold text-foreground">ID: {selected.id}</p>
              <p className="flex items-center gap-1.5">
                <Phone className="size-4" /> {selected.phoneNumber}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" /> {selected.address}
              </p>
              <p className="flex items-center gap-1.5 font-medium text-foreground pt-1">
                <CreditCard className="size-4 shrink-0 text-muted-foreground" />
                Способ оплаты: 
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold">
                  {selected.paymentMethod === 'card' ? 'Картой курьеру' : 'Наличными'}
                </span>
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-background p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Состав заказа
              </p>
              <ul className="divide-y divide-border">
                {selected.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="font-semibold text-foreground">
                      {item.title}{' '}
                      <span className="text-muted-foreground">× {item.quantity}</span>
                    </span>
                    <span className="font-bold text-foreground">
                      {item.price * item.quantity} MDL
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                <span className="font-bold text-foreground">Итого</span>
                <span className="text-lg font-extrabold text-accent">{selected.total} MDL</span>
              </div>
            </div>

            {selected.status === 'PENDING' && (
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  disabled={busy === selected.id}
                  onClick={() => changeStatus(selected, 'ACCEPTED')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-success px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                >
                  <Check className="size-4" /> Принять
                </button>
                <button
                  type="button"
                  disabled={busy === selected.id}
                  onClick={() => changeStatus(selected, 'REJECTED')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-destructive px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                >
                  <X className="size-4" /> Отклонить
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}