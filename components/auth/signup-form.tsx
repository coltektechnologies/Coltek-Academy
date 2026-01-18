"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Loader2, Eye, EyeOff } from "lucide-react"
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  fetchSignInMethodsForEmail 
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"

export function SignupForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password should be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Check if email already exists
      const methods = await fetchSignInMethodsForEmail(auth, formData.email);
      
      if (methods && methods.length > 0) {
        throw { code: 'auth/email-already-in-use' };
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      })

      // Get the user's ID token to ensure fresh credentials
      await userCredential.user.getIdToken(true)

      // Create a user document in Firestore
      const userDoc = {
        uid: userCredential.user.uid,  // This must match the document ID
        displayName: formData.name,
        email: formData.email,
        emailVerified: false,
        photoURL: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add any additional required fields here
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc, {
        merge: false // Don't merge, we want to create a new document
      })

      // Send email verification
      // Note: You might want to enable email verification in Firebase Console
      // await sendEmailVerification(userCredential.user)

      toast({
        title: "Account created!",
        description: "Your account has been created successfully.",
      })

      // Redirect to home page or dashboard
      router.push('/')
    } catch (error: any) {
      console.error('Error signing up:', error)
      let errorMessage = "Failed to create account. Please try again."
      let action = null
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered."
        action = {
          label: 'Go to Login',
          onClick: () => router.push('/login')
        }
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Please choose a stronger password (at least 6 characters)."
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address."
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later."
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        action: action ? (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">EduLearn</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Create an Account</h1>
          <p className="text-muted-foreground text-sm">Join us to start your learning journey</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
