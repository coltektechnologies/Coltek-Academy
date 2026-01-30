export interface Instructor {
  name: string
  bio: string
  avatar: string
}

export interface CurriculumModule {
  module: string
  lessons: string[]
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string
  fullDescription: string
  image: string
  category: string
  level: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  price: number
  instructor: Instructor
  curriculum: CurriculumModule[]
  whatYouLearn: string[]
  prerequisites: string[]
  enrolledStudents: number
  rating: number
  reviewCount: number
  language: string
  lastUpdated: string
  relatedCourses?: Course[]
  // Add any other fields that might be in your database
  [key: string]: any
}

export interface RegistrationFormData {
  // Step 1: Personal Info
  firstName: string
  lastName: string
  email: string
  phone: string

  // Step 2: Educational Background
  highestEducation: string
  fieldOfStudy: string
  currentOccupation: string
  yearsOfExperience: string

  // Step 3: Course Selection
  selectedCourseId: string
  learningGoals: string
  preferredSchedule: string

  // Step 4: Payment (placeholder)
  paymentMethod: string
  agreeToTerms: boolean
}

export interface UserEnrollment {
  id: string
  userId: string
  userEmail: string
  courseId: string
  courseTitle: string
  enrollmentDate: Date
  paymentReference: string
  paymentAmount: number
  paymentMethod: string
  status: 'active' | 'completed' | 'cancelled'
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  education: {
    highestEducation: string
    fieldOfStudy: string
    currentOccupation: string
    yearsOfExperience: string
  }
  courseDetails: {
    learningGoals: string
    preferredSchedule: string
  }
}

export interface Certificate {
  id: string
  userId: string
  userEmail: string
  courseId: string
  courseTitle: string
  enrollmentId: string
  certificateNumber: string
  issueDate: Date
  completionDate: Date
  instructorName: string
  certificateUrl: string // Firebase Storage URL for PDF
  previewUrl?: string // Firebase Storage URL for preview image (optional)
  status: 'issued' | 'revoked'
  metadata: {
    templateUsed: string
    verificationCode: string
    grade?: string
  }
}
