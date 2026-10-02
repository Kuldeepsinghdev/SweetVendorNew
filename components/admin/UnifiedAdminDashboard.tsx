'use client';

import { useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { SessionUser } from '@/lib/auth/session';
import type { DashboardData, TabContentProps } from '@/lib/admin/dashboard-tabs';
import {
  DEFAULT_TAB_BY_ROLE,
  getDashboardTabsForRole,
} from '@/lib/admin/dashboard-tabs';

/**
 * Unified Admin Dashboard Component
 * 
 * Client component that displays role-based dashboard tabs matching the
 * application theme (warm amber, orange, saffron).
 * - Filters available tabs based on user's role
 * - Reads active tab directly from URL search params (reactive to sidebar navigation)
 * - Renders tab navigation with bilingual labels
 * - Renders lazy-loaded tab content with matching warm loading skeleton
 */

/**
 * Loading skeleton shown while tab content loads
 */
function TabLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 bg-amber-200/60 rounded-lg w-1/3"></div>
      <div className="space-y-3">
        <div className="h-4 bg-amber-100/70 rounded w-full"></div>
        <div className="h-4 bg-amber-100/60 rounded w-5/6"></div>
        <div className="h-4 bg-amber-100/50 rounded w-4/6"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="h-20 bg-amber-50/80 border border-amber-200/60 rounded-xl"></div>
        <div className="h-20 bg-amber-50/80 border border-amber-200/60 rounded-xl"></div>
        <div className="h-20 bg-amber-50/80 border border-amber-200/60 rounded-xl"></div>
      </div>
    </div>
  );
}

interface UnifiedAdminDashboardProps {
  /** Current authenticated user session */
  session: SessionUser;
  
  /** Pre-filtered dashboard data based on user's role */
  data: DashboardData;
  
  /** Current locale code ('hi' | 'en') */
  locale: string;
}

export default function UnifiedAdminDashboard({
  session,
  data,
  locale,
}: UnifiedAdminDashboardProps) {
  const hi = locale === 'hi';
  const searchParams = useSearchParams();

  // Filter tabs based on user's role: only show tabs where minRole <= user.role
  const visibleTabs = useMemo(() => {
    return getDashboardTabsForRole(session.role);
  }, [session.role]);

  // Compute active tab directly from URL search params
  // This makes the component reactive to URL changes from AdminSidebar's router.push()
  const activeTabId = useMemo(() => {
    const tabParam = searchParams.get('tab');
    
    // Priority 1: If tab param exists and is valid for this user, use it
    if (tabParam && visibleTabs.some((tab) => tab.id === tabParam)) {
      return tabParam;
    }
    
    // Priority 2: Use role-specific default tab if it's accessible
    const defaultTabId = DEFAULT_TAB_BY_ROLE[session.role];
    if (defaultTabId && visibleTabs.some((tab) => tab.id === defaultTabId)) {
      return defaultTabId;
    }
    
    // Priority 3: Fall back to first visible tab
    return visibleTabs[0]?.id ?? '';
  }, [searchParams, visibleTabs, session.role]);

  // Save active tab to localStorage for persistence across sessions
  useEffect(() => {
    if (activeTabId) {
      localStorage.setItem(`dashboard-active-tab-${session.role}`, activeTabId);
    }
  }, [activeTabId, session.role]);

  // Get the active tab configuration
  const activeTab = visibleTabs.find((tab) => tab.id === activeTabId);

  // Handle gracefully if no tabs are visible (shouldn't happen in normal flow)
  if (visibleTabs.length === 0) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl shadow-xs">
        <h2 className="font-bold text-rose-800 mb-2">
          {hi ? 'कोई अनुमति नहीं' : 'No Access'}
        </h2>
        <p className="text-sm text-rose-700">
          {hi
            ? 'आपके पास इस डैशबोर्ड तक पहुंचने के लिए पर्याप्त अनुमति नहीं है।'
            : 'You do not have permission to access this dashboard.'}
        </p>
      </div>
    );
  }

  // Props to pass to active tab component
  const tabContentProps: TabContentProps = {
    session,
    data,
    locale,
  };

  return (
    <div>
      {/* Tab Content Panel */}
      {activeTab ? (
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 sm:p-6 shadow-sm">
          {/* Render Active Tab Component with Lazy Loading */}
          <Suspense fallback={<TabLoadingSkeleton />}>
            <div>
              <activeTab.component {...tabContentProps} />
            </div>
          </Suspense>
        </div>
      ) : (
        // Fallback if active tab is missing (shouldn't happen)
        <div className="p-6 bg-white border border-amber-200 rounded-2xl shadow-sm text-center">
          <p className="text-slate-600 text-sm">
            {hi ? 'टैब सामग्री लोड नहीं हो सकी।' : 'Unable to load tab content.'}
          </p>
        </div>
      )}
    </div>
  );
}
