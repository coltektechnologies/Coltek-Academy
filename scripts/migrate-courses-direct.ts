import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { courses } from '../lib/data';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateCourses() {
  try {
    console.log('Starting migration...');
    const batchSize = 5; // Process 5 courses at a time
    
    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = [];
      const batchEnd = Math.min(i + batchSize, courses.length);
      
      console.log(`\nProcessing batch ${i / batchSize + 1} (${i + 1}-${batchEnd} of ${courses.length})`);
      
      // Prepare batch
      for (let j = i; j < batchEnd; j++) {
        const course = courses[j];
        console.log(`Preparing: ${course.title}`);
        
        const courseData = {
          ...course,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        batch.push({
          ref: doc(collection(db, 'courses'), course.id),
          data: courseData
        });
      }
      
      // Write batch
      console.log('Writing batch to Firestore...');
      const writePromises = batch.map(({ ref, data }) => 
        setDoc(ref, data, { merge: true })
          .then(() => console.log(`✅ Success: ${ref.id}`))
          .catch(error => console.error(`❌ Error with ${ref.id}:`, error.message))
      );
      
      await Promise.all(writePromises);
      
      // Add delay between batches
      if (batchEnd < courses.length) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateCourses();
