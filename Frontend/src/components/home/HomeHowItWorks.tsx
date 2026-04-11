import { homeHowItWorksSteps } from "../../../data/home-data"
import { HomeSectionHeader } from "./HomeSectionHeader"

export function HomeHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 bg-card/30 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeader
          title="How it works"
          description="Three steps from upload to a tailored draft."
        />
        <ol className="mx-auto mt-12 grid max-w-5xl gap-8 md:mt-16 md:grid-cols-3 md:gap-10">
          {homeHowItWorksSteps.map((item) => (
            <li key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground md:h-16 md:w-16 md:text-xl">
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground md:mt-6">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
