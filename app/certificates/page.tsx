"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Download, Award, Lock, CheckCircle, Eye, FileText, Clock, BookOpen } from 'lucide-react'
import { CertificateService } from '@/lib/certificate-service'
import { getUserEnrollments } from '@/lib/enrollment'
import type { Certificate, UserEnrollment } from '@/lib/types'

export default function CertificatesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login?redirect=/certificates')
      return
    }

    // Fetch real certificates and enrollments from Firebase
    const fetchData = async () => {
      try {
        const [userCertificates, userEnrollments] = await Promise.all([
          CertificateService.getUserCertificates(user.uid),
          getUserEnrollments(user.uid)
        ])
        setCertificates(userCertificates)
        setEnrollments(userEnrollments)
      } catch (error) {
        console.error('Error fetching data:', error)
        // For now, keep the mock data as fallback
        const mockCertificates: Certificate[] = [
          {
            id: '1',
            userId: user.uid,
            userEmail: user.email || '',
            courseId: 'web-dev-advanced',
            courseTitle: 'Advanced Web Development',
            enrollmentId: 'enrollment-1',
            certificateNumber: 'CERT-001',
            issueDate: new Date('2024-01-15'),
            completionDate: new Date('2024-01-15'),
            instructorName: 'Coltek Academy',
            certificateUrl: '/certificates/sample-certificate.pdf',
            previewUrl: undefined,
            status: 'issued',
            metadata: {
              templateUsed: 'default',
              verificationCode: 'ABC123'
            }
          },
          {
            id: '2',
            userId: user.uid,
            userEmail: user.email || '',
            courseId: 'data-science-fundamentals',
            courseTitle: 'Data Science Fundamentals',
            enrollmentId: 'enrollment-2',
            certificateNumber: 'CERT-002',
            issueDate: new Date('2024-02-20'),
            completionDate: new Date('2024-02-20'),
            instructorName: 'Coltek Academy',
            certificateUrl: '/certificates/sample-certificate-2.pdf',
            previewUrl: undefined,
            status: 'issued',
            metadata: {
              templateUsed: 'default',
              verificationCode: 'DEF456'
            }
          }
        ]
        setCertificates(mockCertificates)
        setEnrollments([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, authLoading, router])

  const handleDownload = (certificate: Certificate) => {
    // In real app, this would trigger actual download
    const link = document.createElement('a')
    link.href = certificate.certificateUrl
    link.download = `${certificate.courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const CertificatePreview = ({ certificate }: { certificate: Certificate }) => (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-2xl border-4 border-primary/20">
      {/* Certificate Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Award className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-2">Certificate of Completion</h1>
        <div className="w-32 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Certificate Body */}
      <div className="text-center space-y-6">
        <p className="text-lg text-muted-foreground">This is to certify that</p>
        <h2 className="text-3xl font-bold text-foreground">{user?.displayName || certificate.userEmail.split('@')[0] || 'Student'}</h2>
        <p className="text-lg text-muted-foreground">has successfully completed the course</p>
        <h3 className="text-2xl font-semibold text-primary">{certificate.courseTitle}</h3>
        <p className="text-lg text-muted-foreground">on</p>
        <p className="text-xl font-medium">
          {certificate.completionDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Certificate Details */}
      <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
        <div className="text-center">
          <p className="text-muted-foreground">Certificate Number</p>
          <p className="font-mono font-medium">{certificate.certificateNumber}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Issue Date</p>
          <p className="font-medium">{certificate.issueDate.toLocaleDateString()}</p>
        </div>
      </div>

      {/* Certificate Footer */}
      <div className="mt-12 flex justify-between items-end">
        <div className="text-center">
          <div className="w-32 h-1 bg-primary/50 mb-2"></div>
          <p className="text-sm text-muted-foreground">Instructor</p>
          <p className="font-medium">{certificate.instructorName}</p>
        </div>
        <div className="text-center">
          <div className="w-32 h-1 bg-primary/50 mb-2"></div>
          <p className="text-sm text-muted-foreground">Director</p>
          <p className="font-medium">Coltek Technologies</p>
        </div>
      </div>

      {/* Certificate Seal */}
      <div className="absolute top-8 right-8 opacity-20">
        <Award className="h-24 w-24 text-primary" />
      </div>
    </div>
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your certificates...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
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
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Certificates */}
            {certificates.length > 0 && (
              <div className="space-y-8 mb-16">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">Your Certificates</h2>
                  <p className="text-muted-foreground">Congratulations! Download your earned certificates</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {certificates.map((certificate) => (
                    <Card key={certificate.id} className="group hover:shadow-lg transition-shadow">
                      <CardHeader className="text-center">
                        <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                          <Award className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{certificate.courseTitle}</CardTitle>
                        <CardDescription>
                          Completed on {certificate.completionDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center">
                        <Badge variant="secondary" className="mb-4">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Certificate Available
                        </Badge>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex-1 group-hover:border-primary/50 transition-colors"
                                onClick={() => setPreviewCertificate(certificate)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-center">Certificate Preview</DialogTitle>
                              </DialogHeader>
                              <CertificatePreview certificate={certificate} />
                              <div className="flex justify-center mt-6">
                                <Button onClick={() => handleDownload(certificate)} className="w-full max-w-xs">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Certificate
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            onClick={() => handleDownload(certificate)}
                            className="flex-1 group-hover:bg-primary/90 transition-colors"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Enrolled Courses Status */}
            {enrollments.length > 0 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">Your Course Progress</h2>
                  <p className="text-muted-foreground">Track your enrolled courses and certificate availability</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrollments.map((enrollment) => {
                    // Check if certificate exists for this enrollment
                    const hasCertificate = certificates.some(cert => cert.enrollmentId === enrollment.id)

                    return (
                      <Card key={enrollment.id} className="group hover:shadow-lg transition-shadow">
                        <CardHeader className="text-center">
                          <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-full w-fit">
                            {hasCertificate ? (
                              <Award className="h-8 w-8 text-primary" />
                            ) : (
                              <BookOpen className="h-8 w-8 text-accent" />
                            )}
                          </div>
                          <CardTitle className="text-xl">{enrollment.courseTitle}</CardTitle>
                          <CardDescription>
                            Enrolled on {enrollment.enrollmentDate.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                          <Badge
                            variant={hasCertificate ? "default" : "secondary"}
                            className="mb-4"
                          >
                            {hasCertificate ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Certificate Available
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                In Progress
                              </>
                            )}
                          </Badge>

                          {hasCertificate ? (
                            <p className="text-sm text-muted-foreground">
                              Your certificate is ready for download above
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Complete this course to earn your certificate
                              </p>
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/courses/${enrollment.courseId}`}>
                                  Continue Learning
                                </a>
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* No certificates or enrollments */}
            {certificates.length === 0 && enrollments.length === 0 && (
              <div className="text-center py-20">
                <div className="mx-auto mb-6 p-6 bg-muted/50 rounded-full w-fit">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">No Courses Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Enroll in a course to start your learning journey and earn certificates upon completion.
                </p>
                <Button asChild size="lg">
                  <a href="/courses">
                    Browse Courses
                  </a>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}