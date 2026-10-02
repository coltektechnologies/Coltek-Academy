"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CalendarDays, CalendarRange, ExternalLink } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { LoadingState } from "@/components/academy/states"
import { FormField } from "@/components/register/form-field"
import { getAllCourses } from "@/lib/courses"
import { formatCourseDuration, getCourseMode } from "@/lib/course-display"
import { cn } from "@/lib/utils"
import type { RegistrationFormData, Course } from "@/lib/types"

interface StepCourseSelectionProps {
  formData: RegistrationFormData
  updateFormData: (data: Partial<RegistrationFormData>) => void
  errors: Record<string, string>
}

const SCHEDULES = [
  { value: "weekdays", label: "Weekdays", description: "Monday – Friday", icon: CalendarDays },
  { value: "weekends", label: "Weekends", description: "Saturday – Sunday", icon: CalendarRange },
]

const feeLabel = (course: Course) => (typeof course.price === "number" && course.price > 0 ? `GH₵${course.price.toLocaleString()}` : "Free")

/** Step 1: choose a course, check its requirements, and share goals and schedule preference. */
export function StepCourseSelection({ formData, updateFormData, errors }: StepCourseSelectionProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllCourses()
      .then(setCourses)
      .catch((error) => console.error("Error loading courses:", error))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <LoadingState label="Loading courses…" />
  }

  const selected = courses.find((course) => course.id === formData.selectedCourseId)
  const requirements: string[] = selected ? [...(selected.prerequisites || []), ...(selected.requirements || [])] : []
  const duration = selected ? formatCourseDuration(selected.duration) : null
  const mode = selected ? getCourseMode(selected) : null

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Choose your course</h2>
        <p className="mt-1 text-muted-foreground">Check the requirements, then tell us what you want to achieve.</p>
      </div>

      <FormField id="selectedCourseId" label="Course" required error={errors.selectedCourseId}>
        {(controlProps) => (
          <Select value={formData.selectedCourseId} onValueChange={(value) => updateFormData({ selectedCourseId: value })}>
            <SelectTrigger {...controlProps} className="h-12 w-full">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      {selected && (
        <section aria-labelledby="selected-course-heading" className="rounded-xl border border-border bg-muted p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-accent">{selected.category}</p>
              <h3 id="selected-course-heading" className="text-lg font-semibold text-foreground">
                {selected.title}
              </h3>
            </div>
            <p className="text-lg font-bold text-foreground">
              <span className="sr-only">Fee: </span>
              {feeLabel(selected)}
            </p>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Level</dt>
              <dd className="font-medium text-foreground">{selected.level}</dd>
            </div>
            {duration && (
              <div>
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-medium text-foreground">{duration}</dd>
              </div>
            )}
            {mode && (
              <div>
                <dt className="text-muted-foreground">Mode</dt>
                <dd className="font-medium text-foreground">{mode}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Certificate</dt>
              <dd className="font-medium text-foreground">{selected.certificateIncluded ? "Included" : "Not included"}</dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-foreground">Requirements</h4>
            {requirements.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No prerequisites are listed for this course.</p>
            )}
          </div>

          <Link
            href={`/courses/${selected.slug || selected.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            View full course details
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </Link>
        </section>
      )}

      <FormField
        id="learningGoals"
        label="What do you want to achieve with this course?"
        required
        hint="A sentence or two is enough, for example the skills or role you are working towards."
        error={errors.learningGoals}
      >
        <Textarea
          value={formData.learningGoals}
          onChange={(event) => updateFormData({ learningGoals: event.target.value })}
          rows={4}
          maxLength={1000}
        />
      </FormField>

      <fieldset>
        <legend className="text-sm font-medium text-foreground">Preferred learning schedule</legend>
        <p className="mt-1 text-sm text-muted-foreground">Let us know when you would prefer to study.</p>
        <RadioGroup
          value={formData.preferredSchedule}
          onValueChange={(value) => updateFormData({ preferredSchedule: value })}
          className="mt-3 grid gap-3 sm:grid-cols-2"
        >
          {SCHEDULES.map((option) => {
            const checked = formData.preferredSchedule === option.value
            return (
              <Label
                key={option.value}
                htmlFor={`schedule-${option.value}`}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-4 font-normal transition-colors duration-150",
                  checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                )}
              >
                <RadioGroupItem value={option.value} id={`schedule-${option.value}`} />
                <option.icon className="size-5 text-muted-foreground" aria-hidden="true" />
                <span>
                  <span className="block font-medium text-foreground">{option.label}</span>
                  <span className="block text-sm text-muted-foreground">{option.description}</span>
                </span>
              </Label>
            )
          })}
        </RadioGroup>
      </fieldset>
    </div>
  )
}
