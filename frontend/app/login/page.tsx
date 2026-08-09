'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { FieldInput } from '@/components/field-input'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { ApiError } from '@/lib/api'

type Errors = Partial<Record<'email' | 'password', string>>

export default function LoginPage() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      await login(email, password)
      showToast('Авторизация успешна!', 'success')
      router.push('/')
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err)
      const lower = rawMessage.toLowerCase()

      // 🎯 Проверяем ошибку неверного логина или пароля
      if (
        lower.includes('invalid email or password') ||
        lower.includes('invalid credentials') ||
        lower.includes('unauthorized') ||
        (err instanceof ApiError && err.status === 401)
      ) {
        const friendlyMessage = 'Неверный email или пароль'
        
        // Подсвечиваем инпут с паролем красивой красной рамкой
        setErrors({ password: friendlyMessage })
        showToast(friendlyMessage, 'error')
      } else if (err instanceof ApiError && Array.isArray(err.fieldErrors) && err.fieldErrors.length) {
        // Если пришли валидационные ошибки по полям
        const next: Errors = {}
        for (const fe of err.fieldErrors as any[]) {
          const key = fe.key || fe.field
          if (key === 'email') next.email = 'Введите корректный email'
          if (key === 'password') next.password = 'Введите пароль'
        }
        setErrors(next)
      } else {
        // Любая другая общая ошибка
        showToast(rawMessage || 'Ошибка входа', 'error')
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
            Вход в систему
          </h1>
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
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
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Входим…' : 'Войти'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Нет аккаунта?{' '}
            <Link href="/register" className="font-semibold text-accent hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}