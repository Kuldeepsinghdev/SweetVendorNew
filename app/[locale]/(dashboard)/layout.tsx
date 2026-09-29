import { requireRole } from '@/lib/auth/rbac';
import { logoutAction } from '@/lib/actions/auth';
import { isLocale } from '@/src/lib/locale';
import { notFound } from 'next/navigation';

/**
 * Server-side guard for every route in the (dashboard) group.
 * Enforces at least `kendra` role; the middleware already blocked
 * unauthenticated requests, but this is the authoritative check.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const hi = locale === 'hi';

  const session = await requireRole('kendra');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="text-xs">
          <span className="font-black text-amber-300">{session.name}</span>
          <span className="text-slate-400"> · {session.role}</span>
        </div>
        <form action={logoutAction}>
          {/* Carry the active locale so post-logout returns to /<locale>/admin. */}
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg"
          >
            {hi ? 'लॉगआउट' : 'Logout'}
          </button>
        </form>
      </header>
      <div className="p-4">{children}</div>
    </div>
  );
}
