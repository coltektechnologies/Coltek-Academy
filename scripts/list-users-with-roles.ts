import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase-config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listUsers() {
  try {
    console.log('🔍 Fetching all users from Firestore...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }
    
    console.log(`\n📋 Found ${usersSnapshot.size} users:`);
    console.log('='.repeat(80));
    
    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      console.log(`
👤 User ID: ${doc.id}`);
      console.log(`   Name: ${user.displayName || 'Not set'}`);
      console.log(`   Email: ${user.email || 'Not set'}`);
      console.log(`   Role: ${user.role || 'Not set'}`);
      console.log(`   Created: ${user.createdAt?.toDate?.() || 'Unknown'}`);
      console.log('─'.repeat(40));
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    process.exit(0);
  }
}

listUsers();
