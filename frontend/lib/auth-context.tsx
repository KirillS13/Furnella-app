'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { ADMIN_EMAIL, api } from './api'
import type { User } from './types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAdmin: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<User>
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const profile = await api.getProfile()
    setUser(profile)
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const u = await api.login(email, password)
    setUser(u)
    return u
  }

  async function register(
    name: string,
    email: string,
    password: string,
  ) {
    const u = await api.register(name, email, password)
    setUser(u)
    return u
  }

  async function logout() {
    await api.logout()
    setUser(null)
  }

  const isAdmin = !!user && (user.role === 'admin' || user.email === ADMIN_EMAIL)

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, setUser, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
