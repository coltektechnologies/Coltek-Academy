import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

async function addSampleCourse() {
  try {
    const coursesRef = collection(db, 'courses');
    
    const courseData = {
      title: 'Introduction to Web Development',
      description: 'Learn the basics of web development with HTML, CSS, and JavaScript',
      duration: '8 weeks',
      level: 'Beginner',
      enrolledStudents: [],
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(coursesRef, courseData);
    console.log('Course added with ID: ', docRef.id);
    process.exit(0);
  } catch (error) {
    console.error('Error adding course: ', error);
    process.exit(1);
  }
}

addSampleCourse();
