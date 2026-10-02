"use client"

import { LoadingState } from '@/components/academy/states'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { saveUserEnrollment } from '@/lib/enrollment'
import { getCourseById } from '@/lib/courses'
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

      let verifyData: { status?: string; data?: { status?: string; metadata?: { courseId?: string; courseTitle?: string; userId?: string; userEmail?: string } } } = {}

      // For real payments, verify with Paystack first (and get metadata as fallback)
      if (!isMockPayment) {
        try {
          const verifyResponse = await fetch(`/api/paystack/verify?reference=${paymentRef}`)
          verifyData = await verifyResponse.json()

          if (!verifyResponse.ok || !verifyData.status || verifyData.data?.status !== 'success') {
            setError('Payment verification failed')
            setIsProcessing(false)
            return
          }
        } catch (verifyError) {
          console.error('Payment verification error:', verifyError)
          setError('Payment verification failed')
          setIsProcessing(false)
          return
        }
      }

      try {
        // Get course info: prefer localStorage, fallback to Paystack verify metadata (survives redirect)
        const storedCourseId = localStorage.getItem('selectedCourseId')
        const storedCourseTitle = localStorage.getItem('selectedCourseTitle')
        const storedFormData = localStorage.getItem('registrationFormData')
        const formData = storedFormData ? JSON.parse(storedFormData) : {}

        const rawMeta = verifyData.data?.metadata
        const metadata = typeof rawMeta === 'string' ? (() => { try { return JSON.parse(rawMeta) } catch { return null } })() : rawMeta
        // Prefer the course recorded on the verified Paystack transaction over browser storage
        const courseId = metadata?.courseId || storedCourseId
        const courseTitle = metadata?.courseTitle || storedCourseTitle

        if (!courseId) {
          throw new Error('Course ID not found. It may have been cleared after redirect. Please contact support with your payment reference.')
        }

        // Merge courseId into formData in case it was lost (e.g. localStorage cleared partially)
        const formDataWithCourse = { ...formData, selectedCourseId: courseId }

        // Get course details from Firestore
        const selectedCourse = await getCourseById(courseId)
        if (!selectedCourse) {
          throw new Error(`Course not found (id: ${courseId})`)
        }
        setCourseTitleShown(selectedCourse.title || courseTitle || '')

        if (!paymentRef) {
          throw new Error('Payment reference not found')
        }

        if (!user) {
          throw new Error('User not authenticated. Please log in to complete your enrollment.')
        }

        // Save enrollment to Firebase (pass courseId override for reliability)
        await saveUserEnrollment(
          user.uid,
          user.email || '',
          formDataWithCourse,
          paymentRef,
          selectedCourse.price ?? 0,
          'paystack',
          courseId
        )

        // Send confirmation email with WhatsApp group invite
        try {
          const idToken = await user.getIdToken()
          const emailResponse = await fetch('/api/register/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({
              firstName: formData.firstName || 'Student',
              courseTitle: selectedCourse.title,
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
        setError('Payment was successful but enrollment could not be saved. ' + errMessage + ' Please contact support with reference: ' + paymentRef)
        setIsProcessing(false)
      }
    }

    handlePaymentSuccess()
  }, [user, searchParams])


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
