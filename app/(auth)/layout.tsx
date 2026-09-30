import type { ReactNode } from 'react';

/**
 * Public authentication routes layout.
 * Allows unauthenticated access for:
 * - Customer/Mitra login
 * - Admin login
 * - Mitra application signup
 * - Password reset
 *
 * No auth checks here; middleware allows these routes.
 * Authentication validation happens in individual pages if needed.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
