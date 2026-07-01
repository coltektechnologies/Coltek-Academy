import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getStorage } from 'firebase-admin/storage';
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
    const destinationPath = `certificates/${userId}/${fileName}`;

    if (isDev) {
      const relativeUploadDir = join('uploads', 'certificates', userId);
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

    // Production / hosted deployment cannot write to the local filesystem.
    // Use Firebase Storage when deployed.
    ensureFirebaseAdminInitialized();
    const app = getColtekFirebaseAdminApp();
    const storage = getStorage(app);
    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
      (app.options.storageBucket as string | undefined)?.trim();

    if (!bucketName) {
      throw new Error(
        'Production upload requires Firebase Storage. Set FIREBASE_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to a valid bucket name.'
      );
    }

    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`Firebase storage bucket does not exist: ${bucketName}`);
    }

    const blob = bucket.file(destinationPath);
    const buffer = Buffer.from(await file.arrayBuffer());
    await blob.save(buffer, {
      contentType: file.type || 'application/octet-stream',
      resumable: false,
    });

    const [signedUrl] = await blob.getSignedUrl({
      action: 'read',
      expires: '12-31-2491',
    });

    return NextResponse.json({
      success: true,
      filePath: signedUrl,
      fileName,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error uploading file' },
      { status: 500 }
    );
  }
}
