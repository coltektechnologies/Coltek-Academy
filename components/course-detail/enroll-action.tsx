"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { useAuth } from "@/hooks/use-auth"
import { checkUserEnrollment } from "@/lib/enrollment"
import { cn } from "@/lib/utils"

interface EnrollActionProps {
  courseId: string
  courseTitle: string
  upcoming: boolean
  className?: string
}

/** Enrollment button with the existing enrolled / re-enroll behaviour. */
export function EnrollAction({ courseId, courseTitle, upcoming, className }: EnrollActionProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const registerHref = `/register?course=${encodeURIComponent(courseId)}`

  useEffect(() => {
    if (!user || upcoming) {
      setIsEnrolled(false)
      return
    }
    checkUserEnrollment(user.uid, courseId)
      .then(setIsEnrolled)
      .catch(() => setIsEnrolled(false))
  }, [user, courseId, upcoming])

  if (upcoming) {
    return (
      <Button asChild size="lg" variant="outline" className={className}>
        <Link href="/courses">Browse open courses</Link>
      </Button>
    )
  }

  if (isEnrolled) {
    return (
      <>
        <Button size="lg" variant="secondary" className={className} onClick={() => setShowDialog(true)}>
          <CheckCircle aria-hidden="true" />
          Enrolled
        </Button>
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Already enrolled</AlertDialogTitle>
              <AlertDialogDescription>
                You have already enrolled in {courseTitle}. Do you wish to take it again?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push(registerHref)}>Yes, enroll again</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <Button asChild size="lg" className={className}>
      <Link href={registerHref}>Enroll now</Link>
    </Button>
  )
}

/** Fixed bottom bar on small screens so the fee and enrollment action are always visible. */
export function MobileEnrollBar({
  courseId,
  courseTitle,
  upcoming,
  priceLabel,
}: EnrollActionProps & { priceLabel: string }) {
  return (
    <div
      role="region"
      aria-label="Enrollment"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{upcoming ? "Status" : "Course fee"}</p>
          <p className={cn("truncate font-bold text-foreground", upcoming ? "text-base" : "text-lg")}>{priceLabel}</p>
        </div>
        <EnrollAction courseId={courseId} courseTitle={courseTitle} upcoming={upcoming} className="shrink-0" />
      </div>
    </div>
  )
}
