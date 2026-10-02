'use client';

import { useState } from 'react';
import { BookOpen, Home, LogOut, Settings, FileText, Users, GraduationCap, MessageSquareQuote, FolderKanban, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { firebase, isFirebaseConfigured } from '@/lib/firebase';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Certificates', href: '/admin/certificates', icon: FileText },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Enrollments', href: '/admin/enrollments', icon: GraduationCap },
  { name: 'Courses', href: '/admin/courses', icon: BookOpen },
  { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
  { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

// Dashboard matches only itself; other sections also match their sub-pages (e.g. /admin/certificates/123)
const isActivePath = (pathname: string, href: string) =>
  href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

function useAdminLogout() {
  const router = useRouter();
  const { toast } = useToast();
  return async () => {
    if (!isFirebaseConfigured()) return;
    try {
      await signOut(firebase.auth);
      router.replace('/admin/login');
    } catch {
      toast({ title: 'Error', description: 'Failed to log out. Please try again.', variant: 'destructive' });
    }
  };
}

/** Admin navigation links + logout. `tone="dark"` for the navy sidebar, `"light"` for the mobile sheet. */
function AdminNav({ tone, onNavigate }: { tone: 'dark' | 'light'; onNavigate?: () => void }) {
  const pathname = usePathname() || '/admin';
  const logout = useAdminLogout();
  const dark = tone === 'dark';
  const focusRing = dark
    ? 'outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/60'
    : 'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

  return (
    <>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center rounded-lg px-4 text-sm font-medium transition-colors',
                    focusRing,
                    dark
                      ? active
                        ? 'bg-primary-foreground/10 text-primary-foreground'
                        : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                      : active
                        ? 'bg-secondary font-semibold text-primary'
                        : 'text-foreground hover:bg-secondary/60',
                  )}
                >
                  <item.icon
                    className={cn('mr-3 size-5', active ? (dark ? 'text-brand-teal' : 'text-accent') : dark ? '' : 'text-muted-foreground')}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={cn('border-t p-4', dark ? 'border-primary-foreground/15' : 'border-border')}>
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            'min-h-11 w-full justify-start',
            dark ? 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground' : 'text-foreground hover:bg-secondary/60',
          )}
        >
          <LogOut className="mr-3 size-5" aria-hidden="true" />
          Log out
        </Button>
      </div>
    </>
  );
}

/** Desktop admin sidebar (from md). */
export function Sidebar() {
  return (
    <aside aria-label="Admin sidebar" className="hidden md:sticky md:top-0 md:flex md:h-screen md:shrink-0">
      <div className="flex w-64 flex-col bg-primary text-primary-foreground">
        <div aria-hidden="true" className="h-1 bg-brand-gradient" />
        <div className="flex h-16 items-center border-b border-primary-foreground/15 px-4">
          <Link href="/admin" aria-label="Coltek Academy admin, dashboard" className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/60">
            <Image src="/coltek-academy-logo-white.svg" alt="" width={117} height={40} className="h-10 w-auto" />
          </Link>
        </div>
        <AdminNav tone="dark" />
      </div>
    </aside>
  );
}

/** Mobile admin bar (below md) with the admin navigation in a sheet. */
export function AdminMobileBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground md:hidden">
      <div aria-hidden="true" className="h-1 bg-brand-gradient" />
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/admin" aria-label="Coltek Academy admin, dashboard" className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/60">
          <Image src="/coltek-academy-logo-white.svg" alt="" width={117} height={40} className="h-8 w-auto" />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open admin menu"
              className="size-11 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground/60"
            >
              <Menu className="size-6" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-full max-w-xs flex-col gap-0 p-0">
            <div aria-hidden="true" className="h-1 shrink-0 bg-brand-gradient" />
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="text-left">
                <Image src="/coltek-academy-logo.svg" alt="" width={117} height={40} className="h-9 w-auto" />
                <span className="sr-only">Admin menu</span>
              </SheetTitle>
              <SheetDescription className="sr-only">Admin sections and log out</SheetDescription>
            </SheetHeader>
            <AdminNav tone="light" onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
