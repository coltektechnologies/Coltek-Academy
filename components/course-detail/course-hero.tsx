"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Clock, Users, Star, Globe, Calendar, Award, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/hooks/use-auth"
import { checkUserEnrollment } from "@/lib/enrollment"
import type { Course } from "@/lib/types"

interface CourseHeroProps {
  course: Course
  isUpcoming?: boolean
}

const TEAM_BY_IMAGE = {
  ceo: { name: "Mr. Boansi Kyeremateng Collins", image: "/ceo.jpg" },
  cto: { name: "Mr. Frederick Owusu Bonsu", image: "/CTO.jpg" },
  cao: { name: "Miss. Alhassan Habibah", image: "/habiba.jpeg" },
} as const

export function CourseHero({ course, isUpcoming = false }: CourseHeroProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null)
  const [showEnrolledDialog, setShowEnrolledDialog] = useState(false)

  useEffect(() => {
    if (!user || !course?.id) {
      setIsEnrolled(false)
      return
    }
    checkUserEnrollment(user.uid, course.id).then(setIsEnrolled).catch(() => setIsEnrolled(false))
  }, [user, course?.id])

  const levelColors = {
    Beginner: "bg-green-100 text-green-800",
    Intermediate: "bg-yellow-100 text-yellow-800",
    Advanced: "bg-red-100 text-red-800",
  }

  const instructor =
    course.category === "Mobile App"
      ? TEAM_BY_IMAGE.cto
      : course.category === "Marketing"
        ? TEAM_BY_IMAGE.cao
        : TEAM_BY_IMAGE.ceo

  return (
    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/courses" className="hover:text-foreground transition-colors">
                Courses
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground font-medium truncate max-w-[200px]">{course.title}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary">{course.category}</Badge>
              <Badge className={levelColors[course.level]}>{course.level}</Badge>
              {isUpcoming && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  Upcoming
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
              {course.title}
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">{course.description}</p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-foreground">{course.rating}</span>
                <span className="text-muted-foreground">({course.reviewCount.toLocaleString()} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>{course.enrolledStudents.toLocaleString()} students</span>
              </div>
            </div>

            {/* Instructor - CEO/CTO/CAO from About page */}
            <div className="flex items-center gap-4">
              <Image
                src={instructor.image}
                alt={instructor.name}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <div className="text-sm text-muted-foreground">Created by</div>
                <div className="font-semibold text-foreground">{instructor.name}</div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Last updated {course.lastUpdated}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{course.language}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Certificate included</span>
              </div>
            </div>
          </div>

          {/* Right - Course Card */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
              <div className="relative aspect-video">
                <Image src={course.image || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
              </div>
              <div className="p-6 space-y-6">
                {isUpcoming ? (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-center">
                    <p className="font-semibold text-amber-800 dark:text-amber-200">Coming soon</p>
                    <p className="text-sm text-muted-foreground mt-1">This course is not yet available for enrollment. Check back later!</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">GH₵{course.price}</span>
                    </div>

                    <div className="space-y-3">
                      {isEnrolled ? (
                        <>
                          <Button
                            size="lg"
                            variant="secondary"
                            className="w-full text-base gap-2"
                            onClick={() => setShowEnrolledDialog(true)}
                          >
                            <CheckCircle className="h-5 w-5" />
                            Enrolled
                          </Button>
                          <AlertDialog open={showEnrolledDialog} onOpenChange={setShowEnrolledDialog}>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Already enrolled</AlertDialogTitle>
                                <AlertDialogDescription>
                                  You have already enrolled in this course. Do you wish to take it again?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => router.push(`/register?course=${course.id}`)}
                                >
                                  Yes, enroll again
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      ) : (
                        <Button asChild size="lg" className="w-full text-base">
                          <Link href={`/register?course=${course.id}`}>Enroll Now</Link>
                        </Button>
                      )}
                      <Button variant="outline" size="lg" className="w-full text-base bg-transparent">
                        Add to Wishlist
                      </Button>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">30-Day Money-Back Guarantee</div>
                  </>
                )}

                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="font-semibold text-foreground">This course includes:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {course.duration} of content
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Certificate of completion
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Access to community
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
