import 'server-only';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { redirect } from 'next/navigation';

/**
 * Protected customer/mitra routes layout.
 * Enforces that user is authenticated as customer OR mitra.
 *
 * Middleware also checks authentication at Edge, but this provides
 * additional server-side safety for all routes in this group.
 *
 * Unauthenticated users are redirected to /login by middleware,
 * but this guard catches edge cases.
 */
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCustomerSession();
  
  // This should rarely happen due to middleware, but provides safety
  if (!session) {
    redirect('/login');
  }

  return <>{children}</>;
}
