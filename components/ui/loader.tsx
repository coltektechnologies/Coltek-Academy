import { Loader2 } from "lucide-react"

// Full-screen loading overlay used by route loading files. No decorative ping animation (DESIGN_SYSTEM.md §22).
export default function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 shadow-lg">
        <Loader2 className="size-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
        <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  )
}
