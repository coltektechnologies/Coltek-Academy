import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore'
import { firebase } from './firebase'
import type { UserEnrollment, RegistrationFormData, Course } from './types'

export async function saveUserEnrollment(
  userId: string,
  userEmail: string,
  formData: Partial<RegistrationFormData> & { selectedCourseId?: string },
  paymentReference: string,
  paymentAmount: number,
  paymentMethod: string,
  courseIdOverride?: string
): Promise<string> {
  try {
    const courseId = courseIdOverride || formData.selectedCourseId
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const enrollmentId = `enrollment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get course details from Firestore
    const courseDoc = await getDoc(doc(firebase.db, 'courses', courseId));
    if (!courseDoc.exists()) {
      throw new Error(`Selected course not found (id: ${courseId})`);
    }
    const selectedCourse = { id: courseDoc.id, ...courseDoc.data() } as Course;
    
    const enrollmentData: UserEnrollment = {
      id: enrollmentId,
      userId,
      userEmail,
      courseId,
      courseTitle: selectedCourse.title,
      enrollmentDate: new Date(),
      paymentReference,
      paymentAmount,
      paymentMethod,
      status: 'active',
      personalInfo: {
        firstName: formData.firstName ?? '',
        lastName: formData.lastName ?? '',
        email: formData.email ?? userEmail,
        phone: formData.phone ?? '',
      },
      education: {
        highestEducation: formData.highestEducation ?? '',
        fieldOfStudy: formData.fieldOfStudy ?? '',
        currentOccupation: formData.currentOccupation ?? '',
        yearsOfExperience: formData.yearsOfExperience ?? '',
      },
      courseDetails: {
        learningGoals: formData.learningGoals ?? '',
        preferredSchedule: formData.preferredSchedule ?? 'weekdays',
      },
    }

    // Save to Firestore
    await setDoc(doc(firebase.db, 'enrollments', enrollmentId), {
      ...enrollmentData,
      enrollmentDate: enrollmentData.enrollmentDate.toISOString(), // Convert Date to string for Firestore
    })

    console.log('Enrollment saved successfully:', enrollmentId)
    return enrollmentId
  } catch (error) {
    console.error('Error saving enrollment:', error)
    if (error instanceof Error) throw error
    throw new Error('Failed to save enrollment data')
  }
}

export async function getUserEnrollments(userId: string): Promise<UserEnrollment[]> {
  try {
    const q = query(collection(firebase.db, 'enrollments'), where('userId', '==', userId))
    const querySnapshot = await getDocs(q)

    const enrollments: UserEnrollment[] = []
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data()
      enrollments.push({
        ...data,
        enrollmentDate: parseEnrollmentDate(data.enrollmentDate),
      } as UserEnrollment)
    })

    return enrollments
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    throw new Error('Failed to fetch enrollment data')
  }
}

export function parseEnrollmentDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date(0)
}

/** All course registrations (admin UI). Requires Firestore read access for each enrollment doc. */
export async function getAllEnrollments(): Promise<UserEnrollment[]> {
  const querySnapshot = await getDocs(collection(firebase.db, 'enrollments'))
  const enrollments: UserEnrollment[] = []
  querySnapshot.forEach((d) => {
    const data = d.data()
    enrollments.push({
      ...data,
      id: d.id,
      enrollmentDate: parseEnrollmentDate(data.enrollmentDate),
    } as UserEnrollment)
  })
  enrollments.sort((a, b) => b.enrollmentDate.getTime() - a.enrollmentDate.getTime())
  return enrollments
}

export async function checkUserEnrollment(userId: string, courseId: string): Promise<boolean> {
  try {
    const q = query(
      collection(firebase.db, 'enrollments'),
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      where('status', '==', 'active')
    )
    const querySnapshot = await getDocs(q)

    return !querySnapshot.empty
  } catch (error) {
    console.error('Error checking enrollment:', error)
    return false
  }
}