"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2, BookOpen, Award, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getUserEnrollments } from "@/lib/enrollment"
import type { UserEnrollment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const Navbar = dynamic(
  () => import("@/components/navbar").then((mod) => mod.Navbar),
  { ssr: false, loading: () => <div className="h-16 bg-background" /> }
)

const Footer = dynamic(
  () => import("@/components/footer").then((mod) => mod.Footer || mod),
  { ssr: false, loading: () => null }
)

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/login?redirect=/dashboard")
      return
    }
    getUserEnrollments(user.uid)
      .then((list) => {
        // Deduplicate by courseId: keep only the most recent enrollment per course
        const byCourse = new Map<string, UserEnrollment>()
        for (const e of list) {
          const existing = byCourse.get(e.courseId)
          const date = e.enrollmentDate instanceof Date ? e.enrollmentDate.getTime() : new Date(e.enrollmentDate).getTime()
          const existingDate = existing
            ? (existing.enrollmentDate instanceof Date ? existing.enrollmentDate.getTime() : new Date(existing.enrollmentDate).getTime())
            : 0
          if (!existing || date > existingDate) byCourse.set(e.courseId, e)
        }
        setEnrollments(Array.from(byCourse.values()))
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7" />
            My Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here are your enrolled courses.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No enrollments yet</CardTitle>
              <CardDescription>
                You haven&apos;t enrolled in any courses. Browse our catalog to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{enrollment.courseTitle}</CardTitle>
                  <CardDescription>
                    Enrolled{" "}
                    {enrollment.enrollmentDate instanceof Date
                      ? enrollment.enrollmentDate.toLocaleDateString()
                      : new Date(enrollment.enrollmentDate).toLocaleDateString()}
                    {enrollment.status && ` • ${enrollment.status}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild variant="default" size="sm">
                    <Link href={`/courses/${enrollment.courseId}`} className="inline-flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      View Course
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/certificates" className="inline-flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Certificates
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
            <div className="pt-4">
              <Button asChild variant="outline">
                <Link href="/courses">Browse More Courses</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">My Certificates</CardTitle>
              <CardDescription>View and download your certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/certificates">
                  <Award className="mr-2 h-4 w-4" />
                  Go to Certificates
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Course Catalog</CardTitle>
              <CardDescription>Explore and enroll in more courses</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/courses">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Courses
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
