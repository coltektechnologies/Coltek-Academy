import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

// Run with ADMIN_EMAIL and ADMIN_PASSWORD from .env (never hardcode)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  process.exit(1);
}

createAdminUser(ADMIN_EMAIL, ADMIN_PASSWORD)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
