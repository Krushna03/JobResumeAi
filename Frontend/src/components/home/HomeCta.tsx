import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function HomeCta() {
  return (
    <section className="relative py-16 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="bg-gradient-brand-cta overflow-hidden rounded-3xl border border-white/10 p-8 text-center shadow-none sm:p-10 md:p-14">
          <h2 className="font-headline text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            Ready to send a sharper resume?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/85 sm:text-base md:text-lg">
            Open the tailor experience or use the full builder when you want templates and more control.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button
              size="lg"
              className="h-12 rounded-full border-0 px-8 text-base font-medium gradient-primary text-white hover:opacity-90"
              asChild
            >
              <Link to="/tailor">Tailor a resume</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/45 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link to="/builder">Open resume builder</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  )
}
