import { homeHowItWorksSteps } from "../../../data/home-data"
import { HomeSectionHeader } from "./HomeSectionHeader"

export function HomeHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 bg-card/20 py-16 md:py-20 lg:py-24"
    >
      {/* Hairlines that frame the section as a distinct band */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        aria-hidden
      />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeader
          title="How it works"
          description="Three steps from upload to a tailored draft."
        />

        <div className="relative mx-auto mt-12 max-w-5xl md:mt-16">
          {/* Horizontal connector — links the step nodes into a visible process path (md+) */}
          <div
            className="pointer-events-none absolute inset-x-[12%] top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:top-8 md:block"
            aria-hidden
          />

          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-10">
            {homeHowItWorksSteps.map((item) => (
              <li key={item.step} className="group relative text-center">
                {/* Step node — outlined circle with gradient numeral, solid bg covers the connector at its position */}
                <div className="relative mx-auto h-14 w-14 md:h-16 md:w-16">
                  <div
                    className="pointer-events-none absolute -inset-2 rounded-full bg-primary/25 opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  />
                  <div className="relative flex h-full w-full items-center justify-center rounded-full border border-border bg-card ring-1 ring-white/5">
                    <span className="font-headline bg-gradient-to-br from-primary to-brand-secondary bg-clip-text text-lg font-bold text-transparent md:text-xl">
                      {item.step}
                    </span>
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-semibold text-foreground md:mt-6 md:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
