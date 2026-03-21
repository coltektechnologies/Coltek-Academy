import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { courses } from '../lib/data';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin credentials (from env - never hardcode)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  process.exit(1);
}

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
