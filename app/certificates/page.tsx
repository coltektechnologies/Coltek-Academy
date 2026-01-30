'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Award, Eye, Download, BookOpen, Clock, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CertificateService } from '@/lib/certificate-service';
import { getUserEnrollments } from '@/lib/enrollment';
import type { UserEnrollment as BaseUserEnrollment } from '@/lib/types';
import { Certificate } from '@/types/certificate';

// Extend the base UserEnrollment type with additional properties
interface UserEnrollment extends Omit<BaseUserEnrollment, 'courseId' | 'enrollmentDate'> {
  enrollmentDate: Date | string | { toDate: () => Date };
  courseTitle: string;
  instructorName: string;
  courseId: string;
  completed: boolean;
  progress: number;
}

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Extend the Certificate type with additional properties needed for the UI
interface UICertificate extends Certificate {
  // Required Certificate properties
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  courseTitle: string; // Alias for courseName for UI consistency
  recipientName: string;
  recipientEmail: string;
  issueDate: Date | string;
  completionDate: Date | string;
  certificateUrl: string;
  status: 'issued' | 'revoked' | 'pending';
  
  // Additional UI-specific properties
  instructorName: string;
  userEmail: string;
  downloadUrl?: string;
  previewUrl?: string;
  verificationCode?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
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
            <p className="font-mono text-sm">{certificate.verificationCode || 'N/A'}</p>
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
  onDownload,
  onPreview
}: {
  certificate: UICertificate;
  onDownload: (cert: UICertificate) => void;
  onPreview: (cert: UICertificate) => void;
}) => {
  const [localError, setLocalError] = useState<string | null>(null);
  
  const handlePreviewClick = useCallback(async () => {
    try {
      setLocalError(null);
      // If we already have a preview or certificate URL, use it directly
      if (certificate.previewUrl || certificate.certificateUrl) {
        onPreview(certificate);
        return;
      }
      
      // Ensure we have a valid ID before making the request
      const certId = certificate.id;
      if (!certId) {
        throw new Error('Certificate ID is required');
      }
      
      // Fetch the certificate data
      const cert = await CertificateService.getCertificateById(certId);
      if (cert) {
        const updatedCert: UICertificate = {
          ...certificate,
          id: cert.id || certId,
          courseId: cert.courseId || certificate.courseId || '',
          courseTitle: cert.courseTitle || certificate.courseTitle || 'Unnamed Course',
          instructorName: (cert as any).instructorName || certificate.instructorName || 'Instructor',
          userEmail: (cert as any).userEmail || certificate.userEmail || '',
          previewUrl: (cert as any).previewUrl || cert.certificateUrl || '',
          certificateUrl: cert.certificateUrl || certificate.certificateUrl || '',
          status: cert.status || certificate.status || 'pending'
        };
        onPreview(updatedCert);
      } else {
        onPreview(certificate);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load certificate preview';
      console.error('Error loading certificate preview:', errorMessage);
      setLocalError(errorMessage);
    }
  }, [certificate, onPreview]);

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
        <h3 className="text-xl font-semibold mb-2">{certificate.courseTitle}</h3>
        <p className="text-sm text-muted-foreground">
          Issued on {new Date(certificate.issueDate).toLocaleDateString()}
        </p>
        {localError && (
          <p className="text-sm text-destructive mt-2">{localError}</p>
        )}
      </div>
      <div className="p-6 border-t border-foreground/10">
        <div className="flex justify-between items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePreviewClick}
            className="flex items-center"
            disabled={!certificate.previewUrl && !certificate.certificateUrl}
          >
            <Eye className="h-4 w-4 mr-2" />
            {certificate.previewUrl || certificate.certificateUrl ? 'Preview' : 'No Preview'}
          </Button>
          <Button 
            size="sm"
            onClick={() => onDownload(certificate)}
            className="flex items-center"
            disabled={!certificate.certificateUrl}
          >
            <Download className="h-4 w-4 mr-2" />
            {certificate.certificateUrl ? 'Download' : 'Unavailable'}
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
  enrollment: UserEnrollment; 
  onViewCourse: () => void;
}) => {
  return (
    <div className="opacity-75 hover:opacity-100 transition-opacity border rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="p-3 rounded-lg bg-muted/50 w-fit mb-4">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{enrollment.courseTitle || 'Untitled Course'}</h3>
        <p className="text-sm text-muted-foreground">
          Enrolled on {
            enrollment.enrollmentDate instanceof Date 
              ? enrollment.enrollmentDate.toLocaleDateString()
              : typeof enrollment.enrollmentDate === 'string' 
                ? new Date(enrollment.enrollmentDate).toLocaleDateString()
                : enrollment.enrollmentDate.toDate().toLocaleDateString()
          }
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
  
  // State variables
  const [certificates, setCertificates] = useState<UICertificate[]>([]);
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewCertificate, setPreviewCertificate] = useState<UICertificate | null>(null);
  
  // Handle certificate download
  const handleDownloadCertificate = useCallback(async (certificate: UICertificate) => {
    try {
      let certUrl = certificate.certificateUrl || '';
      
      // If no direct URL, try to get the full certificate
      if (!certUrl) {
        const cert = await CertificateService.getCertificateById(certificate.id);
        if (cert?.certificateUrl) {
          certUrl = cert.certificateUrl;
        } else {
          throw new Error('Certificate URL not found');
        }
      }

      if (!certUrl) {
        throw new Error('No download URL available');
      }

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = certUrl;
      link.download = `Certificate-${certificate.id}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      setError('Failed to download certificate. Please try again.');
    }
  }, []);
  
  // Handle certificate preview
  const handlePreviewCertificate = useCallback((certificate: UICertificate) => {
    setPreviewCertificate(certificate);
  }, []);
  
  // Handle view course
  const handleViewCourse = useCallback((courseId: string) => {
    router.push(`/courses/${courseId}`);
  }, [router]);

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
        setIsLoading(true);
        setError(null);
        
        // Load certificates and map to UICertificate
        const certs = await CertificateService.getUserCertificates(user.uid);
        const uiCertificates = certs
          .map(cert => {
            try {
              const now = new Date();
              // Ensure we have all required fields with defaults
              const uiCert: UICertificate = {
                id: cert.id || '',
                userId: cert.userId || user.uid,
                courseId: cert.courseId || '',
                courseName: cert.courseName || cert.courseTitle || 'Untitled Course',
                courseTitle: cert.courseTitle || cert.courseName || 'Untitled Course',
                recipientName: cert.recipientName || user.displayName || 'Certificate Holder',
                recipientEmail: cert.recipientEmail || user.email || '',
                issueDate: cert.issueDate || now,
                completionDate: cert.completionDate || cert.issueDate || now,
                certificateUrl: cert.certificateUrl || (cert as any).fileUrl || '',
                status: cert.status || 'issued',
                instructorName: (cert as any).instructorName || 'Instructor',
                userEmail: user.email || '',
                previewUrl: (cert as any).previewUrl || '',
                verificationCode: (cert as any).verificationCode,
                metadata: {
                  ...(cert.metadata || {}),
                  ...((cert as any).metadata || {})
                }
              };
              
              return uiCert;
            } catch (error) {
              console.error('Error processing certificate:', error);
              return null;
            }
          })
          .filter((cert): cert is UICertificate => cert !== null);
        
        setCertificates(uiCertificates);
        
        // Load enrollments
        console.log('Fetching enrollments for user:', user.uid);
        const userEnrollments = await getUserEnrollments(user.uid);
        console.log('Raw enrollments from DB:', userEnrollments);
        
        const typedEnrollments: UserEnrollment[] = userEnrollments.map(enrollment => {
          let enrollmentDate: Date | string | { toDate: () => Date } = enrollment.enrollmentDate;
          
          // Handle Firestore Timestamp or string date
          if (enrollmentDate && typeof enrollmentDate === 'object' && 'toDate' in enrollmentDate) {
            enrollmentDate = (enrollmentDate as { toDate: () => Date }).toDate();
          } else if (typeof enrollmentDate === 'string') {
            enrollmentDate = new Date(enrollmentDate);
          }
          
          return {
            ...enrollment,
            enrollmentDate,
            courseTitle: (enrollment as any).courseTitle || 'Untitled Course',
            instructorName: (enrollment as any).instructorName || 'Instructor',
            courseId: (enrollment as any).courseId || '',
            completed: (enrollment as any).completed || false,
            progress: (enrollment as any).progress || 0
          };
        });
        
        console.log('Processed enrollments:', typedEnrollments);
        setEnrollments(typedEnrollments);
        
        // Debug: Check what will be rendered
        const nonCertifiedCourses = typedEnrollments.filter(
          enrollment => !uiCertificates.some(cert => cert.courseId === enrollment.courseId)
        );
        console.log('Courses without certificates:', nonCertifiedCourses);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load certificates. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading]);

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
                  View and download your earned certificates. Your achievements, all in one place.
                </p>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="py-12 md:py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {error && (
                <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 mb-8 rounded">
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-12">
                {/* Certificates Section */}
                <div>
                  <h2 className="text-2xl font-bold mb-6">Your Certificates</h2>
                  {certificates.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-lg">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No certificates yet</h3>
                      <p className="text-muted-foreground mb-6">Complete a course to earn your first certificate.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {certificates.map((certificate) => (
                        <CertificateCard
                          key={certificate.id}
                          certificate={certificate}
                          onDownload={handleDownloadCertificate}
                          onPreview={handlePreviewCertificate}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Enrolled Courses Section */}
                {enrollments.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Your Enrolled Courses</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {enrollments.map((enrollment) => {
                        console.log('Rendering enrollment:', {
                          enrollmentId: enrollment.id,
                          courseId: enrollment.courseId,
                          courseTitle: enrollment.courseTitle,
                          hasCertificate: certificates.some(cert => cert.courseId === enrollment.courseId)
                        });
                        
                        return (
                          <EnrollmentCard
                            key={enrollment.courseId}
                            enrollment={enrollment}
                            onViewCourse={() => handleViewCourse(enrollment.courseId || '')}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {enrollments.length === 0 && certificates.length === 0 && (
                  <div className="text-center">
                    <Button onClick={() => router.push('/courses')}>
                      Browse Available Courses
                    </Button>
                  </div>
                )}
              </div>
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
                disabled={!previewCertificate?.certificateUrl}
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