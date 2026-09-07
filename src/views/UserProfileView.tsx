/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, CartItem } from '../types';
import { PrintReceiptModal } from '../components/PrintReceiptModal';
import {
  User,
  Package,
  CreditCard,
  MapPin,
  Settings,
  LogOut,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  QrCode,
  Printer,
  Share2,
  ChevronRight,
  ShieldCheck,
  Building2,
  Store,
  Sparkles,
  Search,
  ExternalLink,
  Coins,
  ArrowRight,
  Copy,
  Check,
  ShoppingBag,
  Award,
  ArrowLeft,
  Edit3,
  Save,
  RotateCcw,
  AlertCircle,
  FileText,
  HelpCircle,
  TrendingUp,
  Truck
} from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const {
    currentUser,
    updateUserSession,
    logoutUser,
    role,
    setRole,
    language,
    setLanguage,
    bookings,
    activeCity,
    setActiveCityId,
    cities,
    saleCenters,
    mitras,
    activeFestival,
    addToCart
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'payments' | 'pickup' | 'settings'>('profile');
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'confirmed' | 'delivered'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  // Edit profile local state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editAddress, setEditAddress] = useState(currentUser?.address || '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border-2 border-amber-300 shadow-xl text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-orange-950 flex items-center justify-center mx-auto shadow-md">
          <User className="w-8 h-8 text-orange-800" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900">
            {language === 'hi' ? 'उपयोगकर्ता प्रोफ़ाइल देखने हेतु लॉगिन आवश्यक है' : 'Login Required to View Profile'}
          </h2>
          <p className="text-xs text-slate-600">
            {language === 'hi'
              ? 'कृपया अपने मोबाइल नंबर अथवा ओटीपी से लॉगिन करें।'
              : 'Please log in with your phone number to access your account dashboard.'}
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => setRole('customer')}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {language === 'hi' ? 'ग्राहक लॉगिन एवं कैटलॉग' : 'Customer Login'}
          </button>
          <button
            onClick={() => setRole('common')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            {language === 'hi' ? 'होम पेज' : 'Home'}
          </button>
        </div>
      </div>
    );
  }

  // Filter bookings associated with the logged-in user
  const userBookings = bookings.filter((b) => {
    if (currentUser.role === 'customer') {
      const matchPhone = currentUser.phone && b.customer?.phone?.includes(currentUser.phone);
      const matchName = currentUser.name && b.customer?.name?.toLowerCase().includes(currentUser.name.toLowerCase());
      return b.bookedByRole === 'customer' || matchPhone || matchName;
    } else if (currentUser.role === 'mitra') {
      const matchMitraId = currentUser.id && b.mitraId === currentUser.id;
      const matchMitraName = currentUser.name && b.mitraName?.toLowerCase().includes(currentUser.name.toLowerCase());
      const matchPhone = currentUser.phone && b.customer?.phone?.includes(currentUser.phone);
      return matchMitraId || matchMitraName || matchPhone;
    } else {
      // Kendra or Admin
      return true;
    }
  });

  // Filtered by search & status
  const filteredOrders = userBookings.filter((b) => {
    if (orderStatusFilter === 'confirmed' && b.status === 'delivered') return false;
    if (orderStatusFilter === 'delivered' && b.status !== 'delivered') return false;

    if (!searchOrderQuery.trim()) return true;
    const q = searchOrderQuery.toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      b.customer?.name?.toLowerCase().includes(q) ||
      b.centerNameHi?.toLowerCase().includes(q) ||
      b.deliveryOtp?.includes(q) ||
      b.items.some(it => it.sweetNameHi?.toLowerCase().includes(q))
    );
  });

  // Mitra specific details if logged in as mitra
  const currentMitra = mitras.find(
    (m) => m.phone === currentUser.phone || (currentUser.id && m.id === currentUser.id)
  );

  // Active City Centers
  const cityCenters = saleCenters.filter((c) => c.cityId === activeCity.id && c.isActive);
  const primaryCenter = cityCenters[0] || saleCenters[0];

  // Financial summary
  const totalBookedAmount = userBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaidAmount = userBookings.reduce((sum, b) => {
    if (b.paymentStatus === 'paid') return sum + b.totalAmount;
    if (b.paymentMethod === 'online') return sum + b.totalAmount;
    return sum;
  }, 0);
  const totalPendingAmount = totalBookedAmount - totalPaidAmount;
  const totalBookedKg = userBookings.reduce((sum, b) => sum + (b.totalKg || 0), 0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleShareWhatsApp = (b: Booking) => {
    const text = `*सहकार भारती — उत्सव मिष्ठान अग्रिम बुकिंग*\nऑर्डर संख्या: ${b.id}\nग्राहक नाम: ${b.customer?.name || ''}\nकुल मात्रा: ${b.totalKg} kg | राशि: ₹${b.totalAmount}\nसंग्रह केंद्र: ${b.centerNameHi}\nसंग्रह तिथि: ${b.pickupDate}\nडिलीवरी OTP: ${b.deliveryOtp}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleReorder = (b: Booking) => {
    b.items.forEach((item) => {
      addToCart(item);
    });
    setReorderSuccessMsg(language === 'hi' ? `ऑर्डर ${b.id} की सभी मिठाइयाँ कार्ट में जोड़ दी गईं!` : `Items from order ${b.id} added to cart!`);
    setTimeout(() => setReorderSuccessMsg(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserSession({
      name: editName.trim() || currentUser.name,
      email: editEmail.trim(),
      address: editAddress.trim()
    });
    setIsEditingProfile(false);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  const getRoleLabel = () => {
    switch (currentUser.role) {
      case 'customer':
        return { hi: 'पंजीकृत ग्राहक (Customer)', en: 'Registered Customer', badge: 'ग्राहक', color: 'bg-blue-600' };
      case 'mitra':
        return { hi: 'अधिकृत सहकार मित्र (Sahakar Mitra)', en: 'Authorized Sahakar Mitra', badge: 'सहकार मित्र', color: 'bg-amber-600' };
      case 'kendra':
        return { hi: 'बिक्री केंद्र प्रबंधक (Kendra Manager)', en: 'Sale Center Manager', badge: 'केंद्र प्रबंधक', color: 'bg-purple-700' };
      case 'city_admin':
        return { hi: 'शहर एडमिन (City Admin)', en: 'City Administrator', badge: 'शहर एडमिन', color: 'bg-emerald-700' };
      case 'super_admin':
        return { hi: 'राष्ट्रीय सुपर एडमिन (Super Admin)', en: 'Super Administrator', badge: 'सुपर एडमिन', color: 'bg-rose-700' };
      default:
        return { hi: 'उपयोगकर्ता', en: 'User', badge: 'उपयोगकर्ता', color: 'bg-slate-700' };
    }
  };

  const roleInfo = getRoleLabel();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. TOP BREADCRUMB & BACK NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setRole(currentUser.role === 'mitra' ? 'mitra' : 'customer')}
            className="font-bold text-orange-700 hover:text-orange-900 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'मिष्ठान कैटलॉग पर वापस' : 'Back to Catalog'}</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800">
            {language === 'hi' ? 'उपयोगकर्ता खाता एवं डैशबोर्ड' : 'User Account & Dashboard'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRole('customer')}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-300"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-orange-800" />
            <span>{language === 'hi' ? 'मिठाई बुक करें' : 'Order Sweets'}</span>
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>{language === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* Toast notifications */}
      {reorderSuccessMsg && (
        <div className="p-3 bg-emerald-950 text-emerald-100 rounded-2xl border-2 border-emerald-400 flex items-center gap-2 text-xs font-bold shadow-lg animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reorderSuccessMsg}</span>
        </div>
      )}

      {profileSaveSuccess && (
        <div className="p-3 bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-300 flex items-center gap-2 text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{language === 'hi' ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!' : 'Profile updated successfully!'}</span>
        </div>
      )}

      {/* 2. MAIN USER HERO BANNER */}
      <div className="relative bg-gradient-to-r from-orange-950 via-amber-900 to-orange-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border-3 border-amber-400 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 text-orange-950 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl border-3 border-white shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentUser.name || (language === 'hi' ? 'सहकार ग्राहक' : 'Sahakar Customer')}
                </h1>
                <span className={`px-2.5 py-0.5 ${roleInfo.color} text-white font-mono text-xs font-bold rounded-full border border-white/40 shadow-xs`}>
                  {roleInfo.badge}
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/90 text-slate-950 font-bold text-[11px] rounded-full flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{language === 'hi' ? 'प्रमाणित (Verified)' : 'Verified'}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-200/90 font-mono">
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentUser.phone || '9413XXXXXX'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{activeCity.nameHi} ({activeCity.nameEn})</span>
                </div>
                {currentUser.id && (
                  <div className="bg-amber-950/80 px-2 py-0.5 rounded text-[10.5px] text-amber-300 font-bold border border-amber-500/40">
                    ID: {currentUser.id}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics on Hero */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-amber-950/70 p-3 sm:p-4 rounded-2xl border border-amber-500/40 backdrop-blur-xs text-center">
            <div>
                    <span className="text-[10.5px] uppercase font-bold text-amber-300/80 block">{language === 'hi' ? 'कुल ऑर्डर्स' : 'Total Orders'}</span>
              <span className="font-mono font-black text-lg sm:text-xl text-white mt-0.5 block">{userBookings.length}</span>
            </div>
            <div className="border-x border-amber-600/40 px-2">
              <span className="text-[10.5px] uppercase font-bold text-amber-300/80 block">{language === 'hi' ? 'कुल वज़न' : 'Total Weight'}</span>
              <span className="font-mono font-black text-lg sm:text-xl text-amber-300 mt-0.5 block">{totalBookedKg.toFixed(1)} kg</span>
            </div>
            <div>
              <span className="text-[10.5px] uppercase font-bold text-amber-300/80 block">{language === 'hi' ? 'कुल राशि' : 'Total Amount'}</span>
              <span className="font-mono font-black text-lg sm:text-xl text-emerald-400 mt-0.5 block">₹{totalBookedAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FULL PAGE NAVIGATION TABS */}
      <div className="bg-white rounded-2xl border-2 border-amber-300 p-2 shadow-xs flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'profile', labelHi: '👤 प्रोफ़ाइल एवं पता', labelEn: 'Profile & Address', icon: User },
          {
            id: 'orders',
            labelHi: '📦 मेरे ऑर्डर्स व रसीदें',
            labelEn: 'My Orders & Receipts',
            icon: Package,
            badge: userBookings.length > 0 ? userBookings.length : undefined
          },
          { id: 'payments', labelHi: '💳 भुगतान एवं अग्रिम बहीखाता', labelEn: 'Payments & Ledger', icon: CreditCard },
          { id: 'pickup', labelHi: '📍 संग्रह केंद्र व समय सारिणी', labelEn: 'Pickup Hub & Timings', icon: Store },
          { id: 'settings', labelHi: '⚙️ खाता प्राथमिकताएं', labelEn: 'Preferences', icon: Settings }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-900 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border border-slate-200 hover:border-amber-300'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-amber-800'}`} />
              <span>{language === 'hi' ? tab.labelHi : tab.labelEn}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-amber-400 text-amber-950' : 'bg-orange-100 text-orange-950 border border-orange-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}
      
      {/* TAB 1: PROFILE & PERSONAL DETAILS */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Profile Card & Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-700" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    {language === 'hi' ? 'व्यक्तिगत जानकारी एवं सम्पर्क' : 'Personal & Contact Information'}
                  </h3>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => {
                      setEditName(currentUser.name || '');
                      setEditEmail(currentUser.email || '');
                      setEditAddress(currentUser.address || '');
                      setIsEditingProfile(true);
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-orange-700" />
                    <span>{language === 'hi' ? 'संपादित करें' : 'Edit Profile'}</span>
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {language === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2.5 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {language === 'hi' ? 'मोबाइल नंबर (पंजीकृत)' : 'Registered Mobile'}
                      </label>
                      <input
                        type="text"
                        disabled
                        value={currentUser.phone || ''}
                        className="w-full p-2.5 border border-slate-200 bg-slate-100 rounded-xl text-slate-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {language === 'hi' ? 'ईमेल पता (वैकल्पिक)' : 'Email Address (Optional)'}
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full p-2.5 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {language === 'hi' ? 'स्थानीय पता / लैंडमार्क (संग्रह केंद्र चयन हेतु)' : 'Address / Landmark'}
                    </label>
                    <textarea
                      rows={2}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder={language === 'hi' ? 'गली, मोहल्ला, मकान संख्या या नजदीकी लैंडमार्क...' : 'Street address, landmark...'}
                      className="w-full p-2.5 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {currentUser.name || (language === 'hi' ? 'ग्राहक' : 'Customer')}
                    </span>
                  </div>

                  <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {language === 'hi' ? 'पंजीकृत मोबाइल नंबर' : 'Registered Mobile'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                      {currentUser.phone || '9413XXXXXX'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {language === 'hi' ? 'ईमेल आईडी' : 'Email Address'}
                    </span>
                    <span className="font-mono text-slate-800 text-xs mt-0.5 block">
                      {currentUser.email || (language === 'hi' ? 'उपलब्ध नहीं (Not Provided)' : 'Not Provided')}
                    </span>
                  </div>

                  <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {language === 'hi' ? 'सक्रिय वितरण शहर' : 'Active City'}
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {language === 'hi' ? `${activeCity.nameHi} (${activeCity.stateHi})` : `${activeCity.nameEn} (${activeCity.stateEn})`}
                    </span>
                  </div>

                  <div className="sm:col-span-2 p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {language === 'hi' ? 'पता / लैंडमार्क' : 'Address / Landmark'}
                    </span>
                    <span className="text-slate-800 text-xs mt-0.5 block">
                      {currentUser.address || (language === 'hi' ? 'सवाई माधोपुर (राजस्थान) — डिफ़ॉल्ट' : 'Sawai Madhopur (Rajasthan) — Default')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sahakar Mitra Credentials Card (if role is mitra) */}
            {currentUser.role === 'mitra' && currentMitra && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-amber-700" />
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-amber-950">
                        {language === 'hi' ? 'अधिकृत सहकार मित्र क्रेडेंशियल' : 'Authorized Sahakar Mitra Credentials'}
                      </h4>
                      <p className="text-xs text-amber-800">
                        {language === 'hi' ? 'सहकार भारती अधिकृत उत्सव मिष्ठान प्रतिनिधि' : 'Authorized Festive Sweets Representative'}
                      </p>
                    </div>
                  </div>
                  <span className="bg-amber-300 text-amber-950 font-mono font-black text-xs px-2.5 py-1 rounded-xl border border-amber-400 shadow-xs">
                    {currentMitra.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'स्वीकृति स्थिति' : 'Approval Status'}</span>
                    <span className="font-bold text-emerald-700 text-xs block mt-0.5">✓ {language === 'hi' ? 'स्वीकृत (Active)' : 'Approved (Active)'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'उधार क्रेडिट लिमिट' : 'Credit Limit'}</span>
                    <span className="font-mono font-black text-slate-900 text-xs block mt-0.5">₹{currentMitra.creditLimit || 25000}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'संलग्न शहर' : 'Assigned City'}</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5">{language === 'hi' ? currentMitra.cityNameHi : activeCity.nameEn}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[11px]">{language === 'hi' ? 'सक्रिय केंद्र' : 'Active Center'}</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5 truncate">{language === 'hi' ? primaryCenter?.nameHi : primaryCenter?.nameEn}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Member ID Card & Quick Hub */}
          <div className="space-y-6">
            {/* Digital Member Card */}
            <div className="bg-gradient-to-br from-amber-900 via-orange-950 to-amber-950 text-white rounded-3xl p-5 border-2 border-amber-400 shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10 text-9xl">🏛️</div>
              
              <div className="flex items-center justify-between relative z-10 border-b border-amber-500/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-orange-950 flex items-center justify-center font-black text-sm">
                    स
                  </div>
                  <div>
                    <span className="font-black text-xs text-white tracking-wider block">सहकार भारती</span>
                    <span className="text-[10px] text-amber-200 block">डिजिटल सदस्य पास</span>
                  </div>
                </div>
                <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/40">
                  {roleInfo.badge}
                </span>
              </div>

              <div className="space-y-2 relative z-10 text-xs">
                <div>
                  <span className="text-[10px] text-amber-300/80 uppercase font-bold">सदस्य नाम</span>
                  <p className="font-black text-sm text-white">{currentUser.name}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-amber-300/80 uppercase font-bold">पंजीकृत मोबाइल</span>
                    <p className="font-mono font-bold text-amber-200">{currentUser.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-300/80 uppercase font-bold">{language === 'hi' ? 'शहर' : 'City'}</span>
                    <p className="font-bold text-white">{language === 'hi' ? activeCity.nameHi : activeCity.nameEn}</p>
                  </div>
                </div>
              </div>

              {/* QR Code Graphic */}
              <div className="bg-white p-3 rounded-2xl flex items-center justify-between text-slate-900 relative z-10">
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-9 h-9 text-amber-950 shrink-0" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold block">{language === 'hi' ? 'संग्रह सत्यापन QR' : 'Pickup Verification QR'}</span>
                    <span className="text-[10px] text-slate-500">{language === 'hi' ? 'वितरण काउंटर पर दिखाएं' : 'Show at the pickup counter'}</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-black text-orange-900 bg-orange-100 px-2 py-1 rounded-lg">
                  {currentUser.phone?.slice(-4) || '7533'}
                </span>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
                {language === 'hi' ? 'त्वरित क्रियाएं (Quick Actions)' : 'Quick Actions'}
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className="w-full p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-700" />
                    <span>{language === 'hi' ? 'सभी ऑर्डर्स व रसीदें' : 'All Orders & Receipts'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-700" />
                </button>

                <button
                  onClick={() => setActiveTab('payments')}
                  className="w-full p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-700" />
                    <span>{language === 'hi' ? 'भुगतान एवं बहीखाता' : 'Payments & Ledger'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-700" />
                </button>

                <button
                  onClick={() => setRole('customer')}
                  className="w-full p-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-300" />
                    <span>{language === 'hi' ? 'नया मिष्ठान ऑर्डर करें' : 'Order New Sweets'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY ORDERS & PAST BOOKINGS */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Controls: Search + Filter status */}
          <div className="bg-white rounded-2xl border border-amber-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'hi' ? 'ऑर्डर #PB, मिठाई नाम या OTP से खोजें...' : 'Search by order ID, item or OTP...'}
                value={searchOrderQuery}
                onChange={(e) => setSearchOrderQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-amber-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {[
                { id: 'all', label: language === 'hi' ? 'सभी ऑर्डर्स' : 'All Orders' },
                { id: 'confirmed', label: language === 'hi' ? 'अग्रिम बुक' : 'Confirmed' },
                { id: 'delivered', label: language === 'hi' ? 'वितरित' : 'Delivered' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    orderStatusFilter === f.id
                      ? 'bg-amber-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border-2 border-amber-200 text-center space-y-3 shadow-xs">
              <Package className="w-16 h-16 text-amber-300 mx-auto" />
              <h3 className="font-extrabold text-base text-slate-800">
                {language === 'hi' ? 'कोई ऑर्डर रिकॉर्ड नहीं मिला' : 'No Orders Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {language === 'hi'
                  ? 'आपने अभी तक कोई अग्रिम मिष्ठान बुकिंग नहीं की है अथवा आपके खोज फिल्टर में कोई परिणाम नहीं मिला।'
                  : 'You have not placed any advance sweet bookings yet.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setRole('customer')}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  <span>{language === 'hi' ? 'मिष्ठान कैटलॉग से बुकिंग करें' : 'Browse Sweets Catalog'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-3xl border-2 border-amber-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Card Top Bar */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                            {booking.id}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            booking.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}>
                            {booking.status === 'delivered' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>वितरित (Delivered)</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>पुष्ट (Confirmed)</span>
                              </>
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                          दिनांक: {booking.createdAt}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">कुल मूल्य</span>
                        <span className="font-mono font-black text-base text-amber-950 block">₹{booking.totalAmount}</span>
                      </div>
                    </div>

                    {/* Sweets items list */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                      <span className="text-[10.5px] uppercase font-bold text-slate-500 block mb-1">
                        मिठाइयाँ ({booking.totalKg} kg):
                      </span>
                      {booking.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-700">
                          <span className="font-medium truncate max-w-[220px]">
                            • {language === 'hi' ? item.sweetNameHi : item.sweetNameEn} ({item.variantLabel}) x {item.quantity}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{item.totalAmount}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Collection Center & Date */}
                    <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Store className="w-4 h-4 text-orange-700 shrink-0" />
                        <span className="font-bold text-slate-900">{booking.centerNameHi}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span>संग्रह तिथि: <b className="text-slate-900">{booking.pickupDate}</b></span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                      <QrCode className="w-4 h-4 text-emerald-700" />
                      <span className="text-[11px] font-bold text-emerald-950">
                        OTP: <b className="font-mono text-xs text-emerald-800 tracking-wider">{booking.deliveryOtp}</b>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReorder(booking)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="पुनः कार्ट में जोड़ें (Reorder)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleShareWhatsApp(booking)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                        title="WhatsApp पर रसीद भेजें"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedReceiptBooking(booking)}
                        className="px-3 py-2 bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-300" />
                        <span>रसीद देखें</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS & ADVANCE LEDGER */}
      {activeTab === 'payments' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/60 rounded-3xl border-2 border-blue-200 shadow-sm">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                कुल मिष्ठान बुकिंग मूल्य
              </span>
              <span className="font-mono font-black text-3xl text-blue-950 mt-1 block">
                ₹{totalBookedAmount}
              </span>
              <span className="text-xs text-blue-700 mt-1 block font-medium">
                {userBookings.length} अग्रिम ऑर्डर सम्मिलित
              </span>
            </div>

            <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-3xl border-2 border-emerald-200 shadow-sm">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                जमा अग्रिम राशि (Paid)
              </span>
              <span className="font-mono font-black text-3xl text-emerald-950 mt-1 block">
                ₹{totalPaidAmount}
              </span>
              <span className="text-xs text-emerald-700 mt-1 block font-medium">
                ऑनलाइन / UPI द्वारा प्राप्त
              </span>
            </div>

            <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-3xl border-2 border-amber-200 shadow-sm">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                शेष देय राशि (वितरण काउंटर पर)
              </span>
              <span className="font-mono font-black text-3xl text-amber-950 mt-1 block">
                ₹{totalPendingAmount}
              </span>
              <span className="text-xs text-amber-800 mt-1 block font-medium">
                संग्रह केंद्र पर नकद / UPI द्वारा देय
              </span>
            </div>
          </div>

          {/* Payment Statement Table */}
          <div className="bg-white rounded-3xl border-2 border-amber-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-700" />
                <h3 className="font-extrabold text-base text-slate-900">
                  {language === 'hi' ? 'भुगतान एवं रसीद लेन-देन बहीखाता' : 'Payment Ledger & Transaction Statement'}
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {userBookings.length} रिकॉर्ड
              </span>
            </div>

            {userBookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">कोई भुगतान रिकॉर्ड उपलब्ध नहीं है।</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-amber-50/70 border-b border-amber-200 text-amber-950">
                      <th className="p-3 font-extrabold">ऑर्डर #</th>
                      <th className="p-3 font-extrabold">दिनांक</th>
                      <th className="p-3 font-extrabold">संग्रह केंद्र</th>
                      <th className="p-3 font-extrabold">भुगतान माध्यम</th>
                      <th className="p-3 font-extrabold text-right">राशि</th>
                      <th className="p-3 font-extrabold text-center">स्थिति</th>
                      <th className="p-3 font-extrabold text-center">रसीद</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-950">{b.id}</td>
                        <td className="p-3 text-slate-600 font-mono">{b.createdAt}</td>
                        <td className="p-3 font-medium text-slate-800 truncate max-w-[150px]">{b.centerNameHi}</td>
                        <td className="p-3">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                            {b.paymentMethod.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-right text-slate-900">₹{b.totalAmount}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                            b.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.paymentStatus === 'paid' ? 'सफल (Paid)' : 'अग्रिम देय'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedReceiptBooking(b)}
                            className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors cursor-pointer"
                            title="रसीद प्रिंट करें"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PICKUP HUB & FESTIVAL TIMELINE */}
      {activeTab === 'pickup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
          
          {/* Active Pickup Center Card */}
          {primaryCenter && (
            <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10.5px] font-mono uppercase font-bold text-amber-800">
                    {language === 'hi' ? `${activeCity.nameHi} अधिकृत मिष्ठान वितरण केन्द्र` : `${activeCity.nameEn} Authorized Sweet Distribution Center`}
                  </span>
                  <h3 className="font-black text-lg sm:text-xl text-slate-900 mt-0.5">
                    {language === 'hi' ? primaryCenter.nameHi : primaryCenter.nameEn}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                    <span>{language === 'hi' ? `${primaryCenter.addressHi} (पिन कोड: ${primaryCenter.pincode})` : `${primaryCenter.addressEn} (PIN: ${primaryCenter.pincode})`}</span>
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300 shrink-0">
                  सक्रिय (Open)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                  <span className="text-slate-500 block text-[11px]">दैनिक वितरण समय:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{primaryCenter.timing}</span>
                </div>

                {primaryCenter.ownerPhone && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[11px]">केंद्र हेल्पलाइन संपर्क:</span>
                    <span className="font-mono font-bold text-emerald-800 mt-0.5 block">{primaryCenter.ownerPhone}</span>
                  </div>
                )}
              </div>

              {primaryCenter.mapUrl && (
                <a
                  href={primaryCenter.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-900 underline pt-1"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Google Maps पर केंद्र का मार्ग देखें</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Festival Schedule Card */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 rounded-3xl border-2 border-amber-300 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-200/80 pb-3">
              <Calendar className="w-5 h-5 text-orange-700" />
              <div>
                <h3 className="font-black text-base text-amber-950">
                  {activeFestival.nameHi} — वितरण समय सारिणी
                </h3>
                <span className="text-xs text-amber-800">
                  सहकार भारती प्राधिकृत उत्सव वितरण कार्यक्रम
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-amber-200">
                <span className="text-slate-700 font-medium">अग्रिम बुकिंग कट-ऑफ तिथि:</span>
                <b className="font-mono text-orange-900 text-sm">{activeFestival.cutoffDate}</b>
              </div>
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-amber-200">
                <span className="text-slate-700 font-medium">मिष्ठान वितरण आरंभ तिथि:</span>
                <b className="font-mono text-emerald-800 text-sm">{activeFestival.distributionStartDate}</b>
              </div>
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-amber-200">
                <span className="text-slate-700 font-medium">अंतिम संग्रह तिथि:</span>
                <b className="font-mono text-slate-900 text-sm">{activeFestival.distributionEndDate}</b>
              </div>
            </div>

            <div className="p-3 bg-amber-200/60 rounded-2xl border border-amber-400 text-xs text-amber-950 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-800 shrink-0 mt-0.5" />
              <span>
                <b>सूचना:</b> संग्रह तिथि पर केंद्र पर अपना 4-अंकीय OTP और बुकिंग रसीद प्रस्तुत करना अनिवार्य है।
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PREFERENCES & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border-2 border-amber-200 p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
              {language === 'hi' ? 'भाषा एवं प्रदर्शन प्राथमिकता' : 'Language & Display Preferences'}
            </h3>
            
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">इंटरफ़ेस भाषा (Language)</span>
                <span className="text-slate-500">पोर्टल की भाषा का चयन करें</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('hi')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    language === 'hi'
                      ? 'bg-orange-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-orange-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-amber-200 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
              {language === 'hi' ? 'सहकार भारती सहायता केंद्र' : 'Sahakar Bharati Support Contacts'}
            </h3>
            <div className="space-y-2 text-xs font-mono font-bold text-amber-950">
              <div className="flex items-center gap-2 p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>9413753383 (सवाई माधोपुर हेल्पलाइन)</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>9829012345 (जयपुर मुख्य कार्यालय)</span>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-rose-50 rounded-3xl border-2 border-rose-200 p-6 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <h4 className="font-bold text-sm text-rose-950">
                {language === 'hi' ? 'खाता सत्र समाप्त करें' : 'Sign out of active session'}
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                {language === 'hi' ? 'वर्तमान ब्राउज़र से सुरक्षित रूप से लॉगआउट करें।' : 'Safely log out from this browser session.'}
              </p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
            >
              {language === 'hi' ? 'लॉगआउट करें' : 'Logout'}
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Prompt */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border-3 border-rose-400 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-sm">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">
                {language === 'hi' ? 'क्या आप लॉगआउट करना चाहते हैं?' : 'Are you sure you want to log out?'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'hi' ? 'आपका वर्तमान सत्र समाप्त हो जाएगा।' : 'Your active session will be ended.'}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logoutUser();
                  setRole('common');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                {language === 'hi' ? 'हाँ, लॉगआउट' : 'Yes, Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Receipt Modal */}
      {selectedReceiptBooking && (
        <PrintReceiptModal
          booking={selectedReceiptBooking}
          onClose={() => setSelectedReceiptBooking(null)}
        />
      )}
    </div>
  );
};
