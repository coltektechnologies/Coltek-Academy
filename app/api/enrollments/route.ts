import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/admin-db'
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-token'

/**
 * Create an enrollment for the signed-in student — the ONLY way a student enrollment is written
 * (firestore.rules no longer let browsers create enrollments).
 *
 * - Free course (price <= 0): enrolled directly.
 * - Paid course: the Paystack `reference` is verified here with the secret key — status success,
 *   GHS, amount >= current course price, and the transaction belongs to this course and this user.
 *   Each reference can create one enrollment only (document id `paystack_<reference>`), so a
 *   payment cannot be reused for another course or account. Repeating the call is safe.
 *
 * Body: { courseId?: string, reference?: string, formData?: RegistrationFormData-like }
 */

const MOCK_PAYSTACK = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_PAYSTACK === 'true'

// Form answers are stored as short plain strings
function text(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function parseMetadata(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

type PaymentCheck =
  | { ok: true; courseId: string; amountPaid: number }
  | { ok: false; status: number; error: string }

async function verifyPaystackPayment(reference: string, uid: string, email: string | undefined): Promise<PaymentCheck> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return { ok: false, status: 500, error: 'Payment configuration error' }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: 'no-store',
  })
  const body = await response.json().catch(() => null)
  const transaction = body?.data
  if (!response.ok || !body?.status || transaction?.status !== 'success') {
    return { ok: false, status: 402, error: 'We could not confirm this payment with Paystack.' }
  }

  const metadata = parseMetadata(transaction.metadata)
  const courseId = text(metadata?.courseId, 200)
  if (!courseId) return { ok: false, status: 400, error: 'This payment is not linked to a course.' }

  // The transaction must belong to the signed-in account
  const paidByUid = text(metadata?.userId, 200)
  const customerEmail = text(transaction.customer?.email, 320).toLowerCase()
  const belongsToUser = paidByUid ? paidByUid === uid : !!email && customerEmail === email.toLowerCase()
  if (!belongsToUser) return { ok: false, status: 403, error: 'This payment belongs to a different account.' }

  if (transaction.currency !== 'GHS' || typeof transaction.amount !== 'number') {
    return { ok: false, status: 402, error: 'Payment currency or amount is invalid.' }
  }

  return { ok: true, courseId, amountPaid: transaction.amount }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Please log in to enroll.' }, { status: 401 })
    }
    let decoded
    try {
      decoded = await verifyFirebaseIdToken(authHeader.substring(7))
    } catch {
      return NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
    }
    const uid = decoded.uid
    const userEmail = decoded.email || ''

    const body = await request.json().catch(() => ({}))
    const reference = text(body?.reference, 120)
    const form = body?.formData && typeof body.formData === 'object' ? body.formData : {}
    let courseId = text(body?.courseId, 200)

    const db = getAdminDb()
    let paymentMethod = 'free'
    let paymentReference = ''
    let paymentAmount = 0
    let amountPaid = 0
    let enrollmentRef = db.collection('enrollments').doc()

    if (reference) {
      // Paid enrollment: the verified Paystack transaction decides the course
      const isMock = reference.startsWith('MOCK-')
      if (isMock && !MOCK_PAYSTACK) {
        return NextResponse.json({ error: 'Invalid payment reference.' }, { status: 400 })
      }
      if (!isMock) {
        const check = await verifyPaystackPayment(reference, uid, decoded.email)
        if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })
        courseId = check.courseId
        amountPaid = check.amountPaid
      }
      if (!courseId) return NextResponse.json({ error: 'Course is required.' }, { status: 400 })
      paymentMethod = 'paystack'
      paymentReference = reference
      // One enrollment per payment reference
      enrollmentRef = db.collection('enrollments').doc(`paystack_${reference.replace(/[^A-Za-z0-9_-]/g, '_')}`)
    } else if (!courseId) {
      return NextResponse.json({ error: 'Course is required.' }, { status: 400 })
    }

    const courseSnap = await db.collection('courses').doc(courseId).get()
    const course = courseSnap.data()
    if (!courseSnap.exists || !course || course.isPublished !== true) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
    }
    const price = typeof course.price === 'number' ? course.price : 0

    if (price > 0) {
      if (!reference) {
        return NextResponse.json({ error: 'This course requires payment.' }, { status: 402 })
      }
      if (!reference.startsWith('MOCK-') && amountPaid < Math.round(price * 100)) {
        return NextResponse.json({ error: 'The amount paid does not match the course price.' }, { status: 402 })
      }
      paymentAmount = price
    } else {
      // Free course: never tie it to a payment reference
      paymentMethod = 'free'
      paymentReference = `FREE-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      enrollmentRef = db.collection('enrollments').doc()
    }

    const enrollment = {
      id: enrollmentRef.id,
      userId: uid,
      userEmail,
      courseId: courseSnap.id,
      courseTitle: String(course.title || ''),
      enrollmentDate: new Date().toISOString(),
      paymentReference,
      paymentAmount,
      paymentMethod,
      status: 'active',
      personalInfo: {
        firstName: text(form.firstName, 100),
        lastName: text(form.lastName, 100),
        email: text(form.email, 320) || userEmail,
        phone: text(form.phone, 40),
      },
      education: {
        highestEducation: text(form.highestEducation, 100),
        fieldOfStudy: text(form.fieldOfStudy, 150),
        currentOccupation: text(form.currentOccupation, 150),
        yearsOfExperience: text(form.yearsOfExperience, 40),
      },
      courseDetails: {
        learningGoals: text(form.learningGoals, 2000),
        preferredSchedule: text(form.preferredSchedule, 40) || 'weekdays',
      },
    }

    try {
      // create() fails if this payment reference was already used
      await enrollmentRef.create(enrollment)
    } catch (error) {
      const existing = await enrollmentRef.get()
      if (existing.exists && existing.data()?.userId === uid) {
        // Same student reloading the confirmation page: already enrolled
        return NextResponse.json({ enrollmentId: existing.id, courseTitle: existing.data()?.courseTitle || enrollment.courseTitle, alreadyEnrolled: true })
      }
      if (existing.exists) {
        return NextResponse.json({ error: 'This payment has already been used for another enrollment.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ enrollmentId: enrollmentRef.id, courseTitle: enrollment.courseTitle, alreadyEnrolled: false })
  } catch (error) {
    console.error('[api/enrollments] Failed to create enrollment', error)
    return NextResponse.json({ error: 'Enrollment could not be saved. Please contact support.' }, { status: 500 })
  }
}
