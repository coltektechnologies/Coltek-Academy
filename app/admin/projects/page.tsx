"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore"
import { ExternalLink, Eye, EyeOff, FolderKanban, Github, ImageIcon, MoreHorizontal, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { AdminPage, AdminPageHeader, AdminSearch, AdminToolbar, StatusBadge } from "@/components/admin/admin-ui"
import { EmptyState, ErrorState, LoadingState } from "@/components/academy/states"
import { useToast } from "@/hooks/use-toast"
import { firebase } from "@/lib/firebase"
import { cn } from "@/lib/utils"

// Radix Select cannot use an empty value, so "no course" has its own sentinel
const NO_COURSE = "none"

interface Project {
  id: string
  title: string
  studentName: string
  cohort: string
  description: string
  technologies: string[]
  imageUrl: string
  projectUrl: string
  repoUrl: string
  courseId: string
  isPublished: boolean
  order: number
}

interface ProjectForm extends Omit<Project, "id" | "technologies"> {
  technologies: string
}

const emptyForm: ProjectForm = {
  title: "",
  studentName: "",
  cohort: "",
  description: "",
  technologies: "",
  imageUrl: "",
  projectUrl: "",
  repoUrl: "",
  courseId: "",
  isPublished: true,
  order: 0,
}

const FILTERS = ["all", "published", "draft"] as const
type Filter = (typeof FILTERS)[number]

const isWebLink = (value: string) => /^https?:\/\/\S+$/i.test(value)

/** Resize a screenshot to at most 1280×800 and encode as JPEG so it fits in the Firestore document. */
async function fileToScreenshotDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file for the screenshot.")
  if (file.size > 10 * 1024 * 1024) throw new Error("The screenshot must be 10 MB or smaller.")
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1280 / bitmap.width, 800 / bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not prepare the screenshot.")
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", 0.8)
}

export default function AdminProjectsPage() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProjectForm>(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Admin access is enforced by app/admin/layout.tsx (AdminGuard)
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [projectSnap, courseSnap] = await Promise.all([getDocs(collection(firebase.db, "projects")), getDocs(collection(firebase.db, "courses"))])
      setProjects(
        projectSnap.docs
          .map((item) => {
            const data = item.data()
            return {
              id: item.id,
              title: data.title || "",
              studentName: data.studentName || "",
              cohort: data.cohort || "",
              description: data.description || "",
              technologies: Array.isArray(data.technologies) ? data.technologies : [],
              imageUrl: data.imageUrl || "",
              projectUrl: data.projectUrl || "",
              repoUrl: data.repoUrl || "",
              courseId: data.courseId || "",
              isPublished: data.isPublished === true,
              order: Number.isFinite(Number(data.order)) ? Number(data.order) : 999,
            }
          })
          .sort((a, b) => a.order - b.order),
      )
      setCourses(
        courseSnap.docs
          .map((item) => ({ id: item.id, title: String(item.data().title || item.id) }))
          .sort((a, b) => a.title.localeCompare(b.title)),
      )
    } catch (loadError) {
      console.error("Failed to load projects:", loadError)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const courseTitle = (courseId: string) => courses.find((course) => course.id === courseId)?.title

  const counts = useMemo(
    () => ({ all: projects.length, published: projects.filter((p) => p.isPublished).length, draft: projects.filter((p) => !p.isPublished).length }),
    [projects],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects.filter((p) => {
      if (filter === "published" && !p.isPublished) return false
      if (filter === "draft" && p.isPublished) return false
      return !q || [p.title, p.studentName, p.cohort, p.description, ...p.technologies].some((v) => v.toLowerCase().includes(q))
    })
  }, [projects, search, filter])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, order: projects.length ? Math.max(...projects.map((p) => p.order)) + 1 : 0 })
    setImageFile(null)
    setImagePreview("")
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (p: Project) => {
    setEditingId(p.id)
    setForm({ ...p, technologies: p.technologies.join(", ") })
    setImageFile(null)
    setImagePreview(p.imageUrl)
    setFormError(null)
    setFormOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim() || !form.studentName.trim() || !form.description.trim()) {
      setFormError("Project title, student name and description are required.")
      return
    }
    if (!imageFile && !form.imageUrl.trim()) {
      setFormError("Upload a screenshot or enter an https image link.")
      return
    }
    if (!imageFile && !form.imageUrl.startsWith("data:image/") && !/^https:\/\//i.test(form.imageUrl.trim())) {
      setFormError("The screenshot link must start with https://")
      return
    }
    for (const [label, value] of [
      ["Live project link", form.projectUrl],
      ["Source code link", form.repoUrl],
    ] as const) {
      if (value.trim() && !isWebLink(value.trim())) {
        setFormError(`${label} must start with http:// or https://`)
        return
      }
    }

    setSaving(true)
    setFormError(null)
    try {
      const imageUrl = imageFile ? await fileToScreenshotDataUrl(imageFile) : form.imageUrl.trim()
      const data = {
        title: form.title.trim(),
        studentName: form.studentName.trim(),
        cohort: form.cohort.trim(),
        description: form.description.trim(),
        technologies: form.technologies
          .split(",")
          .map((tech) => tech.trim())
          .filter(Boolean),
        imageUrl,
        projectUrl: form.projectUrl.trim(),
        repoUrl: form.repoUrl.trim(),
        courseId: form.courseId,
        isPublished: form.isPublished,
        order: Number(form.order) || 0,
        updatedAt: serverTimestamp(),
      }
      if (editingId) await updateDoc(doc(firebase.db, "projects", editingId), data)
      else await addDoc(collection(firebase.db, "projects"), { ...data, createdAt: serverTimestamp() })
      toast({ title: editingId ? "Project updated" : "Project added", description: data.title })
      setFormOpen(false)
      await load(true)
    } catch (saveError) {
      console.error("Failed to save project:", saveError)
      setFormError(saveError instanceof Error && saveError.message.includes("screenshot") ? saveError.message : "The project couldn't be saved. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (p: Project) => {
    try {
      await updateDoc(doc(firebase.db, "projects", p.id), { isPublished: !p.isPublished, updatedAt: serverTimestamp() })
      toast({ title: p.isPublished ? "Moved to drafts" : "Published", description: p.title })
      await load(true)
    } catch (toggleError) {
      console.error(toggleError)
      toast({ title: "Couldn't update the project", variant: "destructive" })
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteDoc(doc(firebase.db, "projects", toDelete.id))
      toast({ title: "Project deleted", description: toDelete.title })
      setToDelete(null)
      await load(true)
    } catch (deleteError) {
      console.error(deleteError)
      toast({ title: "Couldn't delete the project", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const setField = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <AdminPage>
      <AdminPageHeader
        title="Student projects"
        description="Published projects appear on the homepage and on the course they were built in. Add real student work only."
        meta={
          !loading && !error ? (
            <>
              <span>
                <strong className="font-semibold text-foreground tabular-nums">{counts.published}</strong> published
              </span>
              <span>
                <strong className="font-semibold text-foreground tabular-nums">{counts.draft}</strong> drafts
              </span>
            </>
          ) : undefined
        }
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" />
            Add project
          </Button>
        }
      />

      {loading ? (
        <LoadingState size="page" label="Loading projects…" />
      ) : error ? (
        <ErrorState title="Couldn't load projects" description="Check your connection and try again." onRetry={() => void load()} />
      ) : (
        <>
          <AdminToolbar>
            <AdminSearch value={search} onChange={setSearch} placeholder="Search title, student or technology" label="Search projects" />
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
                  {key === "all" ? "All" : key === "published" ? "Published" : "Drafts"}
                  <span className={cn("tabular-nums", filter === key ? "text-primary-foreground/80" : "text-muted-foreground")}>{counts[key]}</span>
                </button>
              ))}
            </div>
          </AdminToolbar>

          {filtered.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title={projects.length === 0 ? "No student projects yet" : "No projects match"}
              description={projects.length === 0 ? "Add a project a student built during a course to showcase it on the website." : "Try a different search or filter."}
              action={
                projects.length === 0 ? (
                  <Button onClick={openCreate}>
                    <Plus aria-hidden="true" />
                    Add project
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <li key={p.id} className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm", !p.isPublished && "border-dashed")}>
                  <div className="relative aspect-video bg-muted">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={`Screenshot of ${p.title}`} className="absolute inset-0 size-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-8" aria-hidden="true" />
                      </div>
                    )}
                    <StatusBadge status={p.isPublished ? "published" : "draft"} className="absolute top-3 left-3 shadow-sm" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-foreground">{p.title}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {p.studentName}
                          {p.cohort && ` · ${p.cohort}`}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${p.title}`}>
                            <MoreHorizontal aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onSelect={() => openEdit(p)}>
                            <Pencil aria-hidden="true" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void togglePublished(p)}>
                            {p.isPublished ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                            {p.isPublished ? "Unpublish" : "Publish"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(p)}>
                            <Trash2 aria-hidden="true" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                    {p.technologies.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Technologies">
                        {p.technologies.slice(0, 5).map((tech) => (
                          <li key={tech}>
                            <Badge variant="outline">{tech}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
                      <span className="mr-auto text-muted-foreground">{courseTitle(p.courseId) || "No course linked"}</span>
                      {p.projectUrl && (
                        <a href={p.projectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                          <ExternalLink className="size-4" aria-hidden="true" />
                          Live
                          <span className="sr-only"> site for {p.title} (opens in a new tab)</span>
                        </a>
                      )}
                      {p.repoUrl && (
                        <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                          <Github className="size-4" aria-hidden="true" />
                          Code
                          <span className="sr-only"> for {p.title} (opens in a new tab)</span>
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Add / edit */}
      <Dialog open={formOpen} onOpenChange={(open) => !saving && setFormOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit project" : "Add student project"}</DialogTitle>
              <DialogDescription>Only add projects students built, with their permission.</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <span className="text-sm font-medium leading-none">Screenshot *</span>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted sm:w-48">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-6" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-image" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs hover:bg-muted has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50">
                      <Upload className="size-4" aria-hidden="true" />
                      {imagePreview ? "Change screenshot" : "Upload screenshot"}
                      <input
                        id="p-image"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setImageFile(file)
                          if (file) setImagePreview(URL.createObjectURL(file))
                        }}
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground">Up to 10 MB · resized to 1280×800</p>
                  </div>
                </div>
                {!imageFile && (
                  <div className="space-y-2 pt-1">
                    <Label htmlFor="p-image-url" className="text-muted-foreground">
                      …or an https image link
                    </Label>
                    <Input
                      id="p-image-url"
                      value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                      placeholder={form.imageUrl.startsWith("data:") ? "Uploaded screenshot in use" : "https://"}
                      onChange={(e) => {
                        setField("imageUrl", e.target.value)
                        setImagePreview(e.target.value)
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="p-title">Project title *</Label>
                  <Input id="p-title" value={form.title} onChange={(e) => setField("title", e.target.value)} required aria-required="true" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-student">Student name *</Label>
                  <Input id="p-student" value={form.studentName} onChange={(e) => setField("studentName", e.target.value)} required aria-required="true" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-description">Description *</Label>
                <Textarea id="p-description" rows={4} value={form.description} onChange={(e) => setField("description", e.target.value)} required aria-required="true" />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="p-course">Built in course</Label>
                  <Select value={form.courseId || NO_COURSE} onValueChange={(value) => setField("courseId", value === NO_COURSE ? "" : value)}>
                    <SelectTrigger id="p-course" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_COURSE}>No course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-cohort">Cohort</Label>
                  <Input id="p-cohort" value={form.cohort} onChange={(e) => setField("cohort", e.target.value)} placeholder="e.g. 2026" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-tech">Technologies</Label>
                <Input id="p-tech" value={form.technologies} onChange={(e) => setField("technologies", e.target.value)} placeholder="React, Firebase, Tailwind CSS" aria-describedby="p-tech-hint" />
                <p id="p-tech-hint" className="text-xs text-muted-foreground">
                  Separate with commas
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="p-live">Live project link</Label>
                  <Input id="p-live" type="url" value={form.projectUrl} onChange={(e) => setField("projectUrl", e.target.value)} placeholder="https://" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-repo">Source code link</Label>
                  <Input id="p-repo" type="url" value={form.repoUrl} onChange={(e) => setField("repoUrl", e.target.value)} placeholder="https://github.com/…" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                  <div>
                    <Label htmlFor="p-published">Show on the website</Label>
                    <p className="mt-1 text-sm text-muted-foreground">Turn off to keep it as a draft.</p>
                  </div>
                  <Switch id="p-published" checked={form.isPublished} onCheckedChange={(checked) => setField("isPublished", checked)} />
                </div>
                <div className="space-y-2 sm:w-32">
                  <Label htmlFor="p-order">Display order</Label>
                  <Input id="p-order" type="number" min={0} value={form.order} onChange={(e) => setField("order", Number(e.target.value))} />
                </div>
              </div>

              {formError && (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editingId ? "Save changes" : "Add project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{toDelete?.title}&rdquo; will be permanently deleted{toDelete?.isPublished ? " and removed from the website" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void confirmDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  )
}
