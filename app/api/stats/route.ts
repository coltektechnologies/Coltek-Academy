import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { firebase, isFirebaseConfigured } from '@/lib/firebase';

/**
 * Public homepage statistics, computed live from Firestore.
 * - studentsEnrolled: unique users with at least one non-cancelled enrollment
 * - coursesAvailable: published courses
 * - certificatesIssued: certificates with status "issued"
 * - graduates: unique users holding at least one issued certificate
 */
export async function GET() {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: 'Firebase is not configured' }, { status: 503 });
  }

  try {
    const [enrollments, courses, certificates] = await Promise.all([
      getDocs(collection(firebase.db, 'enrollments')),
      getDocs(collection(firebase.db, 'courses')),
      getDocs(collection(firebase.db, 'certificates')),
    ]);

    const students = new Set<string>();
    enrollments.docs.forEach((doc) => {
      const data = doc.data();
      if (String(data.status || '').toLowerCase() === 'cancelled') return;
      const userId = data.userId || data.userEmail;
      if (userId) students.add(String(userId).trim());
    });

    const coursesAvailable = courses.docs.filter((doc) => doc.data().isPublished === true).length;

    const graduates = new Set<string>();
    let certificatesIssued = 0;
    certificates.docs.forEach((doc) => {
      const data = doc.data();
      if (String(data.status || '').toLowerCase() !== 'issued') return;
      certificatesIssued++;
      const userId = data.userId || data.userEmail;
      if (userId) graduates.add(String(userId).trim());
    });

    return NextResponse.json(
      {
        studentsEnrolled: students.size,
        coursesAvailable,
        certificatesIssued,
        graduates: graduates.size,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (error) {
    console.error('Error computing stats:', error);
    return NextResponse.json({ error: 'Failed to load statistics' }, { status: 500 });
  }
}
