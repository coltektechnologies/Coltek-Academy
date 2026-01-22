import * as admin from 'firebase-admin';
import { courses } from '../lib/data';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Firebase Admin using environment variables
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey || !process.env.FIREBASE_PROJECT_ID) {
  throw new Error('Missing required Firebase Admin environment variables');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey
  } as admin.ServiceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});

const db = admin.firestore();

async function migrateCourses() {
  try {
    console.log('Initializing Firestore Admin...');
    
    const batch = db.batch();
    const coursesRef = db.collection('courses');
    
    console.log(`\n=== Starting migration of ${courses.length} courses ===`);
    
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      console.log(`\n[${i + 1}/${courses.length}] Processing: ${course.title} (ID: ${course.id})`);
      
      try {
        // Prepare course data
        const courseData = {
          title: course.title,
          slug: course.slug,
          description: course.description,
          fullDescription: course.fullDescription,
          image: course.image,
          category: course.category,
          level: course.level,
          duration: course.duration,
          price: course.price,
          instructor: course.instructor,
          curriculum: course.curriculum,
          whatYouLearn: course.whatYouLearn,
          prerequisites: course.prerequisites,
          enrolledStudents: course.enrolledStudents || 0,
          rating: course.rating || 0,
          reviewCount: course.reviewCount || 0,
          language: course.language || 'English',
          lastUpdated: course.lastUpdated || new Date().toISOString(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Add to batch
        const docRef = coursesRef.doc(course.id);
        batch.set(docRef, courseData, { merge: true });
        
        console.log(`✅ Prepared: ${course.title}`);
        
        // Commit every 10 operations to avoid batch size limits
        if ((i + 1) % 10 === 0) {
          console.log('Committing batch...');
          await batch.commit();
          console.log('Batch committed');
        }
      } catch (error) {
        console.error(`❌ Error processing course ${course.title}:`, error);
      }
    }
    
    // Commit any remaining operations
    console.log('Committing final batch...');
    await batch.commit();
    
    console.log('\n=== Migration complete! ===');
    console.log(`Total courses processed: ${courses.length}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    // Close the connection
    await admin.app().delete();
    process.exit(0);
  }
}

// Run the migration
migrateCourses();
