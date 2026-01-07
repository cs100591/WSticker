import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/actions';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { I18nProvider } from '@/lib/i18n';

// Check if dev mode skip auth is enabled
const isDevSkipAuth = process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === 'true';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dev mode: skip auth check
  if (!isDevSkipAuth) {
    const user = await getUser();
    if (!user) {
      redirect('/login');
    }
  }

  return (
    <I18nProvider>
      <DashboardShell>
        {children}
      </DashboardShell>
    </I18nProvider>
  );
}
