'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SessionUser } from '@/lib/auth/session';
import type { DashboardData, TabContentProps } from '@/lib/admin/dashboard-tabs';
import {
  DEFAULT_TAB_BY_ROLE,
  getDashboardTabsForRole,
  isMitraApplicationUnapproved,
} from '@/lib/admin/dashboard-tabs';

/**
 * Unified Admin Dashboard Component
 * 
 * Client component that displays role-based dashboard tabs matching the
 * application theme (warm amber, orange, saffron).
 * - Smoothly scrollable tab navigation with left/right scroll controls
 * - Filters available tabs based on user's role
 * - Manages active tab state with URL and localStorage persistence
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
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Filter tabs based on user's role: only show tabs where minRole <= user.role
  const visibleTabs = useMemo(() => {
    return getDashboardTabsForRole(session.role);
  }, [session.role]);

  // The server and first client render must choose the same tab; localStorage is restored after hydration.
  const getInitialTab = () => {
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
  };

  const [activeTabId, setActiveTabId] = useState<string>(getInitialTab());
  const [initialTabResolved, setInitialTabResolved] = useState(false);
  const unapprovedMitraApplicationsCount = data.mitraApplications?.filter(
    isMitraApplicationUnapproved
  ).length ?? 0;

  // Restore a saved tab only after hydration so server and client markup match.
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const savedTab = localStorage.getItem(`dashboard-active-tab-${session.role}`);
    const preferredTab = tabParam && visibleTabs.some((tab) => tab.id === tabParam)
      ? tabParam
      : savedTab;

    if (preferredTab && visibleTabs.some((tab) => tab.id === preferredTab)) {
      setActiveTabId(preferredTab);
    }
    setInitialTabResolved(true);
  }, [searchParams, session.role, visibleTabs]);

  // Check scroll boundary to toggle scroll indicator arrows
  const checkScroll = () => {
    if (tabContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      tabContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Update URL and localStorage without triggering slow RSC server re-renders
  useEffect(() => {
    if (initialTabResolved && activeTabId) {
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== activeTabId) {
        url.searchParams.set('tab', activeTabId);
        window.history.replaceState(null, '', url.pathname + url.search);
      }
      localStorage.setItem(`dashboard-active-tab-${session.role}`, activeTabId);
    }
  }, [activeTabId, initialTabResolved, session.role]);

  // Sync active tab if user navigates back/forward in browser history
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && visibleTabs.some((tab) => tab.id === tabParam)) {
        setActiveTabId(tabParam);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [visibleTabs]);

  // Keep scroll indicators updated and auto-scroll active tab into view
  useEffect(() => {
    checkScroll();
    if (tabContainerRef.current) {
      const activeEl = tabContainerRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [activeTabId, visibleTabs]);

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
    <div className="space-y-4">
      {/* Scrollable Tab Navigation Bar */}
      <div className="relative group">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            aria-label="Scroll tabs left"
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-amber-300 shadow-md text-amber-900 flex items-center justify-center hover:bg-amber-100 transition-colors focus:outline-none"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Scrollable Strip */}
        <div
          ref={tabContainerRef}
          onScroll={checkScroll}
          tabIndex={0}
          aria-label={hi ? 'डैशबोर्ड टैब' : 'Dashboard Tabs'}
          className="flex gap-2 overflow-x-auto pb-2.5 pt-1 px-1 scroll-smooth focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 rounded-xl border-b border-amber-200/80 [scrollbar-width:thin] [scrollbar-color:#f59e0b_#fef3c7]"
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                data-active={isActive ? 'true' : 'false'}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all text-xs sm:text-sm font-bold shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 via-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20 border border-orange-500 ring-2 ring-orange-400/30'
                    : 'bg-white/90 border border-amber-200/90 text-slate-700 hover:bg-amber-100/80 hover:text-amber-950 hover:border-amber-300 shadow-xs'
                }`}
                aria-selected={isActive}
                role="tab"
              >
                {/* Tab Icon */}
                {tab.icon && (
                  <span className={`shrink-0 ${isActive ? 'text-amber-200' : 'text-amber-600'}`}>
                    {tab.icon}
                  </span>
                )}
                
                {/* Tab Label */}
                <span>{hi ? tab.labelHi : tab.labelEn}</span>
                {tab.id === 'mitra-applications' && (
                  <span
                    aria-label={hi
                      ? `${unapprovedMitraApplicationsCount} अस्वीकृत नहीं किए गए आवेदन`
                      : `${unapprovedMitraApplicationsCount} unapproved applications`}
                    className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                      isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {unapprovedMitraApplicationsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            aria-label="Scroll tabs right"
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 border border-amber-300 shadow-md text-amber-900 flex items-center justify-center hover:bg-amber-100 transition-colors focus:outline-none"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Tab Content Panel */}
      {activeTab ? (
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 sm:p-6 shadow-sm">
          {/* Tab Title Header */}
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-amber-100">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
              {activeTab.icon}
            </span>
            <h2 className="text-base sm:text-lg font-black text-amber-950">
              {hi ? activeTab.labelHi : activeTab.labelEn}
            </h2>
          </div>

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
