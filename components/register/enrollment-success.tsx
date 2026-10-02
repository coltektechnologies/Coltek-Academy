import Link from "next/link"
import { CheckCircle2, LayoutDashboard, Mail, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/CVTzw4zdtqVHjDV3IwC1zy"

interface EnrollmentSuccessProps {
  courseTitle?: string
  /** Result of sending the confirmation email. */
  emailStatus: "pending" | "sent" | "failed"
  email?: string | null
  paymentReference?: string | null
  /** Development mock payment: say so instead of claiming a real charge. */
  isTestPayment?: boolean
}

/** Shared confirmation screen for free and paid enrollments: what happened and what happens next. */
export function EnrollmentSuccess({ courseTitle, emailStatus, email, paymentReference, isTestPayment }: EnrollmentSuccessProps) {
  const emailText =
    emailStatus === "sent"
      ? `We've sent a confirmation to ${email || "your email"}.`
      : emailStatus === "pending"
        ? "We're sending your confirmation email…"
        : "Your enrollment is saved, but we couldn't send the confirmation email. You can still join the group and use your dashboard."

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10">
      <div className="text-center" role="status">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-subtle text-success">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">You&apos;re enrolled</h1>
        {courseTitle && (
          <p className="mt-2 text-lg text-muted-foreground">
            Welcome to <span className="font-semibold text-foreground">{courseTitle}</span>.
          </p>
        )}
        {isTestPayment && (
          <p className="mt-2 text-sm text-muted-foreground">This was a test payment. No real charge was made.</p>
        )}
        {paymentReference && (
          <p className="mt-3 text-sm text-muted-foreground">
            Payment reference: <span className="font-mono text-foreground">{paymentReference}</span>
          </p>
        )}
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted-foreground">What happens next</h2>
      <ol className="mt-4 space-y-4">
        <li className="flex gap-4 rounded-lg border border-border p-4">
          <Mail className={cn("mt-0.5 size-5 shrink-0", emailStatus === "failed" ? "text-warning" : "text-primary")} aria-hidden="true" />
          <div>
            <p className="font-semibold text-foreground">Check your email</p>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              {emailText}
            </p>
          </div>
        </li>
        <li className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Join the student WhatsApp group</p>
              <p className="mt-1 text-sm text-muted-foreground">Get course announcements and connect with other students.</p>
            </div>
          </div>
          {/* WhatsApp brand color is allowed for its own button (DESIGN_SYSTEM.md §3.3) */}
          <Button asChild className="shrink-0 bg-[#25D366] text-white hover:bg-[#20BD5A]">
            <a href={WHATSAPP_GROUP_LINK} target="_blank" rel="noopener noreferrer">
              Join group
              <span className="sr-only"> on WhatsApp (opens in a new tab)</span>
            </a>
          </Button>
        </li>
        <li className="flex gap-4 rounded-lg border border-border p-4">
          <LayoutDashboard className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold text-foreground">Start from your dashboard</p>
            <p className="mt-1 text-sm text-muted-foreground">Your course is listed in your student dashboard.</p>
          </div>
        </li>
      </ol>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href="/dashboard">Go to my dashboard</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/courses">Browse more courses</Link>
        </Button>
      </div>
    </div>
  )
}
