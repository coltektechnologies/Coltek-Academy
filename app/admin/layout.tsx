"use client"

import { usePathname } from "next/navigation"
import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminMobileBar, Sidebar } from "@/components/admin/sidebar"

// Pages reachable without admin access
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/register"]

/** Admin shell: every /admin page requires an admin and gets the sidebar (desktop) or menu bar (mobile). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""

  if (PUBLIC_ADMIN_PATHS.includes(pathname)) return <>{children}</>

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-muted">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminMobileBar />
          <main id="main" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  )
}
