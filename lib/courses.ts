import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Course } from './types';

export async function getAllCourses(): Promise<Course[]> {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, orderBy('title'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Course));
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
    return { id: courseDoc.id, ...courseDoc.data() } as Course;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}
