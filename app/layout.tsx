import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { RouteLoaderProvider } from "@/components/providers/route-loader"

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EduLearn - Transform Your Future with Expert-Led Courses",
  description:
    "Discover thousands of courses taught by industry experts. Start learning today and advance your career with in-demand skills.",
  keywords: ["online courses", "education", "learning", "professional development", "skills training"],
  openGraph: {
    title: "EduLearn - Transform Your Future",
    description: "Expert-led courses to advance your career",
    type: "website",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#0A2463",
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
      <body className="font-sans antialiased">
        <RouteLoaderProvider minDurationMs={800} label="Loading..." />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
