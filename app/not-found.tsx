import type { Metadata } from "next"
import Link from "next/link"
import { SearchX } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/academy/states"

export const metadata: Metadata = {
  title: "Page not found | Coltek Academy",
  robots: { index: false },
}

// Rendered for unknown URLs and whenever a page calls notFound() (e.g. an unknown course), with HTTP 404
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 md:py-24">
          <h1 className="sr-only">Page not found</h1>
          <EmptyState
            icon={SearchX}
            title="We couldn't find that page"
            description="The page or course you're looking for may have moved or no longer exists."
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/courses">Browse courses</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Go to home page</Link>
                </Button>
              </div>
            }
          />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need help?{" "}
            <Link
              href="/contact"
              className="rounded-sm font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Contact our team
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
