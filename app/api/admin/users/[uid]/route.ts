import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getAdminDb } from '@/lib/admin-db'
import { getColtekFirebaseAdminApp, isUidAdminServer, verifyFirebaseIdToken } from '@/lib/verify-firebase-token'

export const runtime = 'nodejs'

/**
 * DELETE — permanently remove a user: their Firebase sign-in account AND their users/{uid} profile.
 * Admin only. Enrollment and certificate records are kept (they are the academy's history).
 * Safeguards: an admin cannot delete themself, and admin accounts must be demoted to student first.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let decoded
    try {
      decoded = await verifyFirebaseIdToken(authHeader.slice(7).trim())
    } catch {
      return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 })
    }
    if (!(await isUidAdminServer(decoded.uid, decoded))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { uid } = await params
    if (!uid || uid.length > 128) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
    }
    if (uid === decoded.uid) {
      return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 })
    }

    const app = getColtekFirebaseAdminApp()
    const auth = getAuth(app)
    const db = getAdminDb()

    const [authUser, profile, adminMarker] = await Promise.all([
      auth.getUser(uid).catch(() => null),
      db.collection('users').doc(uid).get(),
      db.collection('adminUsers').doc(uid).get(),
    ])
    if (!authUser && !profile.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isTargetAdmin =
      authUser?.customClaims?.admin === true ||
      profile.data()?.role === 'admin' ||
      adminMarker.data()?.role === 'admin'
    if (isTargetAdmin) {
      return NextResponse.json({ error: 'This is an admin account. Change their role to student before deleting it.' }, { status: 400 })
    }

    if (authUser) await auth.deleteUser(uid)
    if (profile.exists) await profile.ref.delete()

    return NextResponse.json({ deleted: true, deletedSignIn: !!authUser, deletedProfile: profile.exists })
  } catch (error) {
    console.error('[api/admin/users] delete failed', error)
    return NextResponse.json({ error: 'The user could not be deleted. Please try again.' }, { status: 500 })
  }
}
