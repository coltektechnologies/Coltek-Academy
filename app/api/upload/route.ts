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

      const origin = new URL(request.url).origin;
      const publicUrl = `${origin}/${relativeUploadDir}/${fileName}`;

      return NextResponse.json({
        success: true,
        filePath: publicUrl,
        fileName,
      });
    }

    // Production: Store file in Firestore
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

    const origin = new URL(request.url).origin;
    const publicUrl = `${origin}/${relativeUploadDir}/${fileName}`;

    return NextResponse.json({
      success: true,
      filePath: publicUrl,
      fileName,
      fileId: fileDocRef.id,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error uploading file' },
      { status: 500 }
    );
  }
}
