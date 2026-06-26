import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Shield, Sparkles, Users, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { HomeSectionHeader } from "./HomeSectionHeader"

type Plan = {
  name: string
  icon: LucideIcon
  iconClassName: string
  description: string
  price: string
  pricePeriod?: string
  features: readonly string[]
  cta: { label: string; href?: string }
  highlighted?: boolean
}

const PLANS: readonly Plan[] = [
  {
    name: "Starter",
    icon: Shield,
    iconClassName: "text-muted-foreground",
    description: "Try the workflow on a few roles.",
    price: "$0",
    pricePeriod: "/mo",
    features: ["Limited generations per month", "Core tailoring features"],
    cta: { label: "Get started", href: "/tailor" },
  },
  {
    name: "Pro",
    icon: Sparkles,
    iconClassName: "text-brand-secondary",
    description: "For active job seekers applying weekly.",
    price: "$19",
    pricePeriod: "/mo",
    features: [
      "Higher monthly limits",
      "Priority processing",
      "Version history (coming soon)",
    ],
    cta: { label: "Start Pro trial" },
    highlighted: true,
  },
  {
    name: "Team",
    icon: Users,
    iconClassName: "text-muted-foreground",
    description: "Coaches, bootcamps, and career offices.",
    price: "Let's talk",
    features: ["Shared workspace", "Admin and billing"],
    cta: { label: "Contact sales" },
  },
]

export function HomePricing() {
  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 overflow-hidden py-16 md:py-20 lg:py-24"
    >
      {/* Single soft brand halo behind the middle plan to focus the eye there */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[680px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_55%_55%_at_50%_50%,rgb(var(--brand-primary-rgb)/0.22),transparent_70%)] blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeader
          title="Simple pricing"
          description="Start free. Upgrade when you want higher limits and priority generation."
        />
        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-3 md:items-stretch md:gap-8">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  const { highlighted } = plan
  const content = <PlanContent plan={plan} />

  if (highlighted) {
    return (
      <div className="relative md:-my-3">
        {/* Brand-tinted halo behind the highlighted plan */}
        <div
          className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,rgb(var(--brand-primary-rgb)/0.4),transparent_70%)] blur-2xl"
          aria-hidden
        />
        {/* Gradient border via 1px padding wrapper */}
        <div className="relative h-full rounded-2xl bg-gradient-to-br from-brand-primary via-brand-tertiary to-brand-secondary p-px shadow-[0_30px_80px_-20px_rgb(94_92_230/0.45)]">
          <Card className="relative flex h-full flex-col rounded-[15px] border-0 bg-card/90 p-6 backdrop-blur-sm sm:p-8">
            {content}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/40 p-6 transition-colors duration-300 hover:border-foreground/20 hover:bg-card/60 sm:p-8">
      {content}
    </Card>
  )
}

function PlanContent({ plan }: { plan: Plan }) {
  const { name, icon: Icon, iconClassName, description, price, pricePeriod, features, cta, highlighted } = plan

  return (
    <>
      {highlighted ? (
        <Badge className="absolute -top-3 left-1/2 w-max -translate-x-1/2 border-0 bg-gradient-to-r from-primary to-brand-secondary px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg shadow-primary/30">
          Most popular
        </Badge>
      ) : null}

      <div className="flex items-center gap-2">
        <Icon className={cn("h-5 w-5", iconClassName)} aria-hidden />
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <p className="mt-6">
        <span className="font-headline text-4xl font-bold tracking-tight text-foreground">
          {price}
        </span>
        {pricePeriod ? (
          <span className="ml-1 text-muted-foreground">{pricePeriod}</span>
        ) : null}
      </p>

      <ul
        className={cn(
          "mt-6 flex flex-1 flex-col gap-3 text-sm",
          highlighted ? "text-foreground/90" : "text-muted-foreground"
        )}
      >
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <PlanCta cta={cta} highlighted={highlighted} />
      </div>
    </>
  )
}

function PlanCta({ cta, highlighted }: { cta: Plan["cta"]; highlighted?: boolean }) {
  const className = highlighted
    ? "h-11 w-full rounded-xl border-0 gradient-primary text-white hover:opacity-90"
    : "h-11 w-full rounded-xl border-border bg-transparent text-foreground hover:bg-white/5"
  const variant = highlighted ? undefined : ("outline" as const)

  if (cta.href) {
    return (
      <Button asChild variant={variant} className={className}>
        <Link to={cta.href}>{cta.label}</Link>
      </Button>
    )
  }

  return (
    <Button variant={variant} className={className}>
      {cta.label}
    </Button>
  )
}
