import { requireRole } from '@/lib/auth/rbac';
import { getSession } from '@/lib/auth/session';
import { getLocale } from '@/lib/locale/server';
import { loadDashboardData } from '@/lib/data/admin-dashboard';
import UnifiedAdminDashboard from '@/components/admin/UnifiedAdminDashboard';

/**
 * Unified Admin Dashboard Page
 * 
 * Server Component that:
 * - Enforces authentication with requireRole('kendra')
 * - Loads pre-filtered dashboard data based on user's role
 * - Detects locale from request headers
 * - Passes data to UnifiedAdminDashboard client component
 * 
 * @requirements 1.1-1.4, 3.1-3.4, 4.1-4.5, 5.1-5.6, 12.1-12.5
 */

// Always render fresh; this page reflects DB writes immediately.
export const dynamic = 'force-dynamic';

/**
 * Page Metadata
 */
export const metadata = {
  title: 'Admin Dashboard',
  description: 'Unified admin dashboard for Sahakar Bharati',
};

export default async function AdminDashboardPage() {
  // Get locale from request headers (set by middleware)
  const locale = await getLocale();
  const hi = locale === 'hi';

  // Enforce authentication and minimum role: kendra
  // This will redirect to /admin if unauthenticated or under-privileged
  const session = await requireRole('kendra');

  // Load dashboard data pre-filtered by role
  // The function handles all role-specific data queries server-side
  let dashboardData;
  let loadError: string | null = null;

  try {
    dashboardData = await loadDashboardData(session.role, session.sub);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    loadError = hi
      ? 'डैशबोर्ड डेटा लोड करने में विफल। कृपया पृष्ठ को ताज़ा करें।'
      : 'Failed to load dashboard data. Please refresh the page.';
    
    // Provide minimal fallback data so page doesn't crash
    dashboardData = {
      bookings: [],
      festivals: [],
    };
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-amber-950">
          {hi ? 'प्रशासन डैशबोर्ड' : 'Admin Dashboard'}
        </h1>
        <p className="text-xs text-amber-800/80 mt-1 font-medium">
          {hi
            ? `आपकी भूमिका: ${session.role === 'super_admin' ? 'सुपर व्यवस्थापक' : session.role === 'city_admin' ? 'शहर प्रशासक' : 'केंद्र प्रभारी'}`
            : `Your role: ${session.role === 'super_admin' ? 'Super Admin' : session.role === 'city_admin' ? 'City Admin' : 'Kendra Lead'}`}
        </p>
      </div>

      {/* Load Error Alert */}
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl shadow-xs">
          <p className="text-sm text-rose-800 font-medium">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition shadow-xs"
          >
            {hi ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}

      {/* Unified Dashboard Component */}
      <UnifiedAdminDashboard
        session={session}
        data={dashboardData as any}
        locale={locale}
      />

      {/* Server Component Note */}
      <div className="text-[11px] text-amber-800/60 italic text-center sm:text-left">
        {hi
          ? 'सर्वर-रेंडर किया गया। सर्वर-साइड RBAC द्वारा सुरक्षित।'
          : 'Server-rendered. Protected by server-side RBAC.'}
      </div>
    </div>
  );
}
