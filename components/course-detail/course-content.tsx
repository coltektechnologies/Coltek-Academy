import Image from "next/image"
import { CheckCircle } from "lucide-react"
import type { Course } from "@/lib/types"
import { CourseCurriculum } from "./course-curriculum"

const TEAM_BY_CATEGORY = {
  ceo: {
    name: "Mr. Boansi Kyeremateng Collins",
    image: "/ceo.jpg",
    bio: "Software Engineer dedicated to empowering learners through hands-on tech education.",
  },
  cto: {
    name: "Mr. Frederick Owusu Bonsu",
    image: "/CTO.jpg",
    bio: "Chief Technology Officer and mobile application engineer focused on building reliable and scalable digital learning solutions.",
  },
  cao: {
    name: "Miss. Alhassan Habibah",
    image: "/habiba.jpeg",
    bio: "Chief Academic Officer with extensive experience in curriculum development and educational technology.",
  },
} as const

interface CourseContentProps {
  course: Course
}

export function CourseContent({ course }: CourseContentProps) {
  const instructor =
    course.category === "Mobile App"
      ? TEAM_BY_CATEGORY.cto
      : course.category === "Marketing"
        ? TEAM_BY_CATEGORY.cao
        : TEAM_BY_CATEGORY.ceo

  return (
    <div className="max-w-4xl">
      {/* Full Description */}
      <section className="py-12 border-b border-border">
        <h2 className="text-2xl font-bold text-foreground mb-4">About This Course</h2>
        <p className="text-muted-foreground leading-relaxed">{course.fullDescription}</p>
      </section>

      {/* What You'll Learn */}
      <section className="py-12 border-b border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">What You&apos;ll Learn</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {course.whatYouLearn.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Curriculum */}
      <CourseCurriculum curriculum={course.curriculum} />

      {/* Prerequisites */}
      <section className="py-12 border-b border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Prerequisites</h2>
        <ul className="space-y-3">
          {course.prerequisites.map((prereq, index) => (
            <li key={index} className="flex items-center gap-3 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" />
              {prereq}
            </li>
          ))}
        </ul>
      </section>

      {/* Instructor */}
      <section className="py-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Your Instructor</h2>
        <div className="flex items-start gap-6">
          <Image
            src={instructor.image}
            alt={instructor.name}
            width={96}
            height={96}
            className="rounded-full"
          />
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{instructor.name}</h3>
            <p className="text-muted-foreground leading-relaxed">{instructor.bio}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
