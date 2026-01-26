import { NextRequest, NextResponse } from 'next/server';
import { CertificateService } from '@/lib/certificate-service';
import { auth } from '@/lib/firebase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the certificate ID from the URL
    const { id } = params;
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // Verify user is authenticated
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get the certificate
    const certificate = await CertificateService.getCertificateById(id);
    
    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Verify the requesting user owns the certificate or is an admin
    const isAdmin = await CertificateService.checkAdminStatus(decodedToken.uid);
    if (certificate.userId !== decodedToken.uid && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to access this certificate' },
        { status: 403 }
      );
    }

    // If certificate has a direct URL, redirect to it
    if (certificate.certificateUrl) {
      return NextResponse.redirect(certificate.certificateUrl);
    }

    // If no URL but we have the file in storage, generate a signed URL
    // This is where you'd implement storage access logic
    // For now, we'll return a 404 if no URL is available
    return NextResponse.json(
      { error: 'Certificate file not available' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
