import type { FieldError, Order, OrderStatus, Pizza, User } from './types'
import { MOCK_ORDERS, MOCK_PIZZAS } from './mock-data'

/**
 * Base URL of the Go backend. When set (e.g. NEXT_PUBLIC_API_URL=http://localhost:8080)
 * all requests hit the real backend. Otherwise a local in-memory mock backend is used so
 * the UI is fully functional in preview.
 */

import { getToken } from 'firebase/messaging'
import { messaging } from './firebase' // Импортируй инстанс messaging из твоего конфига

async function getRealFcmToken(): Promise<string> {
  if (typeof window === 'undefined' || !messaging) return 'mock_token_ssr'

  try {
    // 1. Запрашиваем у браузера разрешение на уведомления
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Пользователь отклонил запрос на уведомления. Используем заглушку.')
      return 'token_permission_denied'
    }

    // 2. Генерируем реальный FCM токен
    const currentToken = await getToken(messaging, {
      vapidKey: 'BCSGmKk3AfYho1pGa3TOfIlH8TWK1Wp8l8EYa68hwn3-mZjBErJwcvsnZzGEgn1pE-KmgtX4VoD-CR6EwOgW61g'
    })

    if (currentToken) {
      return currentToken
    } else {
      console.warn('Не удалось получить токен. Проверь настройки FCM.')
      return 'no_token_available'
    }
  } catch (error) {
    console.error('Ошибка при генерации FCM токена:', error)
    return 'fcm_error_token'
  }
}
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://furnella-app.onrender.com/api').replace(/\/$/, '');
export const USE_MOCK = API_URL === ''

export const ADMIN_EMAIL = 'furnella@gmail.com'
/** Demo SMS code used by the mock backend. */
export const MOCK_SMS_CODE = '12345'

/** Thrown when the backend returns validation errors as an array of { field, message }. */
export class ApiError extends Error {
  status: number
  fieldErrors?: any[]

  constructor(
    message: string,
    statusOrFieldErrors?: number | any[],
    fieldErrors: any[] = []
  ) {
    super(message)
    this.name = 'ApiError'

    // Если второй аргумент передали как число (например: new ApiError("Ошибка", 400, errors))
    if (typeof statusOrFieldErrors === 'number') {
      this.status = statusOrFieldErrors
      this.fieldErrors = fieldErrors
    } 
    // Если второй аргумент передали как массив (например: new ApiError("Ошибка", errors))
    else {
      this.status = 400 // Дефолтный статус
      this.fieldErrors = statusOrFieldErrors || []
    }
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  let data: any = null
  try {
    data = await res.json()
  } catch {
    /* no body */
  }

  if (!res.ok) {
    // 1. Достаем сообщение из error или message
    const errorMessage =
      typeof data === 'string'
        ? data
        : data?.error || data?.message || 'Ошибка сервера'

    // 2. Достаем массив валидационных ошибок (если есть)
    const fieldErrors = Array.isArray(data)
      ? data
      : Array.isArray(data?.errors)
      ? data.errors
      : []

    // 3. Пробрасываем ApiError со статусом
    throw new ApiError(errorMessage, res.status, fieldErrors)
  }

  return data as T
}

/* -------------------------------------------------------------------------- */
/*                              Local mock backend                            */
/* -------------------------------------------------------------------------- */

const LS_USER = 'furnella:user'
const LS_ORDERS = 'furnella:orders'

function readLocalUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LS_USER)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function writeLocalUser(user: User | null) {
  if (typeof window === 'undefined') return
  if (user) localStorage.setItem(LS_USER, JSON.stringify(user))
  else localStorage.removeItem(LS_USER)
}

function readLocalOrders(): Order[] {
  if (typeof window === 'undefined') return MOCK_ORDERS
  try {
    const raw = localStorage.getItem(LS_ORDERS)
    if (!raw) {
      localStorage.setItem(LS_ORDERS, JSON.stringify(MOCK_ORDERS))
      return MOCK_ORDERS
    }
    return JSON.parse(raw) as Order[]
  } catch {
    return MOCK_ORDERS
  }
}

function writeLocalOrders(orders: Order[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_ORDERS, JSON.stringify(orders))
}

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms))

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/* -------------------------------------------------------------------------- */
/*                                 API surface                                */
/* -------------------------------------------------------------------------- */

export interface OrderPayload {
  name: string
  phoneNumber: string // <-- Здесь тоже camelCase
  address: string
  items: { id: number; title: string; price: number; quantity: number, description: string, image: string }[]
  total: number
  userId?: string;
}

export const api = {
  async getMenus(): Promise<Pizza[]> {
    await delay(400)
    return MOCK_PIZZAS
  },

  async getProfile(): Promise<User | null> {
    if (USE_MOCK) {
      await delay(150)
      return readLocalUser()
    }

    // ВРЕМЕННЫЙ ФИКС: так как бэкенд возвращает 404 на /auth/me,
    // берем пользователя из localStorage, чтобы сессия не слетала.
    const localUser = readLocalUser()
    if (localUser) {
      return localUser
    }

    try {
      // Если локально пусто, пробуем спросить бэкенд
      return await request<User>('/auth/me')
    } catch {
      return null
    }
  },

  async login(email: string, password: string): Promise<User> {
    if (USE_MOCK) {
      await delay(500)
      const fieldErrors: FieldError[] = []
      if (!isValidEmail(email))
        fieldErrors.push({ field: 'email', message: 'Неверный формат почты' })
      if (password.length < 4)
        fieldErrors.push({ field: 'password', message: 'Пароль слишком короткий' })
      if (fieldErrors.length) throw new ApiError('Ошибка валидации', 422, fieldErrors)

      const isAdmin = email.toLowerCase() === ADMIN_EMAIL
      const user: User = {
        id: isAdmin ? 'admin' : 'u-' + Date.now(),
        name: isAdmin ? 'Furnella' : email.split('@')[0],
        email: email.toLowerCase(),
        phoneNumber: isAdmin ? '+373 22 000 000' : undefined,
        phoneNumberVerified: isAdmin,
        role: isAdmin ? 'admin' : 'user',
      }
      writeLocalUser(user)
      return user
    }

    // --- РАБОТА С РЕАЛЬНЫМ БЭКЕНДОМ ---
    const response = await request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    // Извлекаем данные: проверяем, обёрнут ли ответ в "data"
    const responseData = response?.data || response;
    const userId = responseData?.localId || responseData?.local_id || responseData?.id;

    if (!userId) {
      console.error("Не удалось получить UID пользователя из ответа бэкенда:", response);
    }

    const user: User = {
      ...responseData,
      id: userId || 'u-' + Date.now(), // Фолбек только на крайний случай
      role: responseData?.role || 'user',
      name: responseData?.username || responseData?.name || email.split('@')[0]
    }

    const isAdmin = email.toLowerCase() === ADMIN_EMAIL
    if (isAdmin) {
      user.role = 'admin'
      user.phoneNumberVerified = true
    }

    writeLocalUser(user)
    return user
  },

  async register(name: string, email: string, password: string): Promise<User> {
    const fcmToken = "undefined"

    const response = await request<any>('/auth/registration', {
      method: 'POST',
      body: JSON.stringify({
        "username": name,
        email,
        password,
        "fcm_token": fcmToken
      }),
    })

    // Точно так же проверяем наличие обёртки "data" при регистрации
    const responseData = response?.data || response;
    const userId = responseData?.localId || responseData?.local_id || responseData?.id;

    if (!userId) {
      console.error("Не удалось получить UID пользователя при регистрации:", response);
    }

    const user: User = {
      ...responseData,
      id: userId || 'u-' + Date.now(),
      role: responseData?.role || 'user',
      name: responseData?.name || name
    }

    const isAdmin = email.toLowerCase() === ADMIN_EMAIL
    if (isAdmin) {
      user.role = 'admin'
      user.phoneNumberVerified = true
    }

    writeLocalUser(user)
    return user
  },

  async logout(): Promise<void> {
    /*if (USE_MOCK) {
      writeLocalUser(null)
      return
    }
    await request('/auth/logout', { method: 'POST' })*/

    writeLocalUser(null)
  },

  async requestSmsCode(phoneNumber: string): Promise<void> {
    if (USE_MOCK) {
      await delay(400)
      return
    }

    try {
      await request('/notifications/sms/send', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      })
    } catch (error) {
      // 208 StatusAlreadyReported или текст "Sms has already been sent"
      if (
        error instanceof ApiError &&
        (error.status === 208 || error.message.includes('already been sent'))
      ) {
        // Успешно поглощаем ошибку: код уже был отправлен и ещё активен
        return
      }
      throw error
    }
  },

  async verifyPhone(code: string, phoneNumber: string, orderPayload: OrderPayload): Promise<User> {
    if (USE_MOCK) {
      await delay(500)
      if (code !== MOCK_SMS_CODE) {
        throw new ApiError("Неверный код", 400, [{ field: 'code', message: 'Неверный код из SMS' }])
      }
      const user = readLocalUser()
      if (!user) // ✅ Поправь строку 303:
      throw new ApiError("Требуется вход", 401)
      const updated = { ...user, phoneNumberVerified: true }
      writeLocalUser(updated)
      return updated
    }

    // 1. Извлекаем текущего пользователя перед отправкой
    const currentUser = readLocalUser()

    // 2. Приводим фронтенд-структуру OrderPayload к json-тегам бэкенда OrderModel
    const backendOrder = {
      name: orderPayload.name,
      // Вспоминаем Go-структуру бэкенда: там `json:"phoneNumber"` для OrderRequest
      phoneNumber: orderPayload.phoneNumber.trim(),
      address: orderPayload.address.trim(),
      price: Number(orderPayload.total),
      dishes: orderPayload.items.map(item => ({
        id: Number(item.id),
        title: item.title,
        price: Number(item.price || 125),
        quantity: Number(item.quantity || 1),
        image: String(item.image || ""),
        description: String(item.description || "")
      })),
      // Передаем реальный ID авторизованного пользователя
      user_id: currentUser?.id || (orderPayload as any).userId || "xOajXShTWdTJhJ9KTfxkQQFJCbm2"
    }

    // 3. Отправляем запрос на реальный бэкенд
    const response = await request<any>('/notifications/sms/verify', {
      method: 'POST',
      body: JSON.stringify({
        code,
        phoneNumber: phoneNumber.trim(),
        order: backendOrder
      }),
    })

    // Разворачиваем данные, если бэкенд вернул объект с оберткой data
    const responseData = response?.data || response;

    // 4. ФИКС СЛЁТА АВТОРИЗАЦИИ: 
    // Создаем обновленный объект пользователя, бережно сохраняя старые данные (id, email, токены),
    // чтобы бэкенд случайно их не стёр пустым ответом.
    const authenticatedUser: User = {
      ...currentUser, // Сохраняем все данные вошедшего пользователя (токены, email, пароли)
      ...responseData, // Накладываем изменения с бэкенда (например, phoneNumberVerified: true)
      id: currentUser?.id || responseData?.localId || responseData?.id || 'u-' + Date.now(),
      phoneNumberVerified: true, // Хардкодно фиксируем, что телефон подтвержден
      role: currentUser?.role || responseData?.role || 'user'
    }

    // Записываем объединенного пользователя, сессия больше не потеряется!
    writeLocalUser(authenticatedUser)

    return authenticatedUser
  },

  async createOrder(payload: OrderPayload): Promise<Order> {
    if (USE_MOCK) {
      await delay(600)
      const fieldErrors: FieldError[] = []
      if (payload.name.trim().length < 2)
        fieldErrors.push({ field: 'name', message: 'Введите имя' })
      if (!/^\+?[0-9\s]{8,}$/.test(payload.phoneNumber))
        fieldErrors.push({ field: 'phoneNumber', message: 'Неверный формат телефона' })
      if (payload.address.trim().length < 4)
        fieldErrors.push({ field: 'address', message: 'Введите адрес доставки' })
      if (fieldErrors.length) throw new ApiError('Ошибка валидации', fieldErrors)

      const order: any = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        customerName: payload.name.trim(),
        phoneNumber: payload.phoneNumber,
        address: payload.address.trim(),
        items: payload.items,
        total: payload.total,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }
      const orders = readLocalOrders()
      writeLocalOrders([order, ...orders])
      return order
    }

    // 1. Prepare the payload for the real backend API
    // Note: Replace 'CURRENT_USER_ID' with your actual logged-in user's ID
    // 1. Формируем payload в точности по структуре Go: type OrderRequest struct
    const apiPayload = {
      // В Go структуре: `json:"address"`
      address: payload.address.trim(),

      // В Go структуре: `json:"name"`
      name: payload.name.trim(),

      // В Go структуре: `json:"phoneNumber"` (camelCase с большой N!)
      phoneNumber: payload.phoneNumber.trim(),

      // В Go структуре: `json:"price"` (тип int64)
      price: Number(payload.total),

      // В Go структуре: `json:"user_id"` (обязательное поле!)
      user_id: (payload as any).userId || (payload as any).userUid || "xOajXShTWdTJhJ9KTfxkQQFJCbm2",

      // В Go структуре: `json:"dishes"`
      dishes: payload.items.map((item: any) => {
        // Страхуемся на случай, если во фронтенд-объекте пропала цена или количество
        const itemPrice = item.price || 125;
        const itemQuantity = item.quantity || 1;

        return {
          id: Number(item.id),
          title: String(item.title || "Пицца"),
          price: Number(itemPrice), // На бэкенде в БД цена лежит как строка ("125")
          quantity: Number(itemQuantity),
          description: String(item.description || ""),
          image: String(item.image || "")
        };
      })
    };

    // Поле status убираем, так как в структуре OrderRequest его нет
    // 2. Send the correctly mapped payload
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(apiPayload),
    })
  },

  async getOrders(): Promise<Order[]> {
    if (USE_MOCK) {
      await delay(400)
      return readLocalOrders()
    }

    // 1. Делаем запрос к реальному бэкенду
    const response = await request<any>('/orders/all')

    // 2. Достаем массив заказов из поля "data" (с фолбеком на сам ответ, если структуры разнятся)
    const rawOrders = Array.isArray(response) ? response : (response?.data || [])

    // 3. Маппим ключи бэкенда в формат, понятный фронтенду
    return rawOrders.map((o: any) => ({
      id: o.order_id || o.id,
      customerName: o.name || 'Клиент',
      phoneNumber: o.phone_number || '',
      address: o.address || '',
      total: Number(o.price) || 0,
      status: o.status || 'PENDING',
      createdAt: o.createdAt || new Date().toISOString(), // Или любое другое дефолтное время
      items: (o.dishes || []).map((dish: any) => ({
        id: Number(dish.id),
        title: dish.title || 'Без названия',
        price: dish.price || 0,
        quantity: Number(dish.quantity) || 1
      }))
    }))
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    if (USE_MOCK) {
      await delay(300)
      const orders = readLocalOrders()
      const next = orders.map((o) => (o.id === id ? { ...o, status } : o))
      writeLocalOrders(next)
      return next.find((o) => o.id === id)!
    }
    return request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}
