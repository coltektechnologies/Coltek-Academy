import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SectionHeader } from "@/components/academy/section-header"
import { homeFaqs } from "@/lib/faqs"

export function HomeFaqSection() {
  return (
    <section aria-labelledby="faq-heading" className="bg-muted py-16 md:py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-4">
          <SectionHeader
            id="faq-heading"
            eyebrow="FAQ"
            title="Questions about joining"
            description="Quick answers about enrollment, fees, schedules and certificates."
            className="mb-6"
          />
          <p className="text-muted-foreground">
            Can&apos;t find your answer?{" "}
            <Link
              href="/contact"
              className="rounded-sm font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Contact our team
            </Link>
            .
          </p>
        </div>

        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-6 lg:col-span-8">
          {homeFaqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
