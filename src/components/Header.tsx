/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SahakarLogo } from './SahakarLogo';
import { MobileBottomNav } from './MobileBottomNav';
import { LoginModal } from './LoginModal';
import { UserProfileModal } from './UserProfileModal';
import { UserRole } from '../types';
import {
  ShoppingBag,
  MapPin,
  X,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Users,
  Languages,
  LogOut,
  Shield,
  ChevronDown,
  Store,
  Info,
  User,
  Package,
  CreditCard
} from 'lucide-react';

interface HeaderProps {
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart }) => {
  const {
    role,
    setRole,
    currentUser,
    logoutUser,
    language,
    setLanguage,
    cities,
    activeCity,
    setActiveCityId,
    activeCityId,
    saleCenters,
    activeFestival,
    isBookingWindowOpen,
    cart,
    updateCartQty,
    removeFromCart,
    clearCart
  } = useApp();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalRole, setLoginModalRole] = useState<UserRole>('customer');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'orders' | 'payments' | 'pickup' | 'settings'>('profile');
  const [showCenterInfo, setShowCenterInfo] = useState(false);

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.totalAmount, 0);
  const cartTotalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Active City Primary Pickup Center
  const activeCityCenters = (saleCenters || []).filter(
    (c) => c.cityId === activeCityId && c.isActive
  );
  const primaryCenter = activeCityCenters[0] || (saleCenters && saleCenters[0]);

  const handleOpenLogin = (targetRole: UserRole) => {
    setLoginModalRole(targetRole);
    setIsLoginModalOpen(true);
  };

  const handleOpenProfile = (tab: 'profile' | 'orders' | 'payments' | 'pickup' | 'settings' = 'profile') => {
    setProfileInitialTab(tab);
    setIsProfileModalOpen(true);
  };

  return (
    <>
      <header className="bg-gradient-to-r from-orange-600 via-orange-700 to-amber-700 text-white border-b-4 border-amber-400 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Section 1: Identity & Branding (Left) */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setRole('common')}
              className="flex items-center gap-2 group cursor-pointer active:scale-95 transition-transform text-left min-w-0"
              title={language === 'hi' ? 'सहकार भारती — मुख्य पृष्ठ' : 'Sahakar Bharati — Home'}
            >
              <SahakarLogo className="group-hover:scale-105 transition-transform shrink-0 w-8 h-8 sm:w-10 sm:h-10" />
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-tight text-white leading-tight truncate drop-shadow-xs group-hover:text-amber-200 transition-colors">
                    {language === 'hi' ? 'सहकार भारती' : 'Sahakar Bharati'}
                  </h1>
                </div>
                <p className="text-[9px] sm:text-xs text-amber-100/90 font-medium truncate hidden md:block">
                  {language === 'hi'
                    ? 'उत्सव मिष्ठान वितरण एवं प्री-बुकिंग सेवा'
                    : 'Festive Sweets Pre-booking Network'}
                </p>
              </div>
            </button>
          </div>

          {/* Section 3: User Portals, Language Switcher, Profile Hub & Cart (Right) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 justify-end ml-auto">
            {/* 1. Customer Button / Portal (Hidden on very narrow mobile to save space since bottom nav has it) */}
            <button
              onClick={() => {
                setRole('customer');
                if (!currentUser) handleOpenLogin('customer');
              }}
              className={`hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                role === 'customer'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-md'
                  : 'bg-amber-950/80 hover:bg-blue-900/90 text-amber-100 hover:text-white border border-amber-400/60'
              }`}
              title={language === 'hi' ? 'ग्राहक मिष्ठान कैटलॉग व बुकिंग' : 'Customer Sweets Catalog & Booking'}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'hi' ? 'ग्राहक' : 'Customer'}</span>
            </button>

            {/* 2. Sahakar Mitra Button / Portal (Hidden on very narrow mobile) */}
            <button
              onClick={() => {
                setRole('mitra');
                if (!currentUser) handleOpenLogin('mitra');
              }}
              className={`hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                role === 'mitra'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-md'
                  : 'bg-amber-950/80 hover:bg-orange-900/90 text-amber-100 hover:text-white border border-amber-400/60'
              }`}
              title={language === 'hi' ? 'सहकार मित्र पोर्टल' : 'Sahakar Mitra Portal'}
            >
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'hi' ? 'सहकार मित्र' : 'Mitra'}</span>
            </button>

            {/* 3. Language Switcher Toggle */}
            <button
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="px-2 sm:px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-400/80 rounded-xl text-amber-200 hover:text-white flex items-center gap-1 text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              title={language === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
            >
              <Languages className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-mono">{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            {/* 4. Logged-in User Profile & Account Hub Button */}
            {currentUser && (
              <button
                onClick={() => setRole('profile')}
                className={`font-black px-2 sm:px-3 py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 text-xs shadow-md transition-all active:scale-95 border cursor-pointer animate-in fade-in ${
                  role === 'profile'
                    ? 'bg-amber-300 text-orange-950 ring-2 ring-amber-400 border-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200'
                }`}
                title={language === 'hi' ? 'मेरा खाता: प्रोफ़ाइल, पिछले ऑर्डर, भुगतान व सेटिंग्स पेज' : 'My Account: Profile, Orders, Payments & Settings Page'}
              >
                <div className="w-4 h-4 rounded-full bg-orange-950 text-amber-300 flex items-center justify-center font-bold text-[9px] sm:text-[10px] shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="truncate max-w-[50px] sm:max-w-[100px] text-[11px] sm:text-xs">
                  {currentUser.name}
                </span>
                <User className="w-3 h-3 text-orange-950 shrink-0 hidden sm:inline" />
              </button>
            )}

            {/* 5. Cart Button */}
            <button
              onClick={() => {
                if (onOpenCart) onOpenCart();
                else setIsCartOpen(true);
              }}
              className="relative bg-amber-950/80 hover:bg-amber-900 text-amber-100 hover:text-white font-black px-2 sm:px-3 py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 text-xs shadow-xs transition-all active:scale-95 shrink-0 border border-amber-400/60 cursor-pointer"
              title={language === 'hi' ? 'मेरी कार्ट देखें' : 'View Cart'}
            >
              <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden md:inline">
                {language === 'hi' ? 'कार्ट' : 'Cart'}
              </span>
              {cartTotalItemsCount > 0 && (
                <span className="bg-orange-600 text-white font-mono text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow animate-pulse">
                  {cartTotalItemsCount}
                </span>
              )}
              {cartTotalAmount > 0 && (
                <span className="font-mono text-amber-300 font-bold ml-0.5 border-l border-amber-600/40 pl-1 text-[11px] sm:text-xs">
                  ₹{cartTotalAmount}
                </span>
              )}
            </button>

            {/* 6. Quick Logout (Shown when logged in) */}
            {currentUser && (
              <button
                onClick={logoutUser}
                className="p-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 hover:text-white rounded-xl border border-rose-500/50 text-xs transition-colors cursor-pointer"
                title={language === 'hi' ? 'लॉगआउट करें' : 'Logout'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Slide-over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-amber-900 text-amber-50 flex items-center justify-between border-b border-amber-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-base">
                    {language === 'hi' ? 'मेरी प्री-बुकिंग कार्ट' : 'Pre-Booking Cart'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-200 font-medium">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{language === 'hi' ? activeCity?.nameHi : activeCity?.nameEn || ''}</span>
                    {primaryCenter && (
                      <span className="truncate max-w-[160px]">
                        • {language === 'hi' ? primaryCenter.nameHi : primaryCenter.nameEn}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg hover:bg-amber-800 text-amber-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-amber-50/30">
              {!isBookingWindowOpen && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {language === 'hi' ? 'बुकिंग खिड़की बंद है' : 'Booking Window Closed'}
                    </span>
                    {language === 'hi'
                      ? 'उत्सव बुकिंग कट-ऑफ़ हो चुकी है। अब कोई नया ऑर्डर स्वीकार नहीं होगा।'
                      : 'Cutoff date reached. New pre-bookings are paused.'}
                  </div>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <ShoppingBag className="w-12 h-12 mx-auto text-amber-300 opacity-60" />
                  <p className="font-medium text-sm">
                    {language === 'hi' ? 'आपकी कार्ट अभी खाली है' : 'Your cart is empty'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {language === 'hi'
                      ? `${activeCity?.nameHi} की विशिष्ट मिठाइयाँ चुनें और एडवांस बुक करें।`
                      : `Select delicious festive sweets for ${activeCity?.nameEn} and pre-book.`}
                  </p>
                </div>
              ) : (
                (cart || []).map((item) => (
                  <div
                    key={`${item.sweetId}-${item.variantLabel}`}
                    className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-800 truncate">
                        {language === 'hi' ? item.sweetNameHi : item.sweetNameEn}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-mono font-medium">
                          {item.variantLabel}
                        </span>
                        <span>₹{item.unitPrice} / नग</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50">
                        <button
                          onClick={() =>
                            updateCartQty(item.sweetId, item.variantLabel, item.quantity - 1)
                          }
                          className="px-2 py-0.5 font-mono text-slate-700 hover:bg-slate-200 rounded-l-lg cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-xs text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQty(item.sweetId, item.variantLabel, item.quantity + 1)
                          }
                          className="px-2 py-0.5 font-mono text-slate-700 hover:bg-slate-200 rounded-r-lg cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono font-bold text-sm text-amber-900 w-16 text-right">
                        ₹{item.totalAmount}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.sweetId, item.variantLabel)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cart.length > 0 && (
              <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{language === 'hi' ? 'कुल मात्रा:' : 'Total Weight:'}</span>
                    <span className="font-mono font-semibold">
                      {(cart || []).reduce((a, b) => a + (b.variantKg || 0) * (b.quantity || 0), 0).toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-amber-950 pt-1 border-t border-dashed">
                    <span>{language === 'hi' ? 'कुल राशि:' : 'Total Payable:'}</span>
                    <span className="font-mono text-amber-900">₹{cartTotalAmount}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="px-3 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-medium text-slate-600 cursor-pointer"
                  >
                    {language === 'hi' ? 'खाली करें' : 'Clear'}
                  </button>
                  <button
                    disabled={!isBookingWindowOpen}
                    onClick={() => {
                      if (!currentUser) {
                        setIsCartOpen(false);
                        handleOpenLogin('customer');
                        return;
                      }
                      setIsCartOpen(false);
                      if (onOpenCart) onOpenCart();
                      else setRole('customer');
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer ${
                      isBookingWindowOpen
                        ? 'bg-amber-900 hover:bg-amber-950 text-white'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{language === 'hi' ? 'बुकिंग फ़ॉर्म पर जाएँ' : 'Proceed to Booking'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenCart={() => setIsCartOpen(true)}
        onOpenProfile={(tab) => handleOpenProfile(tab || 'profile')}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        defaultRole={loginModalRole}
      />

      {/* Logged User Profile & Account Hub Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileInitialTab}
      />
    </>
  );
};
