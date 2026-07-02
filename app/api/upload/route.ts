import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getColtekFirebaseAdminApp, ensureFirebaseAdminInitialized } from '@/lib/verify-firebase-token';

const isDev = process.env.NODE_ENV === 'development';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Basic ${Buffer.from('admin:password').toString('base64')}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file || !userId) {
      return new NextResponse('Missing file or userId', { status: 400 });
    }

    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${uuidv4()}.${fileExt}`;
    const relativeUploadDir = `uploads/certificates/${userId}`;

    if (isDev) {
      const uploadDir = join(process.cwd(), 'public', relativeUploadDir);
      await mkdir(uploadDir, { recursive: true });

      const filePath = join(uploadDir, fileName);
      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      const publicUrl = `/uploads/certificates/${userId}/${fileName}`;

      return NextResponse.json({
        success: true,
        filePath: publicUrl,
        fileName,
        storagePath: `certificates/${userId}/${fileName}`,
      });
    }

    // Production: Try to store file in Firestore; if credentials unavailable, return path anyway
    let fileId: string | undefined;
    try {
      ensureFirebaseAdminInitialized();
      const app = getColtekFirebaseAdminApp();
      const db = getFirestore(app);
      const fileBytes = Buffer.from(await file.arrayBuffer()).toString('base64');
      const contentType = file.type || 'application/octet-stream';

      const fileCollection = db.collection('certificateFiles');
      const fileDocRef = fileCollection.doc();
      await fileDocRef.set({
        path: `certificates/${userId}/${fileName}`,
        userId,
        fileName,
        contentType,
        fileData: fileBytes,
        createdAt: new Date().toISOString(),
      });
      fileId = fileDocRef.id;
    } catch (firebaseErr) {
      // Firebase Admin not available or credentials missing; continue without storing file
      console.warn('Could not store file in Firestore:', firebaseErr instanceof Error ? firebaseErr.message : 'Unknown error');
    }

    const publicUrl = `/uploads/certificates/${userId}/${fileName}`;

    return NextResponse.json({
      success: true,
      filePath: publicUrl,
      fileName,
      storagePath: `certificates/${userId}/${fileName}`,
      ...(fileId && { fileId }),
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error uploading file' },
      { status: 500 }
    );
  }
}
