import { getAdminDb } from '@/lib/admin-db';

/**
 * Count unique enrolled users per course from the `enrollments` collection.
 * Cancelled enrollments are excluded. This is the only supported source for
 * "students enrolled" figures shown to visitors.
 *
 * Enrollments are private under the Firestore rules, so this runs on the server
 * through Firebase Admin. If Admin is unavailable the counts are empty (pages still render).
 */
export async function getEnrolledStudentCounts(): Promise<Map<string, number>> {
  let snapshot;
  try {
    snapshot = await getAdminDb().collection('enrollments').get();
  } catch (error) {
    console.error('[enrollment-counts] Firebase Admin read failed', error);
    return new Map();
  }
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
