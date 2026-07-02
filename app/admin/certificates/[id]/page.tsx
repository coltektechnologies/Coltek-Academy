"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { doc, getDoc } from 'firebase/firestore'
import { Loader2, ArrowLeft, Download, Eye } from 'lucide-react'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { firebase } from '@/lib/firebase'
import { CertificateService } from '@/lib/certificate-service'
import { useAuth } from '@/hooks/use-auth'
import type { Certificate } from '@/types/certificate'

function formatDateValue(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (!date || Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('application/pdf')
}

/**
 * Normalize a certificate URL to always be a relative path.
 * Old certificates may have stored full URLs with the domain which bypass
 * the Next.js API route and hit static hosting (404).
 */
function normalizeCertUrl(url: string | undefined): string {
  if (!url) return ''
  try {
    if (url.startsWith('http')) {
      return new URL(url).pathname
    }
  } catch {
    // Not a valid URL, return as-is
  }
  return url
}

export default function AdminCertificateDetailPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    const fetchCertificate = async () => {
      if (authLoading || !user) return
      if (!params?.id) {
        setError('Certificate ID is missing')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const [userSnapshot, adminSnapshot] = await Promise.all([
          getDoc(doc(firebase.db, 'users', user.uid)),
          getDoc(doc(firebase.db, 'adminUsers', user.uid)),
        ])

        const role = userSnapshot.exists() ? userSnapshot.data()?.role : null
        const isAdminUser =
          role === 'admin' ||
          (adminSnapshot.exists() && adminSnapshot.data()?.role === 'admin')

        if (!isAdminUser) {
          setError('Admin access required')
          setIsAdmin(false)
          return
        }
        setIsAdmin(true)

        const cert = await CertificateService.getCertificateById(params.id)
        if (!cert) {
          setError('Certificate not found')
          return
        }

        setCertificate(cert)
      } catch (err) {
        console.error('Failed to load certificate detail:', err)
        setError('Unable to load certificate details. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCertificate()
  }, [authLoading, user, params?.id])

  const handleDownload = () => {
    const url = normalizeCertUrl(certificate?.certificateUrl)
    if (!url) return

    const link = document.createElement('a')
    link.href = url
    link.download = `certificate-${certificate?.id || params.id}.pdf`
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/certificates')}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Admin certificate detail</p>
              <h1 className="text-3xl font-bold">Certificate details</h1>
            </div>
          </div>
          {certificate?.certificateUrl && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Link href={normalizeCertUrl(certificate.certificateUrl)} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Open original
                </Button>
              </Link>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading certificate details…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
            <p className="font-medium">{error}</p>
            {error === 'Certificate not found' && (
              <p className="mt-2 text-sm text-muted-foreground">Verify the certificate ID or issue a new certificate from the admin dashboard.</p>
            )}
          </div>
        ) : certificate ? (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.85fr]">
              <Card>
                <CardHeader>
                  <CardTitle>{certificate.recipientName || 'Certificate holder'}</CardTitle>
                  <p className="text-sm text-muted-foreground">{certificate.courseName || certificate.courseTitle || 'Course certificate'}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 text-sm text-foreground">
                    <div className="rounded-xl bg-muted/60 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Certificate ID</p>
                      <p className="mt-1 font-mono text-sm text-foreground">{certificate.id}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 rounded-xl bg-muted/60 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Issued on</p>
                        <p>{formatDateValue(certificate.issueDate)}</p>
                      </div>
                      <div className="space-y-1 rounded-xl bg-muted/60 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                        <Badge variant={certificate.status === 'issued' ? 'default' : 'secondary'}>
                          {certificate.status || 'issued'}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 rounded-xl bg-muted/60 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recipient email</p>
                      <p>{certificate.recipientEmail || '—'}</p>
                    </div>
                    {certificate.verificationCode && (
                      <div className="space-y-1 rounded-xl bg-muted/60 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Verification code</p>
                        <p>{certificate.verificationCode}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Certificate preview</CardTitle>
                  <p className="text-sm text-muted-foreground">Preview and download from the stored document.</p>
                </CardHeader>
                <CardContent>
                  {certificate.previewUrl ? (
                    isPdfUrl(certificate.previewUrl) ? (
                      <iframe
                        title="Certificate preview"
                        src={normalizeCertUrl(certificate.previewUrl)}
                        className="h-90 w-full rounded-3xl border border-border"
                      />
                    ) : (
                      <img
                        src={normalizeCertUrl(certificate.previewUrl)}
                        alt={`Preview for certificate ${certificate.id}`}
                        className="h-90 w-full rounded-3xl border border-border object-contain"
                      />
                    )
                  ) : certificate.certificateUrl ? (
                    <iframe
                      title="Certificate preview"
                      src={normalizeCertUrl(certificate.certificateUrl)}
                      className="h-90 w-full rounded-3xl border border-border"
                    />
                  ) : (
                    <div className="flex min-h-60 items-center justify-center rounded-3xl border border-dashed border-border bg-muted p-6 text-center text-sm text-muted-foreground">
                      Certificate preview is not available for this record.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Raw certificate metadata</h2>
              <div className="mt-4 grid gap-4 text-sm text-foreground sm:grid-cols-2">
                <div className="rounded-xl bg-muted/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Course ID</p>
                  <p>{certificate.courseId || '—'}</p>
                </div>
                <div className="rounded-xl bg-muted/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Completion date</p>
                  <p>{formatDateValue(certificate.completionDate)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  )
}
