/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CachedImage } from '../components/CachedImage';
import { Booking, CartItem, CustomerInfo, DiscountCoupon, PickupMode } from '../types';
import { PrintReceiptModal } from '../components/PrintReceiptModal';
import { LoginModal } from '../components/LoginModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { ZohoPaymentModal } from '../components/ZohoPaymentModal';
import { CheckoutDiscountSection } from '../components/CheckoutDiscountSection';
import { getDatesBetween } from '../utils/dateUtils';
import {
  ShoppingBag,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Search,
  Filter,
  ShieldCheck,
  Phone,
  QrCode,
  Share2,
  ExternalLink,
  Plus,
  X,
  LogOut,
  Check,
  CreditCard,
  Store,
  User,
  Package,
  Tag
} from 'lucide-react';

export const CustomerFlowView: React.FC = () => {
  const {
    language,
    cities,
    activeCity,
    setActiveCityId,
    activeCenterId,
    setActiveCenterId,
    activeSaleCenterId,
    setActiveSaleCenterId,
    activeDistributionCenterId,
    setActiveDistributionCenterId,
    distributionCenters,
    getSaleCenterSweets,
    activeFestival,
    masterSweets,
    saleCenters,
    mitras,
    cart,
    addToCart,
    createBooking,
    openOtpModal,
    isBookingWindowOpen,
    bookings,
    currentUser,
    loginUser,
    setRole,
    validateCoupon
  } = useApp();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'orders' | 'payments' | 'pickup' | 'settings'>('orders');
  const [customerPin, setCustomerPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check login helper
  const requireLogin = () => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return false;
    }
    return true;
  };

  // Step state: 'login' (C-01) -> 'city' (C-02) -> 'catalog' (C-03) -> 'center' (C-04) -> 'checkout' (C-05) -> 'confirmed' (C-06)
  const [step, setStep] = useState<'login' | 'city' | 'catalog' | 'center' | 'checkout' | 'confirmed'>('catalog');

  // Customer state
  const [phone, setPhone] = useState('9829123456');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: 'अजय मेहता',
    phone: '9829123456',
    email: 'ajay.mehta@gmail.com',
    pincode: '302017',
    address: '22/A, मालवीय नगर, जयपुर'
  });

  // Selected sale centre (grouping / discount scope) and distribution centre (pickup point).
  const [selectedSaleCenterId, setSelectedSaleCenterId] = useState(activeSaleCenterId || saleCenters[0]?.id || '');
  // `selectedCenterId` is the pickup point => a distribution centre id.
  const [selectedCenterId, setSelectedCenterId] = useState(
    activeDistributionCenterId || distributionCenters[0]?.id || ''
  );
  const [selectedPickupDate, setSelectedPickupDate] = useState(activeFestival?.distributionStartDate || '');
  const [pickupMode, setPickupMode] = useState<PickupMode>('self');
  const [pickupMitraId, setPickupMitraId] = useState('');

  // Discount Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const cartSubtotal = (cart || []).reduce((acc, item) => acc + (item.totalAmount || 0), 0);
  const finalPayableAmount = Math.max(0, cartSubtotal - discountAmount);

  // Auto-revalidate or adjust coupon if cart subtotal changes
  useEffect(() => {
    if (appliedCoupon) {
      // Discounts are scoped at the sale-centre level, so validate against the sale centre.
      const check = validateCoupon(appliedCoupon.code, cartSubtotal, activeCity?.id, selectedSaleCenterId);
      if (check.valid && check.discountAmount > 0) {
        setDiscountAmount(check.discountAmount);
      } else {
        setAppliedCoupon(null);
        setDiscountAmount(0);
      }
    }
  }, [cartSubtotal, appliedCoupon?.code, activeCity?.id, selectedSaleCenterId, validateCoupon]);

  useEffect(() => {
    if (currentUser) {
      setCustomerInfo((prev) => ({
        ...prev,
        name: currentUser.name || prev.name || 'ग्राहक',
        phone: currentUser.phone || prev.phone || '9829123456'
      }));
    }
  }, [currentUser]);

  // Ensure a valid sale centre is selected for the active city.
  useEffect(() => {
    if (activeCity) {
      const cityCenters = saleCenters.filter((c) => c.cityId === activeCity.id && c.isActive);
      if (cityCenters.length > 0 && (!selectedSaleCenterId || !cityCenters.some((c) => c.id === selectedSaleCenterId))) {
        const next = activeSaleCenterId && cityCenters.some((c) => c.id === activeSaleCenterId)
          ? activeSaleCenterId
          : cityCenters[0].id;
        setSelectedSaleCenterId(next);
        setActiveSaleCenterId(next);
      }
    }
  }, [activeCity, saleCenters, selectedSaleCenterId, activeSaleCenterId, setActiveSaleCenterId]);

  // Ensure a valid distribution centre (pickup point) under the selected sale centre.
  useEffect(() => {
    const scDcs = distributionCenters.filter((dc) => dc.saleCenterId === selectedSaleCenterId && dc.isActive);
    if (scDcs.length > 0 && (!selectedCenterId || !scDcs.some((dc) => dc.id === selectedCenterId))) {
      const next = activeDistributionCenterId && scDcs.some((dc) => dc.id === activeDistributionCenterId)
        ? activeDistributionCenterId
        : scDcs[0].id;
      setSelectedCenterId(next);
      setActiveDistributionCenterId(next);
      setActiveCenterId(next);
    }
  }, [distributionCenters, selectedSaleCenterId, selectedCenterId, activeDistributionCenterId, setActiveDistributionCenterId, setActiveCenterId]);

  const activeSaleCenter =
    saleCenters.find((c) => c.id === selectedSaleCenterId) ||
    saleCenters.find((c) => c.cityId === activeCity?.id) ||
    saleCenters[0];

  // The pickup point is the selected distribution centre.
  const activePickupCenter =
    distributionCenters.find((dc) => dc.id === selectedCenterId) ||
    distributionCenters.find((dc) => dc.saleCenterId === selectedSaleCenterId && dc.isActive) ||
    distributionCenters.find((dc) => dc.cityId === activeCity?.id && dc.isActive);

  const eligiblePickupMitras = mitras.filter((mitra) => {
    if (mitra.status !== 'approved' || !mitra.agreedToCenter) return false;
    const mitraCenterId = `kendra_mitra_${mitra.id.toLowerCase()}`;
    // Mitras attach to sale centres, so match against the selected sale centre.
    return (mitra.centerId === activeSaleCenter?.id || mitraCenterId === activeSaleCenter?.id) && mitra.cityId === activeCity?.id;
  });

  useEffect(() => {
    if (!eligiblePickupMitras.some((mitra) => mitra.id === pickupMitraId)) {
      setPickupMitraId(eligiblePickupMitras[0]?.id || '');
    }
  }, [activePickupCenter?.id, activeCity?.id, eligiblePickupMitras, pickupMitraId]);

  useEffect(() => {
    if (activeFestival?.distributionStartDate) {
      setSelectedPickupDate(activeFestival.distributionStartDate);
    }
  }, [activeFestival]);

  // Completed booking reference for receipt modal
  const [lastCreatedBooking, setLastCreatedBooking] = useState<Booking | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Search & category filter in C-03
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Service not available modal/toast state
  const [notifyCityInput, setNotifyCityInput] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('');

  // Sweets + pricing come from the selected SALE CENTRE's menu now.
  const centerSweets = getSaleCenterSweets(selectedSaleCenterId).filter((s) => s.isActive);
  const filteredSweets = masterSweets.filter((sweet) => {
    const centerConfig = centerSweets.find((cs) => cs.sweetId === sweet.id);
    if (!centerConfig) return false;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      sweet.nameHi.toLowerCase().includes(query) ||
      sweet.nameEn.toLowerCase().includes(query) ||
      sweet.descriptionHi?.toLowerCase().includes(query) ||
      sweet.descriptionEn?.toLowerCase().includes(query) ||
      sweet.ingredientsHi?.toLowerCase().includes(query) ||
      sweet.category.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === 'all' || sweet.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCustomerLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanPin = customerPin.trim().replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      setLoginError(
        language === 'hi'
          ? 'कृपया ठीक 10 अंकों का वैध मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid exactly 10-digit mobile number.'
      );
      return;
    }

    if (cleanPin.length !== 4) {
      setLoginError(
        language === 'hi'
          ? 'कृपया ठीक 4 अंकों का सुरक्षा पिन दर्ज करें।'
          : 'Please enter a valid exactly 4-digit PIN.'
      );
      return;
    }

    // Customer can log in with any valid 10-digit mobile & 4-digit PIN
    loginUser({
      role: 'customer',
      name: customerInfo.name || 'ग्राहक',
      phone: cleanPhone,
      detail: 'ग्राहक (लॉगिन)'
    });

    setIsLoggedIn(true);
    setCustomerInfo((prev) => ({ ...prev, phone: cleanPhone }));
    setStep('catalog');
  };

  // Zoho Payments Gateway integration states
  const [isZohoModalOpen, setIsZohoModalOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState('');

  const handleCreateBookingSubmit = async () => {
    if (!requireLogin()) return;
    if (cart.length === 0) return;
    if (pickupMode === 'mitra' && !pickupMitraId) return;

    // Generate upcoming Order ID and initiate Zoho Payments Gateway
    const nextOrderId = `#PB-${Math.floor(1000 + Math.random() * 9000)}`;
    setPendingOrderId(nextOrderId);
    setIsZohoModalOpen(true);
  };

  const handleZohoPaymentSuccess = async (result: {
    transactionId: string;
    invoiceId: string;
    paymentMode: string;
    booking?: any;
  }) => {
    setIsZohoModalOpen(false);

    // If booking was already saved on the backend during verification, use it or create via context
    if (result.booking) {
      setLastCreatedBooking(result.booking);
    } else {
      const newBooking = await createBooking(
        'customer',
        customerInfo,
        selectedCenterId || activePickupCenter?.id || (distributionCenters.find((dc) => dc.cityId === activeCity?.id)?.id || distributionCenters[0]?.id || ''),
        selectedPickupDate || activeFestival?.distributionStartDate || '',
        'online',
        undefined,
        undefined,
        {
          zohoPaymentId: result.transactionId,
          invoiceId: result.invoiceId,
          zohoPaymentMode: result.paymentMode,
          zohoOrderId: pendingOrderId
        },
        appliedCoupon ? {
          discountCode: appliedCoupon.code,
          discountAmount: discountAmount,
          subtotalAmount: cartSubtotal
        } : undefined,
        {
          pickupMode,
          pickupMitraId: pickupMode === 'mitra' ? pickupMitraId : undefined,
          pickupMitraName: pickupMode === 'mitra' ? eligiblePickupMitras.find((mitra) => mitra.id === pickupMitraId)?.fullName : undefined
        }
      );
      setLastCreatedBooking(newBooking);
    }

    setStep('confirmed');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Role Identity Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-orange-800 to-amber-900 text-white p-4 rounded-xl shadow-md border-b-4 border-amber-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-base shadow-sm border-2 border-white shrink-0">
            ग्राहक
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                {language === 'hi' ? 'ग्राहक प्री-बुकिंग पोर्टल' : 'Customer Pre-booking Portal'}
              </h2>
              <span className="bg-amber-400 text-amber-950 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                {language === 'hi' ? `${activeCity?.nameHi || ''} मंडल` : `${activeCity?.nameEn || ''} District`}
              </span>
            </div>
            <p className="text-xs text-amber-100/90 mt-0.5">
              {language === 'hi'
                ? 'अपनी पसंदीदा मिठाइयों का चयन करें, बिक्री केंद्र चुनें और ऑनलाइन एडवांस बुक करें।'
                : 'Select sweets, pick sale center, and pre-book.'}
            </p>
          </div>
        </div>
      </div>

      {/* Login Required Notice for Unauthenticated Users */}
      {!currentUser && (
        <div className="bg-amber-100 border-2 border-amber-400 p-3.5 sm:p-4 rounded-xl text-amber-950 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-orange-700 shrink-0 stroke-[2.5]" />
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                {language === 'hi' ? 'लॉगिन आवश्यक है (Login Required)' : 'Login Required'}
              </h4>
              <p className="text-xs text-amber-900">
                {language === 'hi'
                  ? 'बिना लॉगिन के आप कार्ट में मिठाई नहीं जोड़ सकते एवं ऑर्डर प्रक्रिया आगे नहीं बढ़ेगी।'
                  : 'Without logging in, you cannot add items to cart or proceed with ordering.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow transition-all active:scale-95 cursor-pointer"
          >
            {language === 'hi' ? 'तुरंत लॉगिन करें →' : 'Login Now →'}
          </button>
        </div>
      )}

      {/* Visual Progress Stepper Component */}
      <div className="bg-gradient-to-b from-white to-orange-50/40 p-4 sm:p-5 rounded-xl shadow-xs border border-orange-200/90">
        <div className="max-w-2xl mx-auto relative px-2">
          {/* Progress Bar Track Line */}
          <div className="absolute top-4 sm:top-5 left-8 right-8 h-1 bg-slate-200 rounded-full z-0">
            <div
              className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{
                width:
                  step === 'checkout' || step === 'confirmed'
                    ? '100%'
                    : step === 'center'
                    ? '50%'
                    : '0%'
              }}
            />
          </div>

          {/* Stepper Nodes Container */}
          <div className="relative z-10 flex items-center justify-between">
            {/* Step 1: Menu */}
            {(() => {
              const isCurrent = step === 'catalog' || step === 'login' || step === 'city';
              const isCompleted = step === 'center' || step === 'checkout' || step === 'confirmed';
              return (
                <button
                  onClick={() => setStep('catalog')}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                  title={language === 'hi' ? 'मिठाई कैटलॉग पर जाएं' : 'Go to Sweet Catalog'}
                >
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200'
                        : isCurrent
                        ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg ring-4 ring-orange-200 scale-105'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <span
                      className={`block text-xs sm:text-sm font-bold leading-tight ${
                        isCurrent ? 'text-orange-950 font-black' : isCompleted ? 'text-emerald-900' : 'text-slate-500'
                      }`}
                    >
                      {language === 'hi' ? '1. मिठाई कैटलॉग' : '1. Sweet Menu'}
                    </span>
                    <span className="text-[10px] text-slate-500 hidden xs:block font-mono mt-0.5">
                      {language === 'hi' ? 'मिठाई चुनें' : 'Select Sweets'}
                    </span>
                  </div>
                </button>
              );
            })()}

            {/* Step 2: Center & Details */}
            {(() => {
              const isCurrent = step === 'center';
              const isCompleted = step === 'checkout' || step === 'confirmed';
              const canAccess = cart.length > 0 || isCompleted || isCurrent;
              return (
                <button
                  onClick={() => {
                    if (!requireLogin()) return;
                    if (canAccess) setStep('center');
                  }}
                  disabled={!canAccess}
                  className={`flex flex-col items-center group focus:outline-none ${
                    canAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                  }`}
                  title={language === 'hi' ? 'बिक्री केंद्र व तिथि चुनें' : 'Choose Sale Center & Date'}
                >
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200'
                        : isCurrent
                        ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg ring-4 ring-orange-200 scale-105'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <span
                      className={`block text-xs sm:text-sm font-bold leading-tight ${
                        isCurrent ? 'text-orange-950 font-black' : isCompleted ? 'text-emerald-900' : 'text-slate-500'
                      }`}
                    >
                      {language === 'hi' ? '2. केंद्र व दिनांक' : '2. Pickup Details'}
                    </span>
                    <span className="text-[10px] text-slate-500 hidden xs:block font-mono mt-0.5">
                      {language === 'hi' ? 'स्थान व तिथि' : 'Center & Date'}
                    </span>
                  </div>
                </button>
              );
            })()}

            {/* Step 3: Payment & Confirmation */}
            {(() => {
              const isCurrent = step === 'checkout' || step === 'confirmed';
              const isCompleted = step === 'confirmed';
              const canAccess = (cart.length > 0 && selectedCenterId) || isCurrent;
              return (
                <button
                  onClick={() => {
                    if (!requireLogin()) return;
                    if (canAccess) setStep('checkout');
                  }}
                  disabled={!canAccess}
                  className={`flex flex-col items-center group focus:outline-none ${
                    canAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                  }`}
                  title={language === 'hi' ? 'भुगतान व ऑर्डर रसीद' : 'Payment & Receipt'}
                >
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200'
                        : isCurrent
                        ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg ring-4 ring-orange-200 scale-105'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <span
                      className={`block text-xs sm:text-sm font-bold leading-tight ${
                        isCurrent ? 'text-orange-950 font-black' : isCompleted ? 'text-emerald-900' : 'text-slate-500'
                      }`}
                    >
                      {language === 'hi' ? '3. भुगतान व रसीद' : '3. Payment & Receipt'}
                    </span>
                    <span className="text-[10px] text-slate-500 hidden xs:block font-mono mt-0.5">
                      {language === 'hi' ? 'ऑर्डर पुष्टि' : 'Confirmation'}
                    </span>
                  </div>
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* C-01 Mobile & PIN Login */}
      {step === 'login' && (
        <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-amber-300 max-w-md mx-auto space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-900 flex items-center justify-center font-bold text-xl mx-auto mb-2 shadow-inner">
              <Phone className="w-6 h-6 text-orange-800" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-800">
              {language === 'hi' ? 'ग्राहक लॉगिन (Customer Login)' : 'Customer Mobile & PIN Login'}
            </h3>
            <p className="text-xs text-slate-600">
              {language === 'hi'
                ? 'अपना 10-अंकीय मोबाइल नंबर एवं 4-अंकीय पिन दर्ज करें'
                : 'Enter your 10-digit mobile number & 4-digit PIN to proceed'}
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleCustomerLoginSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {language === 'hi' ? 'मोबाइल नंबर (10 अंक)' : 'Mobile Number (10 Digits)'}
                </label>
                <span className={`text-[10px] font-mono font-bold ${phone.replace(/\D/g, '').length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {phone.replace(/\D/g, '').length}/10
                </span>
              </div>
              <div className="flex">
                <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-mono font-bold text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setLoginError(null);
                  }}
                  placeholder={language === 'hi' ? '10-अंकीय मोबाइल नंबर' : '10-digit mobile number'}
                  className="flex-1 p-2 border border-slate-300 rounded-r-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {language === 'hi' ? '4-अंकीय सुरक्षा पिन / पासवर्ड' : '4-Digit PIN / Password'}
                </label>
                <span className={`text-[10px] font-mono font-bold ${customerPin.replace(/\D/g, '').length === 4 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {customerPin.replace(/\D/g, '').length}/4
                </span>
              </div>
              <input
                type="password"
                inputMode="numeric"
                required
                maxLength={4}
                value={customerPin}
                onChange={(e) => {
                  setCustomerPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setLoginError(null);
                }}
                placeholder={language === 'hi' ? '4-अंकीय पिन दर्ज करें' : 'Enter 4-digit PIN'}
                className="w-full p-2 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-600"
              />
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
              <input type="checkbox" defaultChecked id="terms" className="mt-0.5 cursor-pointer" />
              <label htmlFor="terms" className="cursor-pointer">
                {language === 'hi'
                  ? 'मैं सहकार भारती के नियम एवं शर्तें स्वीकार करता हूँ।'
                  : 'I agree to Sahakar Bharati terms & conditions.'}
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer active:scale-95"
            >
              {language === 'hi' ? 'लॉगिन करें एवं आगे बढ़ें →' : 'Login & Proceed →'}
            </button>
          </form>
        </div>
      )}

      {/* C-02 City Selector */}
      {step === 'city' && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200 space-y-5">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              {language === 'hi' ? 'अपना शहर चुनें (C-02)' : 'Select Your City'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'केवल उन्हीं शहरों की सूची जहाँ सहकार भारती बिक्री केंद्र सक्रिय हैं।'
                : 'Choose a city with active Sahakar Bharati centers.'}
            </p>
          </div>

          {/* Location button */}
          <button
            onClick={() => {
              if (cities.length > 0) setActiveCityId(cities[0].id);
              setStep('catalog');
            }}
            className="w-full p-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl flex items-center justify-between text-xs font-bold text-amber-950 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-800" />
              <span>{language === 'hi' ? 'मेरी वर्तमान लोकेशन से खोजें' : 'Detect current location'}</span>
            </div>
            <span className="text-[11px] text-amber-800 font-mono font-bold">
              {language === 'hi' ? `${activeCity?.nameHi || 'सवाई माधोपुर'} (ऑटो)` : `${activeCity?.nameEn || 'Sawai Madhopur'} (Auto)`}
            </span>
          </button>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
              {language === 'hi' ? 'उपलब्ध नगर एवं मंडल' : 'Available Cities'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(cities || []).filter((c) => c.isActive).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCityId(c.id);
                    setStep('catalog');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeCity.id === c.id
                      ? 'bg-amber-900 text-white border-amber-950 font-bold shadow-md ring-2 ring-amber-400'
                      : 'bg-white hover:bg-amber-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="text-sm font-bold">{language === 'hi' ? c.nameHi : c.nameEn}</div>
                  <div className={`text-[10px] ${activeCity.id === c.id ? 'text-amber-200' : 'text-slate-500'}`}>
                    {language === 'hi' ? c.stateHi : c.stateEn}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Service Not Available Drawer Option */}
          <div className="border-t border-slate-200 pt-4 bg-slate-50 p-4 rounded border">
            <h4 className="font-bold text-xs text-slate-800 mb-1">
              {language === 'hi' ? 'आपके शहर में सेवा नहीं है?' : 'City not listed?'}
            </h4>
            <p className="text-xs text-slate-500 mb-2">
              {language === 'hi'
                ? 'अपने शहर का नाम दर्ज करें। आगामी त्योहारों पर विस्तार हेतु सूचित किया जाएगा।'
                : 'Enter your city name to receive updates when we expand.'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={language === 'hi' ? 'शहर का नाम (उदा. लखनऊ, पुणे)' : 'City name'}
                value={notifyCityInput}
                onChange={(e) => setNotifyCityInput(e.target.value)}
                className="flex-1 p-2 border border-slate-300 rounded text-xs focus:outline-none"
              />
              <button
                onClick={() => {
                  if (notifyCityInput) {
                    setNotifyMsg(
                      language === 'hi'
                        ? `धन्यवाद! ${notifyCityInput} हेतु आपकी रुचि दर्ज कर ली गई है।`
                        : `Interest recorded for ${notifyCityInput}!`
                    );
                    setNotifyCityInput('');
                  }
                }}
                className="px-3 py-2 bg-slate-800 text-white rounded font-bold text-xs hover:bg-slate-900"
              >
                {language === 'hi' ? 'सूचना पाएँ' : 'Notify Me'}
              </button>
            </div>
            {notifyMsg && (
              <p className="text-xs text-emerald-700 font-medium mt-2 bg-emerald-50 p-2 rounded border border-emerald-200">
                {notifyMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* C-03 Sweet Catalog */}
      {step === 'catalog' && (
        <div className="space-y-4">
          {/* Active City & Linked Pickup Center Connection Banner */}
          {(() => {
            const cityCenters = saleCenters.filter((c) => c.cityId === activeCity.id && c.isActive);
            const currentSelectedCenter = cityCenters.find((c) => c.id === selectedCenterId) || cityCenters[0];

            return (
              <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-amber-900 text-white p-4 rounded-xl shadow-md border-2 border-amber-400/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-inner shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                          {language === 'hi' ? 'वितरण शहर एवं मुख्य संग्रह केंद्र' : 'Distribution City & Pickup Center'}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-400/20 text-amber-200 border border-amber-400/50 rounded-full font-mono text-[10px] font-bold">
                          {language === 'hi' ? `${activeCity.nameHi} विशेष` : `${activeCity.nameEn} Special`}
                        </span>
                      </div>
                      <h3 className="font-black text-base sm:text-lg text-white leading-tight">
                        {currentSelectedCenter
                          ? language === 'hi' ? currentSelectedCenter.nameHi : currentSelectedCenter.nameEn
                          : language === 'hi' ? 'सहकार वितरण केंद्र' : 'Sahakar Distribution Center'}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-amber-200">
                    {language === 'hi' ? 'होम पेज पर चुना गया केंद्र' : 'Center selected on home page'}
                  </span>
                </div>

                {currentSelectedCenter && (
                  <div className="pt-2 border-t border-amber-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-100/90 font-medium">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">
                        {language === 'hi' ? currentSelectedCenter.addressHi : currentSelectedCenter.addressEn} (पिन: {currentSelectedCenter.pincode})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[11px]">
                      <span className="flex items-center gap-1 text-amber-200">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        {currentSelectedCenter.timing}
                      </span>
                      {currentSelectedCenter.ownerPhone && (
                        <a
                          href={`tel:${currentSelectedCenter.ownerPhone}`}
                          className="flex items-center gap-1 text-amber-300 hover:text-white font-mono font-bold underline"
                        >
                          <Phone className="w-3 h-3" />
                          {currentSelectedCenter.ownerPhone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Top Bar Filters & Search */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-amber-950">
                  {language === 'hi' ? 'विशिष्ट मिष्ठान कैटलॉग' : 'Specialty Sweets Catalog'}
                </h3>
                <span className="bg-amber-100 text-amber-900 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                        {language === 'hi'
                          ? `${activeCity.nameHi} (${filteredSweets.length} मिठाइयाँ)`
                          : `${activeCity.nameEn} (${filteredSweets.length} sweets)`}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {language === 'hi'
                  ? `${activeCity.nameHi} शहर हेतु विशेष रूप से तैयार शुद्ध देशी घी व मावे की प्रामाणिक मिठाइयाँ।`
                  : `Authentic sweets prepared exclusively for ${activeCity.nameEn} distribution center.`}
              </p>
            </div>

            {/* Search Input & My Orders Button */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-orange-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder={language === 'hi' ? 'मिठाई का नाम या सामग्री खोजें...' : 'Search sweet name or ingredient...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 border border-orange-300 rounded-xl text-xs bg-orange-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {currentUser && (
                <button
                  onClick={() => setRole('profile')}
                  className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  title={language === 'hi' ? 'मेरे पिछले ऑर्डर, रसीदें एवं खाता पेज' : 'My Past Orders & Account Page'}
                >
                  <Package className="w-3.5 h-3.5 text-orange-800" />
                  <span>{language === 'hi' ? 'मेरे ऑर्डर व खाता' : 'My Orders & Account'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', labelHi: 'सभी विशिष्ट मिठाइयाँ', labelEn: 'All Sweets' },
              { id: 'dry', labelHi: 'काजू व ड्राई मिठाई', labelEn: 'Dry Fruit Sweets' },
              { id: 'traditional', labelHi: 'पारंपरिक / लड्डू / घेवर', labelEn: 'Traditional/Ladoo' },
              { id: 'mawa', labelHi: 'मावा / मिल्क केक', labelEn: 'Mawa / Milk Cake' },
              { id: 'bengali', labelHi: 'बंगाली / रसगुल्ला / जामुन', labelEn: 'Bengali/Juicy' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-orange-700 text-white font-bold shadow-xs'
                    : 'bg-white hover:bg-orange-50 text-slate-700 border border-slate-200'
                }`}
              >
                {language === 'hi' ? cat.labelHi : cat.labelEn}
              </button>
            ))}
          </div>

          {/* Empty Search State */}
          {filteredSweets.length === 0 && (
            <div className="bg-white p-8 rounded-xl border border-orange-200 text-center space-y-3 my-4">
              <Search className="w-10 h-10 text-orange-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                {language === 'hi'
                  ? `'${searchQuery}' के लिए कोई मिठाई नहीं मिली`
                  : `No sweets found for '${searchQuery}'`}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {language === 'hi'
                  ? 'कृपया अन्य नाम से खोजें या श्रेणी बदलें।'
                  : 'Try searching for another sweet or reset filters.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {language === 'hi' ? 'सभी मिठाइयाँ देखें' : 'Show All Sweets'}
              </button>
            </div>
          )}

          {/* Sweets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredSweets.map((sweet) => {
              const centerConfig = centerSweets.find((cs) => cs.sweetId === sweet.id);
              const pricePerKg = centerConfig ? centerConfig.pricePerKg : 700;
              // Pickup point shown on the card is the selected distribution centre.
              const activeCenter = activePickupCenter;

              return (
                <SweetCard
                  key={sweet.id}
                  sweet={sweet}
                  cityName={activeCity.nameHi}
                  linkedCenter={activeCenter}
                  pricePerKg={pricePerKg}
                  onAddToCart={(variantLabel, variantKg, unitPrice) => {
                    if (!requireLogin()) return;
                    const cartItem: CartItem = {
                      sweetId: sweet.id,
                      sweetNameHi: sweet.nameHi,
                      sweetNameEn: sweet.nameEn,
                      variantLabel,
                      variantKg,
                      pricePerKg,
                      quantity: 1,
                      unitPrice,
                      totalAmount: unitPrice,
                      imageUrl: sweet.imageUrl
                    };
                    addToCart(cartItem);
                  }}
                />
              );
            })}
          </div>

          {/* Cart Bottom Floating Bar */}
          {cart.length > 0 && (
            <div className="sticky bottom-20 sm:bottom-4 z-30 bg-amber-950 text-white p-3 rounded-xl shadow-2xl border-2 border-amber-500 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center font-bold text-xs">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </div>
                <div>
                  <div className="font-bold text-xs text-amber-100">
                    {language === 'hi' ? 'कार्ट में वस्तुएं:' : 'Items in Cart:'} {cart.length}
                  </div>
                  <div className="font-mono text-sm font-black text-amber-300">
                    ₹{cart.reduce((a, b) => a + b.totalAmount, 0)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!requireLogin()) return;
                  setStep('center');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded text-xs shadow flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{language === 'hi' ? 'आगे — बिक्री केंद्र चुनें' : 'Proceed to Sale Center'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* C-04 Collection Center & Pickup Date */}
      {step === 'center' && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200 space-y-5">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              {language === 'hi' ? 'बिक्री केंद्र एवं वितरण तिथि (C-04)' : 'Select Collection Center & Date'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'त्योहार पर भीड़ से बचने हेतु अपनी सुविधाजनक तिथि एवं पास का केंद्र चुनें।'
                : 'Select nearest pickup center and preferred distribution date.'}
            </p>
          </div>

          {/* Sale Centre + Distribution Centre selectors */}
          <div className="space-y-3">
            {(() => {
              const cityCenters = saleCenters.filter((c) => c.cityId === activeCity.id && c.isActive);
              const scDcs = distributionCenters.filter((dc) => dc.saleCenterId === selectedSaleCenterId && dc.isActive);
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-1">
                        {language === 'hi' ? 'बिक्री केंद्र' : 'Sale Centre'}
                      </label>
                      <select
                        value={selectedSaleCenterId}
                        onChange={(e) => {
                          const nextSc = e.target.value;
                          setSelectedSaleCenterId(nextSc);
                          setActiveSaleCenterId(nextSc);
                          const firstDc = distributionCenters.find((dc) => dc.saleCenterId === nextSc && dc.isActive);
                          if (firstDc) {
                            setSelectedCenterId(firstDc.id);
                            setActiveDistributionCenterId(firstDc.id);
                            setActiveCenterId(firstDc.id);
                          }
                        }}
                        aria-label={language === 'hi' ? 'बिक्री केंद्र चुनें' : 'Choose sale centre'}
                        className="w-full rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {cityCenters.map((center) => (
                          <option key={center.id} value={center.id}>
                            {language === 'hi' ? center.nameHi : center.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-1">
                        {language === 'hi' ? 'वितरण केंद्र (पिकअप)' : 'Distribution Centre (Pickup)'}
                      </label>
                      <select
                        value={selectedCenterId}
                        onChange={(e) => {
                          setSelectedCenterId(e.target.value);
                          setActiveDistributionCenterId(e.target.value);
                          setActiveCenterId(e.target.value);
                        }}
                        aria-label={language === 'hi' ? 'वितरण केंद्र चुनें' : 'Choose distribution centre'}
                        className="w-full rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {scDcs.length === 0 ? (
                          <option value="" disabled>
                            {language === 'hi' ? 'कोई वितरण केंद्र नहीं' : 'No distribution centre'}
                          </option>
                        ) : (
                          scDcs.map((dc) => (
                            <option key={dc.id} value={dc.id}>
                              {language === 'hi' ? dc.nameHi : dc.nameEn}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Selected pickup (distribution centre) details card */}
                  {activePickupCenter && (
                    <div className="p-4 rounded-lg border-2 border-amber-900 bg-amber-50/60 shadow-xs ring-1 ring-amber-500">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-1 w-4 h-4 text-amber-800 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {language === 'hi' ? activePickupCenter.nameHi : activePickupCenter.nameEn}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-purple-100 text-purple-900 border border-purple-200">
                              {language === 'hi' ? 'वितरण केंद्र' : 'Distribution Centre'}
                            </span>
                          </div>
                          {activeSaleCenter && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {language === 'hi' ? 'बिक्री केंद्र:' : 'Sale Centre:'}{' '}
                              {language === 'hi' ? activeSaleCenter.nameHi : activeSaleCenter.nameEn}
                            </p>
                          )}
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {language === 'hi' ? activePickupCenter.addressHi : activePickupCenter.addressEn}
                            {activePickupCenter.pincode ? ` — ${activePickupCenter.pincode}` : ''}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                            <span>{language === 'hi' ? 'समय:' : 'Hours:'} {activePickupCenter.timing}</span>
                            <span>{language === 'hi' ? 'संपर्क:' : 'Contact:'} {activePickupCenter.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Pickup Date Picker with Calendar Input & Dynamic Date Buttons */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>{language === 'hi' ? 'संग्रहण/वितरण तिथि (Pickup Date):' : 'Collection Center Pickup Date:'}</span>
              </label>

              {/* Direct HTML Date Picker Input */}
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

            <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md font-semibold">
              {language === 'hi'
                ? `उत्सव वितरण अवधि: ${activeFestival?.distributionStartDate || ''} से ${activeFestival?.distributionEndDate || ''}`
                : `Festival Collection Window: ${activeFestival?.distributionStartDate || ''} to ${activeFestival?.distributionEndDate || ''}`}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {getDatesBetween(activeFestival?.distributionStartDate || '', activeFestival?.distributionEndDate || '').map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedPickupDate(d.date)}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    selectedPickupDate === d.date
                      ? 'bg-amber-900 text-white font-bold border-amber-950 shadow-sm ring-2 ring-amber-500/30'
                      : 'bg-white hover:bg-amber-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="text-xs font-mono font-bold">{language === 'hi' ? d.labelHi : d.labelEn}</div>
                  <div className={`text-[10px] mt-0.5 ${selectedPickupDate === d.date ? 'text-amber-200' : 'text-slate-500'}`}>
                    {language === 'hi' ? d.dayHi : d.dayEn}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <button
              onClick={() => setStep('catalog')}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded text-xs font-bold text-slate-700"
            >
              ← {language === 'hi' ? 'कैचलग पर लौटें' : 'Back to Catalog'}
            </button>

            <button
              onClick={() => setStep('checkout')}
              className="px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded text-xs shadow flex items-center gap-1.5"
            >
              <span>{language === 'hi' ? 'आगे — विवरण एवं भुगतान' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* C-05 Customer Details & Payment */}
      {step === 'checkout' && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200 space-y-5">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              {language === 'hi' ? 'ग्राहक विवरण एवं ऑनलाइन भुगतान (C-05)' : 'Checkout & Payment'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'ध्यान दें: ग्राहक द्वारा स्वयं बुकिंग में केवल ऑनलाइन भुगतान उपलब्ध है (उधार/नगद केवल मित्र द्वारा)।'
                : 'Note: Self-booking requires online payment.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form details & Discounts */}
            <div className="space-y-4">
              <div className="space-y-3 bg-slate-50 p-4 rounded border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-800 text-xs uppercase font-mono">
                  {language === 'hi' ? 'ग्राहक जानकारी' : 'Customer Info'}
                </h4>

                <div>
                  <label className="block text-slate-600 mb-0.5">{language === 'hi' ? 'पूरा नाम' : 'Full Name'}</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-0.5">{language === 'hi' ? 'मोबाइल नंबर' : 'Mobile'}</label>
                  <input
                    type="text"
                    value={customerInfo.phone}
                    readOnly
                    className="w-full p-2 border border-slate-300 rounded font-mono bg-slate-100 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-0.5">{language === 'hi' ? 'ईमेल आईडी' : 'Email'}</label>
                  <input
                    type="email"
                    value={customerInfo.email || ''}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-0.5">{language === 'hi' ? 'पूरा पता' : 'Address'}</label>
                  <input
                    type="text"
                    value={customerInfo.address || ''}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-white p-4 rounded border border-amber-200 text-xs">
                <h4 className="font-bold text-slate-800 text-xs uppercase font-mono">
                  {language === 'hi' ? 'मिठाई लेने का विकल्प' : 'Pickup Option'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-300 p-3 cursor-pointer">
                    <input type="radio" name="pickupMode" checked={pickupMode === 'self'} onChange={() => setPickupMode('self')} />
                    <span className="font-bold">{language === 'hi' ? 'स्वयं पिकअप' : 'Self Pickup'}</span>
                  </label>
                  <label className={`flex items-center gap-2 rounded-lg border p-3 ${eligiblePickupMitras.length ? 'border-slate-300 cursor-pointer' : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}`}>
                    <input type="radio" name="pickupMode" checked={pickupMode === 'mitra'} disabled={!eligiblePickupMitras.length} onChange={() => setPickupMode('mitra')} />
                    <span className="font-bold">{language === 'hi' ? 'मित्र पिकअप' : 'Mitra Pickup'}</span>
                  </label>
                </div>
                {eligiblePickupMitras.length ? (
                  pickupMode === 'mitra' && (
                    <select value={pickupMitraId} onChange={(event) => setPickupMitraId(event.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white font-semibold">
                      <option value="">{language === 'hi' ? 'मित्र चुनें' : 'Select a Mitra'}</option>
                      {eligiblePickupMitras.map((mitra) => <option key={mitra.id} value={mitra.id}>{mitra.fullName} ({mitra.phone})</option>)}
                    </select>
                  )
                ) : (
                  <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                    {language === 'hi' ? 'इस केंद्र के लिए कोई सक्रिय पंजीकृत मित्र उपलब्ध नहीं है। मित्र पिकअप उपलब्ध नहीं है।' : 'No active registered Mitra is available for this center. Mitra Pickup is unavailable.'}
                  </p>
                )}
              </div>

              {/* Checkout Discount & Coupon Section — discounts scope to the sale centre */}
              <CheckoutDiscountSection
                cityId={activeCity?.id || ''}
                centerId={selectedSaleCenterId}
                cartSubtotal={cartSubtotal}
                appliedCoupon={appliedCoupon}
                discountAmount={discountAmount}
                onApplyCoupon={(coupon, amt) => {
                  setAppliedCoupon(coupon);
                  setDiscountAmount(amt);
                }}
                onRemoveCoupon={() => {
                  setAppliedCoupon(null);
                  setDiscountAmount(0);
                }}
              />
            </div>

            {/* Order Summary & Payment Box */}
            <div className="space-y-3 bg-amber-50/50 p-4 rounded border border-amber-300 text-xs flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="font-bold text-amber-950 text-xs uppercase font-mono">
                  {language === 'hi' ? 'ऑर्डर सारांश' : 'Order Summary'}
                </h4>

                <div className="bg-white p-2.5 rounded border border-amber-200 space-y-1 divide-y divide-slate-100">
                  {(cart || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center pt-1">
                      <span>
                        {(language === 'hi' ? item.sweetNameHi : item.sweetNameEn)} ({item.variantLabel} x {item.quantity})
                      </span>
                      <span className="font-mono font-bold">₹{item.totalAmount}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-amber-200">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>{language === 'hi' ? 'उप-योग (Subtotal):' : 'Subtotal:'}</span>
                    <span className="font-mono font-bold text-slate-800">₹{cartSubtotal}</span>
                  </div>

                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1.5 rounded border border-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{language === 'hi' ? 'छूट कूपन' : 'Coupon Discount'} ({appliedCoupon.code}):</span>
                      </span>
                      <span className="font-mono font-black text-emerald-700">-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-bold text-amber-950 pt-1.5 border-t border-amber-300">
                    <span>{language === 'hi' ? 'कुल देय राशि:' : 'Total Payable:'}</span>
                    <div className="text-right">
                      {appliedCoupon && discountAmount > 0 && (
                        <span className="font-mono text-xs text-slate-400 line-through mr-1.5">
                          ₹{cartSubtotal}
                        </span>
                      )}
                      <span className="font-mono text-base text-amber-900 font-black">
                        ₹{finalPayableAmount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-br from-[#183247]/5 to-emerald-500/10 border border-[#183247]/20 rounded-lg text-[11px] text-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold flex items-center gap-1.5 text-[#183247]">
                      <div className="w-4 h-4 rounded bg-[#183247] text-white flex items-center justify-center text-[9px] font-black">
                        ZP
                      </div>
                      <span className="text-xs">{language === 'hi' ? 'Zoho Payments गेटवे (सुरक्षित डिजिटल भुगतान)' : 'Zoho Payments Gateway (Secure Digital Payment)'}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                      PCI-DSS Level 1
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-600 leading-snug">
                    UPI (Google Pay, PhonePe, Paytm, BHIM), RuPay/Visa डेबिट व क्रेडिट कार्ड, एवं प्रमुख बैंकों की नेट बैंकिंग से सुरक्षित भुगतान।
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>256-Bit SSL एन्क्रिप्शन • तत्काल टैक्स इनवॉइस व OTP पुष्टि</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateBookingSubmit}
                className="w-full py-3.5 bg-[#183247] hover:bg-[#112433] active:scale-[0.99] text-white font-black rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{language === 'hi' ? `₹${finalPayableAmount} का भुगतान करें (Zoho Payments)` : `Pay ₹${finalPayableAmount} (Zoho Payments)`}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C-06 Booking Confirmation */}
      {step === 'confirmed' && lastCreatedBooking && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-amber-300 space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
              बुकिंग पक्की हो गई (C-06)
            </span>
            <h3 className="text-xl font-black text-slate-900 pt-1">
              प्री-बुकिंग क्रमांक: {lastCreatedBooking.id}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              आपकी प्री-बुकिंग दर्ज कर ली गई है। विवरण SMS तथा ईमेल पर भेज दिया गया है।
            </p>
          </div>

          {/* Quick Details Card */}
          <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-300 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">संग्रह केंद्र:</span>
              <span className="font-bold text-slate-900">{lastCreatedBooking.centerNameHi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">वितरण तिथि:</span>
              <span className="font-mono font-bold text-slate-900">{lastCreatedBooking.pickupDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">कुल मात्रा व राशि:</span>
              <span className="font-mono font-bold text-amber-900">
                {lastCreatedBooking.totalKg} kg | ₹{lastCreatedBooking.totalAmount}
              </span>
            </div>
            {lastCreatedBooking.discountAmount && lastCreatedBooking.discountAmount > 0 ? (
              <div className="flex justify-between items-center bg-emerald-50 px-2.5 py-1.5 rounded text-emerald-800 font-bold border border-emerald-200">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>लागू छूट ({lastCreatedBooking.discountCode}):</span>
                </span>
                <span className="font-mono text-emerald-700">-₹{lastCreatedBooking.discountAmount} (मूल ₹{lastCreatedBooking.subtotalAmount || (lastCreatedBooking.totalAmount + lastCreatedBooking.discountAmount)})</span>
              </div>
            ) : null}
            <div className="flex justify-between items-center pt-2 border-t border-amber-200">
              <span className="text-slate-500">डिलीवरी OTP:</span>
              <span className="font-mono text-sm font-black bg-white px-2 py-0.5 border border-amber-300 rounded text-amber-900">
                {lastCreatedBooking.deliveryOtp}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded text-xs shadow flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>रसीद / QR कोड देखें</span>
            </button>

            <button
              onClick={() => {
                setStep('catalog');
                setLastCreatedBooking(null);
              }}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded text-xs"
            >
              नई बुकिंग करें
            </button>
          </div>
        </div>
      )}

      {/* Pre-book Printable Receipt Modal */}
      {showReceiptModal && (
        <PrintReceiptModal
          booking={lastCreatedBooking}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Login Modal for Guest User Attempting Cart/Order */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        defaultRole="customer"
      />

      {/* User Profile & Past Orders Modal */}
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
        amount={finalPayableAmount}
        customer={{
          name: customerInfo.name || 'ग्राहक',
          phone: customerInfo.phone || phone,
          email: customerInfo.email,
          address: customerInfo.address
        }}
        bookingData={{
          id: pendingOrderId,
          festivalId: activeFestival ? activeFestival.id : 'diwali_2026',
          festivalNameHi: activeFestival ? activeFestival.nameHi : 'दीपावली 2026',
          cityId: activeCity ? activeCity.id : 'jaipur',
          cityNameHi: activeCity ? activeCity.nameHi : 'जयपुर',
          centerId: selectedCenterId || activePickupCenter?.id || '',
          saleCenterId: selectedSaleCenterId || activePickupCenter?.saleCenterId,
          centerNameHi: activePickupCenter?.nameHi || 'सहकार केंद्र',
          centerNameEn: activePickupCenter?.nameEn || 'Sahakar Center',
          centerAddressHi: activePickupCenter?.addressHi || 'जयपुर, राजस्थान',
          centerAddressEn: activePickupCenter?.addressEn || 'Jaipur, Rajasthan',
          centerPhone: activePickupCenter?.phone || '9829012345',
          bookedByRole: 'customer',
          pickupMode,
          pickupMitraId: pickupMode === 'mitra' ? pickupMitraId : undefined,
          pickupMitraName: pickupMode === 'mitra' ? eligiblePickupMitras.find((mitra) => mitra.id === pickupMitraId)?.fullName : undefined,
          customer: {
            name: customerInfo.name || 'ग्राहक',
            phone: customerInfo.phone || phone,
            email: customerInfo.email || '',
            address: customerInfo.address || '',
            pincode: customerInfo.pincode || ''
          },
          items: [...cart],
          totalKg: cart.reduce((acc, i) => acc + (i.variantKg || 0) * (i.quantity || 0), 0),
          subtotalAmount: cartSubtotal,
          discountCode: appliedCoupon ? appliedCoupon.code : undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          totalAmount: finalPayableAmount,
          paymentMethod: 'online',
          paymentStatus: 'paid',
          status: 'confirmed',
          pickupDate: selectedPickupDate || activeFestival?.distributionStartDate || '15-10-2026',
          deliveryOtp: pendingOrderId.replace(/\D/g, '').slice(-4) || '4471',
          createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        }}
        onSuccess={handleZohoPaymentSuccess}
      />
    </div>
  );
};

/* Sweet Card Subcomponent with City & Center Pickup Location Linking */
const SweetCard: React.FC<{
  sweet: any;
  cityName?: string;
  linkedCenter?: any;
  pricePerKg: number;
  onAddToCart: (variantLabel: string, variantKg: number, unitPrice: number) => void;
}> = ({ sweet, cityName, linkedCenter, pricePerKg, onAddToCart }) => {
  const { language } = useApp();
  const images = sweet?.images && sweet.images.length > 0 ? sweet.images : [sweet.imageUrl];
  const [activeImage, setActiveImage] = useState(images[0] || sweet.imageUrl);
  const [showCenterDetail, setShowCenterDetail] = useState(false);

  const variants = sweet?.variants && sweet.variants.length > 0
    ? sweet.variants
    : [{ label: '1kg', weightInKg: 1 }];
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);

  const currentVariant = selectedVariant || variants[0] || { label: '1kg', weightInKg: 1 };
  const calculatedUnitPrice = currentVariant.price !== undefined
    ? currentVariant.price
    : Math.round(pricePerKg * (currentVariant.weightInKg || 1));

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-200 hover:border-orange-500 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between group/card">
      {/* Image & Badges */}
      <div className="relative h-44 bg-slate-100 overflow-hidden group">
        <CachedImage
          src={activeImage}
          alt={language === 'hi' ? sweet.nameHi : sweet.nameEn}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <div className="bg-emerald-800/90 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shadow">
            <span>{language === 'hi' ? '● 100% शुद्ध देशी घी' : '● 100% Pure Desi Ghee'}</span>
          </div>
          {cityName && (
            <div className="bg-amber-950/85 backdrop-blur-xs text-amber-300 text-[9.5px] font-bold px-2 py-0.5 rounded-md border border-amber-400/40 shadow">
              🌟 {cityName} {language === 'hi' ? 'विशेष' : 'Special'}
            </div>
          )}
        </div>

        {sweet.discountPercent ? (
          <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold shadow animate-bounce z-10">
            {sweet.discountPercent}% {language === 'hi' ? 'छूट' : 'off'}
          </div>
        ) : null}

        {/* Multiple Image Thumbnails overlay */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 bg-black/50 backdrop-blur-xs py-1 px-2 rounded-lg z-10">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-6 h-6 rounded border transition-all overflow-hidden cursor-pointer ${
                  activeImage === img ? 'border-amber-400 ring-1 ring-amber-400 scale-110' : 'border-white/60 opacity-70 hover:opacity-100'
                }`}
              >
                <CachedImage src={img} alt="thumb" className="w-full h-full object-cover" showSkeleton={false} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sweet Info */}
      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug group-hover/card:text-orange-950">
                      {language === 'hi' ? sweet.nameHi : sweet.nameEn}
            </h4>
            {sweet.shelfLifeDays && (
              <span className="text-[9.5px] font-mono text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-md shrink-0 font-bold border border-amber-200">
                {sweet.shelfLifeDays} {language === 'hi' ? 'दिन' : 'days'}
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
            {language === 'hi' ? sweet.descriptionHi : sweet.descriptionEn}
          </p>

          {/* Linked Pickup Center Badge */}
          {linkedCenter && (
            <div className="mt-2.5 pt-2 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setShowCenterDetail(!showCenterDetail)}
                className="w-full text-left bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-xl p-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Store className="w-3.5 h-3.5 text-orange-700 shrink-0" />
                    <span className="truncate">
                      {language === 'hi' ? 'संग्रह केंद्र:' : 'Pickup Center:'} {language === 'hi' ? linkedCenter.nameHi : linkedCenter.nameEn}
                    </span>
                  </div>
                  <span className="text-[9.5px] text-orange-800 underline shrink-0">
                    {showCenterDetail ? (language === 'hi' ? 'बंद करें' : 'Close') : (language === 'hi' ? 'विवरण' : 'Details')}
                  </span>
                </div>

                {showCenterDetail && (
                  <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 text-[10.5px] text-slate-600 space-y-0.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                            <span>{language === 'hi' ? linkedCenter.addressHi : linkedCenter.addressEn}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3 text-orange-600 shrink-0" />
                      <span>{language === 'hi' ? 'समय:' : 'Hours:'} {linkedCenter.timing}</span>
                    </div>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">
              {variants.length > 1 ? 'वज़न चुनें:' : 'पैकिंग:'}
            </span>
            <span className="font-mono text-xs font-black text-orange-800">
              ₹{pricePerKg} / kg
            </span>
          </div>

          {/* Variant Selector chips */}
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v: any) => (
              <button
                key={v.label}
                onClick={() => setSelectedVariant(v)}
                className={`px-2.5 py-1 min-h-[30px] rounded-lg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                  currentVariant.label === v.label
                    ? 'bg-orange-700 text-white shadow-xs border border-orange-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-900 border border-slate-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1.5">
            <div>
              <div className="font-mono font-black text-lg text-blue-950">
                ₹{calculatedUnitPrice}
              </div>
              {sweet.discountPercent ? (
                <div className="text-[10px] font-mono text-slate-400 line-through">
                  ₹{Math.round(calculatedUnitPrice * (1 + sweet.discountPercent / 100))}
                </div>
              ) : null}
            </div>

            <button
              onClick={() => onAddToCart(currentVariant.label, currentVariant.weightInKg || 1, calculatedUnitPrice)}
              className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-black px-3.5 py-2 min-h-[38px] rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation"
            >
              <Plus className="w-4 h-4" />
              <span>कार्ट में जोड़ें</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
