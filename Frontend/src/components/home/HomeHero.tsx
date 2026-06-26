import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles } from "lucide-react"

export function HomeHero() {
  return (
    <section className="relative -mt-16 overflow-hidden pb-16 pt-28 md:-mt-[4.25rem] md:pb-20 md:pt-[calc(4.25rem+4rem)] lg:pb-24 lg:pt-[calc(4.25rem+5rem)]">

      {/* Layered ambient background — aurora + grid + accents for production-grade depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Aurora: primary spotlight from above */}
        <div className="absolute -top-1/4 left-1/2 h-[1100px] w-[1600px] -translate-x-1/2 bg-[radial-gradient(ellipse_55%_55%_at_50%_30%,rgb(var(--brand-primary-rgb)/0.55),transparent_65%)]" />
        {/* Aurora: cool blue glow over the resume mockup */}
        <div className="absolute -top-24 right-[-12%] h-[820px] w-[1000px] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(var(--brand-secondary-rgb)/0.38),transparent_65%)]" />
        {/* Aurora: subtle tertiary halo on the left */}
        {/* <div className="absolute top-40 left-[-10%] h-[620px] w-[760px] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(var(--brand-tertiary-rgb)/0.22),transparent_70%)]" /> */}
        {/* Directional conic accent for ethereal highlight */}
        <div className="absolute -top-32 left-1/2 h-[700px] w-[1400px] -translate-x-1/2 opacity-60 [background:conic-gradient(from_210deg_at_50%_50%,transparent_0deg,rgb(var(--brand-primary-rgb)/0.18)_70deg,transparent_140deg,rgb(var(--brand-secondary-rgb)/0.18)_220deg,transparent_290deg)] blur-3xl" />

        {/* Subtle grid — masked to fade into the corners */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.45)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.45)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,black_30%,transparent_85%)]" />

        {/* Soft horizon line that anchors the hero */}
        <div className="absolute inset-x-0 bottom-24 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

        {/* Bottom fade so the hero blends into the stats section */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent via-background/60 to-background" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-6 lg:grid-cols-[2.8fr_2.2fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <Badge
              variant="secondary"
              className="mb-5 border border-border bg-white/5 px-3 py-1.5 text-sm font-medium text-foreground/80"
            >
              <Sparkles className="mr-2 inline h-4 w-4" aria-hidden />
              AI-tailored resumes for each application
            </Badge>
            <h1 className="font-headline text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[3.75rem] lg:leading-[1.08] xl:text-[65px]">
              Generate Stronger Resumes
              <span className="block text-foreground/90">for every job you want</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg md:mt-8 lg:mx-0">
              Upload your resume, paste the job description, and get a focused version that highlights the right
              experience without starting from scratch.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 md:mt-10 lg:justify-start">
              <Button
                size="lg"
                className="h-12 w-full rounded-full border-0 px-8 text-base font-medium gradient-primary text-white hover:opacity-90 sm:w-auto"
                asChild
              >
                <Link to="/tailor">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                asChild
              >
                <Link to="/templates">Browse templates</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl [perspective:1600px] lg:max-w-none">
            {/* Layered glow behind the mockup for depth */}
            <div
              className="pointer-events-none absolute -inset-10 -z-10 bg-[radial-gradient(ellipse_70%_65%_at_55%_45%,rgb(var(--brand-primary-rgb)/0.35),transparent_70%)] blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(ellipse_55%_55%_at_70%_30%,rgb(var(--brand-secondary-rgb)/0.28),transparent_70%)] blur-2xl"
              aria-hidden
            />

            <img
              src="/hero.png"
              alt="Preview of an AI-tailored resume for a Full Stack Developer role"
              className="relative w-full rounded-2xl shadow-[0_30px_80px_-20px_rgb(0_0_0/0.55)] ring-1 ring-white/10 transition-transform duration-500 [transform:rotateX(6deg)_rotateY(-12deg)_rotateZ(1deg)] [transform-style:preserve-3d] hover:[transform:rotateX(4deg)_rotateY(-6deg)_rotateZ(0deg)]"
              loading="eager"
              decoding="async"
            />

            {/* Soft floor reflection beneath the mockup */}
            <div
              className="pointer-events-none absolute -bottom-6 left-1/2 h-10 w-3/4 -translate-x-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(var(--brand-primary-rgb)/0.4),transparent_75%)] blur-2xl"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  )
}
