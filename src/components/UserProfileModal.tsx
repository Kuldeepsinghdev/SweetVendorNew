/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking } from '../types';
import { PrintReceiptModal } from './PrintReceiptModal';
import {
  User,
  Package,
  CreditCard,
  MapPin,
  Settings,
  LogOut,
  X,
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
  Award
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'orders' | 'payments' | 'pickup' | 'settings';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile'
}) => {
  const {
    currentUser,
    logoutUser,
    language,
    switchLanguage,
    bookings,
    activeCity,
    saleCenters,
    mitras,
    activeFestival,
    setRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'payments' | 'pickup' | 'settings'>(initialTab);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Filter bookings associated with the logged-in user
  const userBookings = bookings.filter((b) => {
    if (currentUser.role === 'customer') {
      if (currentUser.userId && b.customerUserId) return b.customerUserId === currentUser.userId;
      const matchPhone = currentUser.phone && b.customer?.phone?.includes(currentUser.phone);
      const matchName = currentUser.name && b.customer?.name?.toLowerCase().includes(currentUser.name.toLowerCase());
      return b.bookedByRole === 'customer' || matchPhone || matchName;
    } else if (currentUser.role === 'mitra') {
      if (currentUser.userId && b.mitraUserId) return b.mitraUserId === currentUser.userId;
      const matchMitraId = currentUser.id && b.mitraId === currentUser.id;
      const matchMitraName = currentUser.name && b.mitraName?.toLowerCase().includes(currentUser.name.toLowerCase());
      const matchPhone = currentUser.phone && b.customer?.phone?.includes(currentUser.phone);
      return matchMitraId || matchMitraName || matchPhone;
    } else {
      // Kendra or Admin
      return true;
    }
  });

  // Filtered by search in orders tab
  const filteredOrders = userBookings.filter((b) => {
    if (!searchOrderQuery.trim()) return true;
    const q = searchOrderQuery.toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      b.customer?.name?.toLowerCase().includes(q) ||
      b.centerNameHi?.toLowerCase().includes(q) ||
      b.deliveryOtp?.includes(q)
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
    return sum; // cash/udhar pending
  }, 0);
  const totalPendingAmount = totalBookedAmount - totalPaidAmount;
  const totalBookedKg = userBookings.reduce((sum, b) => sum + (b.totalKg || 0), 0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleShareWhatsApp = (b: Booking) => {
    const text = `*सहकार भारती — प्री-बुकिंग रसीद*\nऑर्डर नंबर: ${b.id}\nग्राहक: ${b.customer?.name || ''}\nकुल मात्रा: ${b.totalKg} kg | राशि: ₹${b.totalAmount}\nसंग्रह केंद्र: ${b.centerNameHi}\nसंग्रह तिथि: ${b.pickupDate}\nडिलीवरी OTP: ${b.deliveryOtp}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
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
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-400 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-orange-950 via-amber-900 to-orange-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b-2 border-amber-400">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-orange-950 flex items-center justify-center font-black text-xl shadow-lg border-2 border-white shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base sm:text-xl text-white truncate leading-tight">
                    {currentUser.name || (language === 'hi' ? 'उपयोगकर्ता' : 'User')}
                  </h3>
                  <span className={`px-2 py-0.5 ${roleInfo.color} text-white font-mono text-[10.5px] font-bold rounded-full border border-white/40 shadow-xs`}>
                    {roleInfo.badge}
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 font-mono flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3 h-3 text-amber-400" />
                  <span>{currentUser.phone || '9413XXXXXX'}</span>
                  {currentUser.id && (
                    <span className="bg-amber-950/70 px-1.5 py-0.2 rounded text-[10px] text-amber-300 font-bold border border-amber-500/40">
                      ID: {currentUser.id}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white rounded-xl border border-rose-500/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title={language === 'hi' ? 'लॉगआउट करें' : 'Logout'}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="bg-amber-50/80 border-b border-amber-200 px-3 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'profile', labelHi: 'प्रोफ़ाइल विवरण', labelEn: 'Profile', icon: User },
              {
                id: 'orders',
                labelHi: 'मेरे ऑर्डर्स',
                labelEn: 'My Orders',
                icon: Package,
                badge: userBookings.length > 0 ? userBookings.length : undefined
              },
              { id: 'payments', labelHi: 'भुगतान व बहीखाता', labelEn: 'Payments', icon: CreditCard },
              { id: 'pickup', labelHi: 'संग्रह केंद्र व समय', labelEn: 'Pickup Hub', icon: Store },
              { id: 'settings', labelHi: 'प्राथमिकताएं', labelEn: 'Settings', icon: Settings }
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-900 text-white shadow-md'
                      : 'bg-white hover:bg-amber-100 text-slate-700 border border-amber-200'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-amber-700'}`} />
                  <span>{language === 'hi' ? tab.labelHi : tab.labelEn}</span>
                  {tab.badge !== undefined && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-amber-400 text-amber-950' : 'bg-orange-100 text-orange-900 border border-orange-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-slate-50 space-y-4">
            
            {/* TAB 1: PROFILE SUMMARY */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Identity Summary Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                        {language === 'hi' ? 'सदस्यता एवं खाता विवरण' : 'Account & Membership Details'}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      ✓ सक्रिय खाता (Active)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                      </span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                        {currentUser.name || 'ग्राहक'}
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        {language === 'hi' ? 'पंजीकृत मोबाइल नंबर' : 'Registered Mobile'}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                        {currentUser.phone || '9413XXXXXX'}
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        {language === 'hi' ? 'वितरण शहर (Selected City)' : 'Distribution City'}
                      </span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                        {language === 'hi' ? activeCity.nameHi : activeCity.nameEn}
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        {language === 'hi' ? 'प्राथमिक संग्रह केंद्र' : 'Default Pickup Hub'}
                      </span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate" title={primaryCenter?.nameHi}>
                        {language === 'hi' ? primaryCenter?.nameHi || 'सहकार वितरण केंद्र' : primaryCenter?.nameEn || 'Sahakar Distribution Center'}
                      </span>
                    </div>
                  </div>

                  {/* Mitra Additional Cards */}
                  {currentUser.role === 'mitra' && currentMitra && (
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-700" />
                          <span className="font-black text-sm text-amber-950">
                            {language === 'hi' ? 'सहकार मित्र अधिकृत क्रेडेंशियल' : 'Mitra Credentials'}
                          </span>
                        </div>
                        <span className="bg-amber-200 text-amber-900 font-mono font-bold text-xs px-2 py-0.5 rounded border border-amber-400">
                          {currentMitra.id}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-slate-500">{language === 'hi' ? 'उधार क्रेडिट सीमा:' : 'Credit Limit:'}</span>
                          <span className="font-mono font-bold text-emerald-800 ml-1">₹{currentMitra.creditLimit || 25000}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">{language === 'hi' ? 'स्वीकृति स्थिति:' : 'Status:'}</span>
                          <span className="font-bold text-emerald-700 ml-1">स्वीकृत (Approved)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Order Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-center shadow-xs">
                    <span className="text-[10.5px] font-bold text-slate-500 block">कुल ऑर्डर्स</span>
                    <span className="font-mono font-black text-lg text-amber-950">{userBookings.length}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-center shadow-xs">
                    <span className="text-[10.5px] font-bold text-slate-500 block">कुल वज़न</span>
                    <span className="font-mono font-black text-lg text-orange-900">{totalBookedKg.toFixed(1)} kg</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-center shadow-xs">
                    <span className="text-[10.5px] font-bold text-slate-500 block">कुल राशि</span>
                    <span className="font-mono font-black text-lg text-blue-950">₹{totalBookedAmount}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-center shadow-xs">
                    <span className="text-[10.5px] font-bold text-slate-500 block">अग्रिम जमा</span>
                    <span className="font-mono font-black text-lg text-emerald-700">₹{totalPaidAmount}</span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Package className="w-4 h-4" />
                    <span>{language === 'hi' ? 'मेरी सभी बुकिंग रसीदें देखें' : 'View All Bookings & Receipts'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      setRole('customer');
                    }}
                    className="py-2.5 px-4 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl font-bold text-xs flex items-center gap-2 border border-amber-300 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-orange-800" />
                    <span>{language === 'hi' ? 'नई मिठाई बुक करें' : 'Order New Sweets'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MY ORDERS / PAST BOOKINGS */}
            {activeTab === 'orders' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* Search orders */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      language === 'hi'
                        ? 'ऑर्डर संख्या (#PB), केंद्र या नाम से खोजें...'
                        : 'Search by Order ID, center or name...'
                    }
                    value={searchOrderQuery}
                    onChange={(e) => setSearchOrderQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-amber-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-amber-200 text-center space-y-3">
                    <Package className="w-12 h-12 text-amber-300 mx-auto" />
                    <h5 className="font-bold text-sm text-slate-800">
                      {language === 'hi' ? 'कोई बुकिंग उपलब्ध नहीं है' : 'No Bookings Found'}
                    </h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {language === 'hi'
                        ? 'आपने अभी तक कोई अग्रिम मिष्ठान बुकिंग नहीं की है या खोज परिणाम में कोई रिकॉर्ड नहीं मिला।'
                        : 'You have not made any festive pre-bookings yet.'}
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        setRole('customer');
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{language === 'hi' ? 'मिष्ठान कैटलॉग से बुक करें' : 'Book Sweets Now'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white rounded-2xl border-2 border-amber-200 shadow-xs hover:border-orange-400 transition-all p-4 space-y-3"
                      >
                        {/* Order Top Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                              {booking.id}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {booking.createdAt}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
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
                                  <span>अग्रिम बुक (Confirmed)</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Items list */}
                        <div className="space-y-1.5">
                          {booking.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-700">
                              <span className="font-medium truncate max-w-[200px] sm:max-w-[320px]">
                                • {language === 'hi' ? item.sweetNameHi : item.sweetNameEn} ({item.variantLabel}) x {item.quantity}
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                ₹{item.totalAmount}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Summary & Pickup Center */}
                        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="flex items-center gap-1 text-slate-600">
                              <Store className="w-3.5 h-3.5 text-orange-700 shrink-0" />
                              <span className="font-bold text-slate-900">{language === 'hi' ? booking.centerNameHi : booking.centerNameEn || booking.centerNameHi}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <Calendar className="w-3 h-3 text-orange-600" />
                              <span>संग्रह तिथि: <b>{booking.pickupDate}</b></span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-[11px] text-slate-500 font-medium">कुल राशि</div>
                            <div className="font-mono font-black text-sm text-amber-950">₹{booking.totalAmount}</div>
                          </div>
                        </div>

                        {/* OTP and Action buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <QrCode className="w-4 h-4 text-emerald-700" />
                            <span className="text-[11px] font-bold text-emerald-950">
                              संग्रह OTP: <b className="font-mono text-xs text-emerald-800 tracking-wider">{booking.deliveryOtp}</b>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedReceiptBooking(booking)}
                              className="px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-300" />
                              <span>रसीद देखें</span>
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(booking)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                              title="WhatsApp पर शेयर करें"
                            >
                              <Share2 className="w-4 h-4" />
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
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Ledger Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200 shadow-xs">
                    <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                      कुल बुकिंग मूल्य
                    </span>
                    <span className="font-mono font-black text-2xl text-blue-950 mt-1 block">
                      ₹{totalBookedAmount}
                    </span>
                    <span className="text-[10.5px] text-blue-700 mt-1 block">
                      {userBookings.length} अग्रिम ऑर्डर
                    </span>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200 shadow-xs">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                      कुल भुगतान / अग्रिम
                    </span>
                    <span className="font-mono font-black text-2xl text-emerald-950 mt-1 block">
                      ₹{totalPaidAmount}
                    </span>
                    <span className="text-[10.5px] text-emerald-700 mt-1 block">
                      ऑनलाइन / UPI द्वारा जमा
                    </span>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200 shadow-xs">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                      शेष देय राशि (वितरण पर)
                    </span>
                    <span className="font-mono font-black text-2xl text-amber-950 mt-1 block">
                      ₹{totalPendingAmount}
                    </span>
                    <span className="text-[10.5px] text-amber-800 mt-1 block">
                      संग्रह केंद्र पर देय
                    </span>
                  </div>
                </div>

                {/* Payment History List */}
                <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-xs space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-700" />
                    <span>भुगतान एवं रसीद लेन-देन विवरण</span>
                  </h4>

                  {userBookings.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">कोई भुगतान रिकॉर्ड नहीं मिला।</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {userBookings.map((b) => (
                        <div key={b.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>ऑर्डर {b.id}</span>
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                {b.paymentMethod.toUpperCase()}
                              </span>
                              {b.zohoPaymentId && (
                                <span className="text-[9.5px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold border border-emerald-300">
                                  Zoho: {b.zohoPaymentId}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {b.createdAt}
                              {b.zohoPaymentMode && <span className="ml-1.5 text-[10px] text-slate-400">({b.zohoPaymentMode})</span>}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-bold text-sm text-slate-900">₹{b.totalAmount}</div>
                            <span className="text-[10px] font-bold text-emerald-700">
                              {b.paymentStatus === 'paid' ? 'सफल (Paid)' : 'अग्रिम देय'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PICKUP HUB & FESTIVAL TIMELINE */}
            {activeTab === 'pickup' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Active Hub Card */}
                {primaryCenter ? (
                  <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-amber-800">
                          {language === 'hi' ? `${activeCity.nameHi} अधिकृत वितरण केन्द्र` : `${activeCity.nameEn} Authorized Distribution Center`}
                        </span>
                        <h4 className="font-black text-lg text-slate-900">{language === 'hi' ? primaryCenter.nameHi : primaryCenter.nameEn}</h4>
                        <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                          <MapPin className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                          <span>{language === 'hi' ? `${primaryCenter.addressHi} (पिन: ${primaryCenter.pincode})` : `${primaryCenter.addressEn} (PIN: ${primaryCenter.pincode})`}</span>
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-lg border border-emerald-300 shrink-0">
                        खुला है (Open)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>कार्य समय: <b>{primaryCenter.timing}</b></span>
                      </div>
                      {primaryCenter.ownerPhone && (
                        <div className="flex items-center gap-1.5 text-slate-800 font-mono font-bold">
                          <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>हेल्पलाइन: {primaryCenter.ownerPhone}</span>
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
                        <span>Google Maps पर रास्ता देखें</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ) : null}

                {/* Festival Timeline Schedule */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 space-y-3">
                  <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-700" />
                    <span>{activeFestival.nameHi} — वितरण समय सारिणी</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200">
                      <span>अग्रिम बुकिंग कट-ऑफ तिथि:</span>
                      <b className="font-mono text-orange-900">{activeFestival.cutoffDate}</b>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200">
                      <span>मिष्ठान वितरण आरंभ तिथि:</span>
                      <b className="font-mono text-emerald-800">{activeFestival.distributionStartDate}</b>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200">
                      <span>अंतिम संग्रह तिथि:</span>
                      <b className="font-mono text-slate-900">{activeFestival.distributionEndDate}</b>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SETTINGS & PREFERENCES */}
            {activeTab === 'settings' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3 shadow-xs">
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {language === 'hi' ? 'भाषा एवं प्रदर्शन प्राथमिकता' : 'Language & Display'}
                  </h4>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-700">इंटरफ़ेस भाषा (Interface Language)</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => switchLanguage('hi')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          language === 'hi'
                            ? 'bg-orange-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        हिन्दी
                      </button>
                      <button
                        onClick={() => switchLanguage('en')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

                <div className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3 shadow-xs">
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {language === 'hi' ? 'सहकार भारती हेल्पलाइन व संपर्क' : 'Sahakar Bharati Helpline'}
                  </h4>
                  <p className="text-xs text-slate-600">
                    किसी भी प्रकार की अग्रिम बुकिंग समस्या, रसीद पुन: प्राप्ति या केंद्र से संबंधित पूछताछ हेतु संपर्क करें:
                  </p>
                  <div className="space-y-1.5 text-xs font-mono font-bold text-amber-950">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>9413753383 (सवाई माधोपुर हेल्पलाइन)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>9829012345 (जयपुर मुख्य केंद्र)</span>
                    </div>
                  </div>
                </div>

                {/* Logout Card */}
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-xs text-rose-900">
                      {language === 'hi' ? 'खाता सत्र समाप्त करें' : 'Sign out of session'}
                    </h5>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      {language === 'hi' ? 'वर्तमान डिवाइस से सुरक्षित रूप से लॉगआउट करें।' : 'Safely log out from this browser session.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    {language === 'hi' ? 'लॉगआउट करें' : 'Logout'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500">
              सहकार भारती — शुद्धता, गुणवत्ता एवं सेवा
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {language === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Prompt */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border-2 border-rose-400 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-base text-slate-900">
                {language === 'hi' ? 'क्या आप लॉगआउट करना चाहते हैं?' : 'Are you sure you want to log out?'}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'hi' ? 'आपका सत्र समाप्त हो जाएगा।' : 'Your active session will be ended.'}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onClose();
                  logoutUser();
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
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
    </>
  );
};
