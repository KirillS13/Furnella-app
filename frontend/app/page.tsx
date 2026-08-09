import { SiteHeader } from '@/components/site-header'
import { MenuGrid } from '@/components/menu-grid'
import { CartLauncher } from '@/components/cart-launcher'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-6 pt-12 text-center sm:px-6 sm:pt-16 lg:px-8">
          <span className="inline-flex items-center rounded-full bg-accent/15 px-4 py-1.5 text-sm font-bold text-accent">
            Свежая пицца каждый день
          </span>
          <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
            Настоящая итальянская пицца в{' '}
            <span className="text-accent">Furnella</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Готовим на дровяной печи из отборных ингредиентов. Выбирайте любимую
            пиццу и заказывайте с доставкой за пару кликов.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="mb-8 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Наше меню
          </h2>
          <MenuGrid />
        </section>
      </main>

      <CartLauncher />
    </div>
  )
}
