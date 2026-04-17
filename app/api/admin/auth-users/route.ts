import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import type { AuthUserRow } from '@/lib/types'
import {
  getColtekFirebaseAdminApp,
  verifyFirebaseIdToken,
  isUidAdminServer,
} from '@/lib/verify-firebase-token'

export const runtime = 'nodejs'

/**
 * GET — list all Firebase Authentication users (Admin SDK).
 * Caller must send Authorization: Bearer <Firebase ID token> and be an admin.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7).trim()
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 })
    }

    let decoded: Awaited<ReturnType<typeof verifyFirebaseIdToken>>
    try {
      decoded = await verifyFirebaseIdToken(token)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      const code =
        typeof e === 'object' && e !== null && 'code' in e
          ? String((e as { code: string }).code)
          : ''
      console.error('[api/admin/auth-users] verifyIdToken failed', code, msg)
      if (msg.includes('Firebase Admin not configured') || msg.includes('FIREBASE_SERVICE_ACCOUNT_KEY is set but invalid')) {
        return NextResponse.json({ error: 'Server misconfiguration', detail: msg }, { status: 503 })
      }
      const hint =
        'Use a service account from the same Firebase project as your web app (coltek-academy). ' +
        'Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY in .env.'
      return NextResponse.json(
        {
          error: 'Invalid token',
          detail: process.env.NODE_ENV === 'development' ? `${code ? `${code}: ` : ''}${msg}` : hint,
        },
        { status: 401 }
      )
    }

    const ok = await isUidAdminServer(decoded.uid, decoded)
    if (!ok) {
      return NextResponse.json(
        {
          error: 'Admin access required',
          detail:
            'Set ADMIN_EMAIL to the same email you use to sign in (or ADMIN_EMAILS=a@x.com,b@y.com), or ADMIN_FIREBASE_UIDS=<uid>. ' +
            'Optionally fix Firestore IAM for your service account (Cloud Datastore User).',
        },
        { status: 403 }
      )
    }

    const auth = getAuth(getColtekFirebaseAdminApp())
    const rows: AuthUserRow[] = []
    let pageToken: string | undefined

    try {
      do {
        const page = await auth.listUsers(1000, pageToken)
        for (const u of page.users) {
          rows.push({
            uid: u.uid,
            email: u.email ?? null,
            displayName: u.displayName ?? null,
            photoURL: u.photoURL ?? null,
            emailVerified: u.emailVerified,
            disabled: u.disabled,
            providers: u.providerData.map((p) => p.providerId),
            creationTime: u.metadata.creationTime,
            lastSignInTime: u.metadata.lastSignInTime,
          })
        }
        pageToken = page.pageToken
      } while (pageToken)
    } catch (listErr: unknown) {
      const msg = listErr instanceof Error ? listErr.message : String(listErr)
      console.error('[api/admin/auth-users] listUsers failed', listErr)
      if (msg.includes('identitytoolkit') || msg.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          {
            error: 'Cannot list Auth users',
            detail:
              'Firebase Admin is not using the coltek-academy project (often wrong Application Default Credentials). ' +
              'Set FIREBASE_SERVICE_ACCOUNT_KEY to the JSON from Firebase Console → Project settings → Service accounts → Generate new private key.',
          },
          { status: 503 }
        )
      }
      throw listErr
    }

    rows.sort((a, b) => (b.creationTime || '').localeCompare(a.creationTime || ''))

    return NextResponse.json({ users: rows, total: rows.length })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to list users'
    console.error('[api/admin/auth-users]', e)
    if (message.includes('Firebase Admin not configured')) {
      return NextResponse.json(
        {
          error: 'Server misconfiguration',
          detail:
            'Set FIREBASE_SERVICE_ACCOUNT_KEY (JSON string of service account) on the server to list Auth users.',
        },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
