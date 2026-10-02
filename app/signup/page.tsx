import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Suspense } from "react"
import { SignupForm } from "@/components/auth/signup-form"
import { LoadingState } from "@/components/academy/states"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        {/* SignupForm reads ?redirect= from the URL */}
        <Suspense fallback={<LoadingState label="Loading sign-up…" />}>
          <SignupForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
