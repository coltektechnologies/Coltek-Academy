"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { CreditCard, Building, Wallet, Loader2 } from "lucide-react"
import { courses } from "@/lib/data"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { saveUserEnrollment } from "@/lib/enrollment"
import type { RegistrationFormData } from "@/lib/types"

// Paystack type declarations
interface PaystackTransaction {
  key: string
  email: string
  amount: number
  currency: string
  ref: string
  metadata?: Record<string, any>
  callback: (response: any) => void
  onClose: () => void
}

// Paystack type declarations
declare global {
  interface Window {
    PaystackPop?: any
  }
}

interface StepPaymentProps {
  formData: RegistrationFormData
  updateFormData: (data: Partial<RegistrationFormData>) => void
  errors: Record<string, string>
  onPaymentSuccess?: () => void
}

export function StepPayment({ formData, updateFormData, errors, onPaymentSuccess }: StepPaymentProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const selectedCourse = courses.find((c) => c.id === formData.selectedCourseId)

  const handleFreeEnrollment = async () => {
    if (!selectedCourse || !user) return
    
    setIsProcessing(true)
    
    try {
      const paymentReference = `FREE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Save to Firebase using the existing saveUserEnrollment function
      await saveUserEnrollment(
        user.uid,
        user.email || '',
        formData,
        paymentReference,
        0, // paymentAmount
        'free' // paymentMethod
      )
      
      // Call success callback
      if (onPaymentSuccess) {
        onPaymentSuccess()
      }
      
    } catch (error) {
      console.error('Free enrollment error:', error)
      toast({
        title: "Enrollment Error",
        description: error instanceof Error ? error.message : "An error occurred during enrollment. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const handlePaystackPayment = async () => {
    if (!selectedCourse || !user) return
    
    // Handle free courses
    if (selectedCourse.price <= 0) {
      return handleFreeEnrollment()
    }

    // Check if user has an email (required for Paystack)
    if (!user.email) {
      toast({
        title: "Email Required",
        description: "An email address is required to process payments. Please update your profile.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Store course info for callback handling
      localStorage.setItem('selectedCourseId', selectedCourse.id)
      localStorage.setItem('selectedCourseTitle', selectedCourse.title)
      localStorage.setItem('registrationFormData', JSON.stringify(formData))

      console.log('Initializing payment with Paystack...')

      // Initialize transaction server-side
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: selectedCourse.price,
          courseId: selectedCourse.id,
          courseTitle: selectedCourse.title,
          userId: user.uid,
          userEmail: user.email,
        }),
      })

      const data = await response.json()
      console.log('Paystack initialize API response:', { status: response.status, data })

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to initialize payment'
        console.error('Payment initialization failed:', { status: response.status, errorMessage, details: data })
        throw new Error(`${errorMessage}${data.details ? ` (${JSON.stringify(data.details)})` : ''}`)
      }

      console.log('Paystack initialization successful:', data)

      // Redirect to Paystack checkout
      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url
      } else {
        throw new Error('No authorization URL received from Paystack')
      }

    } catch (error) {
      console.error('Payment initialization error:', error)
      setIsProcessing(false)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "An error occurred while processing payment. Please try again.",
        variant: "destructive",
      })
    }
  }

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
              Paystack (Credit / Debit Card)
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

      {/* Paystack Payment Button */}
      {formData.paymentMethod === "credit-card" && (
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handlePaystackPayment}
            disabled={isProcessing || !formData.agreeToTerms || !selectedCourse}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {selectedCourse && selectedCourse.price > 0 ? 'Processing Payment...' : 'Completing Enrollment...'}
              </>
            ) : (
              selectedCourse && (selectedCourse.price > 0 
                ? `Pay ₦${selectedCourse.price} with Paystack` 
                : 'Enroll for Free')
            )}
          </Button>
        </div>
      )}

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
          <strong className="text-foreground">Note:</strong> Payment processing is handled securely through Paystack.
          {process.env.NEXT_PUBLIC_MOCK_PAYSTACK === 'true' ? ' Currently in development mode with mock payments.' : ' Test payments will not charge your card. For production, use live keys.'}
        </p>
        {process.env.NEXT_PUBLIC_MOCK_PAYSTACK === 'true' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <strong className="text-blue-800">Development Mode:</strong>
            <p className="text-blue-700 mt-1">
              Mock payments enabled. Clicking "Pay Now" will simulate a successful payment without contacting Paystack.
            </p>
          </div>
        )}
        {process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.startsWith('pk_test') && !process.env.NEXT_PUBLIC_MOCK_PAYSTACK && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <strong className="text-yellow-800">Test Mode:</strong>
            <p className="text-yellow-700 mt-1">
              Use these test card details:
              <br />• Card: 4084084084084081
              <br />• Expiry: Any future date (MM/YY)
              <br />• CVV: 408
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
