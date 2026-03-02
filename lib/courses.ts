import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Course } from './types';

export async function getAllCourses(): Promise<Course[]> {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, orderBy('title'));
    const querySnapshot = await getDocs(q);
    
    const upcomingSlugs = ['cybersecurity-essentials', 'data-science-machine-learning', 'cloud-computing-aws', 'project-management-professional'];
    const courses = querySnapshot.docs
      .filter(docSnap => docSnap.data().isPublished === true)
      .map(docSnap => {
        const data = docSnap.data();
        const slug = data.slug || docSnap.id;
        const isUpcoming = data.upcoming === true || upcomingSlugs.includes(slug);
        const price = typeof data.price === 'number' ? data.price : 0;
        return { id: docSnap.id, ...data, price, upcoming: isUpcoming } as Course;
      });
    // Current (available) courses first, upcoming courses last
    return courses.sort((a, b) => (a.upcoming === b.upcoming ? 0 : a.upcoming ? 1 : -1));
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  try {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (!courseDoc.exists()) {
      return null;
    }
    const data = courseDoc.data();
    if (data.isPublished !== true) return null;
    const slug = data.slug || courseDoc.id;
    const upcomingSlugs = ['cybersecurity-essentials', 'data-science-machine-learning', 'cloud-computing-aws', 'project-management-professional'];
    const isUpcoming = data.upcoming === true || upcomingSlugs.includes(slug);
    const price = typeof data.price === 'number' ? data.price : 0;
    return { id: courseDoc.id, ...data, price, upcoming: isUpcoming } as Course;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}
