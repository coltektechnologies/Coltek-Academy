import { DocumentData } from 'firebase/firestore';

export interface Instructor {
  id?: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  role?: string;
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'download' | 'assignment';
  url: string;
  duration?: number;
  isPreview: boolean;
}

export interface CourseSection {
  id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  resources?: CourseResource[];
}

export interface CourseReview {
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CompletionCriteria {
  minProgress: number;
  minQuizScore?: number;
  requireAssignment?: boolean;
}

export interface AccessRules {
  requiresApproval: boolean;
  allowedUsers?: string[];
  startDate?: string;
  endDate?: string;
}

export interface Course extends DocumentData {
  // Core Course Information
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  learningObjectives: string[];
  requirements: string[];
  targetAudience: string[];
  
  // Course Metadata
  category: string;
  subCategory: string;
  tags: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  language: string;
  duration: number;
  
  // Pricing & Enrollment
  price: number;
  originalPrice: number;
  isFree: boolean;
  hasDiscount: boolean;
  enrolledStudents: number;
  maxStudents?: number;
  
  // Media
  image: string;
  previewVideo?: string;
  thumbnail?: string;
  
  // Status & Visibility
  isPublished: boolean;
  isFeatured: boolean;
  isApproved: boolean;
  certificateIncluded: boolean;
  
  // Instructor Information
  instructor: Instructor;
  coInstructors?: Instructor[];
  
  // Course Content
  curriculum: CourseSection[];
  
  // Reviews & Ratings
  rating: number;
  totalRatings: number;
  reviews?: CourseReview[];
  
  // System Fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  version: number;
  
  // SEO & Marketing
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  
  // Completion & Certification
  completionCriteria?: CompletionCriteria;
  certificateTemplate?: string;
  
  // Advanced Settings
  accessType: 'public' | 'private' | 'subscription';
  accessRules?: AccessRules;
  
  // Analytics
  views: number;
  completionRate?: number;
  averageTimeToComplete?: number;
  
  // Additional Features
  hasForum: boolean;
  hasLiveSessions: boolean;
  hasQASection: boolean;
  
  // Custom Fields
  customFields?: Record<string, any>;
}

// Form data type that extends Course but makes some fields optional for the form
export type CourseFormData = Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'version' | 'views'> & {
  id?: string;
  imageFile?: File | null;
  imagePreview?: string;
};
