/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserSession } from '../types';
import {
  Shield,
  Users,
  ShoppingBag,
  Store,
  Building2,
  Crown,
  Lock,
  Phone,
  User,
  CheckCircle2,
  ArrowRight,
  X,
  AlertTriangle,
  KeyRound,
  Info
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, defaultRole = 'customer' }) => {
  const { loginUser, language, currentUser } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const roleConfigs: Record<
    UserRole,
    {
      titleHi: string;
      titleEn: string;
      badge: string;
      color: string;
      icon: React.ComponentType<{ className?: string }>;
      detail: string;
      isRestrictedAdmin: boolean;
    }
  > = {
    customer: {
      titleHi: 'ग्राहक (Customer Login)',
      titleEn: 'Customer Login',
      badge: 'ग्राहक पोर्टल',
      color: 'bg-blue-600 text-white',
      icon: ShoppingBag,
      detail: 'ग्राहक पोर्टल',
      isRestrictedAdmin: false
    },
    mitra: {
      titleHi: 'सहकार मित्र (Sahakar Mitra Login)',
      titleEn: 'Sahakar Mitra Login',
      badge: 'कार्यकर्ता पोर्टल',
      color: 'bg-orange-600 text-white',
      icon: Users,
      detail: 'सहकार मित्र पोर्टल',
      isRestrictedAdmin: false
    },
    kendra: {
      titleHi: 'बिक्री केंद्र प्रबंधक (Sale Center Manager)',
      titleEn: 'Sale Center Manager',
      badge: 'केंद्र प्रबंधक',
      color: 'bg-emerald-600 text-white',
      icon: Store,
      detail: 'बिक्री केंद्र प्रबंधन पोर्टल',
      isRestrictedAdmin: true
    },
    city_admin: {
      titleHi: 'शहर एडमिन (City Admin)',
      titleEn: 'City Admin',
      badge: 'ज़िला/शहर एडमिन',
      color: 'bg-purple-600 text-white',
      icon: Building2,
      detail: 'ज़िला सहकार भारती प्रशासनिक पोर्टल',
      isRestrictedAdmin: true
    },
    super_admin: {
      titleHi: 'राष्ट्रीय सुपर एडमिन (Super Admin)',
      titleEn: 'Super Admin',
      badge: 'राष्ट्रीय मुख्यालय',
      color: 'bg-rose-600 text-white',
      icon: Crown,
      detail: 'राष्ट्रीय मुख्यालय नियंत्रण पोर्टल',
      isRestrictedAdmin: true
    },
    common: {
      titleHi: 'सामान्य अतिथि',
      titleEn: 'Guest',
      badge: 'पब्लिक',
      color: 'bg-slate-600 text-white',
      icon: Shield,
      detail: 'अतिथि',
      isRestrictedAdmin: false
    },
    profile: {
      titleHi: 'उपयोगकर्ता खाता',
      titleEn: 'User Profile',
      badge: 'खाता',
      color: 'bg-amber-600 text-white',
      icon: User,
      detail: 'प्रोफ़ाइल एवं डैशबोर्ड',
      isRestrictedAdmin: false
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(defaultRole);
      setName(currentUser?.name || '');
      setPhone(currentUser?.phone || '');
      setPassword('');
      setErrorMessage(null);
      setStep('form');
    }
  }, [isOpen, defaultRole, currentUser]);

  if (!isOpen) return null;

  const currentConfig = roleConfigs[selectedRole] || roleConfigs.customer;
  const RoleIcon = currentConfig.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanPassword = password.trim().replace(/\D/g, '');
    const enteredName = name.trim();

    // 1. Enforce 10-digit mobile rule for ALL roles
    if (cleanPhone.length !== 10) {
      setErrorMessage(
        language === 'hi'
          ? 'कृपया ठीक 10 अंकों का वैध मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid exactly 10-digit mobile number.'
      );
      return;
    }

    // 2. Enforce 4-digit PIN/password rule for ALL roles
    if (cleanPassword.length !== 4) {
      setErrorMessage(
        language === 'hi'
          ? 'कृपया ठीक 4 अंकों का सुरक्षा पिन / पासवर्ड दर्ज करें।'
          : 'Please enter a valid exactly 4-digit PIN / password.'
      );
      return;
    }

    // 3. Restricted Admin Roles Check: Super Admin, City Admin, Sale Center Manager
    if (currentConfig.isRestrictedAdmin) {
      const isRestrictedMatch = cleanPhone === '7737691749' && cleanPassword === '1000';
      if (!isRestrictedMatch) {
        setErrorMessage(
          language === 'hi'
            ? '❌ अमान्य क्रेडेंशियल्स! कृपया सही अधिकृत मोबाइल नंबर एवं पासवर्ड दर्ज करें।'
            : '❌ Invalid credentials! Please check your mobile number and password.'
        );
        return;
      }
    }

    // 4. Determine final session parameters
    const defaultDisplayName =
      selectedRole === 'customer'
        ? (language === 'hi' ? 'ग्राहक' : 'Customer')
        : selectedRole === 'mitra'
        ? (language === 'hi' ? 'सहकार मित्र' : 'Sahakar Mitra')
        : 'admin';

    const finalName = enteredName || defaultDisplayName;
    const finalPhone = cleanPhone;

    const session: UserSession = {
      role: selectedRole,
      name: finalName,
      phone: finalPhone,
      detail: currentConfig.detail
    };

    loginUser(session);
    setStep('success');

    setTimeout(() => {
      setStep('form');
      onClose();
    }, 1000);
  };

  const handlePhoneInputChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePasswordInputChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 4);
    setPassword(digitsOnly);
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border-2 border-orange-300 overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-orange-700 via-amber-800 to-orange-800 text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-orange-950 font-black flex items-center justify-center text-base shadow-sm shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                {language === 'hi' ? 'सहकार भारती — सुरक्षित लॉगिन' : 'Sahakar Bharati Secure Login'}
              </h3>
              <p className="text-xs text-amber-200 font-medium">
                {language === 'hi'
                  ? '10-अंकीय मोबाइल नंबर एवं 4-अंकीय पिन द्वारा प्रवेश'
                  : 'Login with 10-digit mobile & 4-digit PIN'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white transition-colors cursor-pointer"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'success' ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h4 className="font-black text-xl text-slate-900">
              {language === 'hi' ? 'सफल लॉगिन!' : 'Login Successful!'}
            </h4>
            <p className="text-sm text-slate-600">
              {language === 'hi'
                ? `नमस्ते ${name || currentConfig.titleHi}, आपको आपके प्रोफ़ाइल पर ले जाया जा रहा है...`
                : `Welcome ${name || currentConfig.titleEn}, redirecting to your profile...`}
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Target Role Display (Dropdown removed) */}
            <div className="p-3 bg-amber-50/70 border-2 border-orange-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-lg font-bold shrink-0 shadow-xs ${currentConfig.color}`}>
                  <RoleIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'hi' ? 'लॉगिन पोर्टल' : 'Login Portal'}
                  </div>
                  <div className="font-black text-sm text-slate-900 truncate">
                    {language === 'hi' ? currentConfig.titleHi : currentConfig.titleEn}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-orange-100 text-orange-900 rounded-lg shrink-0 border border-orange-300">
                {currentConfig.badge}
              </span>
            </div>

            {/* Role Notice / Security Information */}
            {currentConfig.isRestrictedAdmin ? (
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{language === 'hi' ? 'प्रशासनिक सुरक्षा सत्यापन:' : 'Administrative Security Verification:'}</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-amber-900">
                  {language === 'hi'
                    ? 'यह एक सुरक्षित प्रशासनिक पोर्टल है। कृपया अपने अधिकृत मोबाइल नंबर एवं पासवर्ड से प्रवेश करें।'
                    : 'This is a secure administrative portal. Please enter your authorized mobile number and password.'}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Info className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{language === 'hi' ? 'सुरक्षित पोर्टल लॉगिन:' : 'Secure Portal Login:'}</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-blue-900">
                  {language === 'hi'
                    ? 'कृपया अपना 10-अंकीय मोबाइल नंबर एवं 4-अंकीय सुरक्षा पिन दर्ज करके प्रवेश करें।'
                    : 'Please enter your 10-digit mobile number and 4-digit PIN to proceed.'}
                </p>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-100 border-2 border-red-500 text-red-950 text-xs font-bold flex items-start gap-2 animate-shake shadow-xs">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'hi' ? 'नाम (User Name):' : 'Full Name:'}</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={language === 'hi' ? 'नाम दर्ज करें' : 'Enter user name'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white font-medium"
                  />
                </div>

                {/* Mobile Number (10 digits enforced) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{language === 'hi' ? 'मोबाइल नंबर:' : 'Mobile Number:'}</span>
                    </label>
                    <span className={`text-[10px] font-mono font-bold ${phone.length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {phone.length}/10
                    </span>
                  </div>
                  <div className="flex">
                    <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-xs font-mono font-bold text-slate-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => handlePhoneInputChange(e.target.value)}
                      placeholder={language === 'hi' ? '10-अंकीय मोबाइल नंबर' : '10-digit mobile number'}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4-digit PIN / Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'hi' ? '4-अंकीय पासवर्ड / पिन:' : '4-Digit PIN / Password:'}</span>
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${password.length === 4 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {password.length}/4
                  </span>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  value={password}
                  onChange={(e) => handlePasswordInputChange(e.target.value)}
                  placeholder={language === 'hi' ? '4-अंकीय पिन / पासवर्ड' : '4-digit PIN / password'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <span>{language === 'hi' ? 'लॉगिन करें और प्रवेश करें' : 'Login & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
