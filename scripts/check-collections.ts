import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Initialize Firebase with your config
const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listCollections() {
  try {
    console.log('Available collections:');
    const collections = await getDocs(collection(db, '/'));
    collections.forEach(collection => {
      console.log(`- ${collection.id}`);
    });
  } catch (error) {
    console.error('Error listing collections:', error);
  }
}

listCollections();
