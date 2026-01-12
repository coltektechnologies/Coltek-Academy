import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How do I enroll in a course?",
    answer:
      "To enroll in a course, browse our course catalog, select the course you're interested in, and click the 'Enroll Now' button. You'll be guided through the registration process where you can provide your information and select a payment method.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for select regions. We also offer installment payment plans for courses over $500.",
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer:
      "Yes! We offer a 30-day money-back guarantee for all courses. If you're not satisfied with your purchase, contact our support team within 30 days of enrollment for a full refund.",
  },
  {
    question: "Do I get a certificate upon completion?",
    answer:
      "Yes, upon successful completion of any course, you'll receive a verified certificate that you can share on LinkedIn or include in your resume. Our certificates are recognized by employers worldwide.",
  },
  {
    question: "How long do I have access to course materials?",
    answer:
      "Once enrolled, you have lifetime access to the course materials. You can learn at your own pace and revisit the content whenever you need a refresher.",
  },
  {
    question: "Are the courses self-paced?",
    answer:
      "Most of our courses are self-paced, allowing you to learn on your own schedule. Some bootcamp-style courses have cohort start dates and weekly deadlines to keep you on track.",
  },
]

export function FAQSection() {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Find quick answers to common questions about our courses and platform.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
