/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserSession } from '../types';
import {
  Lock,
  Shield,
  Store,
  Building2,
  Crown,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface AdminAuthGuardProps {
  requiredRole: 'kendra' | 'city_admin' | 'super_admin';
  children: React.ReactNode;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ requiredRole, children }) => {
  const { currentUser, loginUser, setRole, language } = useApp();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Role Metadata & authorized demo credentials
  const roleInfo = {
    kendra: {
      titleHi: 'बिक्री केंद्र / भण्डार प्रबंधक पोर्टल',
      titleEn: 'Sale Center / Store Manager Portal',
      subtitleHi: 'आस्था उपभोक्ता भण्डार व अधिकृत सहकारी वितरण केंद्र',
      subtitleEn: 'Authorized Sahakar Distribution Kendra & Store',
      icon: Store,
      colorTheme: 'from-emerald-900 via-slate-900 to-emerald-950',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-500',
      accentColor: 'emerald',
      demoPhone: '7737691749',
      demoPin: '1000',
      demoLabelHi: 'केंद्र प्रबंधक (आस्था भण्डार)',
      descriptionHi: 'दैनिक मिठाई स्टॉक प्राप्ति, OTP सत्यापन द्वारा ग्राहक वितरण, एवं दैनिक बिलिंग का प्रबंधन।'
    },
    city_admin: {
      titleHi: 'ज़िला / शहर एडमिन पोर्टल',
      titleEn: 'District / City Admin Portal',
      subtitleHi: 'ज़िला सहकार भारती प्रशासनिक नियंत्रण',
      subtitleEn: 'District Sahakar Bharati Administration',
      icon: Building2,
      colorTheme: 'from-purple-950 via-slate-900 to-indigo-950',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      buttonBg: 'bg-purple-600 hover:bg-purple-500',
      accentColor: 'purple',
      demoPhone: '7737691749',
      demoPin: '1000',
      demoLabelHi: 'शहर एडमिन (सवाई माधोपुर)',
      descriptionHi: 'स्थानीय मिष्ठान मूल्य निर्धारण, विक्रय केंद्र आवंटन, सहकार मित्र आवेदन स्वीकृति एवं ज़िला आपूर्ति नियंत्रण।'
    },
    super_admin: {
      titleHi: 'राज्य / राष्ट्रीय सुपर एडमिन पोर्टल',
      titleEn: 'State / National Super Admin Portal',
      subtitleHi: 'सहकार भारती राज्य व राष्ट्रीय मुख्यालय नियंत्रण',
      subtitleEn: 'State & National HQ Master Control',
      icon: Crown,
      colorTheme: 'from-slate-950 via-amber-950 to-slate-900',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      buttonBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
      accentColor: 'amber',
      demoPhone: '7737691749',
      demoPin: '1000',
      demoLabelHi: 'मुख्यालय सुपर एडमिन',
      descriptionHi: 'समस्त ज़िलों की सक्रियता, त्यौहार कट-ऑफ तिथियाँ, मास्टर मिठाई कैटलॉग एवं संपूर्ण राज्य ऑडिट रिपोर्ट।'
    }
  }[requiredRole];

  // Authorization Check
  const isAuthorized =
    currentUser &&
    (currentUser.role === requiredRole ||
      currentUser.role === 'super_admin' ||
      (requiredRole === 'kendra' && currentUser.role === 'city_admin'));

  // If authorized, render the actual admin page!
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Handle Login Submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanPin = pin.trim();

    if (cleanPhone.length !== 10) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया 10 अंकों का अधिकृत मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit authorized mobile number.'
      );
      return;
    }

    if (cleanPin.length < 4) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया 4 अंकों का सुरक्षा पिन / पासवर्ड दर्ज करें।'
          : 'Please enter your 4-digit security PIN.'
      );
      return;
    }

    // Verification check (Accepts authorized credentials or universal demo PIN)
    const isMasterMatch = cleanPin === '1000' || cleanPin === '1234' || cleanPin === 'admin123';
    const isSpecificMatch =
      (cleanPhone === roleInfo.demoPhone && (cleanPin === roleInfo.demoPin || cleanPin === '1000')) ||
      cleanPhone === '9414112233' ||
      cleanPhone === '9413753383' ||
      cleanPhone === '9999999999' ||
      cleanPhone === '7737691749';

    if (!isMasterMatch && !isSpecificMatch) {
      setErrorMsg(
        language === 'hi'
          ? '❌ अमान्य क्रेडेंशियल्स! यह मोबाइल नंबर या पिन इस प्रशासनिक पोर्टल के लिए अधिकृत नहीं है।'
          : '❌ Invalid credentials! Not authorized for this administrative portal.'
      );
      return;
    }

    const sessionName =
      requiredRole === 'kendra'
        ? (language === 'hi' ? 'आस्था भण्डार प्रबंधक' : 'Aastha Store Manager')
        : requiredRole === 'city_admin'
        ? (language === 'hi' ? 'ज़िला सहकार भारती एडमिन' : 'District Admin')
        : (language === 'hi' ? 'राज्य मुख्यालय सुपर एडमिन' : 'HQ Super Admin');

    const session: UserSession = {
      role: requiredRole,
      name: sessionName,
      phone: cleanPhone,
      detail: roleInfo.subtitleHi
    };

    loginUser(session);
    setIsSuccess(true);
  };

  // Quick Demo Login Helper
  const handleQuickDemoLogin = () => {
    setPhone(roleInfo.demoPhone);
    setPin(roleInfo.demoPin);
    setErrorMsg(null);

    const sessionName =
      requiredRole === 'kendra'
        ? (language === 'hi' ? 'आस्था भण्डार प्रबंधक' : 'Aastha Store Manager')
        : requiredRole === 'city_admin'
        ? (language === 'hi' ? 'ज़िला सहकार भारती एडमिन' : 'District Admin')
        : (language === 'hi' ? 'राज्य मुख्यालय सुपर एडमिन' : 'HQ Super Admin');

    const session: UserSession = {
      role: requiredRole,
      name: sessionName,
      phone: roleInfo.demoPhone,
      detail: roleInfo.subtitleHi
    };

    loginUser(session);
    setIsSuccess(true);
  };

  const IconComponent = roleInfo.icon;

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-start sm:justify-center p-2.5 sm:p-6 animate-in fade-in duration-200 space-y-4">
      
      {/* TOP ADMIN ROLE SWITCHER BAR (PROMINENT AT TOP) */}
      <div className="w-full max-w-lg bg-slate-950/90 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border-2 border-amber-400 shadow-xl">
        <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider text-center pb-1.5 border-b border-slate-800 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>प्रशासनिक पोर्टल चयन करें (Switch Admin Portal at Top):</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-1.5">
          {/* Tab 1: Kendra */}
          <button
            type="button"
            onClick={() => setRole('kendra')}
            className={`py-2 px-1 rounded-xl text-xs font-black flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              requiredRole === 'kendra'
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-300 scale-102'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">1. बिक्री केंद्र</span>
          </button>

          {/* Tab 2: City Admin */}
          <button
            type="button"
            onClick={() => setRole('city_admin')}
            className={`py-2 px-1 rounded-xl text-xs font-black flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              requiredRole === 'city_admin'
                ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-300 scale-102'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">2. शहर एडमिन</span>
          </button>

          {/* Tab 3: Super Admin */}
          <button
            type="button"
            onClick={() => setRole('super_admin')}
            className={`py-2 px-1 rounded-xl text-xs font-black flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              requiredRole === 'super_admin'
                ? 'bg-amber-500 text-slate-950 shadow-lg ring-2 ring-amber-300 scale-102'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">3. सुपर एडमिन</span>
          </button>
        </div>
      </div>

      {/* ADMIN AUTH LOGIN CARD */}
      <div className="w-full max-w-lg bg-slate-900 text-white rounded-3xl shadow-2xl border-2 border-amber-400/80 overflow-hidden">
        
        {/* Card Header */}
        <div className={`bg-gradient-to-r ${roleInfo.colorTheme} p-5 sm:p-6 border-b border-slate-700/80 relative`}>
          <div className="flex items-center justify-between gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badgeBg}`}>
              <Shield className="w-3.5 h-3.5" />
              <span>प्रशासनिक सुरक्षा द्वार</span>
            </div>

            <button
              onClick={() => setRole('common')}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer border border-slate-600"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>मुख्य पृष्ठ</span>
            </button>
          </div>

          <div className="mt-3.5 flex items-start gap-3.5">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-md shrink-0">
              <IconComponent className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {roleInfo.titleHi}
              </h2>
              <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                {roleInfo.subtitleHi}
              </p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 space-y-4 bg-slate-900/95">
          
          {/* Security Notice */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-200/90 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>अनधिकृत प्रवेश वर्जित (Restricted Access)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/80 pl-5">
              {roleInfo.descriptionHi}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                अधिकृत मोबाइल नंबर (Authorized Mobile Number):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="font-bold text-xs font-mono">+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="उदा. 7737691749"
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm font-mono text-white focus:outline-none placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            {/* Security PIN */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                सुरक्षा पिन / पासवर्ड (Security PIN):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={10}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="4-अंकीय पिन दर्ज करें (उदा. 1000)"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm font-mono text-white focus:outline-none placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${roleInfo.buttonBg}`}
            >
              <LogIn className="w-4 h-4" />
              <span>प्रशासनिक लॉगिन करें (Secure Sign In)</span>
            </button>
          </form>

          {/* Quick Demo Test Access Button */}
          <div className="pt-1.5 border-t border-slate-800">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 bg-slate-800/90 hover:bg-slate-800 border border-amber-400/40 text-amber-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-क्लिक डेमो लॉगिन: {roleInfo.demoLabelHi} ({roleInfo.demoPhone} / पिन: {roleInfo.demoPin})</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
