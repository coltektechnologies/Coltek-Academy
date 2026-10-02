"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPage, AdminPageHeader, AdminSection, PersonAvatar, StatusBadge, formatAdminDate } from "@/components/admin/admin-ui"
import { EmptyState, ErrorState, LoadingState } from "@/components/academy/states"
import { CertificateService } from "@/lib/certificate-service"
import { downloadCertificateFile, isPdfUrl, normalizeCertUrl } from "@/lib/certificate-files"
import type { Certificate } from "@/types/certificate"

export default function AdminCertificateDetailPage() {
  const params = useParams() as { id?: string }
  const certificateId = params?.id
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<"missing" | "failed" | null>(null)

  // Admin access is enforced by app/admin/layout.tsx (AdminGuard)
  const load = useCallback(async () => {
    if (!certificateId) {
      setError("missing")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const cert = await CertificateService.getCertificateById(certificateId)
      if (cert) setCertificate(cert)
      else setError("missing")
    } catch (loadError) {
      console.error("Failed to load certificate detail:", loadError)
      setError("failed")
    } finally {
      setLoading(false)
    }
  }, [certificateId])

  useEffect(() => {
    void load()
  }, [load])

  const fileUrl = normalizeCertUrl(certificate?.certificateUrl)
  const previewUrl = normalizeCertUrl(certificate?.previewUrl || certificate?.certificateUrl)
  const verificationCode = certificate?.verificationCode || certificate?.metadata?.verificationCode
  const remarks = certificate?.metadata?.remarks

  const details: { label: string; value: React.ReactNode }[] = certificate
    ? [
        { label: "Course", value: certificate.courseName || certificate.courseTitle || "—" },
        { label: "Issued", value: formatAdminDate(certificate.issueDate) },
        { label: "Completed", value: formatAdminDate(certificate.completionDate) },
        { label: "Status", value: <StatusBadge status={certificate.status || "issued"} /> },
        ...(verificationCode ? [{ label: "Verification code", value: <span className="font-mono">{verificationCode}</span> }] : []),
        { label: "Certificate ID", value: <span className="font-mono text-xs wrap-anywhere">{certificate.id}</span> },
        ...(remarks ? [{ label: "Remarks", value: remarks }] : []),
      ]
    : []

  return (
    <AdminPage>
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/admin/certificates">
            <ArrowLeft aria-hidden="true" />
            All certificates
          </Link>
        </Button>
      </div>

      {loading ? (
        <LoadingState size="page" label="Loading certificate…" />
      ) : error === "missing" ? (
        <EmptyState
          icon={FileText}
          title="Certificate not found"
          description="It may have been deleted, or the link is incorrect."
          action={
            <Button asChild variant="outline">
              <Link href="/admin/certificates">Back to certificates</Link>
            </Button>
          }
        />
      ) : error || !certificate ? (
        <ErrorState title="Couldn't load this certificate" description="Check your connection and try again." onRetry={() => void load()} />
      ) : (
        <>
          <AdminPageHeader
            title={certificate.recipientName || "Certificate holder"}
            description={certificate.courseName || certificate.courseTitle || "Course certificate"}
            actions={
              fileUrl ? (
                <>
                  <Button asChild variant="outline">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink aria-hidden="true" />
                      Open file
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </Button>
                  <Button onClick={() => void downloadCertificateFile(fileUrl, `certificate-${certificate.id}${isPdfUrl(fileUrl) ? ".pdf" : ""}`)}>
                    <Download aria-hidden="true" />
                    Download
                  </Button>
                </>
              ) : undefined
            }
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <AdminSection title="Preview" className="lg:col-span-2" contentClassName="p-3 sm:p-4">
              {previewUrl ? (
                isPdfUrl(previewUrl) ? (
                  <iframe title={`Certificate for ${certificate.recipientName}`} src={previewUrl} className="h-128 w-full rounded-lg border border-border bg-muted" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={`Certificate for ${certificate.recipientName}, ${certificate.courseName || certificate.courseTitle}`} className="max-h-128 w-full rounded-lg border border-border bg-muted object-contain" />
                )
              ) : (
                <EmptyState icon={FileText} title="No preview available" description="This certificate record has no stored file." />
              )}
            </AdminSection>

            <div className="space-y-6">
              <AdminSection title="Recipient">
                <div className="flex items-center gap-3">
                  <PersonAvatar name={certificate.recipientName} email={certificate.recipientEmail} className="size-11 text-sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{certificate.recipientName || "—"}</p>
                    <p className="truncate text-sm text-muted-foreground">{certificate.recipientEmail || "—"}</p>
                  </div>
                </div>
              </AdminSection>

              <AdminSection title="Details" contentClassName="px-5 py-2">
                <dl className="divide-y divide-border text-sm">
                  {details.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 py-3">
                      <dt className="shrink-0 text-muted-foreground">{item.label}</dt>
                      <dd className="min-w-0 text-right font-medium text-foreground">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </AdminSection>
            </div>
          </div>
        </>
      )}
    </AdminPage>
  )
}
