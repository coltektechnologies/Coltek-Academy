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
    // Allow files up to 5 MB by chunking them.
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (fileBytes.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File is too large (${(fileBytes.length / 1024 / 1024).toFixed(2)} MB). Maximum allowed is 5 MB. Please compress the image or use a smaller file.`,
        },
        { status: 400 }
      );
    }

    // Split the file into chunks to bypass Firestore's 1 MiB document limit.
    // We use 500 KB chunks (raw size) which safely becomes ~666 KB in base64.
    const CHUNK_SIZE = 500 * 1024; 
    const chunkCount = Math.ceil(fileBytes.length / CHUNK_SIZE);

    ensureFirebaseAdminInitialized();
    const app = getColtekFirebaseAdminApp();
    const db = getFirestore(app);

    const fileCollection = db.collection('certificateFiles');
    const fileDocRef = fileCollection.doc();
    
    // Create the main document
    await fileDocRef.set({
      path: `certificates/${userId}/${fileName}`,
      userId,
      fileName,
      contentType,
      chunkCount,
      // Store the first chunk directly in the main document if it's small enough,
      // but for consistency we'll just store all data in the chunks subcollection
      // or we can store fileData if chunkCount === 1 for backward compatibility
      ...(chunkCount === 1 ? { fileData: fileBytes.toString('base64') } : {}),
      createdAt: new Date().toISOString(),
    });

    // Upload chunks if chunkCount > 1
    if (chunkCount > 1) {
      const uploadPromises = [];
      for (let i = 0; i < chunkCount; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileBytes.length);
        const chunkBytes = fileBytes.slice(start, end);
        
        const chunkDocRef = fileDocRef.collection('chunks').doc(i.toString());
        uploadPromises.push(
          chunkDocRef.set({
            index: i,
            data: chunkBytes.toString('base64'),
          })
        );
      }
      await Promise.all(uploadPromises);
    }

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
