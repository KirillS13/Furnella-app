'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { Modal } from './modal'
import { ApiError, MOCK_SMS_CODE, USE_MOCK, api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'

const CODE_LENGTH = 5

interface SmsVerifyModalProps {
  open: boolean;
  phoneNumber: string;
  onClose: () => void;
  onVerified: () => void;
  username: string;
  address: string;
  cart: {
    // ИСПРАВЛЕНИЕ: меняем id: string на id: number
    items: Array<{ id: number; title: string; price: number; quantity: number }>;
    total: number;
  };
}

// ... (импорты и пропсы остаются прежними)

export function SmsVerifyModal({ open, phoneNumber, onClose, onVerified, username, address, cart }: SmsVerifyModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const { user, setUser } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (open) {
      setDigits(Array(CODE_LENGTH).fill(''))
      setError('')
      // 🔥 УДАЛИЛИ СТРОКУ api.requestSmsCode(phoneNumber), чтобы бэк не ругался на дубликат СМС
      setTimeout(() => inputs.current[0]?.focus(), 100)
    }
  }, [open, phoneNumber])

  function handleChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = char
      return next
    })
    if (char && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((c, i) => (next[i] = c))
    setDigits(next)
    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
  }

  async function handleSubmit() {
    const code = digits.join('')
    if (code.length < CODE_LENGTH) {
      setError('Введите 5-значный код')
      return
    }
    setLoading(true)
    setError('')
    try {
      const orderPayload = {
        name: username,
        phoneNumber: phoneNumber, // Это тот НОВЫЙ номер, который ввёл пользователь
        address: address,
        items: cart.items,
        total: cart.total
      };
      
      // Отправляем СМС и заказ на бэкенд
      const updated = await api.verifyPhone(code, phoneNumber, orderPayload)
      
      // ОБНОВЛЕНИЕ ПРОФИЛЯ: 
      // Если у пользователя изменился номер, мы принудительно записываем 
      // новый подтверждённый номер в его профиль на фронтенде
      if (user) {
        setUser({
          ...user,
          ...updated, 
          phoneNumber: phoneNumber,        // Записываем новый введённый номер вместо старого
          phoneNumberVerified: true        // Он теперь подтверждён
        })
      }
      
      showToast('Номер телефона успешно изменен и подтверждён!', 'success')
      onVerified()
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.fieldErrors) && err.fieldErrors.length) {
        setError(err.fieldErrors[0].message)
      } else {
        setError(err instanceof Error ? err.message : 'Неверный код')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm" labelledBy="sms-title">
      <div className="p-6 text-center sm:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
          <MessageSquareText className="size-7" />
        </div>
        <h2 id="sms-title" className="mt-4 font-heading text-xl font-bold text-card-foreground">
          Подтверждение номера
        </h2>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          Мы отправили 5-значный код на номер{' '}
          <span className="font-semibold text-foreground">{phoneNumber}</span>
        </p>

        <div className="mt-6 flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el
              }}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Цифра ${i + 1}`}
              className={`size-12 rounded-2xl border bg-background text-center text-xl font-bold text-foreground outline-none transition-all focus:ring-4 ${
                error
                  ? 'border-destructive ring-2 ring-destructive/30'
                  : 'border-border focus:border-accent focus:ring-accent/25'
              }`}
            />
          ))}
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}

        {USE_MOCK && (
          <p className="mt-3 text-xs text-muted-foreground">
            Демо-режим: код <span className="font-bold text-accent">{MOCK_SMS_CODE}</span>
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? 'Проверяем…' : 'Подтвердить'}
        </button>
      </div>
    </Modal>
  )
}
