import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // Basic authentication - in production, use a more secure method
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Basic ${Buffer.from('admin:password').toString('base64')}`; // Change this in production
    
    if (!authHeader || authHeader !== expectedAuth) {
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return new NextResponse('Missing file or userId', { status: 400 });
    }

    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const relativeUploadDir = `/uploads/certificates/${userId}`;
    const uploadDir = join(process.cwd(), 'public', relativeUploadDir);
    
    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Write file to disk
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}${relativeUploadDir}/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      filePath: publicUrl,
      fileName
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse('Error uploading file', { status: 500 });
  }
}
