import { NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getColtekFirebaseAdminApp, ensureFirebaseAdminInitialized } from '@/lib/verify-firebase-token'

/**
 * Serve a certificate file by its Firestore document ID.
 * This is the primary file serving endpoint — no filesystem or path-based
 * query needed, just a direct document lookup by ID.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await context.params

    if (!fileId) {
      return new NextResponse('File ID required', { status: 400 })
    }

    ensureFirebaseAdminInitialized()
    const app = getColtekFirebaseAdminApp()
    const db = getFirestore(app)

    // Direct document lookup — no query, no composite index needed
    const docSnap = await db.collection('certificateFiles').doc(fileId).get()

    if (!docSnap.exists) {
      console.error(`Certificate file document not found: ${fileId}`)
      return new NextResponse('File not found', { status: 404 })
    }

    const data = docSnap.data() as {
      fileData?: string
      contentType?: string
      fileName?: string
    }

    if (!data?.fileData) {
      console.error(`Certificate file document ${fileId} has no fileData`)
      return new NextResponse('File data missing', { status: 404 })
    }

    const buffer = Buffer.from(data.fileData, 'base64')
    const contentType = data.contentType || 'application/octet-stream'
    const fileName = data.fileName || 'certificate'

    // Determine if this is a download request
    const url = new URL(request.url)
    const isDownload = url.searchParams.get('download') === '1'

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600, immutable',
    }

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${fileName}"`
    } else {
      headers['Content-Disposition'] = `inline; filename="${fileName}"`
    }

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse(
      `Error serving file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    )
  }
}
