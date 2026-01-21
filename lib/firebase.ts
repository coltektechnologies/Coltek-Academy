import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  Auth
} from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  Firestore
} from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBOH96JkHHrkxLciuFegf56QY3jHBzWuoU",
  authDomain: "coltek-academy.firebaseapp.com",
  projectId: "coltek-academy",
  storageBucket: "coltek-academy.firebasestorage.app",
  messagingSenderId: "546502300314",
  appId: "1:546502300314:web:a3bfb6016898346de78523",
  measurementId: "G-ZH4DD72FS2"
};

// Create a class to manage Firebase instances
class Firebase {
  private static instance: Firebase;
  public app: FirebaseApp;
  public auth: Auth;
  public db: Firestore;
  public analytics: Analytics | null = null;

  private constructor() {
    // Initialize Firebase
    this.app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize Auth
    this.auth = getAuth(this.app);
    
    // Initialize Firestore with persistence
    try {
      this.db = initializeFirestore(this.app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (error) {
      console.warn('Failed to initialize Firestore with persistent cache, falling back to memory cache:', error);
      try {
        this.db = initializeFirestore(this.app, {
          localCache: memoryLocalCache()
        });
      } catch (fallbackError) {
        console.error('Error initializing Firestore with memory cache:', fallbackError);
        this.db = getFirestore(this.app);
      }
    }

    // Set up auth persistence (client-side only)
    if (typeof window !== 'undefined') {
      const setupPersistence = async () => {
        try {
          // First try with session storage which has more quota
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
      };

      // Run persistence setup
      setupPersistence();

      // Clear any existing Firebase local storage items to free up space
      try {
        const firebaseKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('firebase:') || key?.startsWith('firebaseui::') || key?.includes('firestore')) {
            firebaseKeys.push(key);
          }
        }
        firebaseKeys.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared ${firebaseKeys.length} Firebase-related localStorage items`);
      } catch (e) {
        console.warn('Error clearing Firebase localStorage items:', e);
      }

      // Clear IndexedDB databases used by Firestore
      try {
        if ('indexedDB' in window) {
          // Delete Firestore-related IndexedDB databases
          const dbNames = ['firestore/[DEFAULT]/coltek-academy', 'firestore_clients', 'firestore_mutations'];
          dbNames.forEach(dbName => {
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            deleteRequest.onsuccess = () => console.log(`Cleared IndexedDB database: ${dbName}`);
            deleteRequest.onerror = () => console.warn(`Failed to clear IndexedDB database: ${dbName}`);
          });
        }
      } catch (e) {
        console.warn('Error clearing IndexedDB:', e);
      }

      // Initialize Analytics if supported
      isSupported().then(supported => {
        if (supported) {
          try {
            this.analytics = getAnalytics(this.app);
          } catch (e) {
            console.warn('Failed to initialize analytics:', e);
          }
        }
      });
    }
  }

  public static getInstance(): Firebase {
    if (!Firebase.instance) {
      Firebase.instance = new Firebase();
    }
    return Firebase.instance;
  }
}

// Create and export a single instance
const firebase = Firebase.getInstance();
const { app, auth, db, analytics } = firebase;

export { app, auth, db, analytics, firebase as default };
