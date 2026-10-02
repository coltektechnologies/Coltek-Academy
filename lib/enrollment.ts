import { doc, setDoc, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore'
import { firebase } from './firebase'
import type { UserEnrollment, RegistrationFormData, Course } from './types'

/**
 * Enroll the signed-in student through the server (/api/enrollments).
 * Browsers cannot write enrollments directly (firestore.rules): the server checks the course
 * price and, for paid courses, verifies the Paystack payment before saving.
 * Pass `reference` for a paid course; omit it for a free course.
 */
export async function requestEnrollment(options: {
  courseId?: string
  reference?: string
  formData?: Partial<RegistrationFormData>
}): Promise<{ enrollmentId: string; courseTitle: string; alreadyEnrolled: boolean }> {
  const user = firebase.auth.currentUser
  if (!user) throw new Error('Please log in to complete your enrollment.')

  const idToken = await user.getIdToken()
  const response = await fetch('/api/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(options),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Enrollment could not be saved.')
  }
  return data
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

export async function createManualEnrollment(
  userId: string,
  userEmail: string,
  courseId: string,
  markCompleted: boolean
): Promise<string> {
  try {
    const enrollmentId = `enrollment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get course details from Firestore
    const courseDoc = await getDoc(doc(firebase.db, 'courses', courseId));
    if (!courseDoc.exists()) {
      throw new Error(`Selected course not found (id: ${courseId})`);
    }
    const selectedCourse = { id: courseDoc.id, ...courseDoc.data() } as Course;
    
    // Get user details
    const userDoc = await getDoc(doc(firebase.db, 'users', userId));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const firstName = userData.firstName || userData.displayName?.split(' ')[0] || '';
    const lastName = userData.lastName || userData.displayName?.split(' ').slice(1).join(' ') || '';

    const status = markCompleted ? 'completed' : 'active';

    const enrollmentData: UserEnrollment = {
      id: enrollmentId,
      userId,
      userEmail,
      courseId,
      courseTitle: selectedCourse.title,
      enrollmentDate: new Date(),
      paymentReference: 'MANUAL_ADMIN',
      paymentAmount: 0,
      paymentMethod: 'manual',
      status: status as 'active' | 'completed',
      personalInfo: {
        firstName,
        lastName,
        email: userEmail,
        phone: userData.phone || '',
      },
      education: {
        highestEducation: '',
        fieldOfStudy: '',
        currentOccupation: '',
        yearsOfExperience: '',
      },
      courseDetails: {
        learningGoals: 'Manually enrolled by Admin',
        preferredSchedule: 'weekdays',
      },
      // If completed, optionally set progress
      ...(markCompleted ? { completed: true, progress: 100 } : { completed: false, progress: 0 }),
    } as any;

    // Save to Firestore
    await setDoc(doc(firebase.db, 'enrollments', enrollmentId), {
      ...enrollmentData,
      enrollmentDate: enrollmentData.enrollmentDate.toISOString(),
    })

    console.log('Manual enrollment saved successfully:', enrollmentId)
    return enrollmentId
  } catch (error) {
    console.error('Error saving manual enrollment:', error)
    if (error instanceof Error) throw error
    throw new Error('Failed to save manual enrollment data')
  }
}

export async function updateEnrollmentStatus(enrollmentId: string, status: 'active' | 'completed' | 'cancelled'): Promise<void> {
  try {
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completed = true;
      updateData.progress = 100;
    }
    
    await updateDoc(doc(firebase.db, 'enrollments', enrollmentId), updateData);
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    throw new Error('Failed to update enrollment status');
  }
}