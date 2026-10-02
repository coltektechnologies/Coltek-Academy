"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "@/components/register/form-field"
import type { RegistrationFormData } from "@/lib/types"

interface StepDetailsProps {
  formData: RegistrationFormData
  updateFormData: (data: Partial<RegistrationFormData>) => void
  errors: Record<string, string>
}

const EDUCATION_LEVELS = [
  { value: "high-school", label: "High School" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "other", label: "Other" },
]

const EXPERIENCE = [
  { value: "0-1", label: "Less than 1 year" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5-10", label: "5–10 years" },
  { value: "10+", label: "10+ years" },
]

const groupClasses = "space-y-5 rounded-xl border border-border p-5 sm:p-6"
const legendClasses = "px-1 text-base font-semibold text-foreground"

/** Step 2: personal details and educational background (same fields as before, grouped on one step). */
export function StepDetails({ formData, updateFormData, errors }: StepDetailsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Your details</h2>
        <p className="mt-1 text-muted-foreground">We use these to set up your enrollment and contact you about your course.</p>
      </div>

      <fieldset className={groupClasses}>
        <legend className={legendClasses}>About you</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="firstName" label="First name" required error={errors.firstName}>
            <Input
              autoComplete="given-name"
              value={formData.firstName}
              onChange={(event) => updateFormData({ firstName: event.target.value })}
            />
          </FormField>
          <FormField id="lastName" label="Last name" required error={errors.lastName}>
            <Input
              autoComplete="family-name"
              value={formData.lastName}
              onChange={(event) => updateFormData({ lastName: event.target.value })}
            />
          </FormField>
        </div>
        <FormField
          id="email"
          label="Email address"
          required
          hint="Your enrollment confirmation is sent to your account email."
          error={errors.email}
        >
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            value={formData.email}
            onChange={(event) => updateFormData({ email: event.target.value })}
          />
        </FormField>
        <FormField id="phone" label="Phone number" hint="For example 024 123 4567 or +233 24 123 4567." error={errors.phone}>
          <Input
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={formData.phone}
            onChange={(event) => updateFormData({ phone: event.target.value })}
          />
        </FormField>
      </fieldset>

      <fieldset className={groupClasses}>
        <legend className={legendClasses}>Your background</legend>
        <p className="-mt-2 text-sm text-muted-foreground">This helps us understand where you are starting from.</p>
        <FormField id="highestEducation" label="Highest education level" required error={errors.highestEducation}>
          {(controlProps) => (
            <Select value={formData.highestEducation} onValueChange={(value) => updateFormData({ highestEducation: value })}>
              <SelectTrigger {...controlProps} className="w-full">
                <SelectValue placeholder="Select your education level" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="fieldOfStudy" label="Field of study">
            <Input
              value={formData.fieldOfStudy}
              onChange={(event) => updateFormData({ fieldOfStudy: event.target.value })}
              placeholder="e.g. Computer Science"
            />
          </FormField>
          <FormField id="currentOccupation" label="Current occupation">
            <Input
              autoComplete="organization-title"
              value={formData.currentOccupation}
              onChange={(event) => updateFormData({ currentOccupation: event.target.value })}
              placeholder="e.g. Student"
            />
          </FormField>
        </div>
        <FormField id="yearsOfExperience" label="Years of professional experience">
          {(controlProps) => (
            <Select value={formData.yearsOfExperience} onValueChange={(value) => updateFormData({ yearsOfExperience: value })}>
              <SelectTrigger {...controlProps} className="w-full">
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </fieldset>
    </div>
  )
}
