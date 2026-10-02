'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { SessionUser } from '@/lib/auth/session';
import type { Locale } from '@/src/lib/locale';
import { logoutAction } from '@/lib/actions/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DEFAULT_TAB_BY_ROLE, getDashboardTabsForRole } from '@/lib/admin/dashboard-tabs';

interface AdminLayoutClientProps {
  session: SessionUser;
  locale: Locale;
  children: React.ReactNode;
}

function AdminContentHeader({ session, locale }: { session: SessionUser; locale: Locale }) {
  const hi = locale === 'hi';
  const searchParams = useSearchParams();
  const activeTabId = searchParams.get('tab') || DEFAULT_TAB_BY_ROLE[session.role];
  const tabs = getDashboardTabsForRole(session.role);
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-amber-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Active Tab Title */}
        <div className="flex items-center gap-3">
          {activeTab && (
            <>
              <span className="text-amber-600">{activeTab.icon}</span>
              <h2 className="text-lg font-black text-slate-900">
                {hi ? activeTab.labelHi : activeTab.labelEn}
              </h2>
            </>
          )}
        </div>

        {/* Right: User Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-xs text-right">
            <div className="font-black text-amber-900">{session.name}</div>
            <div className="text-slate-600">
              {session.role === 'super_admin'
                ? hi
                  ? 'सुपर व्यवस्थापक'
                  : 'Super Admin'
                : session.role === 'city_admin'
                  ? hi
                    ? 'शहर प्रशासक'
                    : 'City Admin'
                  : hi
                    ? 'केंद्र प्रभारी'
                    : 'Kendra Lead'}
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
            >
              {hi ? 'लॉगआउट' : 'Logout'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminLayoutClient Component
 * 
 * Client component that wraps the admin dashboard with:
 * - AdminSidebar on the left (responsive)
 * - AdminContentHeader showing active tab and user info
 * - Main content area with children
 * 
 * The 2-column layout:
 * - Left: Sidebar (fixed position)
 * - Right: Header + Content (with left margin to account for sidebar)
 * 
 * Note: SiteHeader and SiteFooter are Server Components and are rendered
 * in the parent layout (app/(dashboard)/layout.tsx), not here.
 */
export function AdminLayoutClient({ session, locale, children }: AdminLayoutClientProps) {
  return (
    <div className="flex flex-1 min-h-0">
      {/* Left Column: Sidebar */}
      <Suspense fallback={null}>
        <AdminSidebar session={session} locale={locale} />
      </Suspense>

      {/* Right Column: Content Area */}
      <div className="flex-1 flex flex-col md:ml-16 lg:ml-64 min-h-0">
        {/* Content Header */}
        <Suspense fallback={null}>
          <AdminContentHeader session={session} locale={locale} />
        </Suspense>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
