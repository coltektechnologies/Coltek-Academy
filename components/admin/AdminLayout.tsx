import { ReactNode } from 'react';

/**
 * Kept for existing admin pages. The admin shell (access check, sidebar, mobile bar)
 * now lives in app/admin/layout.tsx and wraps every admin page, so this only passes children through.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
