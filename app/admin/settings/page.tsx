'use client';

import { Info } from 'lucide-react';

import { AdminPage, AdminPageHeader, AdminSection } from '@/components/admin/admin-ui';
import { useAuth } from '@/hooks/use-auth';
import { CONTACT, SITE_NAME } from '@/lib/site';

/**
 * Read-only settings overview.
 * The previous form had no backend: it loaded hard-coded values and reported "Settings saved"
 * without saving anything (maintenance mode, registration and upload-size switches did not exist
 * anywhere in the app). Until real configurable settings exist, this page only shows the actual
 * values and where each one is managed.
 */
export default function SettingsPage() {
  const { user } = useAuth();

  const siteDetails = [
    { label: 'Site name', value: SITE_NAME },
    { label: 'Contact email', value: CONTACT.email },
    { label: 'Phone', value: CONTACT.phoneDisplay },
    { label: 'Office hours', value: CONTACT.hours },
    { label: 'Location', value: CONTACT.location },
  ];

  const managedElsewhere = [
    { label: 'Admin accounts', value: 'Granted with scripts/create-admin-user.ts (Firebase Admin).' },
    { label: 'Payments', value: 'Paystack keys are set in the hosting environment (PAYSTACK_SECRET_KEY, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY).' },
    { label: 'Emails', value: 'Contact and enrollment emails use the SMTP settings in the hosting environment.' },
    { label: 'Data access', value: 'Who can read and write data is controlled by firestore.rules.' },
  ];

  return (
    <AdminPage>
      <AdminPageHeader title="Settings" description="Current site details and where each setting is managed." />

      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info-subtle p-4 text-sm text-info" role="note">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          These settings can&apos;t be edited from the admin panel yet. Site details are kept in <code className="font-mono">lib/site.ts</code>;
          ask your developer to change them.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title="Site details" description="Shown in the site header, footer and contact page." contentClassName="px-5 py-2">
            <dl className="divide-y divide-border text-sm">
              {siteDetails.map((item) => (
                <div key={item.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium text-foreground wrap-anywhere sm:text-right">{item.value}</dd>
                </div>
              ))}
            </dl>
        </AdminSection>

        <AdminSection title="Your admin account" description="The account you are signed in with." contentClassName="px-5 py-2">
            <dl className="divide-y divide-border text-sm">
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground sm:text-right">{user?.displayName || '—'}</dd>
              </div>
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground wrap-anywhere sm:text-right">{user?.email || '—'}</dd>
              </div>
            </dl>
        </AdminSection>

        <AdminSection title="Managed outside the admin panel" className="lg:col-span-2" contentClassName="px-5 py-2">
            <dl className="divide-y divide-border text-sm">
              {managedElsewhere.map((item) => (
                <div key={item.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
                  <dt className="font-medium text-foreground sm:w-40 sm:shrink-0">{item.label}</dt>
                  <dd className="text-muted-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
        </AdminSection>
      </div>
    </AdminPage>
  );
}
