import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error uploading file' },
      { status: 500 }
    );
  }
}
