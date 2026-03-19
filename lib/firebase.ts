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

/**
 * Lazily create Firebase so `next build` / Vercel can import this module
 * without valid NEXT_PUBLIC_* keys until a handler actually uses Firestore/Auth.
 */
function getFirebaseInstance(): Firebase {
  if (!firebaseInstance) {
    firebaseInstance = new Firebase();
  }
  return firebaseInstance;
}

/** Forward property access to the real Firestore/Auth/Storage instance (lazy init). */
function createLazyService<T extends object>(pick: (f: Firebase) => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const real = pick(getFirebaseInstance());
      const value = Reflect.get(real, prop, receiver);
      return typeof value === "function" ? (value as Function).bind(real) : value;
    },
  });
}

export const app = createLazyService((f) => f.app);
export const auth = createLazyService((f) => f.auth);
export const db = createLazyService((f) => f.db);
export const storage = createLazyService((f) => f.storage);

/** Not lazily synced; nothing in the app imports this. Use getFirebaseInstance().analytics in browser if needed. */
export const analytics: Analytics | null = null;

const firebaseDefault = {
  getInstance: getFirebaseInstance,
};
export default firebaseDefault;
