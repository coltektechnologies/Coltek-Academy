'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/academy/states';
import { useAuth } from '@/hooks/use-auth';
import { firebase } from '@/lib/firebase';
import { isAdminUser } from '@/lib/admin-access'

type Access = 'checking' | 'admin' | 'denied';

/**
 * Renders admin pages only for admins. An admin is a signed-in user with the `admin`
 * custom claim, users/{uid}.role === 'admin' or adminUsers/{uid}.role === 'admin'
 * (the same three markers the Firestore rules accept). Signed-out visitors go to /admin/login.
 *
 * This is the UI gate; the data itself is protected by firestore.rules.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [access, setAccess] = useState<Access>('checking');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/admin/login');
      return;
    }

    let cancelled = false;
    setAccess('checking');
    (async () => {
      try {
        const isAdmin = await isAdminUser(user);
        if (!cancelled) setAccess(isAdmin ? 'admin' : 'denied');
      } catch (error) {
        console.error('[AdminGuard] Could not verify admin access', error);
        if (!cancelled) setAccess('denied');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, router]);

  if (loading || !user || access === 'checking') {
    return <LoadingState size="page" label="Checking admin access…" />;
  }

  if (access === 'denied') {
    return (
      <main id="main" className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive-subtle text-destructive">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Admin access required</h1>
          <p className="mt-2 text-muted-foreground">
            You&apos;re signed in as {user.email || 'this account'}, which doesn&apos;t have admin access.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/">Go to the homepage</Link>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut(firebase.auth).catch(() => undefined);
                router.replace('/admin/login');
              }}
            >
              Use another account
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
