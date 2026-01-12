import Image from "next/image"
import Link from "next/link"
import { Clock, Users, Star, Globe, Calendar, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Course } from "@/lib/types"

interface CourseHeroProps {
  course: Course
}

export function CourseHero({ course }: CourseHeroProps) {
  const levelColors = {
    Beginner: "bg-green-100 text-green-800",
    Intermediate: "bg-yellow-100 text-yellow-800",
    Advanced: "bg-red-100 text-red-800",
  }

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

            {/* Instructor */}
            <div className="flex items-center gap-4">
              <Image
                src={course.instructor.avatar || "/placeholder.svg"}
                alt={course.instructor.name}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <div className="text-sm text-muted-foreground">Created by</div>
                <div className="font-semibold text-foreground">{course.instructor.name}</div>
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
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">${course.price}</span>
                </div>

                <div className="space-y-3">
                  <Button asChild size="lg" className="w-full text-base">
                    <Link href={`/register?course=${course.id}`}>Enroll Now</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="w-full text-base bg-transparent">
                    Add to Wishlist
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">30-Day Money-Back Guarantee</div>

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
