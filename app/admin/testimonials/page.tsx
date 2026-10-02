"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore"
import { isAdminUser } from '@/lib/admin-access'
import { Edit, Loader2, MessageSquareQuote, Plus, Star, Trash2, Upload } from "lucide-react"

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

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  rating: number
  avatarUrl: string
  isPublished: boolean
  order: number
  createdAt?: unknown
}

interface TestimonialForm {
  name: string
  role: string
  content: string
  rating: number
  avatarUrl: string
  isPublished: boolean
  order: number
}

const emptyForm: TestimonialForm = {
  name: "",
  role: "",
  content: "",
  rating: 5,
  avatarUrl: "",
  isPublished: true,
  order: 0,
}

async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file for the avatar.")
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Avatar image must be 5MB or smaller.")
  }

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement("canvas")
  const size = 256
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Could not prepare avatar image.")
  }

  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  const x = (size - width) / 2
  const y = (size - height) / 2

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, size, size)
  context.drawImage(bitmap, x, y, width, height)
  bitmap.close()

  return canvas.toDataURL("image/jpeg", 0.82)
}

export default function AdminTestimonialsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [form, setForm] = useState<TestimonialForm>(emptyForm)

  useEffect(() => {
    const checkAdmin = async () => {
      if (loading) return

      if (!user) {
        router.push("/admin/login")
        return
      }

      try {
        setIsAdmin(await isAdminUser(user))
      } catch (error) {
        console.error("Failed to verify admin access:", error)
        setIsAdmin(false)
      } finally {
        setIsCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [loading, router, user])

  const fetchTestimonials = useCallback(async () => {
    try {
      setIsLoading(true)
      const snapshot = await getDocs(collection(firebase.db, "testimonials"))
      const rows = snapshot.docs
        .map((item) => {
          const data = item.data()
          return {
            id: item.id,
            name: data.name || "",
            role: data.role || "",
            content: data.content || "",
            rating: Number(data.rating) || 5,
            avatarUrl: data.avatarUrl || "",
            isPublished: data.isPublished === true,
            order: Number.isFinite(Number(data.order)) ? Number(data.order) : 999,
            createdAt: data.createdAt,
          } as Testimonial
        })
        .sort((a, b) => a.order - b.order)

      setTestimonials(rows)
    } catch (error) {
      console.error("Failed to load testimonials:", error)
      toast({
        title: "Error",
        description: "Failed to load testimonials",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAdmin) {
      fetchTestimonials()
    }
  }, [fetchTestimonials, isAdmin])

  const resetForm = () => {
    setForm(emptyForm)
    setAvatarFile(null)
    setEditingId(null)
  }

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id)
    setAvatarFile(null)
    setForm({
      name: testimonial.name,
      role: testimonial.role,
      content: testimonial.content,
      rating: testimonial.rating,
      avatarUrl: testimonial.avatarUrl,
      isPublished: testimonial.isPublished,
      order: testimonial.order,
    })
  }

  const getAvatarUrl = async () => {
    if (!avatarFile) return form.avatarUrl

    return fileToAvatarDataUrl(avatarFile)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim() || !form.role.trim() || !form.content.trim()) {
      toast({
        title: "Missing details",
        description: "Name, role, and testimonial are required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const avatarUrl = await getAvatarUrl()
      const testimonialData = {
        name: form.name.trim(),
        role: form.role.trim(),
        content: form.content.trim(),
        rating: Math.min(5, Math.max(1, Number(form.rating) || 5)),
        avatarUrl,
        isPublished: form.isPublished,
        order: Number(form.order) || 0,
        updatedAt: serverTimestamp(),
      }

      if (editingId) {
        await updateDoc(doc(firebase.db, "testimonials", editingId), testimonialData)
      } else {
        await addDoc(collection(firebase.db, "testimonials"), {
          ...testimonialData,
          createdAt: serverTimestamp(),
        })
      }

      toast({
        title: "Saved",
        description: "Testimonial saved successfully.",
      })
      resetForm()
      await fetchTestimonials()
    } catch (error) {
      console.error("Failed to save testimonial:", error)
      toast({
        title: "Error",
        description: "Failed to save testimonial.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (testimonial: Testimonial) => {
    const confirmed = window.confirm(`Delete testimonial from ${testimonial.name}?`)
    if (!confirmed) return

    try {
      await deleteDoc(doc(firebase.db, "testimonials", testimonial.id))
      toast({
        title: "Deleted",
        description: "Testimonial removed.",
      })
      await fetchTestimonials()
      if (editingId === testimonial.id) resetForm()
    } catch (error) {
      console.error("Failed to delete testimonial:", error)
      toast({
        title: "Error",
        description: "Failed to delete testimonial.",
        variant: "destructive",
      })
    }
  }

  if (loading || isCheckingAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>You need admin privileges to manage testimonials.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin")}>Back to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground">Upload and publish student testimonials on the homepage.</p>
        </div>
        <Button onClick={resetForm} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          New Testimonial
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit testimonial" : "Add testimonial"}</CardTitle>
            <CardDescription>Published testimonials appear on the homepage automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="name">Student name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Ama Mensah"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role or course</Label>
                  <Input
                    id="role"
                    value={form.role}
                    onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                    placeholder="Web Development Student"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Testimonial</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Share what the student said..."
                  className="min-h-32 resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    min={1}
                    max={5}
                    value={form.rating}
                    onChange={(event) => setForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Display order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={form.order}
                    onChange={(event) => setForm((prev) => ({ ...prev, order: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={form.avatarUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, avatarUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarFile">Upload avatar</Label>
                <Input
                  id="avatarFile"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                />
                {avatarFile && (
                  <p className="text-xs text-muted-foreground">
                    <Upload className="mr-1 inline h-3 w-3" />
                    {avatarFile.name}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="published">Published</Label>
                  <p className="text-sm text-muted-foreground">Show this testimonial on the homepage.</p>
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
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Update" : "Publish"} Testimonial
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All testimonials</CardTitle>
            <CardDescription>{testimonials.length} testimonial{testimonials.length === 1 ? "" : "s"} saved</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex min-h-40 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : testimonials.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <MessageSquareQuote className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No testimonials yet</p>
                <p className="text-sm text-muted-foreground">Add the first student story from the form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testimonials.map((testimonial) => (
                  <article key={testimonial.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{testimonial.name}</h3>
                          <Badge variant={testimonial.isPublished ? "default" : "secondary"}>
                            {testimonial.isPublished ? "Published" : "Draft"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Order {testimonial.order}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <div className="mt-2 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < testimonial.rating
                                  ? "fill-warning text-warning"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-foreground">{testimonial.content}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(testimonial)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(testimonial)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
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
