'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Pizza } from '@/lib/types'

interface PizzaCardProps {
  pizza: Pizza
  onClick: () => void
}

export function PizzaCard({ pizza, onClick }: PizzaCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      className="group flex w-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card text-left shadow-sm transition-shadow duration-300 hover:shadow-2xl hover:shadow-accent/10"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={pizza.image || '/placeholder.svg'}
          alt={pizza.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
        <h3 className="font-heading text-xl font-bold text-card-foreground text-balance">
          {pizza.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {pizza.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-extrabold text-accent">{pizza.price} MDL</span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground/70 transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
            Подробнее
          </span>
        </div>
      </div>
    </motion.button>
  )
}
