import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getFirestore } from 'firebase-admin/firestore'
import { getColtekFirebaseAdminApp, ensureFirebaseAdminInitialized } from '@/lib/verify-firebase-token'

/**
 * Legacy file serving route for certificates stored at /uploads/certificates/...
 * New uploads use /api/files/[fileId] instead.
 * This route exists for backward compatibility with existing certificate records.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ segments?: string[] }> }
) {
  try {
    const { segments: rawSegments } = await context.params
    const segments = rawSegments || []
    if (segments.length < 3 || segments[0] !== 'certificates') {
      return new NextResponse('Not found', { status: 404 })
    }

    const [_, userId, ...fileParts] = segments
    const fileName = fileParts.join('/')
    if (!userId || !fileName) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Try reading from the local public directory first (works in development)
    const localPath = join(process.cwd(), 'public', 'uploads', 'certificates', userId, fileName)
    try {
      const fileBuffer = await readFile(localPath)
      const extension = fileName.split('.').pop() || ''
      const contentType = getContentType(extension)
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } catch {
      // File not on local disk, fall through to Firestore lookup
    }

    // Look up file data from Firestore
    let db
    try {
      ensureFirebaseAdminInitialized()
      const app = getColtekFirebaseAdminApp()
      db = getFirestore(app)
    } catch (initError) {
      console.error('Failed to initialize Firebase Admin for file serving:', initError)
      return new NextResponse('Server configuration error', { status: 500 })
    }

    const filePath = `certificates/${userId}/${fileName}`

    // Query by the stored path
    try {
      const snapshot = await db
        .collection('certificateFiles')
        .where('path', '==', filePath)
        .limit(1)
        .get()

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as {
          fileData?: string
          contentType?: string
        }
        if (data.fileData) {
          const buffer = Buffer.from(data.fileData, 'base64')
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': data.contentType || 'application/octet-stream',
              'Cache-Control': 'public, max-age=3600',
            },
          })
        }
      }
    } catch (queryError) {
      console.error('Firestore path query failed:', queryError)
      // Continue to try other methods
    }

    // Fallback: try finding by userId and fileName individually (no composite index needed)
    try {
      const snapshot = await db
        .collection('certificateFiles')
        .where('fileName', '==', fileName)
        .limit(5)
        .get()

      // Filter results to match the userId
      const match = snapshot.docs.find(d => d.data().userId === userId)
      if (match) {
        const data = match.data() as {
          fileData?: string
          contentType?: string
        }
        if (data.fileData) {
          const buffer = Buffer.from(data.fileData, 'base64')
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': data.contentType || 'application/octet-stream',
              'Cache-Control': 'public, max-age=3600',
            },
          })
        }
      }
    } catch (fallbackError) {
      console.error('Firestore fileName fallback query failed:', fallbackError)
    }

    console.error(`Certificate file not found. path="${filePath}", userId="${userId}", fileName="${fileName}"`)
    return new NextResponse('File not found', { status: 404 })
  } catch (error) {
    console.error('Error serving uploaded file:', error)
    return new NextResponse('Error serving file', { status: 500 })
  }
}

function getContentType(extension: string) {
  switch (extension.toLowerCase()) {
    case 'pdf':
      return 'application/pdf'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}
