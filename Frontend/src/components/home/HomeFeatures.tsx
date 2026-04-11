import { Card } from "@/components/ui/card"
import { Target, Zap, CheckCircle } from "lucide-react"
import { HomeSectionHeader } from "./HomeSectionHeader"

export function HomeFeatures() {
  return (
    <section
      id="features"
      className="relative scroll-mt-24 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeader
          title="Built for real applications"
          description="Clear structure, role-aware emphasis, and a workflow that fits how you already apply."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-8">
          <Card className="rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:bg-card sm:p-8">
            <Target className="mb-5 h-10 w-10 text-primary md:h-12 md:w-12" />
            <h3 className="text-lg font-semibold text-foreground">Role-aligned emphasis</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Surfaces the achievements and skills that match the posting—without inventing experience you do not have.
            </p>
          </Card>
          <Card className="rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:bg-card sm:p-8">
            <Zap className="mb-5 h-10 w-10 text-brand-secondary md:h-12 md:w-12" />
            <h3 className="text-lg font-semibold text-foreground">Fast iteration</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Spin a new version per listing in minutes so you can apply broadly without burning out on rewrites.
            </p>
          </Card>
          <Card className="rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:bg-card sm:col-span-2 sm:p-8 lg:col-span-1">
            <CheckCircle className="mb-5 h-10 w-10 text-brand-tertiary md:h-12 md:w-12" />
            <h3 className="text-lg font-semibold text-foreground">Readable and professional</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Strong hierarchy and scannable bullets help humans and parsers find the signal quickly.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
