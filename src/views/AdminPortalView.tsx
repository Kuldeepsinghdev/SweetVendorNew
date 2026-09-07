/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { CityAdminView } from './CityAdminView';
import { KendraFlowView } from './KendraFlowView';
import { SuperAdminView } from './SuperAdminView';
import { LoginModal } from '../components/LoginModal';
import {
  ShieldAlert,
  Building2,
  Store,
  Crown,
  Lock,
  ArrowLeft,
  CheckCircle2,
  LogIn,
  KeyRound
} from 'lucide-react';

export const AdminPortalView: React.FC = () => {
  const { role, setRole, currentUser, language, logoutUser } = useApp();
  const [selectedAdminTab, setSelectedAdminTab] = useState<'city_admin' | 'kendra' | 'super_admin'>('city_admin');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<UserRole>('city_admin');

  // Check if current user is logged in as an authorized admin
  const isAuthorizedAdmin =
    currentUser &&
    (currentUser.role === 'city_admin' || currentUser.role === 'kendra' || currentUser.role === 'super_admin');

  const handleOpenLogin = (adminRole: 'city_admin' | 'kendra' | 'super_admin') => {
    setTargetLoginRole(adminRole);
    setIsLoginModalOpen(true);
  };

  // If user is logged in as an admin or in an admin role view
  if (role === 'city_admin') {
    return (
      <div className="space-y-4">
        <div className="bg-purple-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-300" />
            <span className="font-bold text-sm sm:text-base">
              {language === 'hi' ? 'प्रशासनिक पोर्टल — शहर एडमिन' : 'Admin Portal — City Admin'}
            </span>
          </div>
          <button
            onClick={() => setRole('common')}
            className="text-xs bg-purple-800 hover:bg-purple-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'मुख्य पृष्ठ पर जाएँ' : 'Back to Home'}</span>
          </button>
        </div>
        <CityAdminView />
      </div>
    );
  }

  if (role === 'kendra') {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-300" />
            <span className="font-bold text-sm sm:text-base">
              {language === 'hi' ? 'प्रशासनिक पोर्टल — बिक्री केंद्र प्रबंधक' : 'Admin Portal — Sale Kendra'}
            </span>
          </div>
          <button
            onClick={() => setRole('common')}
            className="text-xs bg-emerald-800 hover:bg-emerald-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'मुख्य पृष्ठ पर जाएँ' : 'Back to Home'}</span>
          </button>
        </div>
        <KendraFlowView />
      </div>
    );
  }

  if (role === 'super_admin') {
    return (
      <div className="space-y-4">
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm sm:text-base">
              {language === 'hi' ? 'प्रशासनिक पोर्टल — राष्ट्रीय सुपर एडमिन' : 'Admin Portal — Super Admin'}
            </span>
          </div>
          <button
            onClick={() => setRole('common')}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'मुख्य पृष्ठ पर जाएँ' : 'Back to Home'}</span>
          </button>
        </div>
        <SuperAdminView />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-6 rounded-2xl shadow-xl border-2 border-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black">
                {language === 'hi' ? 'सहकार प्रशासनिक पोर्टल (Admin Portal)' : 'Sahakar Admin Portal'}
              </h2>
              <p className="text-xs text-amber-200">
                {language === 'hi'
                  ? 'शहर एडमिन, बिक्री केंद्र प्रबंधक एवं राष्ट्रीय सुपर एडमिन प्रवेश'
                  : 'Authorized access for City Admin, Kendra Manager & Super Admin'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setRole('common')}
          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'hi' ? 'मुख्य पृष्ठ (Home)' : 'Back to Home'}</span>
        </button>
      </div>

      {/* 3 Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City Admin */}
        <div className="bg-white rounded-2xl border-2 border-purple-200 hover:border-purple-500 shadow-md p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                {language === 'hi' ? 'ज़िला / शहर स्तर' : 'City Level'}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {language === 'hi' ? 'शहर एडमिन (City Admin)' : 'City Admin'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'स्थानीय मिष्ठान मूल्य निर्धारण, केंद्र आवंटन एवं सहकार मित्र आवेदन स्वीकृति।'
                  : 'City sweets pricing, kendra allocation & Sahakar Mitra approvals.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenLogin('city_admin')}
            className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>{language === 'hi' ? 'शहर एडमिन लॉगिन' : 'City Admin Login'}</span>
          </button>
        </div>

        {/* Kendra Manager */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 shadow-md p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                {language === 'hi' ? 'वितरण केंद्र' : 'Distribution Center'}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {language === 'hi' ? 'बिक्री केंद्र प्रबंधक (Kendra Manager)' : 'Kendra Manager'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'उत्सव मिठाई प्राप्ति, OTP सत्यापन द्वारा वितरण एवं इनवॉइस जनरेशन।'
                  : 'Stock management, OTP delivery verification & invoice generation.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenLogin('kendra')}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>{language === 'hi' ? 'केंद्र प्रबंधक लॉगिन' : 'Kendra Login'}</span>
          </button>
        </div>

        {/* Super Admin */}
        <div className="bg-white rounded-2xl border-2 border-slate-300 hover:border-amber-500 shadow-md p-5 flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-xs">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                {language === 'hi' ? 'राष्ट्रीय मुख्यालय' : 'National HQ'}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {language === 'hi' ? 'राष्ट्रीय सुपर एडमिन (Super Admin)' : 'Super Admin'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'राष्ट्रीय मिष्ठान कैटलॉग, उत्सव विंडो प्रबंधन एवं संपूर्ण ऑडिट लॉग नियंत्रण।'
                  : 'National catalog, festival window scheduling & system audit logs.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenLogin('super_admin')}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>{language === 'hi' ? 'सुपर एडमिन लॉगिन' : 'Super Admin Login'}</span>
          </button>
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-center gap-3">
        <KeyRound className="w-5 h-5 text-amber-700 shrink-0" />
        <div>
          <span className="font-bold block">
            {language === 'hi' ? 'सुरक्षित प्रशासनिक पहुँच:' : 'Secure Admin Access:'}
          </span>
          <span>
            {language === 'hi'
              ? 'प्रशासनिक भूमिकाओं में प्रवेश के लिए अधिकृत मोबाइल नंबर एवं सुरक्षा पिन अनिवार्य है।'
              : 'Authorized mobile number & security PIN are required for administrative access.'}
          </span>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        defaultRole={targetLoginRole}
      />
    </div>
  );
};
