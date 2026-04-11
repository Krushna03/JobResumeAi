import { Card } from "@/components/ui/card"
import { homeTestimonials } from "../../../data/home-data"
import { HomeSectionHeader } from "./HomeSectionHeader"

export function HomeTestimonials() {
  return (
    <section className="relative py-16 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeader
          title="What people say"
          description="Honest feedback from people optimizing their search, not generic hype."
        />
        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-3 md:gap-8">
          {homeTestimonials.map((t) => (
            <Card key={t.initials} className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/90 to-brand-secondary/90 text-sm font-semibold text-primary-foreground"
                  aria-hidden
                >
                  {t.initials}
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate font-medium text-foreground">{t.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">&ldquo;{t.quote}&rdquo;</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
