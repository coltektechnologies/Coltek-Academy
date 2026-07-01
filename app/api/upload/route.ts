import { NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
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

    ensureFirebaseAdminInitialized();
    const app = getColtekFirebaseAdminApp();
    const storage = getStorage(app);
    const projectId = app.options.projectId as string | undefined;
    const defaultBucket = (app.options.storageBucket as string | undefined)?.trim();
    const envBucket = process.env.FIREBASE_STORAGE_BUCKET?.trim() || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
    const fallbackBucket = projectId ? `${projectId}.appspot.com` : undefined;
    const candidateBuckets = [envBucket, defaultBucket, fallbackBucket].filter(Boolean) as string[];

    let bucket = null as any;
    let chosenBucketName: string | undefined;

    for (const candidate of candidateBuckets) {
      const candidateName = candidate.trim();
      if (!candidateName) continue;
      const candidateBucket = storage.bucket(candidateName);
      const [exists] = await candidateBucket.exists();
      if (exists) {
        bucket = candidateBucket;
        chosenBucketName = candidateName;
        break;
      }
    }

    if (!bucket) {
      throw new Error(
        `Firebase storage bucket does not exist. Checked: ${candidateBuckets.join(', ')}.`
      );
    }

    const safeFileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const destination = `certificates/${userId}/${safeFileName}`;
    const blob = bucket.file(destination);
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
      fileName: safeFileName,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error uploading file' },
      { status: 500 }
    );
  }
}
