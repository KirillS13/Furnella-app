'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { AdminOrders } from '@/components/admin-orders'
import { useAuth } from '@/lib/auth-context'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user || user.role !== 'admin') {
      router.replace('/')
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground font-semibold">Проверка доступа…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 🎯 Задаем тайтл страницы прямо в клиентском компоненте: */}
      <title>Панель заказов — Furnella</title>

      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <AdminOrders />
      </main>
    </div>
  )
}