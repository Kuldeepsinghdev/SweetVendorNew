'use client';

/**
 * Mitra Portal Sidebar
 *
 * Fixed-width left navigation panel for the 2-column portal layout.
 * Displays navigation items (Browse Catalog, Dashboard, My Bookings),
 * user info, and logout button.
 *
 * On mobile, collapses into a drawer triggered by a hamburger button.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  LayoutDashboard,
  BookOpen,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { customerLogoutAction } from '@/lib/actions/customerAuth';
import type { Locale } from '@/src/lib/locale';

interface MitraPortalSidebarProps {
  locale: Locale;
  session: {
    sub: string;
    name: string;
    phone: string;
    centerId?: string | null;
    cityId?: string | null;
  };
  assignedDcNameHi?: string | null;
  assignedDcNameEn?: string | null;
  activeNav: 'catalog' | 'dashboard' | 'bookings';
  onNavChange: (nav: 'dashboard' | 'bookings') => void;
}

export function MitraPortalSidebar({
  locale,
  session,
  assignedDcNameHi,
  assignedDcNameEn,
  activeNav,
  onNavChange,
}: MitraPortalSidebarProps) {
  const hi = locale === 'hi';
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      id: 'catalog' as const,
      label: 'Browse Catalog',
      labelHi: 'कैटलॉग देखें',
      icon: <ShoppingBag className="w-4 h-4" />,
      href: '/mitra/catalog',
      isLink: true,
    },
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      labelHi: 'डैशबोर्ड',
      icon: <LayoutDashboard className="w-4 h-4" />,
      href: undefined,
      isLink: false,
    },
    {
      id: 'bookings' as const,
      label: 'My Booking',
      labelHi: 'मेरी बुकिंग',
      icon: <BookOpen className="w-4 h-4" />,
      href: undefined,
      isLink: false,
    },
  ];

  const dcName = hi ? (assignedDcNameHi ?? assignedDcNameEn) : (assignedDcNameEn ?? assignedDcNameHi);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <>
      {/* Hamburger button for mobile — top-left of header */}
      <div className="lg:hidden fixed top-14 left-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-sm"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay/drawer background */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-20"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container — fixed on desktop, drawer on mobile */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-30 w-60 bg-white text-slate-800
          flex flex-col h-screen overflow-y-auto border-r border-amber-200 shadow-sm
          transition-transform duration-200 lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top section: Brand */}
        <div className="p-4 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-black flex items-center justify-center text-sm shrink-0 border border-orange-700 shadow-sm">
              SB
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-sm text-slate-900 truncate">
                {hi ? 'सहकार भारती' : 'Sahakar Bharati'}
              </h2>
              <p className="text-[10px] text-amber-800 truncate">
                {hi ? 'मित्र पोर्टल' : 'Mitra Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Middle section: Navigation items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;

            if (item.isLink && item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm
                    transition-all duration-150 group
                    ${
                      isActive
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-amber-50 hover:text-orange-900'
                    }
                  `}
                >
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-700'}`}>
                    {item.icon}
                  </span>
                  <span>{hi ? item.labelHi : item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavChange(item.id as 'dashboard' | 'bookings');
                  closeMobileMenu();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm text-left
                  transition-all duration-150 group
                  ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-amber-50 hover:text-orange-900'
                  }
                `}
              >
                <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-700'}`}>
                  {item.icon}
                </span>
                <span>{hi ? item.labelHi : item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom section: User info + Logout */}
        <div className="border-t border-amber-200 p-4 space-y-3">
          {/* User info block */}
          <div className="bg-amber-50 rounded-lg p-3 space-y-2 border border-amber-200">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                {hi ? 'नाम' : 'Name'}
              </p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {session.name}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                {hi ? 'फोन' : 'Phone'}
              </p>
              <p className="text-sm font-mono text-slate-700">{session.phone}</p>
            </div>
            {dcName && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  {hi ? 'वितरण केंद्र' : 'Distribution Center'}
                </p>
                <p className="text-sm text-slate-700 truncate">{dcName}</p>
              </div>
            )}
          </div>

          {/* Logout button */}
          <form action={customerLogoutAction} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm
                bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800
                border border-rose-200 hover:border-rose-300
                transition-all duration-150"
              title={hi ? 'लॉगआउट करें' : 'Logout'}
            >
              <LogOut className="w-4 h-4" />
              <span>{hi ? 'लॉगआउट' : 'Logout'}</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
