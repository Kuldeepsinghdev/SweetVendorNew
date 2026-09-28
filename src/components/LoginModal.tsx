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
  Info,
  Mail
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

// Customer self-login is disabled. Any request to open the login modal for the
// customer role is redirected to the Sahakar Mitra portal, since bookings are
// placed exclusively by Mitra.
const resolveLoginRole = (requested: UserRole): UserRole =>
  requested === 'customer' ? 'mitra' : requested;

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, defaultRole = 'mitra' }) => {
  const { loginUser, language, currentUser } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>(resolveLoginRole(defaultRole));
  // Login method: 'email' (primary) uses email + password; 'phone' uses mobile
  // + 4-digit SMS PIN.
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('email');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 'form' = login; 'success' = logged in; 'reset_request' = forgot-password
  // email entry; 'reset_sent' = generic confirmation after requesting a reset.
  const [step, setStep] = useState<'form' | 'success' | 'reset_request' | 'reset_sent'>('form');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

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
      setSelectedRole(resolveLoginRole(defaultRole));
      setLoginMethod('email');
      setName(currentUser?.name || '');
      setPhone(currentUser?.phone || '');
      setEmail(currentUser?.email || '');
      setPassword('');
      setErrorMessage(null);
      setStep('form');
      setResetEmail(currentUser?.email || '');
      setResetSubmitting(false);
    }
  }, [isOpen, defaultRole, currentUser]);

  if (!isOpen) return null;

  const currentConfig = roleConfigs[selectedRole] || roleConfigs.customer;
  const RoleIcon = currentConfig.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const enteredName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanPin = password.trim().replace(/\D/g, '');
    const cleanEmail = email.trim();
    const cleanPassword = password; // email password: no digit stripping / length rule

    // Build the API request body depending on the selected login method.
    let requestBody: Record<string, string>;

    if (loginMethod === 'email') {
      // Email + password validation (relaxed: no digit-only / length rules)
      const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
      if (!emailIsValid) {
        setErrorMessage(
          language === 'hi'
            ? 'कृपया एक वैध ईमेल पता दर्ज करें।'
            : 'Please enter a valid email address.'
        );
        return;
      }
      if (cleanPassword.length < 4) {
        setErrorMessage(
          language === 'hi'
            ? 'कृपया अपना पासवर्ड दर्ज करें (कम से कम 4 वर्ण)।'
            : 'Please enter your password (at least 4 characters).'
        );
        return;
      }
      requestBody = { email: cleanEmail, password: cleanPassword };
    } else {
      // Phone + 4-digit SMS PIN validation
      if (cleanPhone.length !== 10) {
        setErrorMessage(
          language === 'hi'
            ? 'कृपया ठीक 10 अंकों का वैध मोबाइल नंबर दर्ज करें।'
            : 'Please enter a valid exactly 10-digit mobile number.'
        );
        return;
      }
      if (cleanPin.length !== 4) {
        setErrorMessage(
          language === 'hi'
            ? 'कृपया ठीक 4 अंकों का सुरक्षा पिन / पासवर्ड दर्ज करें।'
            : 'Please enter a valid exactly 4-digit PIN / password.'
        );
        return;
      }
      requestBody = { phone: cleanPhone, pin: cleanPin };
    }

    // Restricted Admin Roles: Redirect to server-side login page
    if (currentConfig.isRestrictedAdmin) {
      // Admin roles must use the server-side login at /admin
      setErrorMessage(
        language === 'hi'
          ? 'प्रशासनिक लॉगिन के लिए कृपया /admin पृष्ठ का उपयोग करें।'
          : 'Please use the /admin page for administrative login.'
      );
      return;
    }

    // Customer/Mitra login: Call the API
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(
          language === 'hi'
            ? (loginMethod === 'email'
                ? '❌ अमान्य क्रेडेंशियल्स! कृपया सही ईमेल एवं पासवर्ड दर्ज करें।'
                : '❌ अमान्य क्रेडेंशियल्स! कृपया सही मोबाइल नंबर एवं पिन दर्ज करें।')
            : (loginMethod === 'email'
                ? '❌ Invalid credentials! Please check your email and password.'
                : '❌ Invalid credentials! Please check your mobile number and PIN.')
        );
        return;
      }

      // Determine final session parameters
      const defaultDisplayName =
        selectedRole === 'customer'
          ? (language === 'hi' ? 'ग्राहक' : 'Customer')
          : selectedRole === 'mitra'
          ? (language === 'hi' ? 'सहकार मित्र' : 'Sahakar Mitra')
          : 'User';

      const finalName = enteredName || data.user?.name || defaultDisplayName;
      const finalPhone = data.user?.phone || cleanPhone;
      const finalEmail = data.user?.email ?? (loginMethod === 'email' ? cleanEmail : null);
      const userRole = data.user?.role || selectedRole;

      const session: UserSession = {
        role: userRole as UserRole,
        name: finalName,
        phone: finalPhone,
        email: finalEmail,
        userId: data.user?.id,
        cityId: data.user?.cityId ?? null,
        centerId: data.user?.centerId ?? null,
        detail: currentConfig.detail
      };

      loginUser(session);
      setStep('success');

      setTimeout(() => {
        setStep('form');
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(
        language === 'hi'
          ? 'लॉगिन में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Login error occurred. Please try again.'
      );
    }
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

  // Email-mode password: free-form, no digit-only stripping or length cap.
  const handleEmailPasswordChange = (val: string) => {
    setPassword(val);
    if (errorMessage) setErrorMessage(null);
  };

  const handleEmailInputChange = (val: string) => {
    setEmail(val);
    if (errorMessage) setErrorMessage(null);
  };

  // Switch between phone/SMS-PIN and email/password login. Clear the shared
  // credential field so a 4-digit PIN doesn't leak into the password field.
  const switchLoginMethod = (method: 'phone' | 'email') => {
    setLoginMethod(method);
    setPassword('');
    setErrorMessage(null);
  };

  const openResetRequest = () => {
    // Prefill with whatever email the user already typed on the login form.
    setResetEmail((prev) => prev || email);
    setErrorMessage(null);
    setStep('reset_request');
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = resetEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage(
        language === 'hi'
          ? 'कृपया एक वैध ईमेल पता दर्ज करें।'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setResetSubmitting(true);
    try {
      await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      // Always show the same generic confirmation (no account enumeration).
      setStep('reset_sent');
    } catch (error) {
      console.error('Password reset request error:', error);
      // Still show the generic confirmation to avoid leaking information.
      setStep('reset_sent');
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border-2 border-orange-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-orange-700 via-amber-800 to-orange-800 text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-orange-950 font-black flex items-center justify-center text-base shadow-sm shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                {language === 'hi' ? 'सहकार भारती — सुरक्षित लॉगिन' : 'Sahakar Bharati Secure Login'}
              </h3>
              <p className="text-xs text-amber-200 font-medium">
                {loginMethod === 'email'
                  ? (language === 'hi'
                      ? 'ईमेल एवं पासवर्ड द्वारा प्रवेश'
                      : 'Login with email & password')
                  : (language === 'hi'
                      ? '10-अंकीय मोबाइल नंबर एवं 4-अंकीय पिन द्वारा प्रवेश'
                      : 'Login with 10-digit mobile & 4-digit PIN')}
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

        {step === 'reset_request' ? (
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            <div>
              <h4 className="font-black text-lg text-slate-900">
                {language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset your password'}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'hi'
                  ? 'अपना पंजीकृत ईमेल दर्ज करें। हम आपको पासवर्ड रीसेट करने के लिए एक लिंक भेजेंगे।'
                  : 'Enter your registered email. We will send you a link to reset your password.'}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-100 border-2 border-red-500 text-red-950 text-xs font-bold flex items-start gap-2 animate-shake shadow-xs">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleResetRequest} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === 'hi' ? 'ईमेल पता:' : 'Email Address:'}</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder={language === 'hi' ? 'आपका ईमेल पता' : 'you@example.com'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              <div className="pt-1 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-1/3 py-2.5 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'वापस' : 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="w-2/3 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <span>
                    {resetSubmitting
                      ? (language === 'hi' ? 'भेजा जा रहा है…' : 'Sending…')
                      : (language === 'hi' ? 'रीसेट लिंक भेजें' : 'Send reset link')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : step === 'reset_sent' ? (
          <div className="p-8 text-center space-y-3 overflow-y-auto">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Mail className="w-9 h-9" />
            </div>
            <h4 className="font-black text-xl text-slate-900">
              {language === 'hi' ? 'ईमेल जाँचें' : 'Check your email'}
            </h4>
            <p className="text-sm text-slate-600">
              {language === 'hi'
                ? 'यदि उस ईमेल के लिए कोई खाता मौजूद है, तो हमने पासवर्ड रीसेट लिंक भेज दिया है। लिंक 30 मिनट में समाप्त हो जाएगा।'
                : 'If an account exists for that email, we have sent a password reset link. The link expires in 30 minutes.'}
            </p>
            <button
              onClick={() => setStep('form')}
              className="mt-2 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {language === 'hi' ? 'लॉगिन पर वापस जाएँ' : 'Back to login'}
            </button>
          </div>
        ) : step === 'success' ? (
          <div className="p-8 text-center space-y-3 overflow-y-auto">
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
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
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
                  {loginMethod === 'email'
                    ? (language === 'hi'
                        ? 'कृपया अपना पंजीकृत ईमेल पता एवं पासवर्ड दर्ज करके प्रवेश करें।'
                        : 'Please enter your registered email address and password to proceed.')
                    : (language === 'hi'
                        ? 'कृपया अपना 10-अंकीय मोबाइल नंबर एवं 4-अंकीय सुरक्षा पिन दर्ज करके प्रवेश करें।'
                        : 'Please enter your 10-digit mobile number and 4-digit PIN to proceed.')}
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

            {/* Login Method Toggle: Email (primary, password) vs Phone (SMS PIN) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => switchLoginMethod('email')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  loginMethod === 'email'
                    ? 'bg-white text-orange-800 shadow-xs ring-1 ring-orange-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'ईमेल' : 'Email'}</span>
              </button>
              <button
                type="button"
                onClick={() => switchLoginMethod('phone')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  loginMethod === 'phone'
                    ? 'bg-white text-orange-800 shadow-xs ring-1 ring-orange-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'फ़ोन नंबर' : 'Phone'}</span>
              </button>
            </div>

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

                {loginMethod === 'phone' ? (
                  /* Mobile Number (10 digits enforced) */
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
                ) : (
                  /* Email Address */
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{language === 'hi' ? 'ईमेल पता:' : 'Email Address:'}</span>
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailInputChange(e.target.value)}
                      placeholder={language === 'hi' ? 'आपका ईमेल पता' : 'you@example.com'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                )}
              </div>

              {loginMethod === 'phone' ? (
                /* 4-digit PIN / Password */
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
              ) : (
                /* Free-form Password (email login) */
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>{language === 'hi' ? 'पासवर्ड:' : 'Password:'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={openResetRequest}
                      className="text-[11px] font-bold text-orange-700 hover:text-orange-900 hover:underline cursor-pointer"
                    >
                      {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                    </button>
                  </div>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => handleEmailPasswordChange(e.target.value)}
                    placeholder={language === 'hi' ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
              )}

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
