import { Play } from "lucide-react"
import { Card } from "@/components/ui/card"

/**
 * Placeholder for product walkthrough / demo video.
 * Replace the inner block with an iframe (YouTube, Vimeo, Mux) or <video> when ready.
 */
export function TailorVideoSection() {
  return (
    <section className="relative bg-card/20 py-16 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            See how tailoring works
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Short walkthrough of upload, job description, and your tailored output—video coming soon.
          </p>
        </div>
        <Card className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-none md:mt-14">
          <div className="relative aspect-video w-full bg-gradient-to-br from-primary/15 via-background to-brand-secondary/10">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg ring-4 ring-primary/20">
                <Play className="h-7 w-7 translate-x-0.5" fill="currentColor" aria-hidden />
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Drop your embed or video file here. This area uses a 16:9 frame so layouts stay stable.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
