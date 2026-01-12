"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditCard, Building, Wallet } from "lucide-react"
import { courses } from "@/lib/data"
import type { RegistrationFormData } from "@/lib/types"

interface StepPaymentProps {
  formData: RegistrationFormData
  updateFormData: (data: Partial<RegistrationFormData>) => void
  errors: Record<string, string>
}

export function StepPayment({ formData, updateFormData, errors }: StepPaymentProps) {
  const selectedCourse = courses.find((c) => c.id === formData.selectedCourseId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Payment Information</h2>
        <p className="text-muted-foreground">Complete your registration by selecting a payment method.</p>
      </div>

      {/* Order Summary */}
      {selectedCourse && (
        <div className="p-6 bg-secondary/50 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-4">Order Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{selectedCourse.title}</span>
              <span className="font-medium text-foreground">${selectedCourse.price}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-foreground text-xl">${selectedCourse.price}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="space-y-3">
        <Label>Payment Method *</Label>
        <RadioGroup
          value={formData.paymentMethod}
          onValueChange={(value) => updateFormData({ paymentMethod: value })}
          className="space-y-3"
        >
          <div
            className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === "credit-card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            <RadioGroupItem value="credit-card" id="credit-card" />
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="credit-card" className="font-normal cursor-pointer flex-1">
              Credit / Debit Card
            </Label>
          </div>
          <div
            className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === "bank-transfer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            <RadioGroupItem value="bank-transfer" id="bank-transfer" />
            <Building className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="bank-transfer" className="font-normal cursor-pointer flex-1">
              Bank Transfer
            </Label>
          </div>
          <div
            className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === "paypal" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            <RadioGroupItem value="paypal" id="paypal" />
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="paypal" className="font-normal cursor-pointer flex-1">
              PayPal
            </Label>
          </div>
        </RadioGroup>
        {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod}</p>}
      </div>

      {/* Terms Agreement */}
      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => updateFormData({ agreeToTerms: checked as boolean })}
            className="mt-1"
          />
          <Label htmlFor="terms" className="font-normal leading-relaxed cursor-pointer">
            I agree to the{" "}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            . I understand that my enrollment is subject to the course availability and refund policy.
          </Label>
        </div>
        {errors.agreeToTerms && <p className="text-sm text-destructive">{errors.agreeToTerms}</p>}
      </div>

      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> This is a demo registration form. No actual payment will be
          processed. In production, this would integrate with a payment processor like Stripe.
        </p>
      </div>
    </div>
  )
}
