'use client';

import { useState, useMemo } from 'react';
import type { SessionUser } from '@/lib/auth/session';
import { roleSatisfies } from '@/lib/auth/rbac';
import type { DashboardData, TabConfig, TabContentProps } from '@/lib/admin/dashboard-tabs';
import { DASHBOARD_TABS } from '@/lib/admin/dashboard-tabs';

/**
 * Unified Admin Dashboard Component
 * 
 * Client component that displays role-based dashboard tabs.
 * - Filters available tabs based on user's role
 * - Manages active tab state
 * - Renders tab navigation with bilingual labels
 * - Renders tab content panels
 * - Responsive tab bar navigation
 * 
 * @component
 * @requirements 2.1, 2.2, 2.3, 2.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5, 13.1-13.5, 22.1-22.5
 */

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

  // Filter tabs based on user's role: only show tabs where minRole <= user.role
  const visibleTabs = useMemo(() => {
    return DASHBOARD_TABS.filter((tab) => roleSatisfies(session.role, tab.minRole));
  }, [session.role]);

  // Initialize active tab to first visible tab (or empty if none)
  const [activeTabId, setActiveTabId] = useState<string>(visibleTabs[0]?.id ?? '');

  // Get the active tab configuration
  const activeTab = visibleTabs.find((tab) => tab.id === activeTabId);

  // If no active tab found and there are visible tabs, set to first visible
  if (!activeTab && visibleTabs.length > 0) {
    if (activeTabId !== visibleTabs[0].id) {
      setActiveTabId(visibleTabs[0].id);
    }
  }

  // Handle gracefully if no tabs are visible (shouldn't happen in normal flow)
  if (visibleTabs.length === 0) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-800/40 rounded-lg">
        <h2 className="font-bold text-red-400 mb-2">
          {hi ? 'कोई अनुमति नहीं' : 'No Access'}
        </h2>
        <p className="text-sm text-red-300">
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
    <div className="space-y-4">
      {/* Tab Navigation Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-700/40 scrollbar-hide">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
              activeTabId === tab.id
                ? 'bg-blue-600/30 border border-blue-500/40 text-blue-100'
                : 'bg-slate-800/40 border border-slate-700/20 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
            }`}
            aria-selected={activeTabId === tab.id}
            role="tab"
          >
            {/* Tab Icon */}
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            
            {/* Tab Label */}
            <span>{hi ? tab.labelHi : tab.labelEn}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Panel */}
      {activeTab ? (
        <div className="bg-slate-900/40 border border-slate-800/40 rounded-lg p-6">
          {/* Tab Title */}
          <h2 className="text-lg font-bold text-slate-100 mb-4">
            {hi ? activeTab.labelHi : activeTab.labelEn}
          </h2>

          {/* Render Active Tab Component */}
          <div>
            <activeTab.component {...tabContentProps} />
          </div>
        </div>
      ) : (
        // Fallback if active tab is missing (shouldn't happen)
        <div className="p-6 bg-slate-800/40 border border-slate-700/40 rounded-lg">
          <p className="text-slate-400 text-sm">
            {hi ? 'टैब सामग्री लोड नहीं हो सकी।' : 'Unable to load tab content.'}
          </p>
        </div>
      )}
    </div>
  );
}
