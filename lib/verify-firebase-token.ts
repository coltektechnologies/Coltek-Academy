import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

/**
 * Verify a Firebase ID token on the server (Admin SDK).
 * Set FIREBASE_SERVICE_ACCOUNT_KEY to the JSON string of your service account,
 * or use application default credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS).
 */
export async function verifyFirebaseIdToken(idToken: string) {
  if (getApps().length === 0) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (json) {
      initializeApp({
        credential: cert(JSON.parse(json)),
      })
    } else {
      try {
        initializeApp({ credential: applicationDefault() })
      } catch {
        throw new Error(
          'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or GOOGLE_APPLICATION_CREDENTIALS.'
        )
      }
    }
  }
  return getAuth().verifyIdToken(idToken)
}
