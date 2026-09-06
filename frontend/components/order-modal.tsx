'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Modal } from './modal'
import { FieldInput } from './field-input'
import { SmsVerifyModal } from './sms-verify-modal'
import { ApiError, api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useCart } from '@/lib/cart-context'
import { useToast } from '@/lib/toast-context'

interface OrderModalProps {
  open: boolean
  onClose: () => void
}

type Errors = Partial<Record<'name' | 'phoneNumber' | 'address', string>>

export function OrderModal({ open, onClose }: OrderModalProps) {
  const { items, totalPrice, clear } = useCart()
  const { user, refresh } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash') // <-- СОСТОЯНИЕ ОПЛАТЫ
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [smsOpen, setSmsOpen] = useState(false)

  function resetAndClose() {
    setErrors({})
    onClose()
  }

  function applyFieldErrors(err: unknown) {
    if (err instanceof ApiError && Array.isArray(err.fieldErrors) && err.fieldErrors.length) {
      const next: Errors = {}
      for (const fe of err.fieldErrors) {
        const field = fe.field as keyof Errors
        if (field === 'name' || field === 'phoneNumber' || field === 'address') {
          next[field] = fe.message
        }
      }
      setErrors(next)
      return true
    }
    return false
  }

  async function submitOrder() {
    setLoading(true)
    setErrors({})

    console.log("ДАННЫЕ ПЕРЕД ОТПРАВКОЙ:", {
      name,
      phoneNumber,
      address,
      paymentMethod, // <-- Лог оплаты
      items
    });

    try {
      // 1. Делаем запрос на бэкенд
      const response = await api.createOrder({
        name,
        phoneNumber,
        address,
        paymentMethod, // <-- Передаем на бэкенд ("cash" или "card")
        userId: user?.id || '',
        items: items.map((i) => ({
          id: Number(i.id),
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          description: i.description || '',
          image: i.image || '',
        })),
        total: totalPrice,
      }) as any;

      // 2. ПРОВЕРКА ОТВЕТА БЭКЕНДА
      if (response?.message === "Verified message was sent") {
        setSmsOpen(true);
        return;
      }

      showToast('🎉 Заказ успешно оформлен!', 'success')
      clear()
      resetAndClose()
    } catch (err) {
      if (err instanceof Error && err.message.includes("already been sent")) {
        setSmsOpen(true);
      } else if (!applyFieldErrors(err)) {
        showToast(err instanceof Error ? err.message : 'Не удалось оформить заказ', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      showToast('Войдите в аккаунт, чтобы оформить заказ', 'info')
      router.push('/login')
      return
    }

    const next: Errors = {}
    if (name.trim().length < 2) next.name = 'Введите имя'
    if (!/^\+?[0-9\s]{8,}$/.test(phoneNumber)) next.phoneNumber = 'Неверный формат телефона'
    if (address.trim().length < 4) next.address = 'Введите адрес доставки'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    await submitOrder()
  }

  async function handleVerified() {
    setSmsOpen(false)
    await refresh()

    showToast('🎉 Заказ успешно оформлен!', 'success')
    clear()
    resetAndClose()
  }

  return (
    <>
      <Modal open={open} onClose={resetAndClose} className="max-w-md" labelledBy="order-title">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <h2 id="order-title" className="text-center font-heading text-2xl font-bold text-card-foreground">
            Заказ
          </h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Заполните данные для доставки
          </p>

          <div className="mt-6 space-y-3">
            <FieldInput
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              autoComplete="name"
            />
            <FieldInput
              placeholder="Номер телефона"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              error={errors.phoneNumber}
              inputMode="tel"
              autoComplete="tel"
            />
            <FieldInput
              placeholder="Адрес"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={errors.address}
              autoComplete="street-address"
            />
          </div>

          {/* ВЫБОР СПОСОБА ОПЛАТЫ */}
          <div className="mt-5 text-left">
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Способ оплаты
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-card-foreground cursor-pointer select-none">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                Наличными
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-card-foreground cursor-pointer select-none">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                Картой курьеру
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-center">
            <span className="text-sm font-semibold text-muted-foreground">Итоговая цена:</span>
            <span className="text-xl font-extrabold text-accent">{totalPrice} MDL</span>
          </div>

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? 'Оформляем…' : 'Заказать'}
          </button>
        </form>
      </Modal>

      <SmsVerifyModal
        open={smsOpen}
        phoneNumber={phoneNumber}
        onClose={() => setSmsOpen(false)}
        onVerified={handleVerified}
        username={name}
        address={address}
        cart={{
          items: items.map(item => ({
            id: Number(item.id),
            title: item.title,
            price: item.price,
            quantity: item.quantity
          })),
          total: totalPrice
        }}
      />
    </>
  )
}