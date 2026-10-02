import type { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { firebase } from '@/lib/firebase'

/**
 * Client-side admin check — the single source of truth for admin UI.
 * An admin has ANY of: the `admin` custom claim, users/{uid}.role === 'admin',
 * or adminUsers/{uid}.role === 'admin' (the same markers firestore.rules and
 * isUidAdminServer accept). Data access is still enforced by the Firestore rules.
 */
export async function isAdminUser(user: User): Promise<boolean> {
  const [token, userDoc, adminDoc] = await Promise.all([
    user.getIdTokenResult(),
    getDoc(doc(firebase.db, 'users', user.uid)),
    getDoc(doc(firebase.db, 'adminUsers', user.uid)),
  ])
  return (
    token.claims.admin === true ||
    (userDoc.exists() && userDoc.data()?.role === 'admin') ||
    (adminDoc.exists() && adminDoc.data()?.role === 'admin')
  )
}
