'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import type { SessionUser } from '@/lib/auth/session';
import type { Locale } from '@/src/lib/locale';
import { getSidebarTabsOrdered, type TabConfig, isMitraApplicationUnapproved, type DashboardData } from '@/lib/admin/dashboard-tabs';

interface AdminSidebarProps {
  session: SessionUser;
  locale: Locale;
  data?: DashboardData;
}

/**
 * AdminSidebar Component
 * 
 * Vertical navigation sidebar for the admin dashboard.
 * - Desktop (≥1024px): Full sidebar (256px wide)
 * - Tablet (768-1023px): Icon-only sidebar (64px wide) with hover tooltips
 * - Mobile (<768px): Hamburger menu with drawer overlay
 * 
 * Reads activeTabId from URL (?tab=) and updates URL on navigation.
 */
export function AdminSidebar({ session, locale, data }: AdminSidebarProps) {
  const hi = locale === 'hi';
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeTabId = searchParams.get('tab') || '';
  const tabs = getSidebarTabsOrdered(session.role);

  // Calculate unapproved mitra count for badge
  const unapprovedMitraCount = data?.mitraApplications?.filter(isMitraApplicationUnapproved).length ?? 0;

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, activeTabId]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleTabClick = (tabId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    router.push(`${pathname}?${url.searchParams.toString()}`);
    setIsMobileMenuOpen(false);
  };

  const renderNavItems = (isTablet: boolean = false) => (
    <>
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const showBadge = tab.id === 'mitra-applications' && unapprovedMitraCount > 0;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${
              isActive
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-amber-50 hover:text-slate-900'
            } ${isTablet ? 'justify-center px-2' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Icon */}
            <span
              className={`shrink-0 ${
                isActive ? 'text-amber-200' : 'text-amber-600 group-hover:text-amber-700'
              }`}
            >
              {tab.icon}
            </span>

            {/* Label - hidden on tablet, visible on desktop */}
            {!isTablet && (
              <>
                <span className="flex-1 text-left">{hi ? tab.labelHi : tab.labelEn}</span>
                {showBadge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs leading-none ${
                      isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                    }`}
                    aria-label={hi
                      ? `${unapprovedMitraCount} अस्वीकृत नहीं किए गए आवेदन`
                      : `${unapprovedMitraCount} unapproved applications`}
                  >
                    {unapprovedMitraCount}
                  </span>
                )}
              </>
            )}

            {/* Tooltip for tablet icon-only mode */}
            {isTablet && (
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {hi ? tab.labelHi : tab.labelEn}
                {showBadge && (
                  <span className="ml-1.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px]">
                    {unapprovedMitraCount}
                  </span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button - visible only on mobile */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 w-10 h-10 rounded-xl bg-white border-2 border-amber-300 shadow-lg flex items-center justify-center text-amber-900 hover:bg-amber-50 transition-colors"
        aria-label={isMobileMenuOpen ? (hi ? 'मेनू बंद करें' : 'Close menu') : (hi ? 'मेनू खोलें' : 'Open menu')}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop & Tablet Sidebar (always visible on lg+) */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-amber-200 fixed top-0 left-0 h-screen z-30 transition-all ${
          // Desktop: full width, Tablet: icon-only
          'md:w-16 lg:w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="px-4 py-6 border-b border-amber-200">
          <h2 className="text-lg font-black text-amber-900 hidden lg:block">
            {hi ? 'डैशबोर्ड' : 'Dashboard'}
          </h2>
          {/* Icon-only for tablet */}
          <div className="lg:hidden flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white font-black text-xs">
              DB
            </div>
          </div>
        </div>

        {/* Navigation Items - Desktop (full labels) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 hidden lg:flex lg:flex-col scrollbar-thin">
          {renderNavItems(false)}
        </nav>

        {/* Navigation Items - Tablet (icon-only) */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 flex flex-col lg:hidden scrollbar-thin">
          {renderNavItems(true)}
        </nav>
      </aside>

      {/* Mobile Drawer (slides in from left) */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-64 bg-white border-r border-amber-200 z-50 transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Sidebar Header */}
        <div className="px-4 py-6 border-b border-amber-200 flex items-center justify-between">
          <h2 className="text-lg font-black text-amber-900">
            {hi ? 'डैशबोर्ड' : 'Dashboard'}
          </h2>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-amber-50 transition-colors"
            aria-label={hi ? 'मेनू बंद करें' : 'Close menu'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {renderNavItems(false)}
        </nav>
      </aside>
    </>
  );
}
