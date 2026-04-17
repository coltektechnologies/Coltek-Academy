"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { saveUserEnrollment } from '@/lib/enrollment'
import { getCourseById } from '@/lib/courses'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2, MessageCircle } from 'lucide-react'

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/CVTzw4zdtqVHjDV3IwC1zy'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

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
        const courseId = storedCourseId || metadata?.courseId
        const courseTitle = storedCourseTitle || metadata?.courseTitle

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
          await fetch('/api/register/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email || formData.email,
              firstName: formData.firstName || 'Student',
              courseTitle: selectedCourse.title,
            }),
          })
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
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


  if (authLoading || isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              {authLoading ? 'Checking authentication...' : 'Processing Payment...'}
            </CardTitle>
            <CardDescription>
              {authLoading 
                ? 'Please wait while we verify your session.'
                : 'Please wait while we confirm your payment and enroll you in the course.'
              }
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">
              {error.includes('authenticated') ? 'Authentication Required' : 'Payment Error'}
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            {error.includes('authenticated') ? (
              <Button 
                onClick={() => {
                  // Save current URL to redirect back after login
                  localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
                  router.push('/login');
                }}
                className="w-full"
              >
                Log In
              </Button>
            ) : null}
            <Button 
              onClick={() => router.push('/courses')} 
              variant={error.includes('authenticated') ? 'outline' : 'default'}
              className="w-full"
            >
              Return to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Payment Successful!
          </CardTitle>
          <CardDescription>
            {searchParams.get('reference')?.startsWith('MOCK-') || searchParams.get('trxref')?.startsWith('MOCK-')
              ? "This was a test payment. In production, you would be charged."
              : "You have been successfully enrolled in your course. A confirmation email has been sent with next steps."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-4 text-left">
            <p className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Join the CADs WhatsApp Group
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Connect with fellow students and stay updated on course announcements.
            </p>
            <Button asChild className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white">
              <a href={WHATSAPP_GROUP_LINK} target="_blank" rel="noopener noreferrer">
                Join WhatsApp Group
              </a>
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Payment Reference: {searchParams.get('reference') || searchParams.get('trxref')}
          </div>
          <div className="space-y-2">
            <Button onClick={() => router.push('/courses')} className="w-full">
              Browse More Courses
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}