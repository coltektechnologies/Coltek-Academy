import { collection, getDocs } from 'firebase/firestore';
import { firebase } from '@/lib/firebase';

/**
 * Count unique enrolled users per course from the `enrollments` collection.
 * Cancelled enrollments are excluded. This is the only supported source for
 * "students enrolled" figures shown to visitors.
 */
export async function getEnrolledStudentCounts(): Promise<Map<string, number>> {
  const snapshot = await getDocs(collection(firebase.db, 'enrollments'));
  const usersByCourse = new Map<string, Set<string>>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const status = String(data.status || '').toLowerCase();
    const courseId = data.courseId || data.courseDetails?.courseId || data.course?.id;
    const userId = data.userId || data.userEmail || doc.id;

    if (!courseId || !userId || status === 'cancelled') {
      return;
    }

    const normalizedCourseId = String(courseId).trim();
    if (!usersByCourse.has(normalizedCourseId)) {
      usersByCourse.set(normalizedCourseId, new Set<string>());
    }
    usersByCourse.get(normalizedCourseId)?.add(String(userId).trim());
  });

  const counts = new Map<string, number>();
  usersByCourse.forEach((users, courseId) => counts.set(courseId, users.size));
  return counts;
}
