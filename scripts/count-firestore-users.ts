/**
 * Prints how many documents exist in Firestore `users` (app profiles).
 * Run from repo root: npx tsx scripts/count-firestore-users.ts
 */
import dotenv from "dotenv";
dotenv.config();

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function main() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_* in .env");
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snap = await getDocs(collection(db, "users"));
  console.log(`Firestore users collection: ${snap.size} document(s)`);
  console.log(`Project: ${firebaseConfig.projectId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
