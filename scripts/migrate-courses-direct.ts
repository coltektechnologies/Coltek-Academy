import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { courses } from '../lib/data';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOH96JkHHrkxLciuFegf56QY3jHBzWuoU",
  authDomain: "coltek-academy.firebaseapp.com",
  projectId: "coltek-academy",
  storageBucket: "coltek-academy.firebasestorage.app",
  messagingSenderId: "546502300314",
  appId: "1:546502300314:web:a3bfb6016898346de78523",
  measurementId: "G-ZH4DD72FS2"
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
