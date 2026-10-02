"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { collection, doc, getDocs, setDoc } from "firebase/firestore"
import { BookOpen, Eye, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { firebase } from "@/lib/firebase"
import { getUserEnrollments } from "@/lib/enrollment"
import type { AuthUserRow, UserEnrollment } from "@/lib/types"
import { cn } from "@/lib/utils"

/** One row per person: their sign-in account (if any) merged with their users/{uid} profile (if any). */
interface UserRow {
  id: string
  displayName: string
  email: string
  photoURL: string
  role: string
  providers: string[]
  createdAt: string | null
  lastSignIn: string | null
  hasSignIn: boolean
  hasProfile: boolean
}

const ROLE_FILTERS = ["all", "student", "admin"] as const
type RoleFilter = (typeof ROLE_FILTERS)[number]

function providerLabel(id: string): string {
  if (id === "password") return "Email"
  if (id === "google.com") return "Google"
  if (id === "github.com") return "GitHub"
  return id.replace(".com", "")
}

export default function AdminUsersPage() {
  const { user: sessionUser } = useAuth()
  const { toast } = useToast()
  const [rows, setRows] = useState<UserRow[]>([])
  const [authListError, setAuthListError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")

  const [selected, setSelected] = useState<UserRow | null>(null)
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState({ displayName: "", role: "student" })
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!sessionUser) return
    if (!silent) setLoading(true)
    setError(false)
    setAuthListError(null)
    try {
      const profilesSnap = await getDocs(collection(firebase.db, "users"))
      const profiles = new Map(profilesSnap.docs.map((d) => [d.id, d.data()]))

      let authUsers: AuthUserRow[] = []
      const token = await sessionUser.getIdToken()
      const res = await fetch("/api/admin/auth-users", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      const body = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(body.users)) authUsers = body.users
      else setAuthListError([body.error, body.detail].filter(Boolean).join(" — ") || `Sign-in accounts could not be loaded (${res.status}).`)

      const merged: UserRow[] = authUsers.map((a) => {
        const p = profiles.get(a.uid)
        return {
          id: a.uid,
          displayName: p?.displayName || a.displayName || "",
          email: a.email || p?.email || "",
          photoURL: p?.photoURL || a.photoURL || "",
          role: p?.role || "student",
          providers: a.providers,
          createdAt: a.creationTime,
          lastSignIn: a.lastSignInTime,
          hasSignIn: true,
          hasProfile: !!p,
        }
      })
      // Profiles without a sign-in account (e.g. created by the old "add user" form)
      const authIds = new Set(authUsers.map((a) => a.uid))
      profilesSnap.docs
        .filter((d) => !authIds.has(d.id) && authUsers.length > 0)
        .forEach((d) => {
          const p = d.data()
          merged.push({
            id: d.id,
            displayName: p.displayName || "",
            email: p.email || "",
            photoURL: p.photoURL || "",
            role: p.role || "student",
            providers: [],
            createdAt: typeof p.createdAt === "string" ? p.createdAt : null,
            lastSignIn: null,
            hasSignIn: false,
            hasProfile: true,
          })
        })
      // When the sign-in list is unavailable, fall back to profiles only
      if (authUsers.length === 0) {
        profilesSnap.docs.forEach((d) => {
          const p = d.data()
          merged.push({
            id: d.id,
            displayName: p.displayName || "",
            email: p.email || "",
            photoURL: p.photoURL || "",
            role: p.role || "student",
            providers: [],
            createdAt: typeof p.createdAt === "string" ? p.createdAt : null,
            lastSignIn: null,
            hasSignIn: true,
            hasProfile: true,
          })
        })
      }

      merged.sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))
      setRows(merged)
    } catch (loadError) {
      console.error("Error loading users:", loadError)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [sessionUser])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(
    () => ({
      all: rows.length,
      student: rows.filter((r) => r.role !== "admin").length,
      admin: rows.filter((r) => r.role === "admin").length,
    }),
    [rows],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (roleFilter === "admin" && r.role !== "admin") return false
      if (roleFilter === "student" && r.role === "admin") return false
      return !q || r.displayName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    })
  }, [rows, search, roleFilter])

  const openDetails = async (row: UserRow) => {
    setSelected(row)
    setLoadingDetails(true)
    setEnrollments([])
    try {
      setEnrollments(await getUserEnrollments(row.id))
    } catch (detailError) {
      console.error(detailError)
    } finally {
      setLoadingDetails(false)
    }
  }

  const openEdit = (row: UserRow) => {
    setEditUser(row)
    setEditForm({ displayName: row.displayName, role: row.role === "admin" ? "admin" : "student" })
  }

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editUser) return
    if (!editForm.displayName.trim()) {
      toast({ title: "Name is required", variant: "destructive" })
      return
    }
    if (editUser.id === sessionUser?.uid && editForm.role !== "admin") {
      toast({ title: "You can't remove your own admin access", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      await setDoc(
        doc(firebase.db, "users", editUser.id),
        {
          uid: editUser.id,
          displayName: editForm.displayName.trim(),
          email: editUser.email,
          role: editForm.role,
          updatedAt: new Date().toISOString(),
          ...(editUser.hasProfile ? {} : { createdAt: new Date().toISOString() }),
        },
        { merge: true },
      )
      toast({ title: "User updated", description: editForm.displayName.trim() })
      setEditUser(null)
      await load(true)
    } catch (saveError) {
      console.error(saveError)
      toast({ title: "Couldn't save the user", description: "Please try again.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteUser || !sessionUser) return
    setSubmitting(true)
    try {
      const token = await sessionUser.getIdToken()
      const res = await fetch(`/api/admin/users/${encodeURIComponent(deleteUser.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "The user could not be deleted.")
      toast({ title: "User deleted", description: deleteUser.displayName || deleteUser.email })
      setDeleteUser(null)
      if (selected?.id === deleteUser.id) setSelected(null)
      await load(true)
    } catch (deleteError) {
      toast({
        title: "Couldn't delete the user",
        description: deleteError instanceof Error ? deleteError.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const rowActions = (row: UserRow) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.displayName || row.email}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => void openDetails(row)}>
          <Eye aria-hidden="true" />
          View courses
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openEdit(row)}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        {row.id !== sessionUser?.uid && row.role !== "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteUser(row)}>
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const signInLabel = (row: UserRow) => (row.hasSignIn ? (row.providers.length ? row.providers.map(providerLabel).join(", ") : "—") : "No sign-in account")

  return (
    <AdminPage>
      <AdminPageHeader
        title="Users"
        description="Student and admin accounts. Students create their own accounts when they sign up."
        meta={
          !loading && !error ? (
            <>
              <span>
                <strong className="font-semibold text-foreground tabular-nums">{counts.student}</strong> students
              </span>
              <span>
                <strong className="font-semibold text-foreground tabular-nums">{counts.admin}</strong> admins
              </span>
            </>
          ) : undefined
        }
      />

      {authListError && (
        <Alert variant="warning">
          <AlertTitle>Sign-in details unavailable</AlertTitle>
          <AlertDescription>{authListError} Showing profiles only.</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <LoadingState size="page" label="Loading users…" />
      ) : error ? (
        <ErrorState title="Couldn't load users" description="Check your connection and try again." onRetry={() => void load()} />
      ) : (
        <>
          <AdminToolbar>
            <AdminSearch value={search} onChange={setSearch} placeholder="Search name or email" label="Search users" />
            <div role="group" aria-label="Filter by role" className="flex gap-1 rounded-lg border border-border bg-card p-1">
              {ROLE_FILTERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={roleFilter === key}
                  onClick={() => setRoleFilter(key)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    roleFilter === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {key === "all" ? "All" : key === "student" ? "Students" : "Admins"}
                  <span className={cn("tabular-nums", roleFilter === key ? "text-primary-foreground/80" : "text-muted-foreground")}>{counts[key]}</span>
                </button>
              ))}
            </div>
          </AdminToolbar>

          {filtered.length === 0 ? (
            <EmptyState icon={Users} title={rows.length === 0 ? "No users yet" : "No users match"} description={rows.length === 0 ? undefined : "Try a different search or filter."} />
          ) : (
            <>
              <AdminTableCard className="hidden md:block">
                <Table>
                  <TableCaption className="sr-only">User accounts</TableCaption>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="h-11 px-4">User</TableHead>
                      <TableHead className="h-11 px-4">Role</TableHead>
                      <TableHead className="h-11 px-4">Signs in with</TableHead>
                      <TableHead className="h-11 px-4">Joined</TableHead>
                      <TableHead className="h-11 px-4">Last sign-in</TableHead>
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
                            <PersonAvatar name={row.displayName} email={row.email} photoURL={row.photoURL} />
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => void openDetails(row)}
                                className="rounded-sm text-left font-medium text-foreground underline-offset-4 hover:underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                              >
                                {row.displayName || "No name"}
                                {row.id === sessionUser?.uid && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                              </button>
                              <p className="text-muted-foreground">{row.email || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <StatusBadge status={row.role} />
                        </TableCell>
                        <TableCell className={cn("px-4 py-3", row.hasSignIn ? "text-muted-foreground" : "text-warning")}>{signInLabel(row)}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground tabular-nums">{formatAdminDate(row.createdAt)}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground tabular-nums">{formatAdminDate(row.lastSignIn)}</TableCell>
                        <TableCell className="px-4 py-3 text-right">{rowActions(row)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AdminTableCard>

              <ul className="space-y-3 md:hidden" aria-label="User accounts">
                {filtered.map((row) => (
                  <li key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <PersonAvatar name={row.displayName} email={row.email} photoURL={row.photoURL} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {row.displayName || "No name"}
                          {row.id === sessionUser?.uid && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{row.email}</p>
                        <p className={cn("mt-1 text-sm", row.hasSignIn ? "text-muted-foreground" : "text-warning")}>
                          {signInLabel(row)} · joined {formatAdminDate(row.createdAt)}
                        </p>
                      </div>
                      {rowActions(row)}
                    </div>
                    <div className="mt-3">
                      <StatusBadge status={row.role} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* User details */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="border-b border-border px-6 py-5">
                <div className="flex items-center gap-3 pr-10">
                  <PersonAvatar name={selected.displayName} email={selected.email} photoURL={selected.photoURL} className="size-12 text-sm" />
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-lg">{selected.displayName || "No name"}</SheetTitle>
                    <SheetDescription className="truncate">{selected.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Role</dt>
                    <dd className="mt-1">
                      <StatusBadge status={selected.role} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Signs in with</dt>
                    <dd className="mt-1 font-medium text-foreground">{signInLabel(selected)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Joined</dt>
                    <dd className="mt-1 font-medium text-foreground tabular-nums">{formatAdminDate(selected.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Last sign-in</dt>
                    <dd className="mt-1 font-medium text-foreground tabular-nums">{formatAdminDate(selected.lastSignIn)}</dd>
                  </div>
                </dl>

                <section aria-labelledby="user-courses-heading">
                  <h3 id="user-courses-heading" className="text-sm font-semibold text-foreground">
                    Courses
                  </h3>
                  {loadingDetails ? (
                    <LoadingState label="Loading courses…" />
                  ) : enrollments.length === 0 ? (
                    <EmptyState icon={BookOpen} title="Not enrolled in any course" className="mt-3" />
                  ) : (
                    <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
                      {enrollments.map((e) => (
                        <li key={e.id} className="flex items-start justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{e.courseTitle || e.courseId}</p>
                            <p className="text-sm text-muted-foreground tabular-nums">Enrolled {formatAdminDate(e.enrollmentDate)}</p>
                          </div>
                          <StatusBadge status={String(e.status || "active")} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
              <div className="flex gap-3 border-t border-border px-6 py-4">
                <Button variant="outline" className="flex-1" onClick={() => openEdit(selected)}>
                  <Pencil aria-hidden="true" />
                  Edit
                </Button>
                {selected.id !== sessionUser?.uid && selected.role !== "admin" && (
                  <Button variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => setDeleteUser(selected)}>
                    <Trash2 aria-hidden="true" />
                    Delete
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && !submitting && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={saveEdit}>
            <DialogHeader>
              <DialogTitle>Edit user</DialogTitle>
              <DialogDescription>{editUser?.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editForm.displayName} onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={(role) => setEditForm((f) => ({ ...f, role }))}>
                  <SelectTrigger id="edit-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin — full access to this admin panel</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">The email address is the account&apos;s sign-in and can&apos;t be changed here.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && !submitting && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteUser?.displayName || deleteUser?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUser?.hasSignIn
                ? "Their sign-in account and profile will be permanently deleted, so they can no longer log in. Their enrollment and certificate records are kept."
                : "This profile has no sign-in account. The profile will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void confirmDelete()
              }}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Deleting…" : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  )
}
