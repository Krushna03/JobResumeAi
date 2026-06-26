import { Card } from "@/components/ui/card"
import { Quote } from "lucide-react"
import { homeTestimonials } from "../../../data/home-data"
import { HomeSectionHeader } from "./HomeSectionHeader"

export function HomeTestimonials() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20 lg:py-24">
      {/* Soft dotted background — distinct from the grid pattern used elsewhere */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 [mask-image:radial-gradient(ellipse_70%_65%_at_50%_50%,black_30%,transparent_85%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeader
          title="What people say"
          description="Honest feedback from people optimizing their search, not generic hype."
        />
        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-3 md:gap-8">
          {homeTestimonials.map((t) => (
            <Card
              key={t.initials}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/40 p-6 transition-colors duration-300 hover:border-foreground/20 hover:bg-card/60 sm:p-8"
            >
              {/* Quote — promoted to the lead element, slightly larger and brighter than before */}
              <p className="relative text-base leading-relaxed text-foreground/90 md:text-lg">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Attribution at the bottom, under a divider — print/editorial pattern */}
              <div className="relative mt-6 flex items-center gap-3 border-t border-border pt-5">
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
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
