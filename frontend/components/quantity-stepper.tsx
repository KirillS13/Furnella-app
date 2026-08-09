'use client'

import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
}

export function QuantityStepper({ value, onChange, min = 1 }: QuantityStepperProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-full border border-border bg-secondary/60 p-1">
      <button
        type="button"
        aria-label="Уменьшить количество"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="inline-flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground active:scale-90"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-8 text-center text-base font-bold tabular-nums text-foreground">
        {value}
      </span>
      <button
        type="button"
        aria-label="Увеличить количество"
        onClick={() => onChange(value + 1)}
        className="inline-flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground active:scale-90"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
