import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Loading placeholder matching CourseCard's layout
export function CourseCardSkeleton() {
  return (
    <Card className="h-full gap-0 overflow-hidden py-0" aria-hidden="true">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-6 w-full" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-3/4" />
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="flex min-h-16 items-center justify-between border-t border-border px-6 py-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
    </Card>
  )
}
