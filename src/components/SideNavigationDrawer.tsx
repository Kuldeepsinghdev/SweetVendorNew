/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SahakarLogo } from './SahakarLogo';
import { UserRole } from '../types';
import { LoginModal } from './LoginModal';
import { MyOrdersModal } from './MyOrdersModal';
import {
  X,
  Home,
  LayoutGrid,
  User,
  Users,
  Store,
  Building2,
  Crown,
  MapPin,
  Globe,
  Clock,
  LogIn,
  LogOut,
  UserCheck,
  Lock,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Sparkles,
  HelpCircle,
  Package
} from 'lucide-react';

interface SideNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideNavigationDrawer: React.FC<SideNavigationDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const {
    role,
    setRole,
    currentUser,
    logoutUser,
    language,
    toggleLanguage,
    cities,
    activeCityId,
    setActiveCityId,
    activeCity,
    activeFestival,
    forceCutoffClosed,
    setForceCutoffClosed,
    isBookingWindowOpen,
    bookings
  } = useApp();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginDefaultRole, setLoginDefaultRole] = useState<UserRole>('customer');
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);

  const getUserOrderCount = () => {
    if (!currentUser) return 0;
    if (currentUser.role === 'customer') {
      return bookings.filter(
        (b) =>
          b.bookedByRole === 'customer' ||
          (currentUser.phone && b.customer?.phone?.includes(currentUser.phone)) ||
          (currentUser.name && b.customer?.name?.toLowerCase().includes(currentUser.name.toLowerCase()))
      ).length;
    }
    if (currentUser.role === 'mitra') {
      return bookings.filter(
        (b) =>
          b.mitraId === currentUser.id ||
          (currentUser.name && b.mitraName?.toLowerCase().includes(currentUser.name.toLowerCase())) ||
          (currentUser.phone && b.customer?.phone?.includes(currentUser.phone))
      ).length;
    }
    return bookings.length;
  };

  const userOrderCount = getUserOrderCount();

  if (!isOpen) return null;

  const isAdminUser =
    role === 'city_admin' ||
    role === 'super_admin' ||
    currentUser?.role === 'city_admin' ||
    currentUser?.role === 'super_admin';

  const getRoleOptionStatus = (optId: UserRole) => {
    // Home ('common') is always active and enabled
    if (optId === 'common') {
      return { isEnabled: true, isLocked: false };
    }

    // Until user is logged in, all other options are deactivated (locked)
    if (!currentUser) {
      return { isEnabled: false, isLocked: true };
    }

    // User is logged in: check role authorization
    const uRole = currentUser.role;
    if (uRole === 'super_admin' || uRole === 'city_admin') {
      return { isEnabled: true, isLocked: false };
    }
    if (uRole === optId) {
      return { isEnabled: true, isLocked: false };
    }

    // Option is deactivated for current user profile (e.g. customer clicking Mitra)
    return { isEnabled: false, isLocked: true };
  };

  const handleRoleSelect = (targetRole: UserRole) => {
    if (targetRole === 'common') {
      setRole('common');
      onClose();
      return;
    }

    const { isLocked } = getRoleOptionStatus(targetRole);

    if (!currentUser || isLocked) {
      // If user is not logged in or option is locked, show Login Popup Modal!
      handleOpenLogin(targetRole);
      return;
    }

    setRole(targetRole);
    onClose();
  };

  const handleOpenLogin = (targetRole: UserRole = 'customer') => {
    setLoginDefaultRole(targetRole);
    setIsLoginModalOpen(true);
  };

  const handleBookingToggle = () => {
    if (!isAdminUser) {
      alert(
        language === 'hi'
          ? 'केवल शहर एडमिन एवं सुपर एडमिन को ही बुकिंग विंडो चालू या बंद करने की अनुमति है।'
          : 'Only City Admin and Super Admin can toggle the booking window.'
      );
      return;
    }
    setForceCutoffClosed(!forceCutoffClosed);
  };

  const roleOptions = [
    {
      id: 'common' as UserRole,
      titleHi: 'होम स्क्रीन (Home)',
      titleEn: 'Home Page',
      descHi: 'मुख्य स्क्रीन, नियम एवं मिठाई प्री-बुकिंग',
      descEn: 'Main festival screen & pre-booking',
      icon: Home,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10 border-amber-500/30'
    },
    {
      id: 'customer' as UserRole,
      titleHi: 'ग्राहक ऑर्डर पोर्टल',
      titleEn: 'Customer Pre-Booking',
      descHi: 'मिठाइयां चुनें एवं एडवांस बुक करें',
      descEn: 'Browse sweets & pre-order',
      icon: User,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/30'
    },
    {
      id: 'mitra' as UserRole,
      titleHi: 'सहकार मित्र पोर्टल',
      titleEn: 'Sahakar Mitra (Agent)',
      descHi: 'सामूहिक बुकिंग व कमीशन विवरण',
      descEn: 'Group booking & commission logs',
      icon: Users,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30'
    },
    {
      id: 'kendra' as UserRole,
      titleHi: 'बिक्री केंद्र (Kendra)',
      titleEn: 'Sale Center Desk',
      descHi: 'काउंटर बिलिंग व क्यूआर पिकअप',
      descEn: 'QR pickup & counter dispatch',
      icon: Store,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30'
    },
    {
      id: 'city_admin' as UserRole,
      titleHi: 'नगर एडमिन',
      titleEn: 'City Admin',
      descHi: 'शहर मूल्य निर्धारण व केंद्र प्रबंधन',
      descEn: 'Manage city pricing & centers',
      icon: Building2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30'
    },
    {
      id: 'super_admin' as UserRole,
      titleHi: 'राष्ट्रीय सुपर एडमिन',
      titleEn: 'National Super Admin',
      descHi: 'मास्टर कैटलॉग, नियम एवं नेटवर्क ऑडिट',
      descEn: 'Master catalog & national rules',
      icon: Crown,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/30'
    }
  ];

  const getFilteredRoleOptions = () => {
    if (!currentUser) {
      // Guest mode: show home and primary public options with login locks
      return roleOptions.filter((opt) => opt.id === 'common' || opt.id === 'customer' || opt.id === 'mitra' || opt.id === 'kendra');
    }

    const uRole = currentUser.role;
    if (uRole === 'customer') {
      // Customer: hide Mitra, Kendra, City Admin, and Super Admin options
      return roleOptions.filter((opt) => opt.id === 'common' || opt.id === 'customer');
    }
    if (uRole === 'mitra') {
      // Mitra: hide Kendra, City Admin, and Super Admin options
      return roleOptions.filter((opt) => opt.id === 'common' || opt.id === 'customer' || opt.id === 'mitra');
    }
    if (uRole === 'kendra') {
      // Kendra: hide Mitra, City Admin, and Super Admin options
      return roleOptions.filter((opt) => opt.id === 'common' || opt.id === 'customer' || opt.id === 'kendra');
    }
    if (uRole === 'city_admin') {
      // City Admin: hide Super Admin option
      return roleOptions.filter((opt) => opt.id !== 'super_admin');
    }
    // Super admin sees all
    return roleOptions;
  };

  const filteredRoleOptions = getFilteredRoleOptions();

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-start no-print transition-opacity"
        onClick={onClose}
      >
        <div
          className="bg-slate-900 text-white w-80 sm:w-96 h-full border-r-2 border-amber-500/40 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar Header */}
          <div className="p-4 bg-gradient-to-r from-orange-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                setRole('common');
                onClose();
              }}
              className="flex items-center gap-3 text-left group cursor-pointer"
              title="होम स्क्रीन पर जाएं (Go to Home)"
            >
              <SahakarLogo className="group-hover:scale-105 transition-transform" />
              <div>
                <h2 className="font-extrabold text-base text-amber-300 tracking-tight leading-tight group-hover:text-white transition-colors">
                  {language === 'hi' ? 'सहकार भारती' : 'Sahakar Bharati'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="bg-orange-950 text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/40">
                    {language === 'hi' ? activeFestival?.nameHi || 'उत्सव' : activeFestival?.nameEn || 'Festival'}
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Account Bar */}
          <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-white truncate">{currentUser?.name || 'उपयोगकर्ता'}</p>
                    <p className="text-[10px] text-amber-300 font-mono">
                      {currentUser.role === 'customer'
                        ? 'ग्राहक (Customer)'
                        : currentUser.role === 'mitra'
                        ? 'सहकार मित्र'
                        : currentUser.role === 'kendra'
                        ? 'बिक्री केंद्र'
                        : currentUser.role === 'city_admin'
                        ? 'शहर एडमिन'
                        : 'सुपर एडमिन'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logoutUser();
                    onClose();
                  }}
                  className="bg-rose-600/90 hover:bg-rose-600 text-white font-bold px-2.5 py-1 rounded text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-slate-300">
                  <span className="font-semibold block text-white">
                    {language === 'hi' ? 'अतिथि मोड (Guest)' : 'Guest Mode'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'hi' ? 'विशेष सुविधाओं हेतु लॉगइन करें' : 'Login for custom portals'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    handleOpenLogin('customer');
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-orange-950" />
                  <span>{language === 'hi' ? 'लॉगइन करें' : 'Login'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Drawer Body Options List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Section 1: Navigation Options */}
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'hi' ? 'पोर्टल विकल्प (Portals)' : 'Portals & Views'}</span>
              </h3>

              <div className="space-y-1.5">
                {filteredRoleOptions.map((opt) => {
                  const IconComp = opt.icon;
                  const isActive = role === opt.id;
                  const { isLocked } = getRoleOptionStatus(opt.id);

                  return (
                    <React.Fragment key={opt.id}>
                      <button
                        onClick={() => handleRoleSelect(opt.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isActive
                            ? `${opt.bgColor} ring-1 ring-amber-400/50 shadow-sm`
                            : isLocked
                            ? 'opacity-65 bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/80 hover:opacity-100 hover:border-amber-500/40'
                            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-amber-400 text-slate-950 font-bold'
                                : isLocked
                                ? 'bg-slate-800 text-slate-500 border border-slate-700'
                                : 'bg-slate-700 text-amber-300'
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">
                                {language === 'hi' ? opt.titleHi : opt.titleEn}
                              </span>
                              {isActive ? (
                                <span className="bg-amber-400 text-slate-950 text-[9px] font-mono px-1.5 py-0.2 rounded font-black shrink-0">
                                  {language === 'hi' ? 'सक्रिय' : 'Active'}
                                </span>
                              ) : isLocked ? (
                                <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[9px] font-mono px-1 py-0.2 rounded font-bold shrink-0 flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                                  <span>{language === 'hi' ? 'लॉगइन' : 'Login'}</span>
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                              {language === 'hi' ? opt.descHi : opt.descEn}
                            </p>
                          </div>
                        </div>

                        {isLocked ? (
                          <Lock className="w-4 h-4 text-amber-400/80 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </button>

                      {/* My Previous Orders option directly AFTER Customer Pre-booking option */}
                      {opt.id === 'customer' && (
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              setLoginDefaultRole('customer');
                              setIsLoginModalOpen(true);
                            } else {
                              setIsMyOrdersOpen(true);
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            !currentUser
                              ? 'opacity-75 bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/80 hover:border-amber-500/40'
                              : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              !currentUser ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-slate-700 text-amber-300'
                            }`}>
                              <Package className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 flex-wrap">
                                <span className="truncate">
                                  {language === 'hi' ? 'मेरे पिछले ऑर्डर' : 'My Previous Orders'}
                                </span>
                                {!currentUser ? (
                                  <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[9px] font-mono px-1 py-0.2 rounded font-bold shrink-0 flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                                    <span>{language === 'hi' ? 'लॉगइन' : 'Login'}</span>
                                  </span>
                                ) : (
                                  <span className="bg-orange-600 text-white text-[9px] font-mono px-1.5 py-0.2 rounded font-black shrink-0">
                                    {userOrderCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                                {!currentUser
                                  ? (language === 'hi' ? 'ऑर्डर देखने हेतु लॉगइन करें' : 'Login required to view orders')
                                  : (language === 'hi' ? 'बुकिंग विवरण, OTP व रसीदें' : 'View past bookings & receipts')}
                              </p>
                            </div>
                          </div>

                          {!currentUser ? (
                            <Lock className="w-4 h-4 text-amber-400/80 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                        </button>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Quick Preferences & Settings */}
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                {language === 'hi' ? 'सेटिंग्स व नियंत्रण' : 'Settings & Controls'}
              </h3>

              <div className="space-y-2.5 bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                {/* City Selection */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{language === 'hi' ? 'सक्रिय नगर:' : 'Active City:'}</span>
                  </div>
                  <select
                    value={activeCity?.id || activeCityId}
                    onChange={(e) => setActiveCityId(e.target.value)}
                    className="bg-slate-800 text-amber-300 font-bold border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer max-w-[180px] truncate"
                  >
                    {(cities || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === 'hi' ? c.nameHi : c.nameEn} ({language === 'hi' ? c.stateHi : c.stateEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-px bg-slate-800" />

                {/* Language Switch */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{language === 'hi' ? 'भाषा (Language):' : 'Language:'}</span>
                  </div>
                  <button
                    onClick={toggleLanguage}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-amber-300 flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>{language === 'hi' ? 'हिंदी ➔ English' : 'English ➔ हिंदी'}</span>
                  </button>
                </div>

                <div className="h-px bg-slate-800" />

                {/* Booking Cut-off Toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{language === 'hi' ? 'बुकिंग विंडो:' : 'Booking Window:'}</span>
                  </div>
                  <button
                    onClick={handleBookingToggle}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 border transition-all ${
                      isBookingWindowOpen
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-rose-950 border-rose-500 text-rose-300'
                    } ${isAdminUser ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-80'}`}
                  >
                    <span>{isBookingWindowOpen ? 'खुली है (Open)' : 'बंद है (Closed)'}</span>
                    {!isAdminUser && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Timeline & Info */}
            <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl space-y-1.5 text-xs text-amber-200/90">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Calendar className="w-4 h-4" />
                <span>{language === 'hi' ? `${activeFestival?.nameHi || 'उत्सव'} समयावधि` : `${activeFestival?.nameEn || 'Festival'} period`}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                • अंतिम बुकिंग तिथि: <b>{activeFestival?.cutoffDate || ''}</b>
                <br />• वितरण (पिकअप): <b>{activeFestival?.distributionStartDate || ''} से {activeFestival?.distributionEndDate || ''}</b>
              </p>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[10.5px] text-slate-500 font-mono">
            सहकार भारती © {new Date().getFullYear()} — सर्व अधिकार सुरक्षित
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        defaultRole={loginDefaultRole}
      />

      <MyOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
      />
    </>
  );
};
