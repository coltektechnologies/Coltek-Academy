import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/hooks/use-auth"

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Coltek Academy - Transform Your Future with Expert-Led Courses",
  description:
    "Discover courses taught by industry experts. Start learning today and advance your career with in-demand skills.",
  keywords: ["online courses", "education", "learning", "professional development", "skills training"],
  openGraph: {
    title: "Coltek Academy - Transform Your Future",
    description: "Expert-led courses to advance your career",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/fav-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/fav-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/fav-32x32.png",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#193E72",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {/* First focusable element: lets keyboard users jump past the header */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
        >
          Skip to main content
        </a>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
