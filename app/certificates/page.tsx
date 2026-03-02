'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Award, Eye, Download, BookOpen, Clock, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CertificateService } from '@/lib/certificate-service';
import { getUserEnrollments } from '@/lib/enrollment';
import type { UserEnrollment as BaseUserEnrollment } from '@/lib/types';
import { Certificate } from '@/types/certificate';

const Navbar = dynamic(
  () => import('@/components/navbar').then((mod) => mod.Navbar),
  { ssr: false, loading: () => <div className="h-16 bg-background" /> }
);

const Footer = dynamic(
  () => import('@/components/footer').then((mod) => mod.Footer || mod),
  { ssr: false, loading: () => null }
);

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
  <div className="relative mx-auto max-w-2xl rounded-xl border-2 border-border bg-card p-8 shadow-lg dark:bg-card">
    <div className="absolute right-6 top-6 opacity-10">
      <Award className="h-20 w-20 text-primary" />
    </div>
    <div className="text-center">
      <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Certificate of Completion</h2>
      <p className="mt-2 text-muted-foreground">This certificate is proudly presented to</p>
      <div className="mt-6">
        <p className="text-2xl font-semibold text-foreground sm:text-3xl">{certificate.recipientName || certificate.userEmail}</p>
        <div className="mx-auto my-4 h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
        <p className="text-muted-foreground">for successfully completing the course</p>
        <p className="mt-2 text-lg font-semibold text-primary">{certificate.courseTitle}</p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-6 text-left">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Issued on</p>
          <p className="mt-1 font-medium text-foreground">
            {new Date(certificate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Instructor</p>
          <p className="mt-1 font-medium text-foreground">{certificate.instructorName || 'Coltek Academy'}</p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <div>
          <p className="text-xs text-muted-foreground">Certificate ID</p>
          <p className="font-mono text-sm text-foreground">{certificate.verificationCode || '—'}</p>
        </div>
        <Badge variant={certificate.status === 'issued' ? 'default' : 'secondary'}>
          {certificate.status === 'issued' ? 'Verified' : 'Pending'}
        </Badge>
      </div>
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
      if (certificate.previewUrl || certificate.certificateUrl) {
        onPreview(certificate);
        return;
      }
      const certId = certificate.id;
      if (!certId) throw new Error('Certificate ID is required');
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
      setLocalError(error instanceof Error ? error.message : 'Failed to load preview');
    }
  }, [certificate, onPreview]);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-primary/60 opacity-90" />
      <div className="p-6 pl-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-2 ring-primary/20 transition group-hover:ring-primary/30">
            <Award className="h-6 w-6" />
          </div>
          <Badge variant="secondary" className="shrink-0 font-medium">
            {certificate.status === 'issued' ? 'Verified' : 'Pending'}
          </Badge>
        </div>
        <h3 className="mt-4 text-lg font-semibold leading-tight text-foreground">
          {certificate.courseTitle}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Issued {new Date(certificate.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        {localError && (
          <p className="mt-2 text-sm text-destructive">{localError}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewClick}
            className="gap-2"
            disabled={!certificate.previewUrl && !certificate.certificateUrl}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={() => onDownload(certificate)}
            className="gap-2"
            disabled={!certificate.certificateUrl}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
    </article>
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
  const dateStr =
    enrollment.enrollmentDate instanceof Date
      ? enrollment.enrollmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : typeof enrollment.enrollmentDate === 'string'
        ? new Date(enrollment.enrollmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : (enrollment.enrollmentDate as { toDate: () => Date }).toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <article className="rounded-2xl border border-border bg-card/50 p-6 shadow-sm transition-all duration-300 hover:border-primary/15 hover:bg-card hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <BookOpen className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">
            {enrollment.courseTitle || 'Untitled Course'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Enrolled {dateStr}</p>
          <Badge variant="secondary" className="mt-3 gap-1 font-medium">
            <Clock className="h-3.5 w-3.5" />
            In progress
          </Badge>
          <p className="mt-3 text-sm text-muted-foreground">
            Complete the course to earn your certificate.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewCourse}
            className="mt-4 gap-2"
          >
            Continue learning
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
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
        
        const userEnrollments = await getUserEnrollments(user.uid);
        
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

        // Deduplicate by courseId: keep only the most recent enrollment per course
        const byCourse = new Map<string, UserEnrollment>();
        for (const e of typedEnrollments) {
          if (!e.courseId) continue;
          const existing = byCourse.get(e.courseId);
          const date = e.enrollmentDate instanceof Date ? e.enrollmentDate.getTime() : new Date(e.enrollmentDate as string).getTime();
          const existingDate = existing
            ? (existing.enrollmentDate instanceof Date ? existing.enrollmentDate.getTime() : new Date(existing.enrollmentDate as string).getTime())
            : 0;
          if (!existing || date > existingDate) byCourse.set(e.courseId, e);
        }
        const uniqueEnrollments = Array.from(byCourse.values());
        setEnrollments(uniqueEnrollments);
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {authLoading ? 'Checking authentication...' : 'Loading your achievements...'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">One moment</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Suspense fallback={<LoadingFallback />}>
        <main className="flex-1">
          {/* Hero */}
          <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_110%)]" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28">
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Your achievements
                </div>
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Your certificates
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                  View and download your earned certificates. Everything you&apos;ve achieved, in one place.
                </p>
                {(certificates.length > 0 || enrollments.length > 0) && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
                    <span className="flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-sm border border-border">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{certificates.length}</span>
                      <span className="text-muted-foreground">certificate{certificates.length !== 1 ? 's' : ''}</span>
                    </span>
                    <span className="flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-sm border border-border">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{enrollments.length}</span>
                      <span className="text-muted-foreground">in progress</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="py-12 md:py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {error && (
                <div className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-14">
                {/* Certificates */}
                <div>
                  <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Your certificates</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Download or preview your earned certificates.</p>
                  {certificates.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <FileText className="h-8 w-8" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-foreground">No certificates yet</h3>
                      <p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">
                        Complete a course to earn your first certificate. Your progress is saved—pick up where you left off.
                      </p>
                      <Button onClick={() => router.push('/courses')} className="mt-6 gap-2">
                        Browse courses
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                {/* Enrolled courses */}
                {enrollments.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Courses in progress</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Finish these to unlock more certificates.</p>
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {enrollments.map((enrollment) => (
                        <EnrollmentCard
                          key={enrollment.courseId}
                          enrollment={enrollment}
                          onViewCourse={() => handleViewCourse(enrollment.courseId || '')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {enrollments.length === 0 && certificates.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
                    <p className="text-sm text-muted-foreground mb-6">Get started by enrolling in a course.</p>
                    <Button onClick={() => router.push('/courses')} size="lg" className="gap-2">
                      Browse courses
                      <ArrowRight className="h-4 w-4" />
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
        <DialogContent className="max-w-4xl gap-0 p-0 overflow-hidden rounded-2xl">
          <div className="border-b border-border px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-lg">Certificate preview</DialogTitle>
            </DialogHeader>
          </div>
          <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
            {previewCertificate && (
              <div className="rounded-xl border border-border bg-card p-4">
                <CertificatePreview certificate={previewCertificate} />
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewCertificate(null)}>
                Close
              </Button>
              <Button
                onClick={() => previewCertificate && handleDownloadCertificate(previewCertificate)}
                disabled={!previewCertificate?.certificateUrl}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}