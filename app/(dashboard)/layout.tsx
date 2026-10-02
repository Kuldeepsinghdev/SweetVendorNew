import { requireRole } from '@/lib/auth/rbac';
import { getLocale } from '@/lib/locale/server';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

/**
 * Server-side guard for every route in the (dashboard) group.
 * Enforces at least `kendra` role; the middleware already blocked
 * unauthenticated requests, but this is the authoritative check.
 * 
 * This layout wraps the entire admin dashboard with:
 * - SiteHeader (Server Component)
 * - AdminLayoutClient (2-column sidebar + content layout)
 * - SiteFooter (Server Component)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const session = await requireRole('kendra');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-orange-50 text-slate-900">
      <SiteHeader showAdminLink={false} />
      <div className="flex-1 flex flex-col">
        <AdminLayoutClient session={session} locale={locale}>
          {children}
        </AdminLayoutClient>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
