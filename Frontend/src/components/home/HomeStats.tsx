import { homeStats } from "../../../data/home-data"

export function HomeStats() {
  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-14 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {homeStats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card/50 px-4 py-5 text-center md:px-6 md:py-6"
            >
              <p className="font-headline text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
