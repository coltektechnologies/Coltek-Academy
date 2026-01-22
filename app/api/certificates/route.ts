import { NextRequest, NextResponse } from 'next/server'
import { CertificateService } from '@/lib/certificate-service'
import { auth } from '@/lib/firebase'
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
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = await CertificateService.checkAdminStatus(decodedToken.uid)
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
      courseId: formData.get('courseId') as string,
      courseTitle: formData.get('courseTitle') as string,
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
      certificateUrl: uploadResult.certificateUrl,
      ...(uploadResult.previewUrl && { previewUrl: uploadResult.previewUrl }),
    }

    const certificateIdResult = await CertificateService.createCertificate(finalCertificateData)

    return NextResponse.json({
      success: true,
      certificateId: certificateIdResult,
      certificate: {
        id: certificateIdResult,
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

// GET endpoint to retrieve certificates for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const certificates = await CertificateService.getUserCertificates(userId)

    return NextResponse.json({ certificates })

  } catch (error) {
    console.error('Error fetching certificates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    )
  }
}