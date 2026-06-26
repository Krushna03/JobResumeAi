import { Play } from "lucide-react"
import { Card } from "@/components/ui/card"
import { HomeSectionHeader } from "./HomeSectionHeader"

/**
 * Placeholder for product walkthrough / demo video.
 * Replace the inner block with an iframe (YouTube, Vimeo, Mux) or <video> when ready.
 */
export function TailorVideoSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20 lg:py-24">
      {/* Layered ambient background — aurora + grid to match the hero aesthetic */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Aurora: primary spotlight from above-center */}
        <div className="absolute -top-24 left-1/2 h-[720px] w-[1300px] -translate-x-1/2 bg-[radial-gradient(ellipse_55%_55%_at_50%_40%,rgb(var(--brand-primary-rgb)/0.22),transparent_70%)]" />
        {/* Aurora: secondary accent on the right */}
        <div className="absolute top-16 right-[-10%] h-[520px] w-[720px] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(var(--brand-secondary-rgb)/0.16),transparent_70%)]" />
        {/* Aurora: tertiary halo on the left */}
        <div className="absolute bottom-0 left-[-8%] h-[480px] w-[680px] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(var(--brand-tertiary-rgb)/0.12),transparent_70%)]" />

        {/* Subtle grid pattern masked to fade at the edges */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.4)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.4)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_50%,black_30%,transparent_85%)]" />

        {/* Soft horizon line above the card */}
        <div className="absolute inset-x-0 top-40 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeader
          title="See how tailoring works"
          description="A short walkthrough of upload, job description, and the focused output you can export."
          maxWidthClassName="max-w-3xl"
        />

        <div className="relative mx-auto mt-10 max-w-4xl md:mt-14">
          {/* Soft brand glow behind the card */}
          <div
            className="pointer-events-none absolute -inset-10 -z-10 bg-[radial-gradient(ellipse_65%_60%_at_50%_50%,rgb(var(--brand-primary-rgb)/0.28),transparent_70%)] blur-3xl"
            aria-hidden
          />

          <Card className="overflow-hidden rounded-2xl border border-border bg-card/40 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.55)] ring-1 ring-white/10 backdrop-blur-sm">
            <div className="relative aspect-video w-full overflow-hidden">
              {/* Internal gradient wash to give the placeholder depth */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_75%_at_50%_50%,rgb(var(--brand-primary-rgb)/0.22),transparent_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_20%,rgb(var(--brand-secondary-rgb)/0.18),transparent_65%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_15%_85%,rgb(var(--brand-tertiary-rgb)/0.15),transparent_65%)]" />
              <div className="absolute inset-0 bg-gradient-to-br from-background/0 via-background/30 to-background/60" />

              {/* Subtle inner grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_20%,transparent_80%)]" />

              {/* Play control */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  aria-label="Play the tailoring walkthrough"
                  className="group relative flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-white shadow-[0_20px_60px_-15px_rgb(94_92_230/0.7)] transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                >
                  <span
                    className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-primary/30 opacity-75"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute -inset-4 -z-10 rounded-full bg-primary/25 blur-xl"
                    aria-hidden
                  />
                  <Play className="h-7 w-7 translate-x-0.5" fill="currentColor" aria-hidden />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
