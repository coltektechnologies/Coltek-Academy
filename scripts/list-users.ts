import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
const db = getFirestore(app);

async function listUsers() {
  try {
    console.log('Fetching users from Firestore...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }
    
    console.log('\n=== USERS ===');
    usersSnapshot.forEach((doc) => {
      console.log('\nUser ID:', doc.id);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });
    
    console.log('\nTotal users:', usersSnapshot.size);
  } catch (error) {
    console.error('Error listing users:', error);
  }
}

// Run the function
listUsers().catch(console.error);
