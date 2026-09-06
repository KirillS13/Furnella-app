export interface Pizza {
  id: string
  title: string
  description: string
  price: number
  image: string
}

export interface CartItem extends Pizza {
  quantity: number
}

export interface User {
  id: string
  name: string
  email: string
  phoneNumber?: string
  phoneNumberVerified: boolean
  role?: 'user' | 'admin'
}

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DELIVERED'

export interface OrderItem {
  id: number
  title: string
  price: number
  quantity: number
  description?: string  // <-- Добавили описание
  painter?: string      // <-- Добавили художника
}

export interface Order {
  id: string
  customerName: string
  phoneNumber: string
  address: string
  paymentMethod?: 'cash' | 'card' | string // <-- ДОБАВЬ ЭТУ СТРОКУ
  total: number
  status: OrderStatus
  items: OrderItem[]
  createdAt: string
}

/** Field-level validation error, matches backend `[{ field, message }]` shape. */
export interface FieldError {
  field: string
  message: string
}
