import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { firebase } from '@/lib/firebase';

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

    const safeFileName = `${uuidv4()}-${file.name.replace(/\s+/g, '-')}`;
    const storagePath = `certificates/${userId}/${safeFileName}`;
    const storageRef = ref(firebase.storage, storagePath);
    const bytes = await file.arrayBuffer();

    await uploadBytes(storageRef, new Uint8Array(bytes), {
      contentType: file.type || 'application/octet-stream',
    });

    const publicUrl = await getDownloadURL(storageRef);

    return NextResponse.json({
      success: true,
      filePath: publicUrl,
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
