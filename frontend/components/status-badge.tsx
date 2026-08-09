import type { OrderStatus } from '@/lib/types'

const CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'В ожидании', className: 'bg-chart-4/20 text-chart-5' },
  ACCEPTED: { label: 'Принят', className: 'bg-success/15 text-success' },
  REJECTED: { label: 'Отклонён', className: 'bg-destructive/15 text-destructive' },
  DELIVERED: { label: 'Доставлен', className: 'bg-accent/15 text-accent' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  )
}
