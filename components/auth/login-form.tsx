"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Loader2, Eye, EyeOff } from "lucide-react"
import { GoogleButton } from "./google-button"
import { GithubButton } from "./github-button"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"

export function LoginForm() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [isLoading, setIsLoading] = useState(false)
  const [socialProvider, setSocialProvider] = useState<"google" | "github" | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password)
      
      toast({
        title: "Login successful!",
        description: "Welcome back to Coltek Academy.",
      })
      
      // Redirect to the specified page or home
      router.push(redirectTo)
    } catch (error: any) {
      console.error('Error signing in:', error)
      let errorMessage = "Failed to sign in. Please check your credentials."
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password."
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later."
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setSocialProvider("google")
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      await signInWithPopup(auth, provider)
      toast({
        title: "Signed in successfully!",
        description: "Welcome back to Coltek Academy.",
      })
      window.location.href = redirectTo || '/'
    } catch (error: any) {
      console.error("Google sign-in error:", error)
      let errorMessage = "Failed to sign in with Google. Please try again."

      if (error.code === "auth/popup-blocked") {
        errorMessage = "Sign-in popup was blocked. Please allow popups for this site."
      } else if (error.code === "auth/popup-closed-by-user") {
        return // User closed popup, no need to show error
      } else if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with this email. Please sign in with your email and password."
      } else if (error.code === "auth/cancelled-popup-request") {
        return // User cancelled, no need to show error
      }

      toast({
        title: "Sign-in failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSocialProvider(null)
    }
  }

  const handleGitHubSignIn = async () => {
    setSocialProvider("github")
    try {
      const provider = new GithubAuthProvider()
      provider.addScope("read:user")
      provider.addScope("user:email")
      await signInWithPopup(auth, provider)
      toast({
        title: "Signed in successfully!",
        description: "Welcome back to Coltek Academy.",
      })
      window.location.href = redirectTo || '/'
    } catch (error: any) {
      console.error("GitHub sign-in error:", error)
      let errorMessage = "Failed to sign in with GitHub. Please try again."

      if (error.code === "auth/popup-blocked") {
        errorMessage = "Sign-in popup was blocked. Please allow popups for this site."
      } else if (error.code === "auth/popup-closed-by-user") {
        return
      } else if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with this email. Please sign in with your email and password or Google."
      } else if (error.code === "auth/cancelled-popup-request") {
        return
      }

      toast({
        title: "Sign-in failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSocialProvider(null)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Coltek Academy</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">Sign in to continue your learning journey</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
            />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
              Remember me for 30 days
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">or continue with</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-1 gap-3">
          <GoogleButton
            onClick={handleGoogleSignIn}
            disabled={!!socialProvider}
            isLoading={socialProvider === "google"}
            label="Continue with Google"
            loadingLabel="Signing in with Google..."
          />
          <GithubButton
            onClick={handleGitHubSignIn}
            disabled={!!socialProvider}
            isLoading={socialProvider === "github"}
            label="Continue with GitHub"
            loadingLabel="Signing in with GitHub..."
          />
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}
