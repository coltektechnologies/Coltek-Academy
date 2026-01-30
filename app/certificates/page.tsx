'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Award, Eye, Download, BookOpen, Clock, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CertificateService } from '@/lib/certificate-service';
import { getUserEnrollments } from '@/lib/enrollment';
import type { UserEnrollment } from '@/lib/types';
import { Certificate } from '@/types/certificate';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Extend the Certificate type with additional properties needed for the UI
interface UICertificate extends Certificate {
  courseTitle: string;
  instructorName: string;
  userEmail: string;
  downloadUrl?: string;
}

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Certificate Preview Component
const CertificatePreview = ({ certificate }: { certificate: UICertificate }) => (
  <div className="relative max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-2xl border-4 border-primary/20">
    <div className="text-center">
      <h2 className="text-3xl font-bold text-foreground mb-2">Certificate of Completion</h2>
      <p className="text-muted-foreground mb-8">This certificate is proudly presented to</p>
      
      <div className="mb-8">
        <h3 className="text-4xl font-bold text-primary mb-2">{certificate.userEmail}</h3>
        <div className="h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent my-4"></div>
        <p className="text-muted-foreground">
          For successfully completing the course
        </p>
        <p className="text-xl font-semibold">{certificate.courseTitle}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-8 mt-12 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Issued on</p>
          <p className="font-medium">
            {new Date(certificate.issueDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Instructor</p>
          <p className="font-medium">{certificate.instructorName || 'Coltek Academy'}</p>
        </div>
      </div>
      
      <div className="mt-8 pt-8 border-t border-foreground/10">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Certificate ID</p>
            <p className="font-mono text-sm">{certificate.certificateNumber || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={certificate.status === 'issued' ? 'default' : 'secondary'}>
              {certificate.status === 'issued' ? 'Verified' : 'Pending'}
            </Badge>
          </div>
        </div>
      </div>
    </div>

    <div className="absolute top-8 right-8 opacity-20">
      <Award className="h-24 w-24 text-primary" />
    </div>
  </div>
);

// Certificate Card Component
const CertificateCard = ({
  certificate,
  onPreview,
  onDownload
}: {
  certificate: UICertificate;
  onPreview: (cert: UICertificate) => void;
  onDownload: (cert: UICertificate) => Promise<void>;
}) => {
  return (
    <div className="group hover:shadow-lg transition-shadow border rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="outline" className="ml-auto">
            {certificate.status === 'issued' ? 'Verified' : 'Pending'}
          </Badge>
        </div>
        <h3 className="text-xl">{certificate.courseTitle}</h3>
        <p className="text-muted-foreground">
          Issued on {new Date(certificate.issueDate).toLocaleDateString()}
        </p>
      </div>
      <div className="p-6 border-t border-foreground/10">
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPreview(certificate)}
            className="flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            size="sm"
            onClick={() => onDownload(certificate)}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

// Enrollment Card Component
const EnrollmentCard = ({ 
  enrollment,
  onViewCourse 
}: { 
  enrollment: UserEnrollment & { enrollmentDate: Date }; 
  onViewCourse: () => void;
}) => {
  return (
    <div className="opacity-75 hover:opacity-100 transition-opacity border rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="p-3 rounded-lg bg-muted/50 w-fit mb-4">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{enrollment.courseTitle}</h3>
        <p className="text-sm text-muted-foreground">
          Enrolled on {new Date(enrollment.enrollmentDate).toLocaleDateString()}
        </p>
      </div>
      <div className="p-6 border-t border-foreground/10">
        <Badge variant="secondary" className="mb-4">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
        <p className="text-sm text-muted-foreground mb-4">
          Complete the course to earn your certificate
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewCourse}
          className="mt-4 flex items-center"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Continue Learning
        </Button>
      </div>
    </div>
  );
};

export default function CertificatesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // State for certificates and loading
  const [certificates, setCertificates] = useState<UICertificate[]>([]);
  const [enrollments, setEnrollments] = useState<Array<UserEnrollment & { enrollmentDate: Date }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewCertificate, setPreviewCertificate] = useState<UICertificate | null>(null);
  
  // Handle authentication and redirection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load data when user is authenticated
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const [certs, enrolls] = await Promise.all([
          CertificateService.getUserCertificates(user.uid),
          getUserEnrollments(user.uid)
        ]);
        
        // Map the certificates to include required UI properties
        const mappedCertificates: UICertificate[] = certs.map(cert => ({
          ...cert,
          courseTitle: cert.courseName || 'Unnamed Course',
          instructorName: 'Coltek Academy',
          userEmail: cert.recipientEmail || user.email || '',
          downloadUrl: cert.certificateUrl
        }));
        
        setCertificates(mappedCertificates);
        setEnrollments(enrolls);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Handle certificate download
  const handleDownloadCertificate = async (certificate: UICertificate) => {
    try {
      if (certificate.downloadUrl) {
        window.open(certificate.downloadUrl, '_blank');
        return;
      }
      
      const response = await fetch(`/api/certificates/${certificate.id}/download`);
      if (!response.ok) throw new Error('Failed to download certificate');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.certificateNumber || certificate.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  // Filter out enrollments that already have certificates
  const enrollmentsWithoutCertificates = enrollments.filter((enrollment: UserEnrollment & { enrollmentDate: Date }) => 
    !certificates.some(cert => cert.courseId === enrollment.courseId)
  );

  // Loading states
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {authLoading ? 'Checking authentication...' : 'Loading your certificates...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<LoadingFallback />}>
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
              <div className="text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
                  <Award className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Your Achievements</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                  Download Your <span className="text-primary">Certificates</span>
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Congratulations on completing your courses! Download your certificates to showcase your achievements
                  and advance your career.
                </p>
              </div>
            </div>
          </section>

          {/* Certificates Section */}
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {certificates.length > 0 ? (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-foreground mb-4">Your Certificates</h2>
                    <p className="text-muted-foreground">Download and share your course completion certificates</p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((certificate) => (
                      <CertificateCard 
                        key={certificate.id}
                        certificate={certificate}
                        onPreview={setPreviewCertificate}
                        onDownload={handleDownloadCertificate}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 mb-4">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No certificates yet</h3>
                  <p className="mt-1 text-gray-500">Complete a course to earn your first certificate.</p>
                  <div className="mt-6">
                    <Button onClick={() => router.push('/courses')}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Browse Courses
                    </Button>
                  </div>
                </div>
              )}

              {/* Enrolled Courses Section */}
              {enrollmentsWithoutCertificates.length > 0 && (
                <div className="mt-16">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-foreground mb-4">Your Course Progress</h2>
                    <p className="text-muted-foreground">Track your enrolled courses and certificate availability</p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {enrollmentsWithoutCertificates.map((enrollment) => (
                      <EnrollmentCard 
                        key={enrollment.id}
                        enrollment={enrollment}
                        onViewCourse={() => router.push(`/courses/${enrollment.courseId}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </Suspense>

      {/* Certificate Preview Dialog */}
      <Dialog open={!!previewCertificate} onOpenChange={(open) => !open && setPreviewCertificate(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Certificate Preview</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 max-h-[80vh] overflow-y-auto">
            {previewCertificate && (
              <div className="p-4">
                <CertificatePreview certificate={previewCertificate} />
              </div>
            )}
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setPreviewCertificate(null)}
              >
                Close
              </Button>
              <Button 
                onClick={() => previewCertificate && handleDownloadCertificate(previewCertificate)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}