import { initializeApp, getApps, getApp, cert, applicationDefault } from 'firebase-admin/app'
import type { App } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Isolated Admin app name so we never reuse another package's `[DEFAULT]` app
 * (e.g. Application Default Credentials tied to a different GCP project like cyber-analyzer-*).
 */
const COLTEK_ADMIN_APP_NAME = 'coltek-academy-admin'

export function getColtekFirebaseAdminApp(): App {
  ensureFirebaseAdminInitialized()
  return getApp(COLTEK_ADMIN_APP_NAME)
}

function isGrpcPermissionDenied(e: unknown): boolean {
  const code = typeof e === 'object' && e !== null && 'code' in e ? (e as { code: number }).code : undefined
  const msg = e instanceof Error ? e.message : String(e)
  return code === 7 || msg.includes('PERMISSION_DENIED') || msg.includes('7 PERMISSION_DENIED')
}

/** Firebase Admin needs an explicit project id when using ADC or some hosted environments. */
function resolveProjectId(serviceAccountJson?: { project_id?: string }): string | undefined {
  const fromJson = serviceAccountJson?.project_id?.trim()
  if (fromJson) return fromJson
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim() ||
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    undefined
  )
}

function certFromSeparateEnv(): { credential: ReturnType<typeof cert>; projectId: string } | null {
  const projectId = resolveProjectId()
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim()
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
  if (!projectId || !clientEmail || !privateKey) return null
  if (!clientEmail.includes('@') || !clientEmail.endsWith('.iam.gserviceaccount.com')) return null
  privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n')
  if (!privateKey.includes('BEGIN PRIVATE KEY')) return null
  return { credential: cert({ projectId, clientEmail, privateKey }), projectId }
}

/** True when a Coltek Firebase service account is configured (not Application Default Credentials only). */
export function hasExplicitFirebaseServiceAccount(): boolean {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim()) return true
  return certFromSeparateEnv() !== null
}

/**
 * Initialize Firebase Admin once (server only). Options (first match wins):
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY — full JSON string of the service account
 * 2. FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY + project id
 *    (NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_ADMIN_PROJECT_ID)
 * 3. GOOGLE_APPLICATION_CREDENTIALS / gcloud application default (+ explicit project id from env)
 */
export function ensureFirebaseAdminInitialized(): void {
  if (getApps().some((a) => a.name === COLTEK_ADMIN_APP_NAME)) return

  const webProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim()
  if (json) {
    try {
      const parsed = JSON.parse(json) as { project_id?: string }
      if (webProjectId && parsed.project_id && parsed.project_id !== webProjectId) {
        throw new Error(
          `FIREBASE_SERVICE_ACCOUNT_KEY is for GCP project "${parsed.project_id}" but NEXT_PUBLIC_FIREBASE_PROJECT_ID is "${webProjectId}". Download a new key from Firebase Console → Project settings → Service accounts for the Coltek Academy web app project.`
        )
      }
      const projectId = resolveProjectId(parsed)
      initializeApp(
        {
          credential: cert(parsed),
          ...(projectId ? { projectId } : {}),
        },
        COLTEK_ADMIN_APP_NAME
      )
      return
    } catch (e) {
      throw new Error(
        e instanceof Error && e.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY is for GCP')
          ? e.message
          : `FIREBASE_SERVICE_ACCOUNT_KEY is set but invalid JSON: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }
  const fromParts = certFromSeparateEnv()
  if (fromParts) {
    if (webProjectId && fromParts.projectId !== webProjectId) {
      throw new Error(
        `FIREBASE_ADMIN_* credentials target project "${fromParts.projectId}" but NEXT_PUBLIC_FIREBASE_PROJECT_ID is "${webProjectId}". They must match.`
      )
    }
    initializeApp(
      { credential: fromParts.credential, projectId: fromParts.projectId },
      COLTEK_ADMIN_APP_NAME
    )
    return
  }
  const projectId = resolveProjectId()
  try {
    if (!projectId) {
      throw new Error(
        'No Firebase project id. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID (or FIREBASE_ADMIN_PROJECT_ID) for the server, or use FIREBASE_SERVICE_ACCOUNT_KEY.'
      )
    }
    console.warn(
      '[Firebase Admin] Using Application Default Credentials. If Auth/Firestore calls hit the wrong GCP project, set FIREBASE_SERVICE_ACCOUNT_KEY from Firebase Console (same project as your web app).'
    )
    initializeApp(
      {
        credential: applicationDefault(),
        projectId,
      },
      COLTEK_ADMIN_APP_NAME
    )
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('No Firebase project id')) {
      throw e
    }
    throw new Error(
      'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY (JSON), or FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY + NEXT_PUBLIC_FIREBASE_PROJECT_ID, or GOOGLE_APPLICATION_CREDENTIALS with NEXT_PUBLIC_FIREBASE_PROJECT_ID set.'
    )
  }
}

/**
 * Verify a Firebase ID token on the server (Admin SDK).
 */
export async function verifyFirebaseIdToken(idToken: string) {
  const app = getColtekFirebaseAdminApp()
  return getAuth(app).verifyIdToken(idToken)
}

function resolveAdminEmailsFromEnv(): string[] {
  const fromList = process.env.ADMIN_EMAILS?.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) ?? []
  const single = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (single && !fromList.includes(single)) return [...fromList, single]
  return fromList
}

/**
 * True if this uid is an admin. Tries in order:
 * 1. Custom claim `admin: true` on the ID token (if `decoded` passed)
 * 2. Env `ADMIN_FIREBASE_UIDS` (uid allowlist — no Firestore)
 * 3. Env `ADMIN_EMAILS` (comma-separated) or `ADMIN_EMAIL` — match token email (no Firestore; use your existing .env)
 * 4. Firestore `users/{uid}` or `adminUsers/{uid}` with role admin
 * 5. Auth Admin `getUser` customClaims.admin — only if a real service account is configured
 */
export async function isUidAdminServer(uid: string, decoded?: DecodedIdToken): Promise<boolean> {
  if (decoded && decoded.admin === true) return true

  const allow = process.env.ADMIN_FIREBASE_UIDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
  if (allow.includes(uid)) return true

  const adminEmails = resolveAdminEmailsFromEnv()
  const tokenEmail = decoded?.email?.trim().toLowerCase()
  if (tokenEmail && adminEmails.length > 0 && adminEmails.includes(tokenEmail)) return true

  const expectedWebProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
  const app = getColtekFirebaseAdminApp()

  try {
    const db = getFirestore(app)
    const [userDoc, adminDoc] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('adminUsers').doc(uid).get(),
    ])
    if (userDoc.exists && userDoc.data()?.role === 'admin') return true
    if (adminDoc.exists && adminDoc.data()?.role === 'admin') return true
  } catch (e: unknown) {
    if (!isGrpcPermissionDenied(e)) {
      console.error('[isUidAdminServer] Firestore error', e)
      throw e
    }
    console.warn(
      '[isUidAdminServer] Firestore PERMISSION_DENIED — grant Cloud Datastore User on the service account, or set ADMIN_FIREBASE_UIDS / ADMIN_EMAIL / ADMIN_EMAILS (matches signed-in user).'
    )
  }

  if (hasExplicitFirebaseServiceAccount()) {
    try {
      const user = await getAuth(app).getUser(uid)
      if (user.customClaims?.admin === true) return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('identitytoolkit')) {
        console.warn(
          '[isUidAdminServer] getUser failed (wrong GCP project or API disabled). Use a service account key from Firebase Console for',
          expectedWebProject || 'your web app project',
        )
      } else {
        console.warn('[isUidAdminServer] getUser(customClaims) fallback failed', e)
      }
    }
  }

  return false
}
