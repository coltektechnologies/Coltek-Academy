import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
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
    const fileBytes = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || 'application/octet-stream';

    // Check file size — Firestore documents have a 1 MiB limit.
    // base64 adds ~33% overhead, plus other fields (~1KB).
    // Allow files up to ~750 KB raw (≈1000 KB base64 + metadata).
    const MAX_FILE_SIZE = 750 * 1024; // 750 KB
    if (fileBytes.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File is too large (${(fileBytes.length / 1024).toFixed(0)} KB). Maximum allowed is ${MAX_FILE_SIZE / 1024} KB. Please compress the image or use a smaller file.`,
        },
        { status: 400 }
      );
    }

    // Store file data in Firestore — this is the PRIMARY storage mechanism.
    // On the free Firebase plan (no Storage), this is the only reliable way
    // to persist files for serving later.
    ensureFirebaseAdminInitialized();
    const app = getColtekFirebaseAdminApp();
    const db = getFirestore(app);

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

    const fileId = fileDocRef.id;

    // The serving URL uses the file document ID for direct lookup (no query needed)
    const servingUrl = `/api/files/${fileId}`;

    return NextResponse.json({
      success: true,
      fileUrl: servingUrl,
      filePath: servingUrl,
      fileName,
      fileId,
      storagePath: `certificates/${userId}/${fileName}`,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error uploading file' },
      { status: 500 }
    );
  }
}
