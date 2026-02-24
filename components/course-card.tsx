"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Users, Star } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Course } from "@/lib/types"

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const { toast } = useToast()
  const isUpcoming = course.upcoming || ['cybersecurity-essentials', 'data-science-machine-learning'].includes(course.slug || '')
  const levelColors = {
    Beginner: "bg-green-100 text-green-800",
    Intermediate: "bg-yellow-100 text-yellow-800",
    Advanced: "bg-red-100 text-red-800",
  }

  const handleUpcomingClick = (e: React.MouseEvent) => {
    e.preventDefault()
    toast({ title: "Upcoming", description: "This course is coming soon. Stay tuned!" })
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card h-full flex flex-col py-0 gap-0">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={course.image || "/placeholder.svg"}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <Badge className={levelColors[course.level]}>{course.level}</Badge>
        </div>
        {isUpcoming && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">Upcoming</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-5 flex-1 flex flex-col min-h-0">
        <div className="mb-2">
          <Badge variant="secondary" className="text-xs">
            {course.category}
          </Badge>
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {isUpcoming ? (
            <button onClick={handleUpcomingClick} className="text-left w-full cursor-pointer hover:underline">
              {course.title}
            </button>
          ) : (
            <Link href={`/courses/${course.slug}`}>{course.title}</Link>
          )}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{course.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{course.enrolledStudents.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{course.rating}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-5 py-4 border-t border-border/50 flex items-center justify-between flex-shrink-0 min-h-[60px]">
        <span className="text-xl font-bold text-foreground">GH₵{course.price}</span>
        {isUpcoming ? (
          <Button size="sm" variant="outline" onClick={handleUpcomingClick}>
            View Course
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href={`/courses/${course.slug}`}>View Course</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
