"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RegistrationFormData } from "@/lib/types"

interface StepEducationProps {
  formData: RegistrationFormData
  updateFormData: (data: Partial<RegistrationFormData>) => void
  errors: Record<string, string>
}

export function StepEducation({ formData, updateFormData, errors }: StepEducationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Educational Background</h2>
        <p className="text-muted-foreground">Help us understand your background to recommend the right courses.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="highestEducation">Highest Education Level *</Label>
        <Select
          value={formData.highestEducation}
          onValueChange={(value) => updateFormData({ highestEducation: value })}
        >
          <SelectTrigger className={errors.highestEducation ? "border-destructive" : ""}>
            <SelectValue placeholder="Select education level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high-school">High School</SelectItem>
            <SelectItem value="associate">Associate Degree</SelectItem>
            <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
            <SelectItem value="master">Master&apos;s Degree</SelectItem>
            <SelectItem value="doctorate">Doctorate</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.highestEducation && <p className="text-sm text-destructive">{errors.highestEducation}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fieldOfStudy">Field of Study</Label>
        <Input
          id="fieldOfStudy"
          value={formData.fieldOfStudy}
          onChange={(e) => updateFormData({ fieldOfStudy: e.target.value })}
          placeholder="e.g., Computer Science, Business, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentOccupation">Current Occupation</Label>
        <Input
          id="currentOccupation"
          value={formData.currentOccupation}
          onChange={(e) => updateFormData({ currentOccupation: e.target.value })}
          placeholder="e.g., Software Developer, Student, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="yearsOfExperience">Years of Professional Experience</Label>
        <Select
          value={formData.yearsOfExperience}
          onValueChange={(value) => updateFormData({ yearsOfExperience: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-1">Less than 1 year</SelectItem>
            <SelectItem value="1-3">1-3 years</SelectItem>
            <SelectItem value="3-5">3-5 years</SelectItem>
            <SelectItem value="5-10">5-10 years</SelectItem>
            <SelectItem value="10+">10+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
