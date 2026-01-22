import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { UserEnrollment, RegistrationFormData, Course } from './types'

export async function saveUserEnrollment(
  userId: string,
  userEmail: string,
  formData: RegistrationFormData,
  paymentReference: string,
  paymentAmount: number,
  paymentMethod: string
): Promise<string> {
  try {
    const enrollmentId = `enrollment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get course details from Firestore
    const courseDoc = await getDoc(doc(db, 'courses', formData.selectedCourseId));
    if (!courseDoc.exists()) {
      throw new Error('Selected course not found');
    }
    const selectedCourse = { id: courseDoc.id, ...courseDoc.data() } as Course;
    
    const enrollmentData: UserEnrollment = {
      id: enrollmentId,
      userId,
      userEmail,
      courseId: formData.selectedCourseId,
      courseTitle: selectedCourse.title,
      enrollmentDate: new Date(),
      paymentReference,
      paymentAmount,
      paymentMethod,
      status: 'active',
      personalInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      },
      education: {
        highestEducation: formData.highestEducation,
        fieldOfStudy: formData.fieldOfStudy,
        currentOccupation: formData.currentOccupation,
        yearsOfExperience: formData.yearsOfExperience,
      },
      courseDetails: {
        learningGoals: formData.learningGoals,
        preferredSchedule: formData.preferredSchedule,
      },
    }

    // Save to Firestore
    await setDoc(doc(db, 'enrollments', enrollmentId), {
      ...enrollmentData,
      enrollmentDate: enrollmentData.enrollmentDate.toISOString(), // Convert Date to string for Firestore
    })

    console.log('Enrollment saved successfully:', enrollmentId)
    return enrollmentId
  } catch (error) {
    console.error('Error saving enrollment:', error)
    throw new Error('Failed to save enrollment data')
  }
}

export async function getUserEnrollments(userId: string): Promise<UserEnrollment[]> {
  try {
    const q = query(collection(db, 'enrollments'), where('userId', '==', userId))
    const querySnapshot = await getDocs(q)

    const enrollments: UserEnrollment[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      enrollments.push({
        ...data,
        enrollmentDate: new Date(data.enrollmentDate), // Convert back to Date
      } as UserEnrollment)
    })

    return enrollments
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    throw new Error('Failed to fetch enrollment data')
  }
}

export async function checkUserEnrollment(userId: string, courseId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'enrollments'),
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