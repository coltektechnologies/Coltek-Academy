import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: any;
  lastSignIn?: any;
};

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
const db = getFirestore(app);

function formatDate(timestamp: any): string {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString();
}

async function listUsers() {
  try {
    console.log('\n🔍 Fetching users from Firestore...\n');
    
    // Query users collection, ordered by creation date
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }
    
    // Process users
    const users: User[] = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email || 'No email',
        name: userData.name || 'No name',
        role: userData.role || 'user',
        createdAt: userData.createdAt,
        lastSignIn: userData.lastSignIn
      });
    });
    
    // Calculate column widths
    const idWidth = Math.max('User ID'.length, ...users.map(u => u.id.length)) + 2;
    const emailWidth = Math.max('Email'.length, ...users.map(u => u.email?.length || 0)) + 2;
    const nameWidth = Math.max('Name'.length, ...users.map(u => u.name?.length || 0)) + 2;
    const roleWidth = Math.max('Role'.length, ...users.map(u => (u.role || '').length)) + 2;
    const dateWidth = 20; // Fixed width for dates
    
    // Print table header
    const header = [
      'User ID'.padEnd(idWidth),
      'Email'.padEnd(emailWidth),
      'Name'.padEnd(nameWidth),
      'Role'.padEnd(roleWidth),
      'Created At'.padEnd(dateWidth),
      'Last Sign In'.padEnd(dateWidth)
    ].join(' | ');
    
    console.log(header);
    console.log('-'.repeat(header.length));
    
    // Print each user
    users.forEach(user => {
      const row = [
        user.id.padEnd(idWidth),
        (user.email || '').padEnd(emailWidth),
        (user.name || '').padEnd(nameWidth),
        (user.role || 'user').padEnd(roleWidth),
        formatDate(user.createdAt).padEnd(dateWidth),
        formatDate(user.lastSignIn).padEnd(dateWidth)
      ].join(' | ');
      
      // Highlight admin users
      if (user.role === 'admin') {
        console.log(`\x1b[33m${row}\x1b[0m`); // Yellow color for admin
      } else {
        console.log(row);
      }
    });
    
    // Print summary
    const roleCounts = users.reduce((acc, user) => {
      const role = user.role || 'user';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📊 Summary:');
    console.log(`- Total users: ${users.length}`);
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`- ${role.charAt(0).toUpperCase() + role.slice(1)}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
listUsers().catch(console.error);
