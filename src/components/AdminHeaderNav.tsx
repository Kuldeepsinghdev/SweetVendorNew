/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Building2,
  Store,
  Crown,
  ArrowLeft,
  Shield,
  LogOut,
  UserCheck,
  Sparkles
} from 'lucide-react';

interface AdminHeaderNavProps {
  currentRole: 'city_admin' | 'kendra' | 'super_admin';
}

export const AdminHeaderNav: React.FC<AdminHeaderNavProps> = ({ currentRole }) => {
  const { setRole, language, currentUser, logoutUser } = useApp();

  return (
    <div className="bg-slate-900 text-white p-2.5 sm:p-3 rounded-2xl border-2 border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
      
      {/* Left: Organization & Logged-in Admin Identity */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-xs shrink-0 font-bold">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-white truncate">
              {language === 'hi' ? 'सहकार भारती प्रशासनिक नियंत्रण' : 'Sahakar Bharati Admin Portal'}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {currentRole === 'kendra' && 'केंद्र प्रबंधन'}
              {currentRole === 'city_admin' && 'ज़िला एडमिन'}
              {currentRole === 'super_admin' && 'सुपर एडमिन'}
            </span>
          </div>

          {currentUser && (
            <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
              <span className="text-amber-300 font-bold flex items-center gap-1 text-[11px] sm:text-xs truncate">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[120px]">{currentUser.name}</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-slate-400 text-[10px] sm:text-[11px]">{currentUser.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: 3 Separate Admin Pages Navigation & Logout */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-between sm:justify-end">
        
        {/* Page 1: Kendra / Store Manager */}
        <button
          onClick={() => setRole('kendra')}
          className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            currentRole === 'kendra'
              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300 scale-102'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
          }`}
          title="बिक्री एवं वितरण केंद्र (आस्था भण्डार)"
        >
          <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{language === 'hi' ? '1. केंद्र' : '1. Kendra'}</span>
        </button>

        {/* Page 2: City Admin */}
        <button
          onClick={() => setRole('city_admin')}
          className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            currentRole === 'city_admin'
              ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300 scale-102'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
          }`}
          title="ज़िला/शहर सहकार भारती प्रशासनिक प्रबंधन"
        >
          <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="truncate">{language === 'hi' ? '2. ज़िला' : '2. City'}</span>
        </button>

        {/* Page 3: Super Admin */}
        <button
          onClick={() => setRole('super_admin')}
          className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            currentRole === 'super_admin'
              ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300 scale-102 font-black'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
          }`}
          title="राज्य व राष्ट्रीय सुपर एडमिन नियंत्रण"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{language === 'hi' ? '3. सुपर' : '3. Super'}</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={logoutUser}
          className="px-2 sm:px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 border border-rose-700/60 transition-all cursor-pointer"
          title="प्रशासनिक सत्र से लॉगआउट करें"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="hidden md:inline">{language === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
        </button>

        {/* Return to Public Home Store */}
        <button
          onClick={() => setRole('common')}
          className="px-2 sm:px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-600 transition-all cursor-pointer"
          title="मुख्य ग्राहक स्टोर पर लौटें"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">{language === 'hi' ? 'स्टोर' : 'Store'}</span>
        </button>
      </div>

    </div>
  );
};
