"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, GraduationCap, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ManualEnrollmentModal } from "@/components/admin/manual-enrollment-modal"
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
import { getAllEnrollments, updateEnrollmentStatus } from "@/lib/enrollment"
import type { UserEnrollment } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_FILTERS = ["all", "active", "completed", "cancelled"] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

function studentName(e: UserEnrollment) {
  return [e.personalInfo?.firstName, e.personalInfo?.lastName].filter(Boolean).join(" ")
}

function paymentLabel(e: UserEnrollment) {
  const method = String(e.paymentMethod || "").toLowerCase()
  if (method === "free" || (!e.paymentAmount && method !== "paystack")) return method === "manual" ? "Manual" : "Free"
  return `GH₵${Number(e.paymentAmount || 0).toLocaleString()}`
}

export default function AdminEnrollmentsPage() {
  const [rows, setRows] = useState<UserEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      setRows(await getAllEnrollments())
    } catch (loadError) {
      console.error("Error loading enrollments:", loadError)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: rows.length, active: 0, completed: 0, cancelled: 0 }
    rows.forEach((e) => {
      const key = String(e.status || "active").toLowerCase() as StatusFilter
      if (key in result) result[key]++
    })
    return result
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((e) => {
      if (status !== "all" && String(e.status || "active").toLowerCase() !== status) return false
      if (!q) return true
      return [studentName(e), e.userEmail, e.personalInfo?.email, e.courseTitle, e.paymentReference]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    })
  }, [rows, search, status])

  const uniqueStudents = useMemo(() => new Set(rows.map((e) => e.userId)).size, [rows])

  const handleMarkCompleted = async (enrollment: UserEnrollment) => {
    setUpdatingId(enrollment.id)
    try {
      await updateEnrollmentStatus(enrollment.id, "completed")
      toast({ title: "Marked as completed", description: `${studentName(enrollment) || enrollment.userEmail} · ${enrollment.courseTitle}` })
      await load(true)
    } catch (updateError) {
      console.error(updateError)
      toast({ title: "Couldn't update the enrollment", description: "Please try again.", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const markButton = (e: UserEnrollment) =>
    String(e.status || "active").toLowerCase() === "active" ? (
      <Button variant="outline" size="sm" loading={updatingId === e.id} onClick={() => void handleMarkCompleted(e)}>
        {updatingId !== e.id && <CheckCircle2 aria-hidden="true" />}
        Mark completed
      </Button>
    ) : null

  return (
    <AdminPage>
      <AdminPageHeader
        title="Enrollments"
        description="Every course enrollment, newest first. Mark a student's course as completed when they finish."
        meta={
          !loading && !error ? (
            <>
              <span>
                <strong className="font-semibold text-foreground tabular-nums">{rows.length}</strong> enrollments
              </span>
              <span>
                <strong className="font-semibold text-foreground tabular-nums">{uniqueStudents}</strong> distinct students
              </span>
            </>
          ) : undefined
        }
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus aria-hidden="true" />
            Enroll a student
          </Button>
        }
      />

      {loading ? (
        <LoadingState size="page" label="Loading enrollments…" />
      ) : error ? (
        <ErrorState title="Couldn't load enrollments" description="Check your connection and try again." onRetry={() => void load()} />
      ) : (
        <>
          <AdminToolbar>
            <AdminSearch value={search} onChange={setSearch} placeholder="Search name, email, course or reference" label="Search enrollments" />
            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
              {STATUS_FILTERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={status === key}
                  onClick={() => setStatus(key)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    status === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  <span className={cn("tabular-nums", status === key ? "text-primary-foreground/80" : "text-muted-foreground")}>{counts[key]}</span>
                </button>
              ))}
            </div>
          </AdminToolbar>

          {filtered.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={rows.length === 0 ? "No enrollments yet" : "No enrollments match"}
              description={rows.length === 0 ? "Enrollments appear here when students join a course." : "Try a different search or status."}
            />
          ) : (
            <>
              {/* Desktop table */}
              <AdminTableCard className="hidden md:block">
                <Table>
                  <TableCaption className="sr-only">Course enrollments</TableCaption>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="h-11 px-4">Student</TableHead>
                      <TableHead className="h-11 px-4">Course</TableHead>
                      <TableHead className="h-11 px-4">Enrolled</TableHead>
                      <TableHead className="h-11 px-4">Payment</TableHead>
                      <TableHead className="h-11 px-4">Status</TableHead>
                      <TableHead className="h-11 px-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <PersonAvatar name={studentName(e)} email={e.userEmail} />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{studentName(e) || "—"}</p>
                              <p className="text-muted-foreground">{e.userEmail || e.personalInfo?.email || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-64 px-4 py-3 whitespace-normal text-foreground">{e.courseTitle || e.courseId}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground tabular-nums">{formatAdminDate(e.enrollmentDate)}</TableCell>
                        <TableCell className="px-4 py-3">
                          <p className="font-medium text-foreground tabular-nums">{paymentLabel(e)}</p>
                          {e.paymentReference && <p className="max-w-48 truncate font-mono text-xs text-muted-foreground" title={e.paymentReference}>{e.paymentReference}</p>}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <StatusBadge status={String(e.status || "active")} />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">{markButton(e)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableCard>

              {/* Mobile cards */}
              <ul className="space-y-3 md:hidden" aria-label="Course enrollments">
                {filtered.map((e) => (
                  <li key={e.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <PersonAvatar name={studentName(e)} email={e.userEmail} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{studentName(e) || e.userEmail || "—"}</p>
                        <p className="truncate text-sm text-muted-foreground">{e.userEmail || e.personalInfo?.email}</p>
                      </div>
                      <StatusBadge status={String(e.status || "active")} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">Course</dt>
                        <dd className="font-medium text-foreground">{e.courseTitle || e.courseId}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Enrolled</dt>
                        <dd className="text-foreground tabular-nums">{formatAdminDate(e.enrollmentDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Payment</dt>
                        <dd className="text-foreground tabular-nums">{paymentLabel(e)}</dd>
                      </div>
                    </dl>
                    {markButton(e) && <div className="mt-4 [&>button]:w-full">{markButton(e)}</div>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <ManualEnrollmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => void load(true)} />
    </AdminPage>
  )
}
