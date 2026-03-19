import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Coltek Academy',
  description: 'Read our terms and conditions for using Coltek Academy e-learning platform.',
}

export default function TermsPage() {
  const currentYear = new Date().getFullYear()
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Terms & Conditions</h1>
        <p className="text-muted-foreground">Last Updated: {currentYear}</p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using Coltek Academy ("the Platform"), you accept and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must not use our Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>You must be at least 13 years old to create an account.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You agree to provide accurate and complete information during registration.</li>
            <li>You are responsible for all activities that occur under your account.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Course Enrollment and Access</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Course fees are non-refundable except as required by law.</li>
            <li>Access to course materials is granted for personal, non-commercial use only.</li>
            <li>We reserve the right to modify or discontinue any course at any time.</li>
            <li>Free courses may have limited access compared to paid courses.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
          <p className="mb-4">
            All content on the Platform, including but not limited to text, graphics, logos, and course materials, is the property of Coltek Academy or its content suppliers and is protected by copyright laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. User Conduct</h2>
          <p className="mb-4">
            You agree not to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Share your account credentials with others</li>
            <li>Use the Platform for any illegal or unauthorized purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Platform</li>
            <li>Upload or transmit viruses or any other malicious code</li>
            <li>Harass, abuse, or harm other users</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
          <p className="mb-4">
            Coltek Academy shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these Terms at any time. We will notify users of any changes by updating the "Last Updated" date at the top of this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            Email: <a href="mailto:info@coltektechnologies.io" className="text-primary hover:underline">info@coltektechnologies.io</a><br />
            Phone: 0538008122 / 0549361771<br />
            
          </p>
        </section>
      </div>

      <div className="mt-12 text-center">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}
