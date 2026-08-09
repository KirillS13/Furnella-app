'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  function FieldInput({ error, className = '', ...props }, ref) {
    return (
      <div className="w-full">
        <input
          ref={ref}
          aria-invalid={!!error}
          className={`w-full rounded-2xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:ring-4 ${
            error
              ? 'border-destructive ring-2 ring-destructive/40 focus:ring-destructive/30'
              : 'border-border focus:border-accent focus:ring-accent/25'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 pl-1 text-xs font-semibold text-destructive">{error}</p>
        )}
      </div>
    )
  },
)
