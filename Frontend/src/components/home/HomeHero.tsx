import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles } from "lucide-react"

export function HomeHero() {
  return (
    <section className="relative -mt-16 overflow-hidden pb-16 pt-28 md:-mt-[4.25rem] md:pb-20 md:pt-[calc(4.25rem+4rem)] lg:pb-28 lg:pt-[calc(4.25rem+6rem)]">
      
      {/* Glow sits under sticky header (negative margin); fades through mid hero */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[85%] min-h-[max(22rem,50vh)] md:min-h-[max(30rem,58vh)] lg:min-h-[max(36rem,75vh)]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_110%_at_50%_-12%,rgb(var(--brand-primary-rgb)/0.35),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_75%_at_82%_0%,rgb(var(--brand-secondary-rgb)/0.18),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_14%_12%,rgb(var(--brand-tertiary-rgb)/0.12),transparent_48%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
      </div>
      
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <Badge
          variant="secondary"
          className="mb-5 border border-border bg-white/5 px-3 py-1.5 text-sm font-medium text-foreground/80"
        >
          <Sparkles className="mr-2 inline h-4 w-4" aria-hidden />
          AI-tailored resumes for each application
        </Badge>
        <h1 className="font-headline mx-auto max-w-5xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl lg:leading-[1.10]">
          Generate Stronger Resumes
          <span className="block text-muted-foreground">for every job you want</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg md:mt-8">
          Upload your resume, paste the job description, and get a focused version that highlights the right
          experience—without starting from scratch.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 md:mt-10">
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
    </section>
  )
}
