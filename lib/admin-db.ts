import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getColtekFirebaseAdminApp } from '@/lib/verify-firebase-token'

/**
 * Firestore through Firebase Admin — SERVER ONLY.
 * Use for data the security rules keep private (enrollments, certificates, users),
 * e.g. aggregate counts. Never import from a client component.
 */
export function getAdminDb(): Firestore {
  return getFirestore(getColtekFirebaseAdminApp())
}
