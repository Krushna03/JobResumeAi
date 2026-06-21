import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { Plus } from "lucide-react"
import { homeFaqItems } from "../../../data/home-data"
import { HomeSectionHeader } from "./HomeSectionHeader"

export function HomeFaq() {
  return (
    <section
      id="faq"
      className="relative scroll-mt-24 bg-card/20 py-16 md:py-20 lg:py-24"
    >
      {/* Hairlines that frame the section as a quiet band */}
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
          title="Questions"
          description="Straight answers before you upload anything."
        />

        <AccordionPrimitive.Root
          type="single"
          collapsible
          className="mx-auto mt-10 max-w-3xl space-y-3 md:mt-14"
        >
          {homeFaqItems.map((item, i) => (
            <AccordionPrimitive.Item
              key={item.q}
              value={`item-${i}`}
              className="group overflow-hidden rounded-2xl border border-border bg-card/40 transition-colors duration-300 hover:border-foreground/20 hover:bg-card/60 data-[state=open]:border-primary/30 data-[state=open]:bg-card/60"
            >
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between gap-4 px-5 py-5 text-left text-base font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-6">
                  <span className="pr-2">{item.q}</span>
                  <span
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card/60 transition-all duration-300 group-data-[state=open]:border-primary/40 group-data-[state=open]:bg-primary/10"
                    aria-hidden
                  >
                    <Plus className="h-4 w-4 text-muted-foreground transition-all duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:text-primary" />
                  </span>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden text-sm leading-relaxed text-muted-foreground transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down md:text-base">
                <div className="px-5 pb-5 pt-0 sm:px-6">{item.a}</div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      </div>
    </section>
  )
}
