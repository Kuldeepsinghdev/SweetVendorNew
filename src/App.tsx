/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OtpModal } from './components/OtpModal';
import { AdminAuthGuard } from './components/AdminAuthGuard';
import { Database } from 'lucide-react';

import { CommonLandingView } from './views/CommonLandingView';
import { MitraFlowView } from './views/MitraFlowView';
import { KendraFlowView } from './views/KendraFlowView';
import { CityAdminView } from './views/CityAdminView';
import { SuperAdminView } from './views/SuperAdminView';
import { UserProfileView } from './views/UserProfileView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { RoleDashboard } from './components/RoleDashboard';

// Hash values that open the Super Admin records-management route.
const RECORDS_ROUTE_HASHES = ['#admin', '#/admin', '#records', '#/records'];

const MainContent: React.FC = () => {
  const { role, setRole, currentUser, isLoading, cities, loadError, reloadData } = useApp();

  // Customer self-booking is disabled: bookings are placed exclusively by
  // Sahakar Mitra. Guard against any stale `customer` role (e.g. persisted in
  // localStorage from a previous session) by redirecting to the public landing.
  useEffect(() => {
    if (role === 'customer') {
      setRole('common');
    }
  }, [role, setRole]);

  // Lightweight hash-based routing for the isolated records admin page.
  const [routeHash, setRouteHash] = useState<string>(
    typeof window !== 'undefined' ? window.location.hash.toLowerCase() : ''
  );

  useEffect(() => {
    const onHashChange = () => setRouteHash(window.location.hash.toLowerCase());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const onRecordsRoute = RECORDS_ROUTE_HASHES.includes(routeHash);

  // Business data is loaded exclusively from the database. On the very first
  // load the store is empty, so hold the UI behind a loader until that load
  // completes — the views dereference activeCity/activeFestival directly and
  // would crash against an empty store. Subsequent refetches keep existing data
  // on screen and don't re-trigger this gate.
  if (isLoading && cities.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50/20 text-slate-700 gap-3">
        <Database className="w-6 h-6 text-amber-600 animate-pulse" />
        <p className="text-sm font-bold">लोड हो रहा है… / Loading…</p>
      </div>
    );
  }

  // The initial load failed to reach the API/DB (e.g. all data routes 500'd
  // after a server restart). Show a clear, retryable error screen instead of
  // rendering an empty "undefined" store.
  if (loadError && cities.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50/20 text-slate-700 gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
          <Database className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-black text-slate-900">
            सर्वर से कनेक्ट नहीं हो सका
          </h1>
          <p className="text-sm text-slate-600 max-w-sm">
            We couldn&apos;t reach the server. Please check your connection and try again.
          </p>
        </div>
        <button
          onClick={() => reloadData()}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm cursor-pointer transition-colors"
        >
          पुनः प्रयास करें / Retry
        </button>
      </div>
    );
  }

  // Records route: isolated page, gated behind the existing super_admin login.
  if (onRecordsRoute) {
    return (
      <div className="min-h-screen bg-slate-950">
        {currentUser?.role !== 'super_admin' && (
          <div className="bg-slate-950 text-center py-2 border-b border-slate-800">
            <button
              onClick={() => {
                window.location.hash = '';
              }}
              className="text-xs font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 cursor-pointer"
            >
              ← Exit to main site
            </button>
          </div>
        )}
        <AdminAuthGuard requiredRole="super_admin">
          <AdminDashboardView />
        </AdminAuthGuard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/20 text-slate-900 font-sans text-sm md:text-base">
      {/* Primary Brand Header with direct Customer, Mitra, City, Language & Cart controls */}
      <Header />

      {/* Main Active View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-6 pb-24 sm:pb-6">
        {/* Role Dashboard - show for logged-in users */}
        {currentUser && role !== 'common' && role !== 'profile' && (
          <RoleDashboard />
        )}

        {role === 'common' && (
          <CommonLandingView
            onStartCustomerFlow={() => setRole('mitra')}
            onStartMitraFlow={() => setRole('mitra')}
            onMitraLoginClick={() => setRole('mitra')}
          />
        )}

        {/* Customer self-booking flow is disabled — the `customer` role is
            redirected to the landing view via the guard effect above. */}

        {role === 'profile' && <UserProfileView />}

        {role === 'mitra' && <MitraFlowView />}

        {role === 'kendra' && <KendraFlowView />}

        {role === 'city_admin' && <CityAdminView />}

        {role === 'super_admin' && <SuperAdminView />}
      </main>

      {/* Comprehensive E-Commerce & Cooperative Footer */}
      <Footer />

      {/* Shared OTP Modal */}
      <OtpModal />

      {/* Super Admin quick entry to the records-management console */}
      {currentUser?.role === 'super_admin' && (
        <button
          onClick={() => {
            window.location.hash = 'admin';
          }}
          title="Manage Records (Super Admin)"
          className="fixed bottom-20 sm:bottom-6 right-4 z-40 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/60 shadow-xl rounded-full px-4 py-3 flex items-center gap-2 text-xs font-black cursor-pointer transition-colors"
        >
          <Database className="w-4 h-4" />
          <span className="hidden sm:inline">Manage Records</span>
        </button>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
