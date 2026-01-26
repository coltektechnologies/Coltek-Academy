import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function checkCourses() {
  try {
    console.log('Fetching all courses from Firestore...');
    const coursesRef = collection(db, 'courses');
    const snapshot = await getDocs(coursesRef);
    
    console.log(`Found ${snapshot.size} courses in the database:`);
    
    if (snapshot.empty) {
      console.log('No courses found in the database.');
      // If no courses found, suggest creating a sample course
      console.log('\nTo create a sample course, run:');
      console.log('npx ts-node scripts/add-sample-course.ts');
      return;
    }
    
    snapshot.forEach((doc) => {
      console.log('\nCourse ID:', doc.id);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });
    
  } catch (error) {
    console.error('Error checking courses:', error);
  } finally {
    process.exit(0);
  }
}

checkCourses();
