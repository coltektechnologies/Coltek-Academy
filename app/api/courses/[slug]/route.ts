import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
      const courseDoc = await getDoc(doc(db, 'courses', slug));
      if (courseDoc.exists()) {
        const data = courseDoc.data();
        const courseSlug = data.slug || courseDoc.id;
        return NextResponse.json({ id: courseDoc.id, ...data, price: 150, upcoming: ['cybersecurity-essentials', 'data-science-machine-learning'].includes(courseSlug) });
      }
    } catch (error) {
      console.log('Document not found by ID, trying slug query...');
    }

    // If not found by ID, try to find by slug field
    const coursesRef = collection(db, 'courses');
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
    const courseSlug = data.slug || courseDoc.id;
    const courseData = { id: courseDoc.id, ...data, price: 150, upcoming: ['cybersecurity-essentials', 'data-science-machine-learning'].includes(courseSlug) };

    return NextResponse.json(courseData);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
