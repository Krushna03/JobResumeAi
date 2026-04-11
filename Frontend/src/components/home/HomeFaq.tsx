import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { homeFaqItems } from "../../../data/home-data"
import { HomeSectionHeader } from "./HomeSectionHeader"

export function HomeFaq() {
  return (
    <section
      id="faq"
      className="relative scroll-mt-24 bg-card/30 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeader
          title="Questions"
          description="Straight answers before you upload anything."
        />
        <Accordion type="single" collapsible className="mx-auto mt-10 max-w-3xl md:mt-14">
          {homeFaqItems.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline [&[data-state=open]]:text-foreground/90">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground md:text-base">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
