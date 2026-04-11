import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Sparkles, Shield, Users } from "lucide-react"
import { HomeSectionHeader } from "./HomeSectionHeader"

export function HomePricing() {
  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeader
          title="Simple pricing"
          description="Start free. Upgrade when you want higher limits and priority generation."
        />
        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-3 md:gap-8">
          <Card className="flex flex-col rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Starter</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Try the workflow on a few roles.</p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-foreground">$0</span>
              <span className="text-muted-foreground">/mo</span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" />
                Limited generations per month
              </li>
              <li className="flex gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" />
                Core tailoring features
              </li>
            </ul>
            <Button className="mt-8 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/tailor">Get started</Link>
            </Button>
          </Card>

          <Card className="relative flex flex-col rounded-2xl border border-primary/45 bg-primary/10 p-6 ring-1 ring-primary/20 sm:p-8">
            <Badge className="absolute -top-3 left-1/2 w-max -translate-x-1/2 border-0 bg-primary text-primary-foreground hover:bg-primary">
              Most popular
            </Badge>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-secondary" />
              <h3 className="text-lg font-semibold text-foreground">Pro</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">For active job seekers applying weekly.</p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-foreground">$19</span>
              <span className="text-muted-foreground">/mo</span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-foreground/90">
              <li className="flex gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" />
                Higher monthly limits
              </li>
              <li className="flex gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" />
                Priority processing
              </li>
              <li className="flex gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-tertiary" />
                Version history (coming soon)
              </li>
            </ul>
            <Button className="mt-8 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              Start Pro trial
            </Button>
          </Card>

          <Card className="flex flex-col rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Team</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Coaches, bootcamps, and career offices.</p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-foreground">Let&apos;s talk</span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" />
                Shared workspace
              </li>
              <li className="flex gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" />
                Admin and billing
              </li>
            </ul>
            <Button
              variant="outline"
              className="mt-8 w-full rounded-xl border-border bg-transparent text-foreground hover:bg-white/5"
            >
              Contact sales
            </Button>
          </Card>
        </div>
      </div>
    </section>
  )
}
