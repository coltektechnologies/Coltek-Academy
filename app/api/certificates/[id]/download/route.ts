import { NextRequest, NextResponse } from 'next/server';
import { isUidAdminServer, verifyFirebaseIdToken } from '@/lib/verify-firebase-token';
import { getAdminDb } from '@/lib/admin-db';

function normalizeCertUrl(url: unknown): string {
  const value = typeof url === 'string' ? url : '';
  if (!value) return '';
  try {
    if (value.startsWith('http')) return new URL(value).pathname;
  } catch {
    // Not a valid URL, use as-is
  }
  return value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await verifyFirebaseIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Certificates are private under the Firestore rules: read through Firebase Admin
    const certificates = getAdminDb().collection('certificates');
    let snapshot = await certificates.doc(id).get();
    if (!snapshot.exists) {
      const byCertificateId = await certificates.where('certificateId', '==', id).limit(1).get();
      if (!byCertificateId.empty) snapshot = byCertificateId.docs[0];
    }
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }
    const data = snapshot.data() || {};

    // Only the certificate holder or an admin may download it
    if (data.userId !== decodedToken.uid && !(await isUidAdminServer(decodedToken.uid, decodedToken))) {
      return NextResponse.json({ error: 'Unauthorized to access this certificate' }, { status: 403 });
    }

    const certificateUrl = normalizeCertUrl(data.certificateUrl || data.fileUrl);
    if (certificateUrl) {
      return NextResponse.redirect(new URL(certificateUrl, request.url));
    }

    return NextResponse.json({ error: 'Certificate file not available' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
