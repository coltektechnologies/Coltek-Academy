import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

async function createAdminUser(email: string, password: string) {
  try {
    console.log('Creating admin user...');
    
    // Create the user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Add admin role to Firestore
    await setDoc(doc(db, 'adminUsers', user.uid), {
      uid: user.uid,
      email: user.email,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Admin user created successfully!');
    console.log(`UID: ${user.uid}`);
    
    // Sign in the new admin user
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Successfully signed in as admin');
    
    return user.uid;
  } catch (error: any) {  // Using 'any' type for Firebase Auth error
    if (error.code === 'auth/email-already-in-use') {
      console.log('User already exists, signing in...');
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Successfully signed in as admin');
        return userCredential.user.uid;
      } catch (signInError: any) {
        console.error('Error signing in:', signInError.message);
        throw signInError;
      }
    }
    console.error('Error creating admin user:', error.message);
    throw error;
  }
}

// Run with your desired admin email and password
const ADMIN_EMAIL = 'admin@coltekacademy.com';
const ADMIN_PASSWORD = '!@Password12345'; // Change this to a secure password

createAdminUser(ADMIN_EMAIL, ADMIN_PASSWORD)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
