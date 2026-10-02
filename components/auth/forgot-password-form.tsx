"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { sendPasswordResetEmail } from "firebase/auth"
import { Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { firebase, isFirebaseConfigured } from "@/lib/firebase"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.")
      return
    }
    if (!isFirebaseConfigured()) {
      setError("Password reset is unavailable right now. Please contact support.")
      return
    }

    setIsLoading(true)
    try {
      await sendPasswordResetEmail(firebase.auth, email.trim())
      setIsSent(true)
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        // Same message as success so the form does not reveal which emails have accounts
        setIsSent(true)
      } else if (err?.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else if (err?.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.")
      } else {
        console.error("Password reset error:", err)
        setError("We couldn't send the reset email. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image src="/coltek-academy-logo.svg" alt="Coltek Academy" width={141} height={48} className="h-12 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Reset your password</h1>
          <p className="text-muted-foreground text-sm">
            Enter the email address for your account and we&apos;ll send you a reset link.
          </p>
        </div>

        {isSent ? (
          <div className="space-y-6 text-center" role="status">
            <CheckCircle className="h-10 w-10 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong className="text-foreground">{email.trim()}</strong>, a password reset
              link has been sent. Check your inbox and spam folder.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "reset-error" : undefined}
                required
              />
              {error && (
                <p id="reset-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Remembered it?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
