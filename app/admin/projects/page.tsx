"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore"
import { Edit, ExternalLink, FolderKanban, Loader2, Plus, Trash2, Upload } from "lucide-react"

import { firebase } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface ProjectForm {
  title: string
  studentName: string
  cohort: string
  description: string
  technologies: string
  imageUrl: string
  projectUrl: string
  repoUrl: string
  courseId: string
  isPublished: boolean
  order: number
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

const isWebLink = (value: string) => /^https?:\/\/\S+$/i.test(value)

/** Resize a screenshot to at most 1280×800 and encode as JPEG so it fits in the Firestore document. */
async function fileToScreenshotDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file for the screenshot.")
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Screenshot must be 10MB or smaller.")
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1280 / bitmap.width, 800 / bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Could not prepare screenshot.")
  }
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return canvas.toDataURL("image/jpeg", 0.8)
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState<ProjectForm>(emptyForm)
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    const checkAdmin = async () => {
      if (loading) return

      if (!user) {
        router.push("/admin/login")
        return
      }

      try {
        const adminDoc = await getDoc(doc(firebase.db, "adminUsers", user.uid))
        setIsAdmin(adminDoc.exists() && adminDoc.data()?.role === "admin")
      } catch (error) {
        console.error("Failed to verify admin access:", error)
        setIsAdmin(false)
      } finally {
        setIsCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [loading, router, user])

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      const snapshot = await getDocs(collection(firebase.db, "projects"))
      const rows = snapshot.docs
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
          } as Project
        })
        .sort((a, b) => a.order - b.order)

      setProjects(rows)
    } catch (error) {
      console.error("Failed to load projects:", error)
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAdmin) {
      fetchProjects()
    }
  }, [fetchProjects, isAdmin])

  // Courses a project can be linked to
  useEffect(() => {
    if (!isAdmin) return
    getDocs(collection(firebase.db, "courses"))
      .then((snapshot) =>
        setCourses(
          snapshot.docs
            .map((item) => ({ id: item.id, title: String(item.data().title || item.id) }))
            .sort((a, b) => a.title.localeCompare(b.title)),
        ),
      )
      .catch((error) => console.error("Failed to load courses:", error))
  }, [isAdmin])

  const courseTitle = (courseId: string) => courses.find((course) => course.id === courseId)?.title

  const resetForm = () => {
    setForm(emptyForm)
    setImageFile(null)
    setEditingId(null)
  }

  const handleEdit = (project: Project) => {
    setEditingId(project.id)
    setImageFile(null)
    setForm({
      title: project.title,
      studentName: project.studentName,
      cohort: project.cohort,
      description: project.description,
      technologies: project.technologies.join(", "),
      imageUrl: project.imageUrl,
      projectUrl: project.projectUrl,
      repoUrl: project.repoUrl,
      courseId: project.courseId,
      isPublished: project.isPublished,
      order: project.order,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.title.trim() || !form.studentName.trim() || !form.description.trim()) {
      toast({
        title: "Missing details",
        description: "Project title, student name and description are required.",
        variant: "destructive",
      })
      return
    }
    if (!imageFile && !form.imageUrl.trim()) {
      toast({
        title: "Screenshot required",
        description: "Upload a screenshot or enter an https image URL.",
        variant: "destructive",
      })
      return
    }
    if (!imageFile && !form.imageUrl.startsWith("data:image/") && !/^https:\/\//i.test(form.imageUrl.trim())) {
      toast({
        title: "Invalid image URL",
        description: "The screenshot URL must start with https://",
        variant: "destructive",
      })
      return
    }
    for (const [label, value] of [
      ["Live project link", form.projectUrl],
      ["Source code link", form.repoUrl],
    ] as const) {
      if (value.trim() && !isWebLink(value.trim())) {
        toast({
          title: "Invalid link",
          description: `${label} must start with http:// or https://`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      setIsSaving(true)
      const imageUrl = imageFile ? await fileToScreenshotDataUrl(imageFile) : form.imageUrl.trim()
      const projectData = {
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

      if (editingId) {
        await updateDoc(doc(firebase.db, "projects", editingId), projectData)
      } else {
        await addDoc(collection(firebase.db, "projects"), {
          ...projectData,
          createdAt: serverTimestamp(),
        })
      }

      toast({
        title: "Saved",
        description: form.isPublished
          ? "Project saved and shown on the homepage."
          : "Project saved as a draft.",
      })
      resetForm()
      await fetchProjects()
    } catch (error) {
      console.error("Failed to save project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save project.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (project: Project) => {
    const confirmed = window.confirm(`Delete the project "${project.title}"?`)
    if (!confirmed) return

    try {
      await deleteDoc(doc(firebase.db, "projects", project.id))
      toast({
        title: "Deleted",
        description: "Project removed.",
      })
      await fetchProjects()
      if (editingId === project.id) resetForm()
    } catch (error) {
      console.error("Failed to delete project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      })
    }
  }

  if (loading || isCheckingAdmin) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>You need admin privileges to manage student projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin")}>Back to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Projects</h1>
          <p className="text-muted-foreground">
            Add real student work. Published projects appear in the Projects section of the homepage.
          </p>
        </div>
        <Button onClick={resetForm} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{editingId ? "Edit project" : "Add project"}</CardTitle>
            <CardDescription>The homepage section stays hidden until at least one project is published.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. Student portfolio website"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student name *</Label>
                  <Input
                    id="studentName"
                    value={form.studentName}
                    onChange={(event) => setForm((prev) => ({ ...prev, studentName: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cohort">Course or cohort</Label>
                  <Input
                    id="cohort"
                    value={form.cohort}
                    onChange={(event) => setForm((prev) => ({ ...prev, cohort: event.target.value }))}
                    placeholder="e.g. Web Development, 2025"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseId">Course</Label>
                <Select
                  value={form.courseId || NO_COURSE}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, courseId: value === NO_COURSE ? "" : value }))}
                >
                  <SelectTrigger id="courseId" className="w-full" aria-describedby="courseId-help">
                    <SelectValue placeholder="Not linked to a course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_COURSE}>Not linked to a course</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p id="courseId-help" className="text-xs text-muted-foreground">
                  Linked projects also appear on that course&apos;s page.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short description *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="What the project does and what the student built."
                  className="min-h-28 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="technologies">Technologies</Label>
                <Input
                  id="technologies"
                  value={form.technologies}
                  onChange={(event) => setForm((prev) => ({ ...prev, technologies: event.target.value }))}
                  placeholder="e.g. React, Node.js, Firebase"
                  aria-describedby="technologies-help"
                />
                <p id="technologies-help" className="text-xs text-muted-foreground">
                  Separate technologies with commas.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageFile">Screenshot *</Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                />
                {imageFile ? (
                  <p className="text-xs text-muted-foreground">
                    <Upload className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    {imageFile.name} (resized to 1280px wide when saved)
                  </p>
                ) : form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imageUrl} alt="Current screenshot" className="aspect-video w-full rounded-lg border object-cover" />
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Or screenshot URL</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                  placeholder={form.imageUrl.startsWith("data:") ? "Uploaded image in use" : "https://..."}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectUrl">Live project link</Label>
                  <Input
                    id="projectUrl"
                    type="url"
                    value={form.projectUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, projectUrl: event.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repoUrl">Source code link</Label>
                  <Input
                    id="repoUrl"
                    type="url"
                    value={form.repoUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, repoUrl: event.target.value }))}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display order</Label>
                <Input
                  id="order"
                  type="number"
                  value={form.order}
                  onChange={(event) => setForm((prev) => ({ ...prev, order: Number(event.target.value) }))}
                  className="w-32"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="published">Published</Label>
                  <p className="text-sm text-muted-foreground">Show this project on the homepage.</p>
                </div>
                <Switch
                  id="published"
                  checked={form.isPublished}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" loading={isSaving}>
                  {editingId ? "Update project" : "Save project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>All projects</CardTitle>
            <CardDescription>
              {projects.length} project{projects.length === 1 ? "" : "s"} saved ·{" "}
              {projects.filter((project) => project.isPublished).length} published
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex min-h-40 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <FolderKanban className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="font-medium">No projects yet</p>
                <p className="text-sm text-muted-foreground">Add the first student project from the form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <article key={project.id} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row">
                    {project.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.imageUrl}
                        alt=""
                        className="aspect-video w-full shrink-0 rounded-md border object-cover sm:w-40"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{project.title}</h3>
                        <Badge variant={project.isPublished ? "success" : "secondary"}>
                          {project.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Order {project.order}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.studentName}
                        {project.cohort && ` · ${project.cohort}`}
                      </p>
                      {project.courseId && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Course: <span className="font-medium text-foreground">{courseTitle(project.courseId) || project.courseId}</span>
                        </p>
                      )}
                      <p className="mt-2 line-clamp-2 text-sm text-foreground">{project.description}</p>
                      {project.technologies.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {project.technologies.map((tech) => (
                            <Badge key={tech} variant="outline">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Live project <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2 sm:flex-col">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(project)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
