import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { courses } from '../lib/data';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOH96JkHHrkxLciuFegf56QY3jHBzWuoU",
  authDomain: "coltek-academy.firebaseapp.com",
  projectId: "coltek-academy",
  storageBucket: "coltek-academy.firebasestorage.app",
  messagingSenderId: "546502300314",
  appId: "1:546502300314:web:a3bfb6016898346de78523"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin credentials
const ADMIN_EMAIL = 'admin@coltekacademy.com';
const ADMIN_PASSWORD = '!@Password12345';

async function migrateCourses() {
  try {
    console.log('Signing in as admin...');
    
    // Sign in as admin
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Successfully signed in as admin');
    
    const batchSize = 5;
    console.log(`\nStarting migration of ${courses.length} courses...`);
    
    for (let i = 0; i < courses.length; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, courses.length);
      console.log(`\nProcessing batch ${i / batchSize + 1} (${i + 1}-${batchEnd} of ${courses.length})`);
      
      const batchPromises = [];
      
      for (let j = i; j < batchEnd; j++) {
        const course = courses[j];
        console.log(`Preparing: ${course.title}`);
        
        const courseData = {
          ...course,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = doc(collection(db, 'courses'), course.id);
        batchPromises.push(
          setDoc(docRef, courseData, { merge: true })
            .then(() => console.log(`✅ Success: ${course.title}`))
            .catch(error => console.error(`❌ Error with ${course.title}:`, error.message))
        );
      }
      
      await Promise.all(batchPromises);
      
      // Add delay between batches
      if (batchEnd < courses.length) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateCourses();
