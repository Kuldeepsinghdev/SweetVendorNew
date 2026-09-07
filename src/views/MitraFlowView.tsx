/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, CartItem, CustomerInfo } from '../types';
import { PrintReceiptModal } from '../components/PrintReceiptModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { ZohoPaymentModal } from '../components/ZohoPaymentModal';
import { BookedVsDeliveredChart } from '../components/BookedVsDeliveredChart';
import { getDatesBetween } from '../utils/dateUtils';
import {
  Users,
  Shield,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Share2,
  FileText,
  DollarSign,
  UserCheck,
  Building2,
  MapPin,
  Calendar,
  Lock,
  Phone,
  User,
  CreditCard
} from 'lucide-react';

export const MitraFlowView: React.FC = () => {
  const {
    language,
    cities,
    activeCity,
    setActiveCityId,
    activeFestival,
    masterSweets,
    saleCenters,
    mitras,
    bookings,
    cart,
    addToCart,
    createBooking,
    settleMitraDues,
    submitMitraApplication,
    openOtpModal,
    isBookingWindowOpen,
    setRole
  } = useApp();

  // Mode state: 'dashboard' | 'register' | 'pending' | 'login' | 'booking_step' | 'my_bookings'
  const [viewMode, setViewMode] = useState<'dashboard' | 'register' | 'pending' | 'login' | 'booking_step' | 'my_bookings'>('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'orders' | 'payments' | 'pickup' | 'settings'>('profile');

  // Zoho Payments states
  const [isZohoModalOpen, setIsZohoModalOpen] = useState(false);
  const [zohoContext, setZohoContext] = useState<'booking' | 'dues'>('booking');
  const [pendingOrderId, setPendingOrderId] = useState('');
  const [zohoPayAmount, setZohoPayAmount] = useState(0);

  // Currently logged-in Mitra profile (prioritize active city mitra)
  const currentMitra = mitras.find((m) => m.cityId === activeCity?.id) || mitras[0];

  // Registration Form State (M-01)
  const [regCityId, setRegCityId] = useState(activeCity?.id || 'sawai_madhopur');
  const selectedRegCity = cities.find((c) => c.id === regCityId) || activeCity;
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regAgreedToCenter, setRegAgreedToCenter] = useState(true);
  const [createdAppId, setCreatedAppId] = useState('');

  // Booking Flow on behalf of Customer State (M-05 to M-08)
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1);
  const [custPhone, setCustPhone] = useState('9829098245');
  const [custName, setCustName] = useState('सुनीता शर्मा');
  const [custEmail, setCustEmail] = useState('sunita@gmail.com');
  const [custPincode, setCustPincode] = useState('302004');
  const [custAddress, setCustAddress] = useState('B-12, राजापार्क, जयपुर');

  const [selectedCenterId, setSelectedCenterId] = useState(
    saleCenters.find((c) => c.ownerPhone === currentMitra.phone)?.id || saleCenters[0]?.id || ''
  );
  const [selectedPickupDate, setSelectedPickupDate] = useState(activeFestival.distributionStartDate);
  const [paymentMode, setPaymentMode] = useState<'udhar' | 'cash' | 'online'>('udhar');

  // Receipt Modal State
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Filter for M-10 My Bookings list
  const [bookingTabFilter, setBookingTabFilter] = useState<'all' | 'udhar' | 'delivered' | 'cancelled'>('all');

  const myBookings = bookings.filter((b) => b.mitraId === currentMitra.id);
  const filteredMyBookings = myBookings.filter((b) => {
    if (bookingTabFilter === 'udhar') return b.paymentMethod === 'udhar' && b.paymentStatus === 'udhar_outstanding';
    if (bookingTabFilter === 'delivered') return b.status === 'delivered';
    if (bookingTabFilter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const totalUdharOutstanding = myBookings
    .filter((b) => b.paymentMethod === 'udhar' && b.paymentStatus === 'udhar_outstanding')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPhone || regPhone.length < 10) return;

    openOtpModal(regPhone, 'मित्र पंजीकरण OTP सत्यापन (CM-02)', () => {
      const appId = submitMitraApplication({
        cityId: regCityId,
        cityNameHi: activeCity?.nameHi || '',
        fullName: regFullName,
        phone: regPhone,
        email: regEmail,
        pincode: regPincode,
        address: regAddress,
        agreedToCenter: regAgreedToCenter
      });
      setCreatedAppId(appId);
      setViewMode('pending');
      return true;
    });
  };

  const handleCustomerPhoneLookup = (phoneInput: string) => {
    setCustPhone(phoneInput);
    const existing = bookings.find((b) => b.customer?.phone === phoneInput);
    if (existing && existing.customer) {
      setCustName(existing.customer.name || '');
      setCustEmail(existing.customer.email || '');
      setCustPincode(existing.customer.pincode || '');
      setCustAddress(existing.customer.address || '');
    }
  };

  const handleMitraBookingComplete = async () => {
    if (cart.length === 0) return;

    if (paymentMode === 'online') {
      const nextOrderId = `#PB-${Math.floor(1000 + Math.random() * 9000)}`;
      setPendingOrderId(nextOrderId);
      setZohoPayAmount(cart.reduce((a, b) => a + (b.totalAmount || 0), 0));
      setZohoContext('booking');
      setIsZohoModalOpen(true);
      return;
    }

    const customer: CustomerInfo = {
      name: custName || 'ग्राहक',
      phone: custPhone || '9829123456',
      email: custEmail,
      pincode: custPincode,
      address: custAddress
    };

    const newBooking = await createBooking(
      'mitra',
      customer,
      selectedCenterId || (saleCenters.find((c) => c.cityId === activeCity?.id)?.id || saleCenters[0]?.id || ''),
      selectedPickupDate || activeFestival?.distributionStartDate || '',
      paymentMode,
      currentMitra.id,
      currentMitra.fullName
    );

    setReceiptBooking(newBooking);
    setShowReceiptModal(true);
    setViewMode('dashboard');
  };

  const handleZohoMitraSuccess = async (result: {
    transactionId: string;
    invoiceId: string;
    paymentMode: string;
    booking?: any;
  }) => {
    setIsZohoModalOpen(false);

    if (zohoContext === 'booking') {
      const customer: CustomerInfo = {
        name: custName || 'ग्राहक',
        phone: custPhone || '9829123456',
        email: custEmail,
        pincode: custPincode,
        address: custAddress
      };

      const newBooking = await createBooking(
        'mitra',
        customer,
        selectedCenterId || (saleCenters.find((c) => c.cityId === activeCity?.id)?.id || saleCenters[0]?.id || ''),
        selectedPickupDate || activeFestival?.distributionStartDate || '',
        'online',
        currentMitra.id,
        currentMitra.fullName,
        {
          zohoPaymentId: result.transactionId,
          invoiceId: result.invoiceId,
          zohoPaymentMode: result.paymentMode,
          zohoOrderId: pendingOrderId
        }
      );

      setReceiptBooking(newBooking);
      setShowReceiptModal(true);
      setViewMode('dashboard');
    } else if (zohoContext === 'dues') {
      await settleMitraDues(currentMitra.id, {
        zohoPaymentId: result.transactionId,
        invoiceId: result.invoiceId,
        paymentMode: result.paymentMode,
        amount: zohoPayAmount
      });
    }
  };

  const handlePayDuesOnline = () => {
    if (totalUdharOutstanding <= 0) return;
    setZohoPayAmount(totalUdharOutstanding);
    setPendingOrderId(`DUE-${currentMitra.id.slice(-4)}-${Date.now().toString().slice(-4)}`);
    setZohoContext('dues');
    setIsZohoModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Role Identity Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-yellow-900 to-amber-950 text-white p-4 rounded-xl shadow-md border-b-4 border-yellow-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 text-yellow-950 font-black flex items-center justify-center text-base shadow-sm border-2 border-white shrink-0">
            मित्र
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                {language === 'hi' ? 'सहकार भारती मित्र बल्क बुकिंग पोर्टल' : 'Sahakar Bharati Mitra Portal'}
              </h2>
              <span className="bg-yellow-400 text-yellow-950 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                {language === 'hi' ? `${activeCity?.nameHi || ''} मंडल` : `${activeCity?.nameEn || ''} District`}
              </span>
            </div>
            <p className="text-xs text-yellow-100/90 mt-0.5">
              {language === 'hi'
                ? 'कार्यकर्ताओं एवं नागरिकों की सामूहिक बुकिंग दर्ज करें (क्रेडिट या नगद भुगतान)।'
                : 'Place bulk customer pre-bookings via Mitra Credit/Cash.'}
            </p>
          </div>
        </div>

        <div className="bg-amber-950/80 border border-yellow-500/50 rounded-lg px-3 py-1.5 text-xs font-mono">
          <span className="text-yellow-200 block text-[10px]">उपलब्ध क्रेडिट सीमा</span>
          <b className="text-yellow-300 text-sm">₹{currentMitra.creditLimit - currentMitra.creditUsed}</b>
          <span className="text-yellow-200/80 text-[10px] ml-1">(कुल: ₹{currentMitra.creditLimit})</span>
        </div>
      </div>

      {/* Role Navigation Switcher */}
      <div className="bg-orange-700 text-white p-2.5 sm:p-3 rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs border border-orange-600">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="font-bold truncate">
            {language === 'hi' ? 'सहकार मित्र' : 'Mitra'}
          </span>
          <span className="bg-orange-950/60 text-amber-200 px-2 py-0.5 rounded font-mono text-[11px] truncate border border-amber-400/40">
            {currentMitra.fullName}
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-2.5 py-1.5 rounded font-medium shrink-0 whitespace-nowrap ${
              viewMode === 'dashboard' ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' : 'hover:bg-orange-800 text-white'
            }`}
          >
            {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
          </button>
          <button
            onClick={() => setViewMode('my_bookings')}
            className={`px-2.5 py-1.5 rounded font-medium shrink-0 whitespace-nowrap ${
              viewMode === 'my_bookings' ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' : 'hover:bg-orange-800 text-white'
            }`}
          >
            {language === 'hi' ? 'मेरी बुकिंग' : 'Bookings'}
          </button>
          <button
            onClick={() => setViewMode('register')}
            className={`px-2.5 py-1.5 rounded font-medium shrink-0 whitespace-nowrap ${
              viewMode === 'register' ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' : 'hover:bg-orange-800 text-white'
            }`}
          >
            {language === 'hi' ? 'नया आवेदन' : 'Apply'}
          </button>
        </div>
      </div>

      {/* M-01 Registration Form */}
      {viewMode === 'register' && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200 space-y-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              {language === 'hi' ? 'सहकार मित्र पंजीकरण फ़ॉर्म (M-01)' : 'Sahakar Mitra Registration'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'शहर एडमिन की स्वीकृति के उपरांत आपका खाता सक्रिय होगा तथा SMS/ईमेल पर पासवर्ड प्राप्त होगा।'
                : 'Account activates after City Admin approval.'}
            </p>
          </div>

          <form onSubmit={handleRegistrationSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">शहर (City)</label>
                <select
                  value={regCityId}
                  onChange={(e) => {
                    setRegCityId(e.target.value);
                    setActiveCityId(e.target.value);
                  }}
                  className="w-full p-2 border border-slate-300 rounded font-semibold"
                >
                  {(cities || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === 'hi' ? c.nameHi : c.nameEn} ({language === 'hi' ? c.stateHi : c.stateEn})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">राज्य (Auto)</label>
                <input
                  type="text"
                  value={selectedRegCity?.stateHi || activeCity?.stateHi || ''}
                  readOnly
                  className="w-full p-2 border border-slate-300 rounded bg-slate-100 text-slate-600"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">जिला (Auto)</label>
                <input
                  type="text"
                  value={selectedRegCity?.districtHi || activeCity?.districtHi || ''}
                  readOnly
                  className="w-full p-2 border border-slate-300 rounded bg-slate-100 text-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">पूरा नाम</label>
                <input
                  type="text"
                  required
                  placeholder="रमेश शर्मा"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">यूनिक मोबाइल नंबर</label>
                <input
                  type="tel"
                  required
                  placeholder="98290XXXXX"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">ईमेल आईडी</label>
                <input
                  type="email"
                  placeholder="ramesh@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">पिन कोड</label>
                <input
                  type="text"
                  required
                  placeholder="302004"
                  value={regPincode}
                  onChange={(e) => setRegPincode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">पूरा पता (मकान, गली, क्षेत्र)</label>
              <textarea
                rows={2}
                required
                placeholder="24, गली नंबर 3, राजापार्क, जयपुर"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>

            {/* Sale Center Opt-in Checkbox */}
            <div className="p-3 bg-amber-50 rounded border border-amber-300 space-y-1">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreedCenter"
                  checked={regAgreedToCenter}
                  onChange={(e) => setRegAgreedToCenter(e.target.checked)}
                  className="mt-0.5 text-amber-900 focus:ring-amber-500"
                />
                <label htmlFor="agreedCenter" className="font-bold text-slate-900 cursor-pointer">
                  क्या आप अपना स्थान 'सहकार मित्र बिक्री केंद्र' के रूप में स्थापित करने की स्वीकृति देते हैं?
                </label>
              </div>
              <p className="text-[11px] text-slate-600 pl-5">
                स्वीकृति टिक करने पर आपका यह पता स्वचालित रूप से आपकी मित्र आईडी से लिंक बिक्री केंद्र घोषित हो जाएगा।
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded text-xs shadow transition-colors"
            >
              आगे बढ़ें — OTP सत्यापन एवं आवेदन जमा करें →
            </button>
          </form>
        </div>
      )}

      {/* M-02 Application Received Pending Screen */}
      {viewMode === 'pending' && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-6 h-6 text-amber-800" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-amber-900 uppercase tracking-widest bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block">
              आवेदन प्राप्त — समीक्षा धीन (M-02)
            </span>
            <h3 className="text-lg font-black text-slate-900 pt-1">
              आवेदन क्रमांक: {createdAppId || 'SM-JPR-1042'}
            </h3>
            <p className="text-xs text-slate-600">
              आपका सहकार मित्र आवेदन जयपुर शहर एडमिन की समीक्षा हेतु प्राप्त हो गया है।
            </p>
          </div>

          <div className="bg-amber-50 p-3 rounded border border-amber-200 text-left text-xs space-y-1">
            <b className="block text-slate-900">आगे क्या होगा:</b>
            <p className="text-slate-600">1. जयपुर शहर एडमिन आपके विवरण का सत्यापन करेंगे।</p>
            <p className="text-slate-600">2. स्वीकृति पर आपकी आईडी व पासवर्ड SMS/ईमेल पर आ जाएगा (सामान्यतः 24 घंटे)।</p>
          </div>

          <button
            onClick={() => setViewMode('dashboard')}
            className="w-full py-2 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded text-xs"
          >
            डेमो डैशबोर्ड पर जाएँ
          </button>
        </div>
      )}

      {/* M-04 Mitra Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="space-y-5">
          {/* Welcome & Cutoff Countdown */}
          <div className="bg-white p-5 rounded-lg shadow-xs border border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900">
                  {language === 'hi' ? `नमस्ते, ${currentMitra.fullName}` : `Welcome, ${currentMitra.fullName}`}
                </h3>
                <span className="bg-amber-100 text-amber-900 font-mono text-xs font-bold px-2 py-0.5 rounded border border-amber-300">
                  {language === 'hi' ? currentMitra.cityNameHi : activeCity?.nameEn}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-xs text-slate-500">
                  {language === 'hi' ? 'सहकार मित्र आईडी:' : 'Sahakar Mitra ID:'} <span className="font-mono font-bold text-amber-950">{currentMitra.id}</span>
                </p>
                <button
                  onClick={() => setRole('profile')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:text-orange-900 underline cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'प्रोफ़ाइल व बहीखाता विवरण' : 'Profile & Ledger'}</span>
                </button>
              </div>
            </div>

            {/* Countdown Banner */}
            <div className="bg-amber-950 text-amber-200 p-3 rounded-lg border border-amber-700 text-xs font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <b>{language === 'hi' ? activeFestival?.nameHi || 'उत्सव' : activeFestival?.nameEn || 'Festival'}</b> — {language === 'hi' ? 'बुकिंग बंद होने में' : 'Booking closes in'}{' '}
                <span className="text-amber-300 font-bold">{language === 'hi' ? '11 दिन' : '11 days'}</span> {language === 'hi' ? 'बाक़ी' : 'remaining'}
              </div>
            </div>
          </div>

          {/* 3 Key Stats Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-lg border border-amber-200 text-center space-y-1 shadow-xs">
              <div className="text-2xl font-black font-mono text-amber-950">{myBookings.length}</div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
                {language === 'hi' ? 'कुल बुकिंग' : 'Bookings'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-amber-200 text-center space-y-1 shadow-xs">
              <div className="text-2xl font-black font-mono text-amber-950">
                {(myBookings || []).reduce((sum, b) => sum + (b.totalKg || 0), 0).toFixed(1)} kg
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
                {language === 'hi' ? 'कुल मात्रा' : 'Total Weight'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-amber-200 text-center space-y-1 shadow-xs">
              <div className="text-2xl font-black font-mono text-amber-950">
                ₹{myBookings.reduce((sum, b) => sum + b.totalAmount, 0)}
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
                {language === 'hi' ? 'कुल मूल्य' : 'Total Value'}
              </span>
            </div>
          </div>

          {/* Dues / Bayaaka Alert Banner */}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-xs text-amber-950 font-medium">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-800" />
              <span>
                {language === 'hi' ? 'उधार बकाया वसूली:' : 'Outstanding credit:'} <b className="font-mono text-amber-900">₹{totalUdharOutstanding}</b> ({language === 'hi' ? 'क्रेडिट सीमा' : 'Credit limit'} ₹{currentMitra.creditLimit})
              </span>
            </div>
            <button
              onClick={() => setViewMode('my_bookings')}
              className="text-xs font-bold text-amber-900 hover:underline"
            >
              {language === 'hi' ? 'हिसाब देखें →' : 'View ledger →'}
            </button>
          </div>

          {/* Booked vs Delivered Chart for Mitra */}
          <BookedVsDeliveredChart
            scope="mitra"
            mitraId={currentMitra.id}
            title={language === 'hi' ? 'मेरी बुकिंग: केंद्र-वार बुक बनाम वितरित मिष्ठान' : 'My Bookings: Sweets Booked vs. Delivered by Center'}
            subtitle={language === 'hi' ? 'आपके द्वारा दर्ज ग्राहकों के ऑर्डर एवं डिलीवरी पूर्ति स्थिति' : 'Track delivery progress across distribution centers for your booked orders'}
            height={280}
          />

          {/* CTA: + New Booking for Customer */}
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-amber-200 shadow-xs">
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                {language === 'hi' ? 'ग्राहक हेतु नई बुकिंग दर्ज करें' : 'Book on Behalf of Customer'}
              </h4>
              <p className="text-xs text-slate-500">
                {language === 'hi' ? 'उधार, नगद अथवा ऑनलाइन तीनों भुगतान विकल्पों के साथ।' : 'Choose credit, cash, or online payment.'}
              </p>
            </div>

            <button
              disabled={!isBookingWindowOpen}
              onClick={() => {
                setBookingStep(1);
                setViewMode('booking_step');
              }}
              className={`px-4 py-2.5 rounded font-bold text-xs flex items-center gap-1.5 shadow transition-colors ${
                isBookingWindowOpen
                  ? 'bg-amber-900 hover:bg-amber-950 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? '+ नई बुकिंग करें (M-05)' : '+ New Booking'}</span>
            </button>
          </div>

          {/* Recent Bookings Feed */}
          <div className="bg-white p-5 rounded-lg border border-amber-200 space-y-3 shadow-xs">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-mono">
              {language === 'hi' ? 'हाल ही की बुकिंग' : 'Recent Customer Bookings'}
            </h4>

            <div className="space-y-2">
              {(myBookings || []).slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-amber-50/50 rounded border border-amber-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-950">{b.id}</span>
                      <span className="font-bold text-slate-800">{b.customer?.name || ''}</span>
                      <span className="font-mono text-[10px] text-slate-500">{b.customer?.phone || ''}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      {(b?.items || []).map((i) => `${language === 'hi' ? i.sweetNameHi : i.sweetNameEn} (${i.variantLabel})`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="font-mono font-bold text-amber-950">₹{b.totalAmount}</div>
                    <span
                      className={`inline-block text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        b.paymentMethod === 'udhar'
                          ? 'bg-amber-200 text-amber-950'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {b.paymentMethod === 'udhar' ? (language === 'hi' ? 'उधार' : 'Credit') : (language === 'hi' ? 'ऑनलाइन/नगद' : 'Online/Cash')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* M-05 to M-08 4-Step Customer Booking Flow */}
      {viewMode === 'booking_step' && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200 space-y-5">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-mono font-bold pb-3 border-b border-slate-200 overflow-x-auto">
            <div className={`px-3 py-1 rounded ${bookingStep === 1 ? 'bg-amber-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              M-05: 1. बिक्री केंद्र
            </div>
            <span>→</span>
            <div className={`px-3 py-1 rounded ${bookingStep === 2 ? 'bg-amber-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              M-06: 2. मिठाई चयन
            </div>
            <span>→</span>
            <div className={`px-3 py-1 rounded ${bookingStep === 3 ? 'bg-amber-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              M-07: 3. ग्राहक विवरण
            </div>
            <span>→</span>
            <div className={`px-3 py-1 rounded ${bookingStep === 4 ? 'bg-amber-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              M-08: 4. भुगतान मोड
            </div>
          </div>

          {/* Step 2: Sweets Selection (M-06) */}
          {bookingStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900">
                {language === 'hi' ? 'चरण 2 — मिठाई एवं मात्रा चुनें (M-06)' : 'Step 2 — Choose Sweets'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(masterSweets || []).map((sweet) => {
                  const cityConfig = activeCity?.sweets?.find((cs) => cs.sweetId === sweet.id);
                  const price = cityConfig ? cityConfig.pricePerKg : 1000;

                  return (
                    <div key={sweet.id} className="p-3 bg-amber-50/40 rounded border border-amber-200 text-xs flex justify-between items-center gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{language === 'hi' ? sweet.nameHi : sweet.nameEn}</div>
                        <div className="font-mono text-amber-900 font-semibold">₹{price} / kg</div>
                      </div>

                      <button
                        onClick={() => {
                          const item: CartItem = {
                            sweetId: sweet.id,
                            sweetNameHi: sweet.nameHi,
                            sweetNameEn: sweet.nameEn,
                            variantLabel: '1kg',
                            variantKg: 1,
                            pricePerKg: price,
                            quantity: 1,
                            unitPrice: price,
                            totalAmount: price
                          };
                          addToCart(item);
                        }}
                        className="px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded font-bold text-xs"
                      >
                        + कार्ट में जोड़ें
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="p-3 bg-white border border-amber-300 rounded flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">कार्ट में {cart.length} वस्तुएँ</span>
                    <span className="font-mono font-bold text-amber-900 ml-2">
                      ₹{cart.reduce((a, b) => a + b.totalAmount, 0)}
                    </span>
                  </div>

                  <button
                    onClick={() => setBookingStep(3)}
                    className="px-4 py-2 bg-amber-900 text-white rounded font-bold"
                  >
                    {language === 'hi' ? 'आगे — ग्राहक विवरण →' : 'Next — Customer Details →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Sale Center Selection (M-05) */}
          {bookingStep === 1 && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-base text-slate-900">
                {language === 'hi' ? 'चरण 1 — संग्रह बिक्री केंद्र (M-05)' : 'Step 1 — Select Center'}
              </h3>

              <div className="space-y-2">
                {saleCenters
                  .filter((c) => c.cityId === activeCity.id)
                  .map((center) => (
                    <div
                      key={center.id}
                      onClick={() => setSelectedCenterId(center.id)}
                      className={`p-3 rounded border cursor-pointer ${
                        selectedCenterId === center.id ? 'border-amber-900 bg-amber-50 font-bold' : 'bg-white'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-sm">{language === 'hi' ? center.nameHi : center.nameEn}</div>
                      <p className="text-slate-600">{language === 'hi' ? center.addressHi : center.addressEn}</p>
                    </div>
                  ))}
              </div>

              {/* Pickup Date Picker */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>{language === 'hi' ? 'संग्रहण वितरण तिथि (Pickup Date):' : 'Collection Pickup Date:'}</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">
                      {language === 'hi' ? 'कैलेण्डर से चुनें:' : 'Pick via Calendar:'}
                    </span>
                    <input
                      type="date"
                      min={activeFestival.distributionStartDate}
                      max={activeFestival.distributionEndDate}
                      value={selectedPickupDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedPickupDate(e.target.value);
                        }
                      }}
                      className="px-2.5 py-1 bg-amber-50 border-2 border-amber-400 rounded-lg text-xs font-mono font-bold text-slate-900 cursor-pointer shadow-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  {getDatesBetween(activeFestival?.distributionStartDate || '', activeFestival?.distributionEndDate || '').map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedPickupDate(d.date)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        selectedPickupDate === d.date
                          ? 'bg-amber-900 text-white font-bold border-amber-950 shadow-xs'
                          : 'bg-white hover:bg-amber-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{d.labelHi}</div>
                      <div className={`text-[9px] mt-0.5 ${selectedPickupDate === d.date ? 'text-amber-200' : 'text-slate-500'}`}>
                        {d.dayHi}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t">
                <button onClick={() => setBookingStep(1)} className="px-3 py-1.5 border rounded">
                  ← पीछे
                </button>
                <button onClick={() => setBookingStep(2)} className="px-4 py-2 bg-amber-900 text-white rounded font-bold">
                  {language === 'hi' ? 'आगे — मिठाई चयन →' : 'Next — Choose Sweets →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Customer Details (M-07) */}
          {bookingStep === 3 && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-base text-slate-900">
                {language === 'hi' ? 'चरण 3 — ग्राहक विवरण (M-07)' : 'Step 3 — Customer Info'}
              </h3>

              <div className="space-y-3 bg-slate-50 p-4 rounded border">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ग्राहक मोबाइल नंबर (ऑटो फ़िल हेतु)</label>
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => handleCustomerPhoneLookup(e.target.value)}
                    className="w-full p-2 border rounded font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ग्राहक का पूरा नाम</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full p-2 border rounded font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">पूरा पता</label>
                  <input
                    type="text"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t">
                <button onClick={() => setBookingStep(2)} className="px-3 py-1.5 border rounded">
                  ← पीछे
                </button>
                <button onClick={() => setBookingStep(4)} className="px-4 py-2 bg-amber-900 text-white rounded font-bold">
                  आगे — भुगतान मोड →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment Mode (M-08) */}
          {bookingStep === 4 && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-base text-slate-900">
                {language === 'hi' ? 'चरण 4 — भुगतान का तरीक़ा (M-08)' : 'Step 4 — Payment Mode'}
              </h3>

              <div className="p-3 bg-amber-50 rounded border border-amber-300 font-bold text-amber-950 flex justify-between">
                <span>कुल देय राशि:</span>
                <span className="font-mono text-base">₹{cart.reduce((a, b) => a + b.totalAmount, 0)}</span>
              </div>

              <div className="space-y-2">
                <label
                  onClick={() => setPaymentMode('udhar')}
                  className={`p-3 rounded border block cursor-pointer ${
                    paymentMode === 'udhar' ? 'border-amber-900 bg-amber-50 font-bold' : 'bg-white'
                  }`}
                >
                  <div className="font-bold text-slate-900">1. उधार — बाद में वसूली</div>
                  <p className="text-slate-500 text-[11px]">
                    डिलीवरी के समय वसूली होगी। मित्र के खाते में क्रेडिट एंट्री दर्ज होगी।
                  </p>
                </label>

                <label
                  onClick={() => setPaymentMode('cash')}
                  className={`p-3 rounded border block cursor-pointer ${
                    paymentMode === 'cash' ? 'border-amber-900 bg-amber-50 font-bold' : 'bg-white'
                  }`}
                >
                  <div className="font-bold text-slate-900">2. नगद — मित्र ने ले लिया</div>
                  <p className="text-slate-500 text-[11px]">
                    राशि सहकार मित्र के पास जमा हो गई है।
                  </p>
                </label>

                <label
                  onClick={() => setPaymentMode('online')}
                  className={`p-3 rounded border block cursor-pointer transition-all ${
                    paymentMode === 'online' ? 'border-[#183247] bg-[#183247]/5 ring-2 ring-[#183247]/30 font-bold' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-[#183247] text-white flex items-center justify-center text-[9px] font-black">
                        ZP
                      </div>
                      <span>3. ऑनलाइन — Zoho Payments (UPI / कार्ड / नेट बैंकिंग)</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                      तत्काल डिजिटल रसीद
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">
                    UPI (Google Pay, PhonePe, Paytm), RuPay/Visa डेबिट व क्रेडिट कार्ड द्वारा त्वरित पुष्टि।
                  </p>
                </label>
              </div>

              <div className="flex justify-between pt-3 border-t">
                <button onClick={() => setBookingStep(3)} className="px-3 py-1.5 border rounded">
                  ← पीछे
                </button>
                <button
                  onClick={handleMitraBookingComplete}
                  className="px-5 py-2.5 bg-[#183247] hover:bg-[#112433] text-white rounded font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{paymentMode === 'online' ? 'Zoho Payments से भुगतान व बुकिंग पक्की करें' : 'बुकिंग पक्की करें एवं रसीद जनरेट करें'}</span>
                  <span>✓</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* M-10 My Bookings & Dues View */}
      {viewMode === 'my_bookings' && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {language === 'hi' ? 'मेरी बुकिंग सूची (M-10)' : 'My Customer Bookings'}
              </h3>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="text-xs text-slate-600">
                  उधार बकाया: <span className="font-mono font-bold text-amber-900">₹{totalUdharOutstanding}</span>
                </span>
                {totalUdharOutstanding > 0 && (
                  <button
                    onClick={handlePayDuesOnline}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[11px] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Zoho Payments से ₹{totalUdharOutstanding} बकाया चुकाएं</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 text-xs">
              {(['all', 'udhar', 'delivered', 'cancelled'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBookingTabFilter(tab)}
                  className={`px-3 py-1 rounded font-medium ${
                    bookingTabFilter === tab ? 'bg-amber-900 text-white font-bold' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab === 'all' ? 'सभी' : tab === 'udhar' ? 'उधार' : tab === 'delivered' ? 'वितरित' : 'रद्द'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {(filteredMyBookings || []).map((b) => (
              <div key={b.id} className="p-4 rounded border border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{b.id}</span>
                    <span className="font-bold text-slate-800">{b.customer?.name || ''}</span>
                    <span className="font-mono text-slate-500">{b.customer?.phone || ''}</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    {(b?.items || []).map((i) => `${language === 'hi' ? i.sweetNameHi : i.sweetNameEn} (${i.variantLabel} x ${i.quantity})`).join(', ')}
                  </p>
                      <span className="text-[10px] text-slate-500 block">{language === 'hi' ? 'केंद्र:' : 'Center:'} {b.centerNameHi} | {language === 'hi' ? 'तिथि:' : 'Date:'} {b.pickupDate}</span>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-mono font-bold text-sm text-amber-950">₹{b.totalAmount}</div>
                  <button
                    onClick={() => {
                      setReceiptBooking(b);
                      setShowReceiptModal(true);
                    }}
                    className="px-2.5 py-1 bg-amber-900 text-white rounded text-[11px] font-bold"
                  >
                    रसीद देखें
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-book Printable Receipt Modal */}
      {showReceiptModal && (
        <PrintReceiptModal
          booking={receiptBooking}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* User Profile & Activity Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileInitialTab}
      />

      {/* Official Zoho Payments Gateway Modal */}
      <ZohoPaymentModal
        isOpen={isZohoModalOpen}
        onClose={() => setIsZohoModalOpen(false)}
        orderId={pendingOrderId || `#PB-${Math.floor(1000 + Math.random() * 9000)}`}
        amount={zohoPayAmount}
        customer={{
          name: zohoContext === 'booking' ? custName || 'सहकार मित्र ग्राहक' : currentMitra.fullName,
          phone: zohoContext === 'booking' ? custPhone || currentMitra.phone : currentMitra.phone,
          email: zohoContext === 'booking' ? custEmail || currentMitra.email : currentMitra.email,
          address: zohoContext === 'booking' ? custAddress || currentMitra.address : currentMitra.address
        }}
        onSuccess={handleZohoMitraSuccess}
      />
    </div>
  );
};
