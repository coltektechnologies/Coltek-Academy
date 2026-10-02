"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "firebase/auth"
import { Award, LayoutDashboard, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { firebase, isFirebaseConfigured } from "@/lib/firebase"
import { MAIN_NAV, PRIMARY_ACTION } from "@/lib/site"
import { cn } from "@/lib/utils"

const ACCOUNT_LINKS = [
  { label: "My dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My certificates", href: "/certificates", icon: Award },
]

const focusRing = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

function initialsOf(name?: string | null, email?: string | null) {
  const source = (name || email || "").trim()
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  return (parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CA").slice(0, 2)
}

/** Global site header (DESIGN_SYSTEM.md §15). */
export function Navbar() {
  const pathname = usePathname() || "/"
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    if (!isFirebaseConfigured()) return
    try {
      await signOut(firebase.auth)
      setMenuOpen(false)
      toast({ title: "Logged out", description: "You have been successfully logged out." })
    } catch {
      toast({ title: "Error", description: "Failed to log out. Please try again.", variant: "destructive" })
    }
  }

  const displayName = user?.displayName || user?.email || "Your account"
  const initials = initialsOf(user?.displayName, user?.email)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className={cn("shrink-0 rounded-md", focusRing)} aria-label="Coltek Academy, home">
          <Image src="/coltek-academy-logo.svg" alt="" width={117} height={40} priority className="h-9 w-auto sm:h-10" />
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => {
              const active = item.match(pathname)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150",
                      focusRing,
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                    {active && <span aria-hidden="true" className="absolute inset-x-3 -bottom-3.25 h-0.5 rounded-full bg-accent" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Desktop account area; reserved space while auth loads to avoid a flash of the wrong buttons */}
          <div className="hidden items-center gap-2 lg:flex">
            {loading ? (
              <div className="h-10 w-48" aria-hidden="true" />
            ) : user ? (
              <>
                <Button asChild>
                  <Link href={PRIMARY_ACTION.href}>{PRIMARY_ACTION.label}</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "flex size-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/15",
                      focusRing,
                    )}
                    aria-label={`Account menu for ${displayName}`}
                  >
                    {user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photoURL} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      initials
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="font-normal">
                      <span className="block truncate text-sm font-semibold text-foreground">{user.displayName || "Signed in"}</span>
                      {user.email && <span className="block truncate text-xs text-muted-foreground">{user.email}</span>}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ACCOUNT_LINKS.map((link) => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href}>
                          <link.icon aria-hidden="true" />
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout}>
                      <LogOut aria-hidden="true" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href={PRIMARY_ACTION.href}>{PRIMARY_ACTION.label}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile / tablet menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 lg:hidden" aria-label="Open menu">
                <Menu className="size-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full max-w-sm flex-col gap-0 p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="text-left">Menu</SheetTitle>
                <SheetDescription className="sr-only">Site navigation and account links</SheetDescription>
              </SheetHeader>

              <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                  {MAIN_NAV.map((item) => {
                    const active = item.match(pathname)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex min-h-12 items-center rounded-lg px-3 text-base font-medium transition-colors",
                            focusRing,
                            active ? "bg-secondary text-secondary-foreground" : "text-foreground hover:bg-muted",
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>

                {user && (
                  <div className="mt-6 border-t border-border pt-4">
                    <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your account</p>
                    <p className="mt-1 truncate px-3 text-sm text-muted-foreground">{user.email}</p>
                    <ul className="mt-2 space-y-1">
                      {ACCOUNT_LINKS.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            aria-current={pathname === link.href ? "page" : undefined}
                            className={cn("flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium text-foreground hover:bg-muted", focusRing)}
                          >
                            <link.icon className="size-5 text-muted-foreground" aria-hidden="true" />
                            {link.label}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className={cn("flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-base font-medium text-foreground hover:bg-muted", focusRing)}
                        >
                          <LogOut className="size-5 text-muted-foreground" aria-hidden="true" />
                          Log out
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </nav>

              <div className="space-y-3 border-t border-border p-5">
                <Button asChild size="lg" className="w-full">
                  <Link href={PRIMARY_ACTION.href} onClick={() => setMenuOpen(false)}>
                    {PRIMARY_ACTION.label}
                  </Link>
                </Button>
                {!user && !loading && (
                  <Button asChild size="lg" variant="outline" className="w-full">
                    <Link href="/login" onClick={() => setMenuOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
