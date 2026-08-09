'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'

export function SiteHeader() {
  const { user, isAdmin, logout } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    showToast('Вы вышли из аккаунта', 'info')
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-heading text-2xl font-extrabold tracking-tight text-accent transition-transform hover:scale-105"
        >
          Furnella
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-accent sm:inline-flex"
          >
            Меню
          </Link>

          {user && user.role === 'admin' && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              <LayoutDashboard className="size-4" />
              Админ Панель
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-foreground sm:inline">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                aria-label="Выйти"
                className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground/70 transition-colors hover:text-destructive"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-accent"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95"
              >
                Зарегистрироваться
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
