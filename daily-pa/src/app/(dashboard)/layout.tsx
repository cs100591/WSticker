import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
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
      <div className="min-h-screen gradient-mesh">
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="md:pl-72 pb-24 md:pb-0 min-h-screen">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </I18nProvider>
  );
}
