import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence,
  inMemoryPersistence,
  Auth
} from "firebase/auth";
import { 
  initializeFirestore,
  Firestore
} from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBOH96JkHHrkxLciuFegf56QY3jHBzWuoU",
  authDomain: "coltek-academy.firebaseapp.com",
  projectId: "coltek-academy",
  storageBucket: "coltek-academy.firebasestorage.app",
  messagingSenderId: "546502300314",
  appId: "1:546502300314:web:a3bfb6016898346de78523",
  measurementId: "G-ZH4DD72FS2"
};

class Firebase {
  private static instance: Firebase;
  public app: FirebaseApp;
  public auth: Auth;
  public db: Firestore;
  public analytics: Analytics | null = null;
  public storage: FirebaseStorage;
  
  public static getInstance(): Firebase {
    if (!Firebase.instance) {
      Firebase.instance = new Firebase();
    }
    return Firebase.instance;
  }

  private constructor() {
    try {
      // Initialize Firebase
      this.app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      
      // Initialize Auth with session persistence
      this.auth = getAuth(this.app);
      this.initializeAuth();

      // Initialize Firestore with long polling for better connection handling
      this.db = initializeFirestore(this.app, {
        experimentalForceLongPolling: true
      });
      
      // Initialize Storage
      this.storage = getStorage(this.app);
      
      // Initialize Analytics if in browser
      if (typeof window !== 'undefined') {
        this.initializeAnalytics();
      }
      
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Firebase initialization error:", error);
      throw error;
    }
  }

  private async initializeAuth() {
    try {
      await setPersistence(this.auth, browserSessionPersistence);
      console.log('Using session storage for authentication');
    } catch (error) {
      console.warn('Failed to use session storage, falling back to in-memory:', error);
      try {
        await setPersistence(this.auth, inMemoryPersistence);
        console.log('Using in-memory storage for authentication');
      } catch (e) {
        console.error('Failed to set up any persistence:', e);
      }
    }
  }

  private initializeAnalytics() {
    isSupported().then((supported) => {
      if (supported) {
        this.analytics = getAnalytics(this.app);
      }
    }).catch(console.error);
  }
}

// Create and export a single instance
const firebase = Firebase.getInstance();
const { app, auth, db, analytics, storage } = firebase;

export { app, auth, db, analytics, storage, firebase as default };
