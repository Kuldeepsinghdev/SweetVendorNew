/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OtpModal } from './components/OtpModal';

import { CommonLandingView } from './views/CommonLandingView';
import { CustomerFlowView } from './views/CustomerFlowView';
import { MitraFlowView } from './views/MitraFlowView';
import { KendraFlowView } from './views/KendraFlowView';
import { CityAdminView } from './views/CityAdminView';
import { SuperAdminView } from './views/SuperAdminView';
import { UserProfileView } from './views/UserProfileView';

const MainContent: React.FC = () => {
  const { role, setRole } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/20 text-slate-900 font-sans text-sm md:text-base">
      {/* Primary Brand Header with direct Customer, Mitra, City, Language & Cart controls */}
      <Header />

      {/* Main Active View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-6 pb-24 sm:pb-6">
        {role === 'common' && (
          <CommonLandingView
            onStartCustomerFlow={() => setRole('customer')}
            onStartMitraFlow={() => setRole('mitra')}
            onMitraLoginClick={() => setRole('mitra')}
          />
        )}

        {role === 'customer' && <CustomerFlowView />}

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
