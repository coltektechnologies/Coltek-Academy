"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { collection, getCountFromServer, getDocs, query, where } from "firebase/firestore"
import {
  ArrowRight,
  Award,
  BookOpen,
  FolderKanban,
  GraduationCap,
  MessageSquareQuote,
  UserPlus,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { IssueCertificate } from "@/components/admin/issue-certificate"
import { ManualEnrollmentModal } from "@/components/admin/manual-enrollment-modal"
import { ActivityItem } from "@/components/activity/activity-item"
import {
  AdminPage,
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  PersonAvatar,
  StatusBadge,
  formatAdminDate,
} from "@/components/admin/admin-ui"
import { EmptyState, ErrorState, LoadingState } from "@/components/academy/states"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { firebase } from "@/lib/firebase"
import { getAllEnrollments } from "@/lib/enrollment"
import { getRecentActivities } from "@/lib/activity-service"
import type { UserEnrollment } from "@/lib/types"
import type { Activity } from "@/types/activity"

interface StudentRow {
  id: string
  email: string
  displayName: string
  role?: string
  photoURL?: string
  createdAt?: string
}

interface CourseOption {
  id: string
  title: string
  isPublished: boolean
}

interface Stats {
  students: number
  activeEnrollments: number
  certificatesIssued: number
  publishedCourses: number
  totalCourses: number
}

const QUICK_LINKS = [
  { label: "Courses", description: "Create, edit and publish courses", href: "/admin/courses", icon: BookOpen },
  { label: "Testimonials", description: "Manage student testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
  { label: "Student projects", description: "Showcase student work", href: "/admin/projects", icon: FolderKanban },
  { label: "Users", description: "Student and admin accounts", href: "/admin/users", icon: Users },
]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<StudentRow[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const db = firebase.db
      const [usersSnap, coursesSnap, enrollmentList, studentCount, certificateCount] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "courses")),
        getAllEnrollments(),
        getCountFromServer(query(collection(db, "users"), where("role", "==", "student"))),
        getCountFromServer(query(collection(db, "certificates"), where("status", "==", "issued"))),
      ])

      const userRows = usersSnap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          email: data.email || "",
          displayName: data.displayName || "",
          role: data.role || "student",
          photoURL: data.photoURL || "",
          createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
        }
      })
      const courseRows = coursesSnap.docs.map((d) => ({
        id: d.id,
        title: String(d.data().title || "Untitled course"),
        isPublished: d.data().isPublished === true,
      }))

      setUsers(userRows)
      setCourses(courseRows)
      setEnrollments(enrollmentList)
      setStats({
        students: studentCount.data().count,
        activeEnrollments: enrollmentList.filter((e) => String(e.status).toLowerCase() === "active").length,
        certificatesIssued: certificateCount.data().count,
        publishedCourses: courseRows.filter((c) => c.isPublished).length,
        totalCourses: courseRows.length,
      })

      // Activity is optional: the dashboard still works if it fails
      getRecentActivities(6)
        .then(setActivities)
        .catch((activityError) => console.error("Error loading activity:", activityError))
    } catch (loadError) {
      console.error("Error loading dashboard:", loadError)
      setError(true)
      toast({ title: "Couldn't load the dashboard", description: "Please try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  // Newest student accounts first (admins excluded)
  const newestStudents = useMemo(
    () =>
      users
        .filter((u) => u.role !== "admin")
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .slice(0, 5),
    [users],
  )

  const firstName = (user?.displayName || "").trim().split(/\s+/)[0]

  return (
    <AdminPage>
      <AdminPageHeader
        title="Dashboard"
        description={firstName ? `Welcome back, ${firstName}. Here's what's happening at Coltek Academy.` : "Here's what's happening at Coltek Academy."}
        actions={
          <>
            <Button variant="outline" onClick={() => setEnrollOpen(true)}>
              <UserPlus aria-hidden="true" />
              Enroll a student
            </Button>
            <IssueCertificate users={users} courses={courses}>
              <Button>
                <Award aria-hidden="true" />
                Issue certificate
              </Button>
            </IssueCertificate>
          </>
        }
      />

      {error ? (
        <ErrorState title="Couldn't load the dashboard" description="Check your connection and try again." onRetry={() => void load()} />
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Student accounts" value={stats?.students} icon={Users} href="/admin/users" />
            <AdminStatCard label="Active enrollments" value={stats?.activeEnrollments} icon={GraduationCap} href="/admin/enrollments" />
            <AdminStatCard label="Certificates issued" value={stats?.certificatesIssued} icon={Award} href="/admin/certificates" />
            <AdminStatCard
              label="Published courses"
              value={stats?.publishedCourses}
              icon={BookOpen}
              href="/admin/courses"
              hint={stats ? `${stats.totalCourses} course${stats.totalCourses === 1 ? "" : "s"} in total` : undefined}
            />
          </dl>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <AdminSection
              title="Recent enrollments"
              description="The latest students to join a course"
              className="lg:col-span-2"
              contentClassName="p-0"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/enrollments">
                    View all
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              }
            >
              {loading ? (
                <LoadingState label="Loading enrollments…" />
              ) : enrollments.length === 0 ? (
                <EmptyState title="No enrollments yet" description="New enrollments appear here as students join courses." className="m-5" />
              ) : (
                <ul className="divide-y divide-border">
                  {enrollments.slice(0, 6).map((enrollment) => {
                    const name = `${enrollment.personalInfo?.firstName || ""} ${enrollment.personalInfo?.lastName || ""}`.trim()
                    return (
                      <li key={enrollment.id} className="flex items-center gap-3 px-5 py-3">
                        <PersonAvatar name={name} email={enrollment.userEmail} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{name || enrollment.userEmail || "Student"}</p>
                          <p className="truncate text-sm text-muted-foreground">{enrollment.courseTitle || "Course"}</p>
                        </div>
                        <div className="hidden shrink-0 text-right sm:block">
                          <p className="text-sm text-muted-foreground tabular-nums">{formatAdminDate(enrollment.enrollmentDate)}</p>
                        </div>
                        <StatusBadge status={String(enrollment.status || "active")} />
                      </li>
                    )
                  })}
                </ul>
              )}
            </AdminSection>

            <AdminSection title="Manage" description="Jump to a section" contentClassName="p-2">
              <ul>
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                        <link.icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">{link.label}</span>
                        <span className="block truncate text-sm text-muted-foreground">{link.description}</span>
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </AdminSection>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AdminSection
              title="Newest students"
              description="Most recent sign-ups"
              contentClassName="p-0"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/users">
                    All users
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              }
            >
              {loading ? (
                <LoadingState label="Loading students…" />
              ) : newestStudents.length === 0 ? (
                <EmptyState title="No student accounts yet" className="m-5" />
              ) : (
                <ul className="divide-y divide-border">
                  {newestStudents.map((student) => (
                    <li key={student.id} className="flex items-center gap-3 px-5 py-3">
                      <PersonAvatar name={student.displayName} email={student.email} photoURL={student.photoURL} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{student.displayName || "No name"}</p>
                        <p className="truncate text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{formatAdminDate(student.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminSection>

            <AdminSection title="Recent activity" description="Certificates and other admin actions" contentClassName="p-2">
              {loading ? (
                <LoadingState label="Loading activity…" />
              ) : activities.length === 0 ? (
                <EmptyState title="No activity yet" description="Issued certificates will show up here." className="m-3" />
              ) : (
                <div className="space-y-1">
                  {activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </AdminSection>
          </div>
        </>
      )}

      <ManualEnrollmentModal isOpen={enrollOpen} onClose={() => setEnrollOpen(false)} onSuccess={() => void load(true)} />
    </AdminPage>
  )
}
