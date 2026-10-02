import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { LoadingState } from "@/components/academy/states"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main" className="flex-1 flex items-center justify-center py-12 px-4">
        {/* LoginForm reads ?redirect= from the URL */}
        <Suspense fallback={<LoadingState label="Loading sign-in…" />}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
