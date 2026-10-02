"use client"

import { LoadingState } from '@/components/academy/states'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { requestEnrollment } from '@/lib/enrollment'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { EnrollmentSuccess } from '@/components/register/enrollment-success'

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'pending' | 'sent' | 'failed'>('pending')
  const [courseTitleShown, setCourseTitleShown] = useState<string>('')

  // Handle authentication and payment processing
  useEffect(() => {
    // Wait for auth state to be determined
    if (authLoading) return

    const handlePaymentSuccess = async () => {
      const reference = searchParams.get('reference')
      const trxref = searchParams.get('trxref')
      const isMockPayment = reference?.startsWith('MOCK-') || trxref?.startsWith('MOCK-')

      if (!reference && !trxref) {
        setError('Payment reference not found')
        setIsProcessing(false)
        return
      }

      const paymentRef = reference || trxref

      // For mock payments, require authentication
      if (isMockPayment && !user) {
        // Redirect to login with redirect back to this page
        localStorage.setItem('paymentReference', paymentRef || '')
        localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search)
        router.push('/login')
        return
      }

      try {
        if (!user) {
          throw new Error('User not authenticated. Please log in to complete your enrollment.')
        }

        // Answers from the enrollment form (kept in this browser before going to Paystack)
        const storedCourseId = localStorage.getItem('selectedCourseId') || undefined
        const storedFormData = localStorage.getItem('registrationFormData')
        const formData = storedFormData ? JSON.parse(storedFormData) : {}

        // The server verifies the payment with Paystack and saves the enrollment;
        // the course comes from the verified transaction, not from this browser
        const result = await requestEnrollment({
          reference: paymentRef || undefined,
          courseId: storedCourseId,
          formData,
        })
        setCourseTitleShown(result.courseTitle || localStorage.getItem('selectedCourseTitle') || '')

        if (result.alreadyEnrolled) {
          // Page reloaded after a completed enrollment: the confirmation email went out the first time
          setEmailStatus('sent')
          setIsProcessing(false)
          return
        }

        // Send confirmation email with WhatsApp group invite
        try {
          const idToken = await user.getIdToken()
          const emailResponse = await fetch('/api/register/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({
              firstName: formData.firstName || 'Student',
              courseTitle: result.courseTitle,
            }),
          })
          const emailResult = await emailResponse.json().catch(() => ({}))
          setEmailStatus(emailResponse.ok && emailResult.success === true ? 'sent' : 'failed')
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
          setEmailStatus('failed')
          // Don't fail the flow - enrollment was successful
        }

        // Clear stored data
        localStorage.removeItem('selectedCourseId')
        localStorage.removeItem('selectedCourseTitle')
        localStorage.removeItem('registrationFormData')

        setIsProcessing(false)
      } catch (err) {
        console.error('Error saving enrollment:', err)
        const errMessage = err instanceof Error ? err.message : String(err)
        setError(errMessage + ' If you were charged, please contact support with reference: ' + paymentRef)
        setIsProcessing(false)
      }
    }

    handlePaymentSuccess()
  }, [authLoading, user, searchParams])


  const reference = searchParams.get('reference') || searchParams.get('trxref')
  const isTestPayment = !!reference?.startsWith('MOCK-')
  const needsLogin = !!error?.includes('authenticated')

  let content: React.ReactNode
  if (authLoading || isProcessing) {
    content = (
      <LoadingState
        size="page"
        label={authLoading ? 'Checking your account…' : 'Confirming your payment and enrollment. Please keep this page open.'}
      />
    )
  } else if (error) {
    content = (
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center shadow-sm" role="alert">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive-subtle text-destructive">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
          {needsLogin ? 'Please log in to finish enrolling' : "We couldn't confirm your enrollment"}
        </h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        {reference && !needsLogin && (
          <p className="mt-3 text-sm text-muted-foreground">
            Payment reference: <span className="font-mono text-foreground">{reference}</span>
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {needsLogin ? (
            <Button
              size="lg"
              onClick={() => {
                // Save current URL to redirect back after login
                localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search)
                router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
              }}
            >
              Log in
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/contact">Contact support</Link>
            </Button>
          )}
          <Button asChild size="lg" variant="outline">
            <Link href="/courses">Return to courses</Link>
          </Button>
        </div>
      </div>
    )
  } else {
    content = (
      <div className="mx-auto max-w-2xl">
        <EnrollmentSuccess
          courseTitle={courseTitleShown}
          emailStatus={emailStatus}
          email={user?.email}
          paymentReference={reference}
          isTestPayment={isTestPayment}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">{content}</div>
      </main>
      <Footer />
    </div>
  )
}

// Reads the URL (useSearchParams), so the page renders inside its own Suspense boundary
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingState size="page" label="Confirming your payment…" />}>
      <PaymentSuccessPageContent />
    </Suspense>
  )
}
