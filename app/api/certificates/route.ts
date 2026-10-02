import { NextRequest, NextResponse } from 'next/server'
import { CertificateService } from '@/lib/certificate-service'
import { isUidAdminServer, verifyFirebaseIdToken } from '@/lib/verify-firebase-token'
import { getAdminDb } from '@/lib/admin-db'
import type { Certificate } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify Firebase token
    let decodedToken
    try {
      decodedToken = await verifyFirebaseIdToken(token)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin (server-side: Firebase Admin, not bound by Firestore rules)
    const isAdmin = await isUidAdminServer(decodedToken.uid, decodedToken)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const pdfFile = formData.get('certificate') as File
    const previewFile = formData.get('preview') as File | null

    // Extract certificate data from form
    const certificateData = {
      userId: formData.get('userId') as string,
      userEmail: formData.get('userEmail') as string,
      userName: (formData.get('userName') as string) || (formData.get('userEmail') as string)?.split('@')[0] || 'Certificate Holder',
      recipientEmail: formData.get('userEmail') as string,
      recipientName: (formData.get('userName') as string) || (formData.get('userEmail') as string)?.split('@')[0] || 'Certificate Holder',
      courseId: formData.get('courseId') as string,
      courseTitle: formData.get('courseTitle') as string,
      courseName: formData.get('courseTitle') as string,
      enrollmentId: formData.get('enrollmentId') as string,
      certificateNumber: formData.get('certificateNumber') as string || CertificateService.generateCertificateNumber(),
      issueDate: new Date(formData.get('issueDate') as string),
      completionDate: new Date(formData.get('completionDate') as string),
      instructorName: formData.get('instructorName') as string || 'Coltek Academy',
      certificateUrl: '', // Will be set after upload
      status: 'issued' as const,
      metadata: {
        templateUsed: formData.get('templateUsed') as string || 'default',
        verificationCode: formData.get('verificationCode') as string || CertificateService.generateVerificationCode(),
        grade: formData.get('grade') as string | undefined,
      },
    }

    // Validate required fields
    if (!certificateData.userId || !certificateData.userEmail || !certificateData.courseId || !certificateData.courseTitle || !pdfFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate certificate ID
    const certificateId = `${certificateData.userId}_${certificateData.courseId}_${Date.now()}`

    // Upload files to Firebase Storage
    const uploadResult = await CertificateService.uploadCertificateFiles(
      certificateId,
      pdfFile,
      previewFile || undefined
    )

    // Create certificate record with file URLs
    const finalCertificateData: Omit<Certificate, 'id'> = {
      ...certificateData,
      certificateId: certificateId,
      id: certificateId,
      certificateUrl: uploadResult.certificateUrl,
      previewUrl: uploadResult.previewUrl || uploadResult.certificateUrl,
      fileUrl: uploadResult.certificateUrl,
      filePath: `certificates/${certificateId}/certificate.pdf`,
      storagePath: `certificates/${certificateId}/certificate.pdf`,
      verificationCode: certificateData.metadata.verificationCode,
      ...(uploadResult.previewUrl && { previewUrl: uploadResult.previewUrl }),
    }

    const certificateIdResult = await CertificateService.createCertificate(finalCertificateData)

    return NextResponse.json({
      success: true,
      certificateId: certificateIdResult,
      certificate: {
        id: certificateIdResult,
        certificateId: certificateIdResult,
        ...finalCertificateData,
      },
    })

  } catch (error) {
    console.error('Error uploading certificate:', error)
    return NextResponse.json(
      { error: 'Failed to upload certificate' },
      { status: 500 }
    )
  }
}

function toIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  return null
}

// GET endpoint to retrieve a user's issued certificates — the user themself or an admin only
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decodedToken
    try {
      decodedToken = await verifyFirebaseIdToken(authHeader.substring(7))
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || decodedToken.uid

    if (userId !== decodedToken.uid && !(await isUidAdminServer(decodedToken.uid, decodedToken))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const snapshot = await getAdminDb()
      .collection('certificates')
      .where('userId', '==', userId)
      .where('status', '==', 'issued')
      .get()

    const certificates = snapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          certificateId: data.certificateId || doc.id,
          issueDate: toIso(data.issueDate),
          completionDate: toIso(data.completionDate),
        }
      })
      .sort((a, b) => String(b.issueDate).localeCompare(String(a.issueDate)))

    return NextResponse.json({ certificates })

  } catch (error) {
    console.error('Error fetching certificates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    )
  }
}
