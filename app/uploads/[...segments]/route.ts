import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getFirestore } from 'firebase-admin/firestore'
import { getColtekFirebaseAdminApp, ensureFirebaseAdminInitialized } from '@/lib/verify-firebase-token'

export async function GET(
  request: Request,
  { params }: { params: { segments?: string[] } }
) {
  try {
    const segments = params.segments || []
    if (segments.length < 3 || segments[0] !== 'certificates') {
      return new NextResponse('Not found', { status: 404 })
    }

    const [_, userId, ...fileParts] = segments
    const fileName = fileParts.join('/')
    if (!userId || !fileName) {
      return new NextResponse('Not found', { status: 404 })
    }

    if (process.env.NODE_ENV === 'development') {
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
      } catch (err) {
        // fall through to Firestore lookup
      }
    }

    ensureFirebaseAdminInitialized()
    const app = getColtekFirebaseAdminApp()
    const db = getFirestore(app)
    const filePath = `certificates/${userId}/${fileName}`

    const snapshot = await db
      .collection('certificateFiles')
      .where('path', '==', filePath)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return new NextResponse('Not found', { status: 404 })
    }

    const data = snapshot.docs[0].data() as {
      fileData: string
      contentType: string
    }
    const buffer = Buffer.from(data.fileData, 'base64')

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': data.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    })
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
    default:
      return 'application/octet-stream'
  }
}
