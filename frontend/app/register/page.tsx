'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { FieldInput } from '@/components/field-input'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'

type Errors = Partial<Record<'name' | 'email' | 'password', string>>

// Словарь для перевода сообщений об ошибках с бэкенда
// 1. Словарь точных совпадений и условий (condition)
const ERROR_MESSAGES: Record<string, string> = {
  // Ошибки заполнения (required)
  'username is required': 'Введите имя пользователя',
  'email is required': 'Введите email',
  'password is required': 'Введите пароль',

  // Формат email
  'invalid email format': 'Некорректный формат email',
  'email must be a valid email address': 'Введите корректный email',

  // Пароль
  'password too short': 'Пароль слишком короткий',
}

// 2. Умная функция перевода с поддержкой условий (min, required, etc.)
function translateError(rawError: string, condition?: string, key?: string): string {
  // Если есть точный перевод в словаре — берем его
  if (ERROR_MESSAGES[rawError]) {
    return ERROR_MESSAGES[rawError]
  }

  // Перевод по условию condition (например, min: 6 символов)
  if (condition === 'min' && key === 'password') {
    return 'Пароль должен содержать минимум 6 символов'
  }
  if (condition === 'required') {
    return 'Заполните это поле'
  }

  // Поиск по ключевым словам в тексте ошибки (если текст изменится на бэке)
  const lower = rawError.toLowerCase()
  if (lower.includes('at least') || lower.includes('password')) {
    return 'Пароль должен содержать минимум 6 символов'
  }
  if (lower.includes('email')) {
    return 'Введите корректный email'
  }

  // Фоллбэк
  return rawError
}

export default function RegisterPage() {
  const { register } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const user = await register(name, email, password)
      showToast(`Добро пожаловать, ${user.name}!`, 'success')
      router.push('/')
    } catch (err) {
      // 1. Если пришел массив валидационных ошибок (например, пустые поля)
      // 1. Если пришел массив валидационных ошибок (422)
      if (err instanceof ApiError && Array.isArray(err.fieldErrors) && err.fieldErrors.length) {
        const next: Errors = {}

        for (const fe of err.fieldErrors as any[]) {
          const fieldKey = fe.key || fe.field
          const rawMessage = fe.error || fe.message
          
          // Используем нашу обновленную функцию перевода
          const userFriendlyMessage = translateError(rawMessage, fe.condition, fieldKey)

          if (fieldKey === 'username' || fieldKey === 'name') {
            next.name = userFriendlyMessage
          } else if (fieldKey === 'email') {
            next.email = userFriendlyMessage
          } else if (fieldKey === 'password') {
            next.password = userFriendlyMessage
          }
        }

        setErrors(next)
      } else {
        // 2. Обработка одиночных ошибок с бэкенда
        const rawMessage = err instanceof Error ? err.message : String(err)

        // 🎯 Проверяем ошибку существующего email
        if (rawMessage.includes('already exists') || rawMessage.includes('user with the provided email')) {
          const friendlyError = 'Пользователь с таким email уже зарегистрирован'
          
          // Выводим красный тост
          showToast(friendlyError, 'error')
          
          // Подсвечиваем само поле email в форме
          setErrors({ email: friendlyError })
        } else {
          // Любая другая непредвиденная ошибка
          showToast(rawMessage || 'Ошибка регистрации', 'error')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-8 shadow-xl">
          <h1 className="text-center font-heading text-2xl font-bold text-card-foreground">
            Регистрация
          </h1>
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <FieldInput
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              autoComplete="name"
            />
            <FieldInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <FieldInput
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}