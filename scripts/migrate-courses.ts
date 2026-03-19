import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { courses } from '../lib/data';
import type { Course } from '../lib/types';

// Initialize Firebase with your config
const firebaseConfig = {
  // Your Firebase config here (same as in lib/firebase.ts)
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to clean and prepare course data for Firestore
function prepareCourseForFirestore(course: Course): any {
  try {
    // Create a clean object with only the properties we want to save
    const cleanCourse: Record<string, any> = {
      title: String(course.title || ''),
      slug: String(course.slug || '').toLowerCase().replace(/\s+/g, '-'),
      description: String(course.description || ''),
      fullDescription: String(course.fullDescription || ''),
      image: String(course.image || ''),
      category: String(course.category || 'General'),
      level: ['Beginner', 'Intermediate', 'Advanced'].includes(course.level) 
        ? course.level 
        : 'Beginner',
      duration: String(course.duration || 'Self-paced'),
      price: Number(course.price) || 0,
      instructor: {
        name: String(course.instructor?.name || 'Instructor'),
        bio: String(course.instructor?.bio || ''),
        avatar: String(course.instructor?.avatar || '')
      },
      curriculum: Array.isArray(course.curriculum) 
        ? course.curriculum.map(mod => ({
            module: String(mod.module || ''),
            lessons: Array.isArray(mod.lessons) 
              ? mod.lessons.map(lesson => String(lesson || ''))
              : []
          }))
        : [],
      whatYouLearn: Array.isArray(course.whatYouLearn) 
        ? course.whatYouLearn.map(item => String(item || ''))
        : [],
      prerequisites: Array.isArray(course.prerequisites) 
        ? course.prerequisites.map(item => String(item || ''))
        : [],
      enrolledStudents: Math.max(0, Number(course.enrolledStudents) || 0),
      rating: Math.min(5, Math.max(0, Number(course.rating) || 0)),
      reviewCount: Math.max(0, Number(course.reviewCount) || 0),
      language: String(course.language || 'English'),
      lastUpdated: course.lastUpdated || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Remove any undefined or null values
    Object.keys(cleanCourse).forEach(key => {
      if (cleanCourse[key] === undefined || cleanCourse[key] === null) {
        delete cleanCourse[key];
      }
    });

    // Log the prepared data for debugging
    console.log('Prepared course data:', JSON.stringify(cleanCourse, null, 2));
    return cleanCourse;
  } catch (error) {
    console.error('Error preparing course data:', error);
    throw error;
  }
}

async function migrateCourses() {
  try {
    console.log('Initializing Firestore...');
    const coursesCollection = collection(db, 'courses');
    
    console.log(`\n=== Starting migration of ${courses.length} courses ===`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      console.log(`\n[${i + 1}/${courses.length}] Processing: ${course.title} (ID: ${course.id})`);
      
      try {
        // Validate course ID
        if (!course.id || typeof course.id !== 'string') {
          throw new Error(`Invalid course ID: ${course.id}`);
        }
        
        // Prepare course data
        console.log('Preparing course data...');
        const courseData = prepareCourseForFirestore(course);
        
        // Add to Firestore with the course's ID as the document ID
        console.log('Saving to Firestore...');
        const docRef = doc(coursesCollection, course.id);
        await setDoc(docRef, courseData, { merge: true });
        
        console.log(`✅ Successfully added/updated: ${course.title}`);
        successCount++;
        
        // Add a small delay between operations
        if (i < courses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error(`❌ Error processing course ${course.title}:`, error);
        errorCount++;
        
        // If we hit a critical error, log and continue with next course
        console.log('Continuing with next course...');
      }
    }
    
    console.log(`\nMigration complete!`);
    console.log(`✅ Successfully migrated: ${successCount} courses`);
    if (errorCount > 0) {
      console.log(`❌ Failed to migrate: ${errorCount} courses`);
    }
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
  } finally {
    process.exit(0);
  }
}

migrateCourses();
