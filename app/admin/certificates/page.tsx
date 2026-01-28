'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Certificate } from '@/types/certificate';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setIsLoading(true);
        // Fetch all certificates (admin view)
        const q = query(collection(db, 'certificates'), orderBy('issueDate', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const certs = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            issueDate: data.issueDate?.toDate ? data.issueDate.toDate() : new Date(data.issueDate || Date.now()),
            completionDate: data.completionDate?.toDate ? data.completionDate.toDate() : new Date(data.completionDate || Date.now()),
          } as Certificate;
        });
        
        setCertificates(certs);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError('Failed to load certificates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleDownload = (certificateUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = certificateUrl;
    link.download = fileName || 'certificate.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Issued Certificates</h1>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No certificates have been issued yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardHeader className="flex flex-row justify-between items-start space-y-0">
                <div>
                  <CardTitle className="text-lg">
                    {cert.recipientName || 'Certificate'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {cert.courseName || 'Course Certificate'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {cert.certificateUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(cert.certificateUrl, `certificate-${cert.id}.pdf`)}
                    >
                      Download
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Issued on</p>
                    <p>{format(cert.issueDate, 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <div className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                      <span className="capitalize">{cert.status || 'issued'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Certificate ID</p>
                    <p className="font-mono text-sm">{cert.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
