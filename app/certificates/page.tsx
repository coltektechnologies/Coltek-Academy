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
import { Download, Award, Lock, CheckCircle, Eye } from 'lucide-react'
import { courses } from '@/lib/data'

interface Certificate {
  id: string
  courseTitle: string
  courseId: string
  completionDate: string
  certificateUrl: string
}

export default function CertificatesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login?redirect=/certificates')
      return
    }

    // Mock certificates data - in real app, fetch from backend
    const mockCertificates: Certificate[] = [
      {
        id: '1',
        courseTitle: 'Advanced Web Development',
        courseId: 'web-dev-advanced',
        completionDate: '2024-01-15',
        certificateUrl: '/certificates/sample-certificate.pdf'
      },
      {
        id: '2',
        courseTitle: 'Data Science Fundamentals',
        courseId: 'data-science-fundamentals',
        completionDate: '2024-02-20',
        certificateUrl: '/certificates/sample-certificate-2.pdf'
      }
    ]

    setCertificates(mockCertificates)
    setLoading(false)
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
        <h2 className="text-3xl font-bold text-foreground">{user?.displayName || user?.email?.split('@')[0] || 'Student'}</h2>
        <p className="text-lg text-muted-foreground">has successfully completed the course</p>
        <h3 className="text-2xl font-semibold text-primary">{certificate.courseTitle}</h3>
        <p className="text-lg text-muted-foreground">on</p>
        <p className="text-xl font-medium">
          {new Date(certificate.completionDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Certificate Footer */}
      <div className="mt-12 flex justify-between items-end">
        <div className="text-center">
          <div className="w-32 h-1 bg-primary/50 mb-2"></div>
          <p className="text-sm text-muted-foreground">Course Instructor</p>
          <p className="font-medium">Coltek Academy</p>
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
            {certificates.length > 0 ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">Your Certificates</h2>
                  <p className="text-muted-foreground">Preview your certificates or download them as PDF</p>
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
                          Completed on {new Date(certificate.completionDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center">
                        <Badge variant="secondary" className="mb-4">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
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
            ) : (
              <div className="text-center py-20">
                <div className="mx-auto mb-6 p-6 bg-muted/50 rounded-full w-fit">
                  <Lock className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">No Certificates Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Complete your enrolled courses to earn certificates. Start learning today!
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