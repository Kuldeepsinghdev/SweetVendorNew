import { requireRole } from '@/lib/auth/rbac';
import { logoutAction } from '@/lib/actions/auth';
import { getLocale } from '@/lib/locale/server';

/**
 * Server-side guard for every route in the (dashboard) group.
 * Enforces at least `kendra` role; the middleware already blocked
 * unauthenticated requests, but this is the authoritative check.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const hi = locale === 'hi';

  const session = await requireRole('kendra');

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 text-slate-900">
      <header className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-white">
        <div className="text-xs">
          <span className="font-black text-amber-900">{session.name}</span>
          <span className="text-slate-600"> · {session.role}</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
          >
            {hi ? 'लॉगआउट' : 'Logout'}
          </button>
        </form>
      </header>
      <div className="p-4">{children}</div>
    </div>
  );
}
