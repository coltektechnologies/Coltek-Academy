import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { firebase } from '@/lib/firebase';
import { getEnrolledStudentCounts } from '@/lib/enrollment-counts';

// Seeded rating/review/student figures are not verified, so visitors only see real enrollment counts
async function withVerifiedStats(course: Record<string, any>) {
  const counts = await getEnrolledStudentCounts().catch(() => new Map<string, number>());
  const { rating, reviewCount, totalRatings, ...rest } = course;
  return { ...rest, enrolledStudents: counts.get(String(course.id)) || 0 };
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // Get the slug from URL
    const { searchParams } = new URL(request.url);
    const slug = params?.slug || searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Course slug is required' },
        { status: 400 }
      );
    }

    // First, try to get the course by ID (in case the slug is the document ID)
    try {
      const courseDoc = await getDoc(doc(firebase.db, 'courses', slug));
      if (courseDoc.exists()) {
        const data = courseDoc.data();
        if (data.isPublished !== true) {
          return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }
        const courseSlug = data.slug || courseDoc.id;
        const upcomingSlugs = ['cybersecurity-essentials', 'data-science-machine-learning', 'cloud-computing-aws', 'project-management-professional'];
        const isUpcoming = data.upcoming === true || upcomingSlugs.includes(courseSlug);
        const price = typeof data.price === 'number' ? data.price : 0;
        return NextResponse.json(await withVerifiedStats({ id: courseDoc.id, ...data, price, upcoming: isUpcoming }));
      }
    } catch (error) {
      console.log('Document not found by ID, trying slug query...');
    }

    // If not found by ID, try to find by slug field
    const coursesRef = collection(firebase.db, 'courses');
    const q = query(
      coursesRef,
      where('slug', '==', slug),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const courseDoc = querySnapshot.docs[0];
    const data = courseDoc.data();
    if (data.isPublished !== true) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const courseSlug = data.slug || courseDoc.id;
    const upcomingSlugs = ['cybersecurity-essentials', 'data-science-machine-learning', 'cloud-computing-aws', 'project-management-professional'];
    const isUpcoming = data.upcoming === true || upcomingSlugs.includes(courseSlug);
    const price = typeof data.price === 'number' ? data.price : 0;
    const courseData = { id: courseDoc.id, ...data, price, upcoming: isUpcoming };

    return NextResponse.json(await withVerifiedStats(courseData));
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
