import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  Auth,
} from "firebase/auth";
import { initializeFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ...(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && {
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }),
};

/** True when all required public Firebase env vars are present (Vercel / .env.local). */
export function isFirebaseConfigured(): boolean {
  const { apiKey, authDomain, projectId, appId, messagingSenderId, storageBucket } =
    firebaseConfig;
  return Boolean(
    apiKey?.trim() &&
      authDomain?.trim() &&
      projectId?.trim() &&
      appId?.trim() &&
      messagingSenderId?.trim() &&
      storageBucket?.trim()
  );
}

export const FIREBASE_SETUP_HELP =
  "Add your Firebase web app keys in Vercel: Project → Settings → Environment Variables. " +
  "Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, " +
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, and NEXT_PUBLIC_FIREBASE_APP_ID " +
  "(copy from Firebase Console → Project settings → Your apps → SDK setup). Redeploy after saving.";

class Firebase {
  public app: FirebaseApp;
  public auth: Auth;
  public db: Firestore;
  public analytics: Analytics | null = null;
  public storage: FirebaseStorage;

  constructor() {
    // Initialize Firebase
    this.app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

    // Initialize Auth with session persistence
    this.auth = getAuth(this.app);
    void this.initializeAuth();

    // Initialize Firestore with long polling for better connection handling
    this.db = initializeFirestore(this.app, {
      experimentalForceLongPolling: true,
    });

    // Initialize Storage
    this.storage = getStorage(this.app);

    // Initialize Analytics if in browser
    if (typeof window !== "undefined") {
      this.initializeAnalytics();
    }

    console.log("Firebase initialized successfully");
  }

  private async initializeAuth() {
    try {
      await setPersistence(this.auth, browserSessionPersistence);
      console.log("Using session storage for authentication");
    } catch (error) {
      console.warn(
        "Failed to use session storage, falling back to in-memory:",
        error
      );
      try {
        await setPersistence(this.auth, inMemoryPersistence);
        console.log("Using in-memory storage for authentication");
      } catch (e) {
        console.error("Failed to set up any persistence:", e);
      }
    }
  }

  private initializeAnalytics() {
    isSupported()
      .then((supported) => {
        if (supported) {
          this.analytics = getAnalytics(this.app);
        }
      })
      .catch(console.error);
  }
}

let firebaseInstance: Firebase | null = null;
let firebaseInitError: Error | null = null;

/**
 * Lazily create Firebase so `next build` / Vercel can import this module
 * without valid NEXT_PUBLIC_* keys until a handler actually uses Firestore/Auth.
 */
function getFirebaseInstance(): Firebase {
  if (firebaseInitError) {
    throw firebaseInitError;
  }
  if (!firebaseInstance) {
    if (!isFirebaseConfigured()) {
      firebaseInitError = new Error(
        `Firebase is not configured. ${FIREBASE_SETUP_HELP}`
      );
      throw firebaseInitError;
    }
    try {
      firebaseInstance = new Firebase();
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error(String(e));
      firebaseInitError = err;
      console.error("[Firebase]", err.message);
      throw firebaseInitError;
    }
  }
  return firebaseInstance;
}

/** Clear cached init error (e.g. after fixing env in dev). */
export function resetFirebaseInitError(): void {
  firebaseInitError = null;
  firebaseInstance = null;
}

/**
 * Lazy accessors returning real Firebase instances (not Proxies).
 * `collection(db, …)` requires a real Firestore — Proxies fail instanceof checks.
 */
export const firebase = {
  get app(): FirebaseApp {
    return getFirebaseInstance().app;
  },
  get auth(): Auth {
    return getFirebaseInstance().auth;
  },
  get db(): Firestore {
    return getFirebaseInstance().db;
  },
  get storage(): FirebaseStorage {
    return getFirebaseInstance().storage;
  },
};

/**
 * Named exports — use `export const` (not `export { db }`) so Turbopack lists them in `[app-route]`.
 * In Route Handlers, `import { firebase }` + `firebase.db` is the most reliable pattern.
 */
const _firebaseCoreOrNull: Firebase | null = isFirebaseConfigured()
  ? getFirebaseInstance()
  : null;

export const db: Firestore | null = _firebaseCoreOrNull?.db ?? null;
export const auth: Auth | null = _firebaseCoreOrNull?.auth ?? null;
export const storage: FirebaseStorage | null =
  _firebaseCoreOrNull?.storage ?? null;
export const app: FirebaseApp | null = _firebaseCoreOrNull?.app ?? null;

/** Not lazily synced; nothing in the app imports this. Use getFirebaseInstance().analytics in browser if needed. */
export const analytics: Analytics | null = null;

const firebaseDefault = {
  getInstance: getFirebaseInstance,
};
export default firebaseDefault;
