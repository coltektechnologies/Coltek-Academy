/**
 * Optional alias for Firestore in server code.
 * Prefer in API routes: `import { firebase } from '@/lib/firebase'` then `firebase.db`
 * (avoids Turbopack edge cases with named `db` imports in `[app-route]`).
 */
import type { Firestore } from "firebase/firestore";
import { firebase, isFirebaseConfigured } from "./firebase";

export const db: Firestore | null = isFirebaseConfigured()
  ? firebase.db
  : null;
