import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper function to format course data
function formatCourseData(courseData: any) {
  // Handle both document snapshots and plain objects
  const data = typeof courseData.data === 'function' ? courseData.data() : courseData;
  const id = courseData.id || '';
  
  return {
    id: id,
    title: data.title || 'Untitled Course',
    slug: data.slug || id,
    description: data.description || '',
    shortDescription: data.shortDescription || data.description?.substring(0, 100) || '',
    category: data.category || 'Uncategorized',
    level: data.level || 'Beginner',
    price: typeof data.price === 'number' ? data.price : 0,
    image: data.image || '/placeholder-course.jpg',
    instructor: data.instructor || { name: 'Instructor' },
    rating: typeof data.rating === 'number' ? data.rating : 0,
    totalRatings: typeof data.totalRatings === 'number' ? data.totalRatings : 0,
    enrolledStudents: typeof data.enrolledStudents === 'number' ? data.enrolledStudents : 0,
    duration: data.duration || 0,
    isPublished: data.isPublished !== false,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const coursesRef = collection(db, 'courses');
    const snapshot = await getDocs(coursesRef);
    
    interface FirestoreCourse {
      id: string;
      title: string;
      isPublished: boolean;
      category?: string;
      level?: string;
      price?: number;
      image?: string;
      instructor?: any;
      rating?: number;
      totalRatings?: number;
      enrolledStudents?: number;
      duration?: number;
      description?: string;
      shortDescription?: string;
      slug?: string;
      createdAt?: any;
      updatedAt?: any;
    }

    const allCourses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        isPublished: data.isPublished !== false,
        category: data.category,
        level: data.level,
        price: data.price,
        image: data.image,
        instructor: data.instructor,
        rating: data.rating,
        totalRatings: data.totalRatings,
        enrolledStudents: data.enrolledStudents,
        duration: data.duration,
        description: data.description,
        shortDescription: data.shortDescription,
        slug: data.slug,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as FirestoreCourse;
    });
    
    console.log(`Total courses in Firestore: ${allCourses.length}`);
    
    const publishedCourses = allCourses.filter(course => {
      if (!course.isPublished) {
        console.log('Filtered out unpublished course:', course.id, course.title);
        return false;
      }
      return true;
    });
    
    console.log(`Published courses: ${publishedCourses.length} of ${allCourses.length}`);
    
    // Convert Firestore timestamps to ISO strings and ensure all fields are present
    const courses = publishedCourses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description || '',
      shortDescription: course.shortDescription || course.description?.substring(0, 100) || '',
      category: course.category || 'Uncategorized',
      level: course.level || 'Beginner',
      price: 150, // All courses 150 Ghana Cedis
      image: course.image || '/placeholder-course.jpg',
      instructor: course.instructor || { name: 'Instructor' },
      rating: typeof course.rating === 'number' ? course.rating : 0,
      totalRatings: typeof course.totalRatings === 'number' ? course.totalRatings : 0,
      enrolledStudents: typeof course.enrolledStudents === 'number' ? course.enrolledStudents : 0,
      duration: course.duration || 0,
      slug: course.slug || course.id,
      isPublished: course.isPublished !== false,
      lastUpdated: course.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      upcoming: ['cybersecurity-essentials', 'data-science-machine-learning'].includes(course.slug || course.id)
    }));

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
