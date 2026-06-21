import type { CSSProperties } from "react"
import { Card } from "@/components/ui/card"
import { Target, Zap, CheckCircle, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { HomeSectionHeader } from "./HomeSectionHeader"

type Feature = {
  icon: LucideIcon
  iconClassName: string
  accent: string
  title: string
  description: string
}

const FEATURES: readonly Feature[] = [
  {
    icon: Target,
    iconClassName: "text-primary",
    accent: "rgb(var(--brand-primary-rgb)/0.55)",
    title: "Role-aligned emphasis",
    description:
      "Surfaces the achievements and skills that match the posting—without inventing experience you do not have.",
  },
  {
    icon: Zap,
    iconClassName: "text-brand-secondary",
    accent: "rgb(var(--brand-secondary-rgb)/0.55)",
    title: "Fast iteration",
    description:
      "Spin a new version per listing in minutes so you can apply broadly without burning out on rewrites.",
  },
  {
    icon: CheckCircle,
    iconClassName: "text-brand-tertiary",
    accent: "rgb(var(--brand-tertiary-rgb)/0.55)",
    title: "Readable and professional",
    description:
      "Strong hierarchy and scannable bullets help humans and parsers find the signal quickly.",
  },
]

export function HomeFeatures() {
  return (
    <section
      id="features"
      className="relative scroll-mt-24 py-16 md:py-20 lg:py-24"
    >
      {/* Single restrained accent line that hints at the section start */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        aria-hidden
      />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeader
          title="Built for Real Applications"
          description="Clear structure, role-aware emphasis, and a workflow that fits how you apply."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-8">
          {FEATURES.map(({ icon: Icon, iconClassName, accent, title, description }, index) => (
            <Card
              key={title}
              style={{ "--feature-accent": accent } as CSSProperties}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border bg-card/30 p-6 transition-colors duration-300 hover:border-foreground/20 hover:bg-card/60 sm:p-8",
                index === FEATURES.length - 1 && "sm:col-span-2 lg:col-span-1"
              )}
            >
              {/* Top accent line — brand-tinted, intensifies on hover */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,var(--feature-accent),transparent)] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />

              {/* Numbered editorial label */}
              <div className="mb-6 flex items-center gap-3">
                <span className="font-mono text-xs font-medium tracking-[0.2em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Icon className={cn("mb-5 h-8 w-8", iconClassName)} aria-hidden />

              <h3 className="text-lg font-semibold text-foreground md:text-xl">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
