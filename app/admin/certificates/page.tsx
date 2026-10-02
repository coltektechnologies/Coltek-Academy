"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { Award, Ban, Download, Eye, MoreHorizontal, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { IssueCertificate } from "@/components/admin/issue-certificate"
import {
  AdminPage,
  AdminPageHeader,
  AdminSearch,
  AdminTableCard,
  AdminToolbar,
  PersonAvatar,
  StatusBadge,
  formatAdminDate,
} from "@/components/admin/admin-ui"
import { EmptyState, ErrorState, LoadingState } from "@/components/academy/states"
import { useToast } from "@/hooks/use-toast"
import { firebase } from "@/lib/firebase"
import { CertificateService } from "@/lib/certificate-service"
import { downloadCertificateFile } from "@/lib/certificate-files"
import { cn } from "@/lib/utils"

interface CertificateRow {
  id: string
  recipientName: string
  recipientEmail: string
  courseTitle: string
  issueDate: Date | null
  status: string
  fileUrl: string
  certificateNumber: string
}

const FILTERS = ["all", "issued", "revoked"] as const
type Filter = (typeof FILTERS)[number]

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (typeof value === "object" && value && "toDate" in value) return (value as { toDate: () => Date }).toDate()
  const date = new Date(value as string)
  return Number.isNaN(date.getTime()) ? null : date
}

export default function AdminCertificatesPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<CertificateRow[]>([])
  const [users, setUsers] = useState<{ id: string; email: string; displayName: string; role?: string }[]>([])
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [confirm, setConfirm] = useState<{ row: CertificateRow; action: "revoke" | "restore" } | null>(null)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const db = firebase.db
      const [certSnap, usersSnap, coursesSnap] = await Promise.all([
        getDocs(query(collection(db, "certificates"), orderBy("issueDate", "desc"))),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "courses")),
      ])
      setRows(
        certSnap.docs.map((d) => {
          const data = d.data()
          const email = data.recipientEmail || data.userEmail || data.email || ""
          return {
            id: d.id,
            recipientName: data.recipientName || data.userName || data.displayName || email.split("@")[0] || "Certificate holder",
            recipientEmail: email,
            courseTitle: data.courseTitle || data.courseName || "Course",
            issueDate: toDate(data.issueDate),
            status: String(data.status || "issued"),
            fileUrl: data.certificateUrl || data.fileUrl || data.previewUrl || "",
            certificateNumber: data.certificateNumber || data.verificationCode || data.metadata?.verificationCode || "",
          }
        }),
      )
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, email: d.data().email || "", displayName: d.data().displayName || "", role: d.data().role })))
      setCourses(coursesSnap.docs.map((d) => ({ id: d.id, title: String(d.data().title || "Untitled course") })))
    } catch (loadError) {
      console.error("Error loading certificates:", loadError)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(
    () => ({
      all: rows.length,
      issued: rows.filter((r) => r.status.toLowerCase() === "issued").length,
      revoked: rows.filter((r) => r.status.toLowerCase() === "revoked").length,
    }),
    [rows],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter !== "all" && r.status.toLowerCase() !== filter) return false
      if (!q) return true
      return [r.recipientName, r.recipientEmail, r.courseTitle, r.certificateNumber, r.id].some((v) => v.toLowerCase().includes(q))
    })
  }, [rows, search, filter])

  const applyStatusChange = async () => {
    if (!confirm) return
    setUpdating(true)
    try {
      if (confirm.action === "revoke") await CertificateService.revokeCertificate(confirm.row.id)
      else await CertificateService.updateCertificate(confirm.row.id, { status: "issued" })
      toast({
        title: confirm.action === "revoke" ? "Certificate revoked" : "Certificate restored",
        description: `${confirm.row.recipientName} · ${confirm.row.courseTitle}`,
      })
      setConfirm(null)
      await load(true)
    } catch (updateError) {
      console.error(updateError)
      toast({ title: "Couldn't update the certificate", description: "Please try again.", variant: "destructive" })
    } finally {
      setUpdating(false)
    }
  }

  const rowActions = (row: CertificateRow) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.recipientName}'s certificate`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/admin/certificates/${row.id}`}>
            <Eye aria-hidden="true" />
            View details
          </Link>
        </DropdownMenuItem>
        {row.fileUrl && (
          <DropdownMenuItem onSelect={() => void downloadCertificateFile(row.fileUrl, `certificate-${row.id}${row.fileUrl.toLowerCase().endsWith(".pdf") ? ".pdf" : ""}`)}>
            <Download aria-hidden="true" />
            Download
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {row.status.toLowerCase() === "revoked" ? (
          <DropdownMenuItem onSelect={() => setConfirm({ row, action: "restore" })}>
            <RotateCcw aria-hidden="true" />
            Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm({ row, action: "revoke" })}>
            <Ban aria-hidden="true" />
            Revoke
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <AdminPage>
      <AdminPageHeader
        title="Certificates"
        description="Every certificate issued to students. Revoked certificates are hidden from the student's account."
        meta={
          !loading && !error ? (
            <>
              <span>
                <strong className="font-semibold text-foreground tabular-nums">{counts.issued}</strong> issued
              </span>
              {counts.revoked > 0 && (
                <span>
                  <strong className="font-semibold text-foreground tabular-nums">{counts.revoked}</strong> revoked
                </span>
              )}
            </>
          ) : undefined
        }
        actions={
          <IssueCertificate users={users} courses={courses}>
            <Button disabled={loading}>
              <Award aria-hidden="true" />
              Issue certificate
            </Button>
          </IssueCertificate>
        }
      />

      {loading ? (
        <LoadingState size="page" label="Loading certificates…" />
      ) : error ? (
        <ErrorState title="Couldn't load certificates" description="Check your connection and try again." onRetry={() => void load()} />
      ) : (
        <>
          <AdminToolbar>
            <AdminSearch value={search} onChange={setSearch} placeholder="Search student, course or certificate no." label="Search certificates" />
            <div role="group" aria-label="Filter by status" className="flex gap-1 rounded-lg border border-border bg-card p-1">
              {FILTERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    filter === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  <span className={cn("tabular-nums", filter === key ? "text-primary-foreground/80" : "text-muted-foreground")}>{counts[key]}</span>
                </button>
              ))}
            </div>
          </AdminToolbar>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Award}
              title={rows.length === 0 ? "No certificates yet" : "No certificates match"}
              description={rows.length === 0 ? "Issue a certificate when a student completes a course." : "Try a different search or filter."}
            />
          ) : (
            <>
              <AdminTableCard className="hidden md:block">
                <Table>
                  <TableCaption className="sr-only">Issued certificates</TableCaption>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="h-11 px-4">Student</TableHead>
                      <TableHead className="h-11 px-4">Course</TableHead>
                      <TableHead className="h-11 px-4">Issued</TableHead>
                      <TableHead className="h-11 px-4">Status</TableHead>
                      <TableHead className="h-11 px-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <PersonAvatar name={row.recipientName} email={row.recipientEmail} />
                            <div className="min-w-0">
                              <Link
                                href={`/admin/certificates/${row.id}`}
                                className="font-medium text-foreground underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
                              >
                                {row.recipientName}
                              </Link>
                              <p className="text-muted-foreground">{row.recipientEmail || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-64 px-4 py-3 whitespace-normal text-foreground">{row.courseTitle}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground tabular-nums">{formatAdminDate(row.issueDate)}</TableCell>
                        <TableCell className="px-4 py-3">
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">{rowActions(row)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableCard>

              <ul className="space-y-3 md:hidden" aria-label="Issued certificates">
                {filtered.map((row) => (
                  <li key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <PersonAvatar name={row.recipientName} email={row.recipientEmail} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{row.recipientName}</p>
                        <p className="text-sm text-muted-foreground">{row.courseTitle}</p>
                        <p className="mt-1 text-sm text-muted-foreground tabular-nums">Issued {formatAdminDate(row.issueDate)}</p>
                      </div>
                      {rowActions(row)}
                    </div>
                    <div className="mt-3">
                      <StatusBadge status={row.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && !updating && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.action === "revoke" ? "Revoke this certificate?" : "Restore this certificate?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "revoke"
                ? `${confirm?.row.recipientName}'s certificate for ${confirm?.row.courseTitle} will no longer appear in their account. You can restore it later.`
                : `${confirm?.row.recipientName}'s certificate for ${confirm?.row.courseTitle} will appear in their account again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void applyStatusChange()
              }}
              disabled={updating}
              className={confirm?.action === "revoke" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            >
              {updating ? "Saving…" : confirm?.action === "revoke" ? "Revoke certificate" : "Restore certificate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  )
}
