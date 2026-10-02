import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { Award, CalendarDays, Check, CreditCard, LayoutDashboard, Mail, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CourseCurriculum } from "@/components/course-detail/course-curriculum"
import { EnrollAction } from "@/components/course-detail/enroll-action"
import { formatCourseDuration, formatCoursePrice, getCourseMode, isCourseUpcoming } from "@/lib/course-display"
import { getCourseFaqs } from "@/lib/faqs"
import { getCourseInstructor } from "@/lib/team"
import type { Course } from "@/lib/types"

const SCHEDULE_NOTE = "Choose weekdays or weekends when you register"

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-32">
      <h2 id={`${id}-heading`} className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function CheckList({ items, columns = false }: { items: string[]; columns?: boolean }) {
  return (
    <ul className={columns ? "grid gap-x-8 gap-y-3 sm:grid-cols-2" : "space-y-3"}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <span className="leading-relaxed text-foreground">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function CourseBody({ course }: { course: Course }) {
  const upcoming = isCourseUpcoming(course)
  const priceLabel = formatCoursePrice(course)
  const duration = formatCourseDuration(course.duration)
  const mode = getCourseMode(course)
  const instructor = getCourseInstructor(course.category)
  const certificate = course.certificateIncluded === true

  const audience: string[] = course.targetAudience || []
  const outcomes: string[] = course.whatYouLearn?.length ? course.whatYouLearn : course.learningObjectives || []
  const requirements: string[] = [...(course.prerequisites || []), ...(course.requirements || [])]
  const tools: string[] = course.tags || []
  const faqs = getCourseFaqs({ certificateIncluded: certificate })

  const receives = [
    certificate && { icon: Award, text: "A certificate of completion, downloadable from your dashboard once issued" },
    { icon: LayoutDashboard, text: "Your course listed in your student dashboard" },
    { icon: Mail, text: "A confirmation email when your enrollment is complete" },
    { icon: MessageCircle, text: "An invitation to the Coltek Academy student WhatsApp group" },
  ].filter(Boolean) as { icon: typeof Award; text: string }[]

  const nav = [
    { id: "overview", label: "Overview" },
    outcomes.length > 0 && { id: "learn", label: "What you'll learn" },
    { id: "requirements", label: "Requirements" },
    course.curriculum?.length > 0 && { id: "curriculum", label: "Curriculum" },
    { id: "format", label: "How it works" },
    { id: "receive", label: "What you receive" },
    { id: "faq", label: "FAQ" },
  ].filter(Boolean) as { id: string; label: string }[]

  const glance = [
    { label: "Level", value: course.level },
    duration && { label: "Duration", value: duration },
    mode && { label: "Learning mode", value: mode },
    { label: "Schedule", value: SCHEDULE_NOTE },
    course.language && { label: "Language", value: course.language },
    { label: "Certificate", value: certificate ? "Included" : "Not included" },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      {/* In-page navigation: sticky under the site header, scrolls sideways on small screens */}
      <nav aria-label="Course sections" className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {nav.map((item) => (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                className="inline-flex h-12 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-12 lg:gap-12 lg:px-8">
        {/* Fee & enrollment: first on mobile, sticky sidebar on desktop */}
        <aside aria-labelledby="enroll-heading" className="lg:order-last lg:col-span-4">
          <div id="enroll" className="scroll-mt-32 rounded-xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-32">
            <h2 id="enroll-heading" className="text-sm font-medium text-muted-foreground">
              {upcoming ? "Enrollment" : "Course fee"}
            </h2>
            <p className={upcoming ? "mt-1 text-2xl font-bold text-foreground" : "mt-1 text-4xl font-bold tracking-tight text-foreground"}>
              {priceLabel}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {upcoming
                ? "This course is not yet open for enrollment."
                : priceLabel === "Free"
                  ? "Enroll for free — no payment needed."
                  : "One-time payment, processed securely by Paystack."}
            </p>

            <EnrollAction courseId={course.id} courseTitle={course.title} upcoming={upcoming} className="mt-5 w-full" />

            <dl className="mt-6 divide-y divide-border border-t border-border text-sm">
              {glance.map((item) => (
                <div key={item.label} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="text-right font-medium text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-col gap-2 text-sm">
              <a href="#requirements" className="rounded-sm font-medium text-primary underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                Check the requirements
              </a>
              <Link href="/terms" className="rounded-sm text-muted-foreground underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                Terms, including refunds
              </Link>
            </div>
          </div>
        </aside>

        <div className="space-y-14 lg:col-span-8">
          <Section id="overview" title="About this course">
            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {course.fullDescription || course.description}
            </p>
            {audience.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-foreground">Who this course is for</h3>
                <div className="mt-4">
                  <CheckList items={audience} />
                </div>
              </div>
            )}
          </Section>

          {outcomes.length > 0 && (
            <Section id="learn" title="What you'll learn">
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <CheckList items={outcomes} columns />
              </div>
            </Section>
          )}

          <Section id="requirements" title="Requirements">
            <p className="mb-4 text-muted-foreground">
              Level: <span className="font-semibold text-foreground">{course.level}</span>
            </p>
            {requirements.length > 0 ? (
              <ul className="space-y-3">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <span className="leading-relaxed text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No prerequisites are listed for this course.</p>
            )}
          </Section>

          {course.curriculum?.length > 0 && (
            <Section id="curriculum" title="Curriculum">
              <CourseCurriculum curriculum={course.curriculum} />
            </Section>
          )}

          {tools.length > 0 && (
            <Section id="tools" title="Technologies and tools">
              <ul className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <li key={tool}>
                    <Badge variant="outline" className="px-3 py-1 text-sm">
                      {tool}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section id="format" title="How the course works">
            <dl className="grid gap-6 sm:grid-cols-2">
              {mode && (
                <div>
                  <dt className="text-sm text-muted-foreground">Learning mode</dt>
                  <dd className="mt-1 font-semibold text-foreground">{mode === "Online" ? "Taught online" : "Taught in person"}</dd>
                </div>
              )}
              {duration && (
                <div>
                  <dt className="text-sm text-muted-foreground">Duration</dt>
                  <dd className="mt-1 font-semibold text-foreground">{duration}</dd>
                </div>
              )}
              <div>
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  Schedule
                </dt>
                <dd className="mt-1 font-semibold text-foreground">{SCHEDULE_NOTE}</dd>
              </div>
              {course.language && (
                <div>
                  <dt className="text-sm text-muted-foreground">Language</dt>
                  <dd className="mt-1 font-semibold text-foreground">{course.language}</dd>
                </div>
              )}
            </dl>

            <div className="mt-8 flex items-start gap-5 rounded-xl border border-border bg-card p-6">
              <Image
                src={instructor.image}
                alt=""
                width={64}
                height={64}
                className="size-16 shrink-0 rounded-full object-cover"
              />
              <div>
                <p className="text-sm text-muted-foreground">Your instructor</p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">{instructor.name}</p>
                <p className="text-sm font-medium text-accent">{instructor.role}</p>
                <p className="mt-2 leading-relaxed text-muted-foreground">{instructor.bio}</p>
              </div>
            </div>
          </Section>

          <Section id="receive" title="What you receive">
            <ul className="grid gap-4 sm:grid-cols-2">
              {receives.map((item) => (
                <li key={item.text} className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="leading-relaxed text-foreground">{item.text}</span>
                </li>
              ))}
            </ul>
            {!upcoming && priceLabel !== "Free" && (
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="size-4" aria-hidden="true" />
                Payments are processed securely through Paystack.
              </p>
            )}
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-6">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Section>
        </div>
      </div>
    </>
  )
}
