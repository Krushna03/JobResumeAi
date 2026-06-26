import { Link } from "react-router-dom"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function HomeCta() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20 lg:py-24">
      {/* Soft brand glow behind the card to lift it off the page */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[900px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_55%_55%_at_50%_50%,rgb(var(--brand-primary-rgb)/0.3),transparent_70%)] blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-brand-cta p-8 text-center shadow-[0_30px_80px_-20px_rgb(94_92_230/0.55)] ring-1 ring-white/10 sm:p-12 md:p-16">
          {/* Inner spotlights — top-left and bottom-right — give the gradient real depth */}
          <div
            className="pointer-events-none absolute -left-1/4 -top-1/4 h-[520px] w-[520px] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(255_255_255/0.22),transparent_70%)] blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-1/4 -right-1/4 h-[520px] w-[520px] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(255_255_255/0.15),transparent_70%)] blur-2xl"
            aria-hidden
          />

          {/* Halftone dot overlay — subtle billboard texture */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgb(255_255_255/0.12)_1px,transparent_1px)] bg-[size:28px_28px] opacity-50 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black_20%,transparent_85%)]"
            aria-hidden
          />

          {/* Top edge highlight line */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
            aria-hidden
          />

          <div className="relative">
            <Badge
              variant="secondary"
              className="mb-5 border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/10"
            >
              <Sparkles className="mr-2 inline h-4 w-4" aria-hidden />
              Ready when you are
            </Badge>

            <h2 className="font-headline text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to send a sharper resume?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-white/85 sm:text-base md:text-lg">
              Open the tailor experience or use the full builder when you want templates and more control.
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                size="lg"
                className="h-12 rounded-full border-0 bg-white px-8 text-base font-semibold text-primary shadow-lg shadow-black/10 hover:bg-white/95"
                asChild
              >
                <Link to="/tailor">
                  Tailor a resume
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                asChild
              >
                <Link to="/builder">Open resume builder</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
