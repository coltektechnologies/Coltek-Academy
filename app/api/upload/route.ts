import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getColtekFirebaseAdminApp, ensureFirebaseAdminInitialized } from '@/lib/verify-firebase-token';

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
    const fileBytes = Buffer.from(await file.arrayBuffer());
    const uploadDir = join(process.cwd(), 'public', relativeUploadDir);
    const filePath = join(uploadDir, fileName);

    try {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(filePath, fileBytes);
    } catch (diskError) {
      console.warn('Could not write file to public uploads directory:', diskError instanceof Error ? diskError.message : 'Unknown error');
    }

    let fileId: string | undefined;
    try {
      ensureFirebaseAdminInitialized();
      const app = getColtekFirebaseAdminApp();
      const db = getFirestore(app);
      const contentType = file.type || 'application/octet-stream';

      const fileCollection = db.collection('certificateFiles');
      const fileDocRef = fileCollection.doc();
      await fileDocRef.set({
        path: `certificates/${userId}/${fileName}`,
        userId,
        fileName,
        contentType,
        fileData: fileBytes.toString('base64'),
        createdAt: new Date().toISOString(),
      });
      fileId = fileDocRef.id;
    } catch (firebaseErr) {
      console.warn('Could not store file in Firestore:', firebaseErr instanceof Error ? firebaseErr.message : 'Unknown error');
    }

    const requestUrl = new URL(request.url);
    const publicUrl = new URL(`/uploads/certificates/${userId}/${fileName}`, requestUrl.origin).toString();

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
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
