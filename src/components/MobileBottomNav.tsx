/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { LoginModal } from './LoginModal';
import {
  LayoutGrid,
  ShoppingBag,
  Users,
  Store,
  User,
  ShieldCheck
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenCart?: () => void;
  onOpenProfile?: (tab?: 'profile' | 'orders' | 'payments' | 'pickup' | 'settings') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenCart, onOpenProfile }) => {
  const { role, setRole, currentUser, cart, language } = useApp();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole>('customer');

  const cartTotalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleNavClick = (targetRole: UserRole) => {
    if (targetRole === 'common') {
      setRole('common');
      return;
    }

    if (!currentUser) {
      setLoginRole(targetRole);
      setIsLoginModalOpen(true);
      return;
    }

    // User logged in: check role
    if (currentUser.role === 'super_admin' || currentUser.role === 'city_admin' || currentUser.role === targetRole) {
      setRole(targetRole);
    } else {
      setLoginRole(targetRole);
      setIsLoginModalOpen(true);
    }
  };

  const getNavItems = () => {
    const baseItems = [
      { id: 'common' as UserRole, labelHi: 'होम', labelEn: 'Home', icon: LayoutGrid }
    ];

    if (!currentUser) {
      return [
        ...baseItems,
        { id: 'customer' as UserRole, labelHi: 'ग्राहक', labelEn: 'Customer', icon: User },
        { id: 'mitra' as UserRole, labelHi: 'मित्र', labelEn: 'Mitra', icon: Users },
        { id: 'city_admin' as UserRole, labelHi: 'एडमिन', labelEn: 'Admin', icon: ShieldCheck }
      ];
    }

    // Logged in user tabs
    const items = [...baseItems];
    if (currentUser.role === 'customer') {
      items.push({ id: 'customer' as UserRole, labelHi: 'मिष्ठान', labelEn: 'Sweets', icon: ShoppingBag });
    } else if (currentUser.role === 'mitra') {
      items.push({ id: 'mitra' as UserRole, labelHi: 'मित्र हब', labelEn: 'Mitra Hub', icon: Users });
      items.push({ id: 'customer' as UserRole, labelHi: 'मिष्ठान', labelEn: 'Sweets', icon: ShoppingBag });
    } else {
      items.push({ id: currentUser.role, labelHi: 'पोर्टल', labelEn: 'Portal', icon: Store });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <>
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-amber-950/95 backdrop-blur-md border-t-2 border-amber-400 text-amber-100 shadow-2xl no-print pb-safe">
        <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = role === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center justify-center h-full flex-1 py-1 text-[10px] font-bold transition-all cursor-pointer touch-manipulation active:scale-95 ${
                  isActive
                    ? 'text-amber-400 bg-orange-900/60 border-t-2 border-amber-400'
                    : 'text-amber-200/70 hover:text-white'
                }`}
              >
                <IconComp className="w-5 h-5 mb-0.5" />
                <span className="truncate max-w-[65px]">
                  {language === 'hi' ? item.labelHi : item.labelEn}
                </span>
              </button>
            );
          })}

          {/* Dedicated Profile Hub Button for Logged-in User */}
          {currentUser && (
            <button
              onClick={() => setRole('profile')}
              className={`flex flex-col items-center justify-center h-full flex-1 py-1 text-[10px] font-bold cursor-pointer transition-all touch-manipulation active:scale-95 ${
                role === 'profile'
                  ? 'text-amber-400 bg-orange-900/60 border-t-2 border-amber-400'
                  : 'text-amber-300 hover:text-amber-100'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-amber-400 text-orange-950 flex items-center justify-center font-black text-[9px] mb-0.5 shadow-sm">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="truncate max-w-[65px] font-bold text-amber-300">
                {language === 'hi' ? 'खाता' : 'Account'}
              </span>
            </button>
          )}

          {/* Cart button */}
          <button
            onClick={() => onOpenCart?.()}
            className="relative flex flex-col items-center justify-center h-full flex-1 py-1 text-[10px] font-bold text-amber-200 hover:text-amber-300 cursor-pointer touch-manipulation active:scale-95"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              {cartTotalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose-600 text-white font-mono text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cartTotalItemsCount}
                </span>
              )}
            </div>
            <span className="truncate max-w-[60px] mt-0.5 text-amber-300">
              {language === 'hi' ? 'कार्ट' : 'Cart'}
            </span>
          </button>
        </div>
      </nav>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        defaultRole={loginRole}
      />
    </>
  );
};
