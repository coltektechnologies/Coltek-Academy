"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect, useState } from 'react';
import { getAllCourses } from "@/lib/courses"
import type { RegistrationFormData, Course } from "@/lib/types"

interface StepCourseSelectionProps {
  formData: RegistrationFormData
  updateFormData: (data: Partial<RegistrationFormData>) => void
  errors: Record<string, string>
  preselectedCourseId?: string
}

export function StepCourseSelection({
  formData,
  updateFormData,
  errors,
  preselectedCourseId,
}: StepCourseSelectionProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await getAllCourses();
        setCourses(coursesData);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.id === (formData.selectedCourseId || preselectedCourseId))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Course Selection</h2>
        <p className="text-muted-foreground">Choose your course and tell us about your learning goals.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="course">Select a Course *</Label>
        <Select
          value={formData.selectedCourseId || preselectedCourseId || ""}
          onValueChange={(value) => updateFormData({ selectedCourseId: value })}
        >
          <SelectTrigger className={errors.selectedCourseId ? "border-destructive" : ""}>
            <SelectValue placeholder="Choose a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title} - ${course.price}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.selectedCourseId && <p className="text-sm text-destructive">{errors.selectedCourseId}</p>}
      </div>

      {selectedCourse && (
        <div className="p-4 bg-secondary/50 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground">{selectedCourse.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{selectedCourse.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{selectedCourse.duration}</span>
            <span>•</span>
            <span>{selectedCourse.level}</span>
            <span>•</span>
            <span className="font-semibold text-foreground">${selectedCourse.price}</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="learningGoals">What are your learning goals? *</Label>
        <Textarea
          id="learningGoals"
          value={formData.learningGoals}
          onChange={(e) => updateFormData({ learningGoals: e.target.value })}
          placeholder="Describe what you hope to achieve by taking this course..."
          rows={4}
          className={errors.learningGoals ? "border-destructive" : ""}
        />
        {errors.learningGoals && <p className="text-sm text-destructive">{errors.learningGoals}</p>}
      </div>

      <div className="space-y-3">
        <Label>Preferred Learning Schedule</Label>
        <RadioGroup
          value={formData.preferredSchedule}
          onValueChange={(value) => updateFormData({ preferredSchedule: value })}
          className="space-y-2"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="weekdays" id="weekdays" />
            <Label htmlFor="weekdays" className="font-normal cursor-pointer">
              Weekdays (Monday - Friday)
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="weekends" id="weekends" />
            <Label htmlFor="weekends" className="font-normal cursor-pointer">
              Weekends (Saturday - Sunday)
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="flexible" id="flexible" />
            <Label htmlFor="flexible" className="font-normal cursor-pointer">
              Flexible / Self-paced
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}
