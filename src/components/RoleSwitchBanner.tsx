/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ShoppingBag, Globe, Clock, LogOut, LogIn, UserCheck, Lock } from 'lucide-react';
import { LoginModal } from './LoginModal';

export const RoleSwitchBanner: React.FC = () => {
  const {
    role,
    currentUser,
    logoutUser,
    language,
    toggleLanguage,
    forceCutoffClosed,
    setForceCutoffClosed,
    isBookingWindowOpen
  } = useApp();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginDefaultRole, setLoginDefaultRole] = useState<UserRole>('customer');

  const isAdminUser =
    role === 'city_admin' ||
    role === 'super_admin' ||
    currentUser?.role === 'city_admin' ||
    currentUser?.role === 'super_admin';

  const handleOpenLogin = (targetRole: UserRole = 'customer') => {
    setLoginDefaultRole(targetRole);
    setIsLoginModalOpen(true);
  };

  const handleBookingToggle = () => {
    if (!isAdminUser) {
      alert(
        language === 'hi'
          ? 'केवल शहर एडमिन एवं सुपर एडमिन को ही बुकिंग विंडो चालू या बंद करने की अनुमति है।'
          : 'Only City Admin and Super Admin can open or close the booking window.'
      );
      return;
    }
    setForceCutoffClosed(!forceCutoffClosed);
  };

  return (
    <>
      <div className="bg-slate-900 text-white text-xs sm:text-sm border-b border-slate-800 no-print sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          
          {/* Left: Branding & Role Badge */}
          <div className="flex items-center gap-2 py-0.5">
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-800 to-amber-900 border border-orange-700/80 rounded-lg px-3 py-1 text-xs sm:text-sm font-bold text-white shadow-xs">
              <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{language === 'hi' ? 'सहकार भारती प्लेटफ़ॉर्म' : 'Sahakar Bharati Portal'}</span>
            </div>

            {currentUser && (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {currentUser.role === 'customer'
                    ? (language === 'hi' ? 'ग्राहक प्रोफ़ाइल' : 'Customer Profile')
                    : currentUser.role === 'mitra'
                    ? (language === 'hi' ? 'सहकार मित्र' : 'Sahakar Mitra')
                    : currentUser.role === 'kendra'
                    ? (language === 'hi' ? 'बिक्री केंद्र' : 'Sale Center')
                    : currentUser.role === 'city_admin'
                    ? (language === 'hi' ? 'शहर एडमिन' : 'City Admin')
                    : (language === 'hi' ? 'सुपर एडमिन' : 'Super Admin')}
                </span>
              </div>
            )}
          </div>

          {/* Right: User session status & Log Out / Log In controls */}
          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs sm:text-sm">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-amber-300 truncate max-w-[130px] sm:max-w-none">
                  {currentUser?.name || 'उपयोगकर्ता'}
                </span>
                <button
                  onClick={logoutUser}
                  title={language === 'hi' ? 'लॉगआउट करें' : 'Logout'}
                  className="ml-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded text-xs flex items-center gap-1 shadow-xs transition-colors active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">{language === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenLogin('customer')}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-orange-900" />
                <span>{language === 'hi' ? 'लॉगइन पोर्टल' : 'Login Portal'}</span>
              </button>
            )}

            {/* Booking Cutoff Indicator / Toggle (Only Admin can toggle) */}
            <button
              onClick={handleBookingToggle}
              title={
                isAdminUser
                  ? language === 'hi'
                    ? 'बुकिंग विंडो चालू/बंद करें (एडमिन नियंत्रण)'
                    : 'Toggle Booking Window (Admin Control)'
                  : language === 'hi'
                  ? 'केवल शहर एडमिन/सुपर एडमिन ही बदल सकते हैं'
                  : 'Only Admins can toggle'
              }
              className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5 border shrink-0 transition-all ${
                isBookingWindowOpen
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
                  : 'bg-rose-950/90 border-rose-500 text-rose-300 hover:bg-rose-900'
              } ${isAdminUser ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-90'}`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {isBookingWindowOpen
                  ? language === 'hi' ? 'बुकिंग: चालू' : 'Booking: Open'
                  : language === 'hi' ? 'बुकिंग: बंद' : 'Booking: Closed'}
              </span>
              {!isAdminUser && (
                <Lock className="w-3 h-3 text-amber-400 ml-0.5 shrink-0" title="केवल एडमिन हेतु सुरक्षित" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 font-mono text-xs sm:text-sm shrink-0 touch-manipulation active:scale-95 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className={language === 'hi' ? 'font-bold text-amber-300' : ''}>हिं</span>
              <span className="text-slate-500">|</span>
              <span className={language === 'en' ? 'font-bold text-amber-300' : ''}>EN</span>
            </button>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        defaultRole={loginDefaultRole}
      />
    </>
  );
};
