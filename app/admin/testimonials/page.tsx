"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore"
import { Eye, EyeOff, MessageSquareQuote, MoreHorizontal, Pencil, Plus, Star, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
import { AdminPage, AdminPageHeader, AdminSearch, AdminToolbar, PersonAvatar, StatusBadge } from "@/components/admin/admin-ui"
import { EmptyState, ErrorState, LoadingState } from "@/components/academy/states"
import { useToast } from "@/hooks/use-toast"
import { firebase } from "@/lib/firebase"
import { cn } from "@/lib/utils"

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  rating: number
  avatarUrl: string
  isPublished: boolean
  order: number
}

type TestimonialForm = Omit<Testimonial, "id">

const emptyForm: TestimonialForm = { name: "", role: "", content: "", rating: 5, avatarUrl: "", isPublished: true, order: 0 }

const FILTERS = ["all", "published", "draft"] as const
type Filter = (typeof FILTERS)[number]

/** Square-crops and compresses an avatar to a 256 px JPEG data URL (stored on the testimonial). */
async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file for the photo.")
  if (file.size > 5 * 1024 * 1024) throw new Error("The photo must be 5 MB or smaller.")
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement("canvas")
  const size = 256
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Could not prepare the photo.")
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, size, size)
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", 0.82)
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="sr-only">Rated {rating} out of 5</span>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} aria-hidden="true" className={cn("size-4", index < rating ? "fill-warning text-warning" : "text-border")} />
      ))}
    </div>
  )
}

export default function AdminTestimonialsPage() {
  const { toast } = useToast()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TestimonialForm>(emptyForm)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Testimonial | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Admin access is enforced by app/admin/layout.tsx (AdminGuard)
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const snapshot = await getDocs(collection(firebase.db, "testimonials"))
      setTestimonials(
        snapshot.docs
          .map((item) => {
            const data = item.data()
            return {
              id: item.id,
              name: data.name || "",
              role: data.role || "",
              content: data.content || "",
              rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
              avatarUrl: data.avatarUrl || "",
              isPublished: data.isPublished === true,
              order: Number.isFinite(Number(data.order)) ? Number(data.order) : 999,
            }
          })
          .sort((a, b) => a.order - b.order),
      )
    } catch (loadError) {
      console.error("Failed to load testimonials:", loadError)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(
    () => ({ all: testimonials.length, published: testimonials.filter((t) => t.isPublished).length, draft: testimonials.filter((t) => !t.isPublished).length }),
    [testimonials],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return testimonials.filter((t) => {
      if (filter === "published" && !t.isPublished) return false
      if (filter === "draft" && t.isPublished) return false
      return !q || [t.name, t.role, t.content].some((v) => v.toLowerCase().includes(q))
    })
  }, [testimonials, search, filter])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, order: testimonials.length ? Math.max(...testimonials.map((t) => t.order)) + 1 : 0 })
    setAvatarFile(null)
    setAvatarPreview("")
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (t: Testimonial) => {
    setEditingId(t.id)
    setForm({ name: t.name, role: t.role, content: t.content, rating: t.rating, avatarUrl: t.avatarUrl, isPublished: t.isPublished, order: t.order })
    setAvatarFile(null)
    setAvatarPreview(t.avatarUrl)
    setFormError(null)
    setFormOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim() || !form.role.trim() || !form.content.trim()) {
      setFormError("Name, role and testimonial are required.")
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const avatarUrl = avatarFile ? await fileToAvatarDataUrl(avatarFile) : form.avatarUrl
      const data = {
        name: form.name.trim(),
        role: form.role.trim(),
        content: form.content.trim(),
        rating: Math.min(5, Math.max(1, Number(form.rating) || 5)),
        avatarUrl,
        isPublished: form.isPublished,
        order: Number(form.order) || 0,
        updatedAt: serverTimestamp(),
      }
      if (editingId) await updateDoc(doc(firebase.db, "testimonials", editingId), data)
      else await addDoc(collection(firebase.db, "testimonials"), { ...data, createdAt: serverTimestamp() })
      toast({ title: editingId ? "Testimonial updated" : "Testimonial added", description: data.name })
      setFormOpen(false)
      await load(true)
    } catch (saveError) {
      console.error("Failed to save testimonial:", saveError)
      setFormError(saveError instanceof Error && saveError.message.includes("photo") ? saveError.message : "The testimonial couldn't be saved. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (t: Testimonial) => {
    try {
      await updateDoc(doc(firebase.db, "testimonials", t.id), { isPublished: !t.isPublished, updatedAt: serverTimestamp() })
      toast({ title: t.isPublished ? "Moved to drafts" : "Published", description: t.name })
      await load(true)
    } catch (toggleError) {
      console.error(toggleError)
      toast({ title: "Couldn't update the testimonial", variant: "destructive" })
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteDoc(doc(firebase.db, "testimonials", toDelete.id))
      toast({ title: "Testimonial deleted", description: toDelete.name })
      setToDelete(null)
      await load(true)
    } catch (deleteError) {
      console.error(deleteError)
      toast({ title: "Couldn't delete the testimonial", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Testimonials"
        description="Published testimonials appear on the homepage, in display order. Only add testimonials from real students."
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
            Add testimonial
          </Button>
        }
      />

      {loading ? (
        <LoadingState size="page" label="Loading testimonials…" />
      ) : error ? (
        <ErrorState title="Couldn't load testimonials" description="Check your connection and try again." onRetry={() => void load()} />
      ) : (
        <>
          <AdminToolbar>
            <AdminSearch value={search} onChange={setSearch} placeholder="Search name, role or text" label="Search testimonials" />
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
              icon={MessageSquareQuote}
              title={testimonials.length === 0 ? "No testimonials yet" : "No testimonials match"}
              description={testimonials.length === 0 ? "Add a testimonial from a real student to show it on the homepage." : "Try a different search or filter."}
              action={
                testimonials.length === 0 ? (
                  <Button onClick={openCreate}>
                    <Plus aria-hidden="true" />
                    Add testimonial
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => (
                <li key={t.id} className={cn("flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm", !t.isPublished && "border-dashed")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PersonAvatar name={t.name} photoURL={t.avatarUrl} className="size-11 text-sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{t.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${t.name}'s testimonial`}>
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onSelect={() => openEdit(t)}>
                          <Pencil aria-hidden="true" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void togglePublished(t)}>
                          {t.isPublished ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                          {t.isPublished ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(t)}>
                          <Trash2 aria-hidden="true" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4">
                    <Stars rating={t.rating} />
                  </div>
                  <blockquote className="mt-3 line-clamp-5 flex-1 text-sm leading-relaxed text-muted-foreground">{t.content}</blockquote>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <StatusBadge status={t.isPublished ? "published" : "draft"} />
                    <span className="text-xs text-muted-foreground tabular-nums">Order {t.order}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Add / edit */}
      <Dialog open={formOpen} onOpenChange={(open) => !saving && setFormOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit testimonial" : "Add testimonial"}</DialogTitle>
              <DialogDescription>Use the student&apos;s own words and only with their permission.</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-6">
              <div className="flex items-center gap-4">
                <PersonAvatar name={form.name} photoURL={avatarPreview} className="size-16 text-base" />
                <div className="space-y-1">
                  <Label htmlFor="t-avatar" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs hover:bg-muted has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50">
                    <Upload className="size-4" aria-hidden="true" />
                    {avatarPreview ? "Change photo" : "Upload photo"}
                    <input
                      id="t-avatar"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setAvatarFile(file)
                        if (file) setAvatarPreview(URL.createObjectURL(file))
                      }}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground">Optional · square photo, up to 5 MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="t-name">Name *</Label>
                  <Input id="t-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required aria-required="true" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-role">Role *</Label>
                  <Input id="t-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Web Development graduate" required aria-required="true" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="t-content">Testimonial *</Label>
                <Textarea id="t-content" rows={5} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} required aria-required="true" />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium leading-none">Rating</legend>
                  <div className="flex gap-1 pt-1" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={form.rating === value}
                        aria-label={`${value} star${value === 1 ? "" : "s"}`}
                        onClick={() => setForm((f) => ({ ...f, rating: value }))}
                        className="rounded-md p-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <Star aria-hidden="true" className={cn("size-6", value <= form.rating ? "fill-warning text-warning" : "text-border")} />
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="space-y-2">
                  <Label htmlFor="t-order">Display order</Label>
                  <Input id="t-order" type="number" min={0} value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                <div>
                  <Label htmlFor="t-published">Show on the website</Label>
                  <p className="mt-1 text-sm text-muted-foreground">Turn off to keep it as a draft.</p>
                </div>
                <Switch id="t-published" checked={form.isPublished} onCheckedChange={(checked) => setForm((f) => ({ ...f, isPublished: checked }))} />
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
                {editingId ? "Save changes" : "Add testimonial"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name}&apos;s testimonial will be permanently deleted{toDelete?.isPublished ? " and removed from the homepage" : ""}.
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
              {deleting ? "Deleting…" : "Delete testimonial"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  )
}
