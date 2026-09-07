/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DiscountCoupon } from '../types';
import {
  Tag,
  Plus,
  Percent,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Calendar,
  Store,
  Trash2,
  Edit3,
  Copy,
  Check,
  Sparkles,
  Info,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

interface CityDiscountManagerProps {
  cityId: string;
}

export const CityDiscountManager: React.FC<CityDiscountManagerProps> = ({ cityId }) => {
  const {
    language,
    activeCity,
    saleCenters,
    discounts,
    createDiscount,
    updateDiscount,
    deleteDiscount
  } = useApp();

  const cityCenters = saleCenters.filter((c) => c.cityId === cityId);

  // Filter discounts applicable to this city or 'all'
  const relevantDiscounts = discounts.filter(
    (d) => d.cityId === 'all' || d.cityId === cityId
  );

  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionHi, setDescriptionHi] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(50);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(500);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(150);
  const [selectedCenterId, setSelectedCenterId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>('2026-11-30');
  const [usageLimit, setUsageLimit] = useState<number | undefined>(200);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Reset form
  const resetForm = () => {
    setCode('');
    setTitleHi('');
    setTitleEn('');
    setDescriptionHi('');
    setDiscountType('flat');
    setDiscountValue(50);
    setMinOrderAmount(500);
    setMaxDiscountAmount(150);
    setSelectedCenterId('all');
    setStartDate(new Date().toISOString().split('T')[0]);
    setExpiryDate('2026-11-30');
    setUsageLimit(200);
    setIsActive(true);
    setFormError(null);
    setEditingDiscountId(null);
  };

  // Populate form with preset templates
  const applyTemplate = (type: 'flat50' | 'percent10' | 'bulk150') => {
    setShowCreateForm(true);
    setEditingDiscountId(null);
    if (type === 'flat50') {
      setCode(`FESTIVE${Math.floor(10 + Math.random() * 90)}`);
      setTitleHi('त्योहारी विशेष ₹50 छूट');
      setTitleEn('Festive Special ₹50 Off');
      setDescriptionHi('₹500 या अधिक की मिठाई बुकिंग पर ₹50 की सीधी छूट');
      setDiscountType('flat');
      setDiscountValue(50);
      setMinOrderAmount(500);
      setMaxDiscountAmount(undefined);
    } else if (type === 'percent10') {
      setCode(`UTSAV${Math.floor(10 + Math.random() * 90)}`);
      setTitleHi('उत्सव 10% विशेष छूट');
      setTitleEn('Utsav 10% Special Off');
      setDescriptionHi('₹800 से अधिक की बुकिंग पर 10% की छूट (अधिकतम ₹150)');
      setDiscountType('percentage');
      setDiscountValue(10);
      setMinOrderAmount(800);
      setMaxDiscountAmount(150);
    } else {
      setCode(`BULK${Math.floor(10 + Math.random() * 90)}`);
      setTitleHi('महा बचत ₹150 छूट');
      setTitleEn('Mega Saver ₹150 Off');
      setDescriptionHi('₹1500 या अधिक के बड़े ऑर्डर पर ₹150 की विशेष छूट');
      setDiscountType('flat');
      setDiscountValue(150);
      setMinOrderAmount(1500);
      setMaxDiscountAmount(undefined);
    }
  };

  // Edit existing discount
  const startEdit = (discount: DiscountCoupon) => {
    setEditingDiscountId(discount.id);
    setCode(discount.code);
    setTitleHi(discount.titleHi);
    setTitleEn(discount.titleEn);
    setDescriptionHi(discount.descriptionHi || '');
    setDiscountType(discount.discountType);
    setDiscountValue(discount.discountValue);
    setMinOrderAmount(discount.minOrderAmount);
    setMaxDiscountAmount(discount.maxDiscountAmount);
    setSelectedCenterId(discount.centerId || 'all');
    setStartDate(discount.startDate || '');
    setExpiryDate(discount.expiryDate || '');
    setUsageLimit(discount.usageLimit);
    setIsActive(discount.isActive);
    setShowCreateForm(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // Handle Form Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('कृपया कूपन कोड दर्ज करें (Coupon code required)');
      return;
    }
    if (!titleHi.trim()) {
      setFormError('कृपया कूपन का शीर्षक (हिन्दी) दर्ज करें');
      return;
    }
    if (!discountValue || discountValue <= 0) {
      setFormError('कृपया वैध छूट मूल्य दर्ज करें');
      return;
    }

    if (editingDiscountId) {
      // Update
      await updateDiscount(editingDiscountId, {
        code: cleanCode,
        titleHi: titleHi.trim(),
        titleEn: titleEn.trim() || titleHi.trim(),
        descriptionHi: descriptionHi.trim() || undefined,
        cityId,
        centerId: selectedCenterId,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: discountType === 'percentage' && maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        startDate: startDate || undefined,
        expiryDate: expiryDate || undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        isActive
      });
      setFormSuccess(`कूपन '${cleanCode}' सफलतापूर्वक अद्यतन किया गया!`);
      resetForm();
      setShowCreateForm(false);
    } else {
      // Check duplicate code
      const duplicate = discounts.find((d) => d.code.toUpperCase() === cleanCode);
      if (duplicate) {
        setFormError(`कूपन कोड '${cleanCode}' पहले से मौजूद है। कृपया दूसरा कोड चुनें।`);
        return;
      }

      await createDiscount({
        code: cleanCode,
        titleHi: titleHi.trim(),
        titleEn: titleEn.trim() || titleHi.trim(),
        descriptionHi: descriptionHi.trim() || undefined,
        cityId,
        centerId: selectedCenterId,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: discountType === 'percentage' && maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        startDate: startDate || undefined,
        expiryDate: expiryDate || undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        isActive
      });
      setFormSuccess(`नया कूपन '${cleanCode}' सफलतापूर्वक बनाया गया! अब ग्राहक इसे चेकआउट पर उपयोग कर सकेंगे।`);
      resetForm();
      setShowCreateForm(false);
    }
  };

  const filteredDiscounts = relevantDiscounts.filter((d) => {
    if (filterTab === 'active') return d.isActive;
    if (filterTab === 'inactive') return !d.isActive;
    return true;
  });

  const totalTimesUsed = relevantDiscounts.reduce((sum, d) => sum + (d.timesUsed || 0), 0);
  const activeCouponsCount = relevantDiscounts.filter((d) => d.isActive).length;

  return (
    <div className="space-y-5">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-amber-950 text-white p-4 sm:p-5 rounded-xl border border-amber-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-400/20 text-amber-300 rounded-lg">
                <Tag className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {language === 'hi' ? 'छूट व कूपन प्रबंधन (City Discount Manager)' : 'Discount & Coupon Management'}
              </h3>
            </div>
            <p className="text-xs text-amber-200/90 max-w-xl">
              {language === 'hi'
                ? `शहर एडमिन '${activeCity?.nameHi || 'जयपुर'}' के लिए विशेष डिस्काउंट कोड व त्योहारी कूपन बना सकते हैं। ग्राहक चेकआउट के समय यह कोड दर्ज करके तत्काल छूट प्राप्त कर सकेंगे।`
                : 'Create and manage city-wide or center-specific promo codes for customers to apply at checkout.'}
            </p>
          </div>

          <button
            onClick={() => {
              if (showCreateForm) {
                resetForm();
                setShowCreateForm(false);
              } else {
                setShowCreateForm(true);
              }
            }}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black rounded-lg text-xs shadow transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            {showCreateForm ? (
              <>
                <XCircle className="w-4 h-4" />
                <span>{language === 'hi' ? 'फ़ॉर्म बंद करें' : 'Close Form'}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{language === 'hi' ? '+ नया छूट कूपन बनाएं' : '+ Create New Coupon'}</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-amber-800/80 text-xs">
          <div className="bg-black/20 p-2.5 rounded-lg border border-amber-700/50">
            <span className="text-amber-200/80 block text-[11px]">कुल कूपन (Total)</span>
            <span className="font-mono text-lg font-black text-amber-100">{relevantDiscounts.length}</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-lg border border-amber-700/50">
            <span className="text-amber-200/80 block text-[11px]">सक्रिय कूपन (Active)</span>
            <span className="font-mono text-lg font-black text-emerald-300">{activeCouponsCount}</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-lg border border-amber-700/50">
            <span className="text-amber-200/80 block text-[11px]">कुल उपयोग (Redeemed)</span>
            <span className="font-mono text-lg font-black text-amber-300">{totalTimesUsed} बार</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-lg border border-amber-700/50">
            <span className="text-amber-200/80 block text-[11px]">लागू शहर मंडल</span>
            <span className="font-bold text-xs text-white truncate block">{activeCity?.nameHi || 'जयपुर'}</span>
          </div>
        </div>
      </div>

      {/* Quick Preset Templates Bar */}
      {!showCreateForm && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-950 font-bold">
            <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
            <span>त्वरित कूपन टेम्पलेट्स (Quick Presets):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyTemplate('flat50')}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              🎁 त्योहारी ₹50 छूट (Min ₹500)
            </button>
            <button
              onClick={() => applyTemplate('percent10')}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              🎉 उत्सव 10% छूट (Min ₹800)
            </button>
            <button
              onClick={() => applyTemplate('bulk150')}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              📦 महा बचत ₹150 छूट (Min ₹1500)
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {formSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Create / Edit Coupon Form */}
      {showCreateForm && (
        <div className="bg-white p-5 rounded-xl shadow-md border-2 border-amber-400 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-900 rounded-lg font-black">
                {editingDiscountId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </span>
              <h4 className="font-black text-sm sm:text-base text-slate-900">
                {editingDiscountId
                  ? 'डिस्काउंट कूपन संपादित करें (Edit Coupon)'
                  : 'नया डिस्काउंट कूपन बनाएं (Create New Coupon)'}
              </h4>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateForm(false);
              }}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              रद्द करें (Cancel)
            </button>
          </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-300 text-rose-900 p-2.5 rounded-lg text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Coupon Code */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  कूपन कोड (Promo Code) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="उदा. SAHAKAR50, DIWALI10"
                    className="w-full p-2.5 border border-amber-300 rounded-lg font-mono font-black text-amber-950 bg-amber-50/50 uppercase tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Tag className="w-4 h-4 text-amber-600 absolute right-3 top-3 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-500">ग्राहक यही कोड चेकआउट पर दर्ज करेंगे</span>
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  छूट का प्रकार (Discount Type) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`p-2.5 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      discountType === 'flat'
                        ? 'bg-amber-900 text-white border-amber-950 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>सीधी छूट (₹ Flat)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`p-2.5 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      discountType === 'percentage'
                        ? 'bg-amber-900 text-white border-amber-950 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>प्रतिशत (% Off)</span>
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {discountType === 'flat' ? 'छूट राशि (₹ Flat Amount)' : 'छूट प्रतिशत (% Percentage)'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={discountType === 'percentage' ? 90 : 5000}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    {discountType === 'flat' ? '₹' : '%'}
                  </span>
                </div>
              </div>

              {/* Title (Hindi) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  शीर्षक (हिन्दी में) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={titleHi}
                  onChange={(e) => setTitleHi(e.target.value)}
                  placeholder="उदा. सहकार विशेष छूट"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Title (English) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  शीर्षक (Title in English)
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Sahakar Special Offer"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Minimum Order Value */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  न्यूनतम ऑर्डर राशि (Min Order ₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                </div>
                <span className="text-[10px] text-slate-500">0 का अर्थ बिना किसी न्यूनतम सीमा के</span>
              </div>

              {/* Max Discount Cap (for percentage) */}
              {discountType === 'percentage' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    अधिकतम छूट सीमा (Max Discount Cap ₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      value={maxDiscountAmount || ''}
                      onChange={(e) => setMaxDiscountAmount(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="उदा. 150"
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  </div>
                  <span className="text-[10px] text-slate-500">प्रतिशत छूट की अधिकतम सीमा</span>
                </div>
              )}

              {/* Sale Center Scope */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  लागू बिक्री केंद्र (Sale Center Scope)
                </label>
                <select
                  value={selectedCenterId}
                  onChange={(e) => setSelectedCenterId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">शहर के सभी बिक्री केंद्र (All Centers)</option>
                  {cityCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameHi} ({c.type === 'mitra_kendra' ? 'मित्र केंद्र' : 'सहकार भंडार'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  कुल उपयोग सीमा (Total Usage Limit)
                </label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit || ''}
                  onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="उदा. 200 (खाली छोड़ें असीमित हेतु)"
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-500">इतनी बार कूपन प्रयुक्त होने पर स्वतः बंद होगा</span>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  प्रारंभ तिथि (Start Date)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  समाप्ति तिथि (Expiry Date)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800 text-xs">
                    सक्रिय रखें (Active for Customers)
                  </span>
                </label>
              </div>
            </div>

            {/* Description (Hindi) */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                विवरण / शर्तें (Description & Terms - Hindi)
              </label>
              <input
                type="text"
                value={descriptionHi}
                onChange={(e) => setDescriptionHi(e.target.value)}
                placeholder="उदा. ₹500 या अधिक की मिठाई बुकिंग पर ₹50 की विशेष छूट"
                className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowCreateForm(false);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingDiscountId ? 'कूपन अद्यतन करें' : 'कूपन सहेजें व लागू करें'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-bold shadow-2xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded transition-colors ${
              filterTab === 'all' ? 'bg-amber-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            सभी कूपन ({relevantDiscounts.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded transition-colors ${
              filterTab === 'active' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            सक्रिय ({activeCouponsCount})
          </button>
          <button
            onClick={() => setFilterTab('inactive')}
            className={`px-3 py-1.5 rounded transition-colors ${
              filterTab === 'inactive' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            निष्क्रिय ({relevantDiscounts.length - activeCouponsCount})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          दिखाए जा रहे हैं: {filteredDiscounts.length} कूपन
        </span>
      </div>

      {/* Coupons List Cards */}
      {filteredDiscounts.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
          <Tag className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">कोई डिस्काउंट कूपन नहीं मिला</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            इस फ़िल्टर में कोई कूपन उपलब्ध नहीं है। ऊपर दिए गए बटन से नया कूपन बनाएं।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDiscounts.map((coupon) => {
            const isExpired = coupon.expiryDate ? new Date().toISOString().split('T')[0] > coupon.expiryDate : false;
            const isLimitReached = coupon.usageLimit ? (coupon.timesUsed || 0) >= coupon.usageLimit : false;
            const targetCenter = coupon.centerId && coupon.centerId !== 'all'
              ? saleCenters.find((c) => c.id === coupon.centerId)
              : null;

            return (
              <div
                key={coupon.id}
                className={`p-4 rounded-xl border transition-all relative overflow-hidden bg-white shadow-xs ${
                  !coupon.isActive || isExpired || isLimitReached
                    ? 'border-slate-300 opacity-75'
                    : 'border-amber-300 hover:border-amber-500 hover:shadow-md'
                }`}
              >
                {/* Decorative Dashed Ticket Notches */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-100 border-r border-slate-300" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-100 border-l border-slate-300" />

                <div className="space-y-3">
                  {/* Top Row: Code Pill and Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-100 border border-dashed border-amber-500 px-3 py-1 rounded-md font-mono font-black text-amber-950 text-sm tracking-wider flex items-center gap-1.5 shadow-2xs">
                        <Tag className="w-3.5 h-3.5 text-amber-700" />
                        <span>{coupon.code}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(coupon.code)}
                        className="p-1 text-slate-400 hover:text-amber-800 transition-colors"
                        title="कूपन कोड कॉपी करें"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isExpired ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold border border-rose-200">
                          समाप्त (Expired)
                        </span>
                      ) : isLimitReached ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200">
                          सीमा पूर्ण (Limit Reached)
                        </span>
                      ) : coupon.isActive ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          सक्रिय (Active)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                          बंद (Inactive)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {coupon.titleHi}
                    </h4>
                    {coupon.descriptionHi && (
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {coupon.descriptionHi}
                      </p>
                    )}
                  </div>

                  {/* Offer Details Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1 border-t border-slate-100">
                    <span className="bg-orange-50 text-orange-950 font-bold font-mono px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                      {coupon.discountType === 'flat' ? (
                        <>₹{coupon.discountValue} सीधी छूट</>
                      ) : (
                        <>{coupon.discountValue}% छूट {coupon.maxDiscountAmount ? `(अधिकतम ₹${coupon.maxDiscountAmount})` : ''}</>
                      )}
                    </span>

                    {coupon.minOrderAmount > 0 && (
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                        न्यूनतम ऑर्डर: ₹{coupon.minOrderAmount}
                      </span>
                    )}

                    <span className="bg-blue-50 text-blue-900 font-medium px-2 py-0.5 rounded flex items-center gap-1">
                      <Store className="w-3 h-3 text-blue-700" />
                      <span>{targetCenter ? targetCenter.nameHi : 'सभी बिक्री केंद्र'}</span>
                    </span>
                  </div>

                  {/* Usage & Validity Progress */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-[11px] space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>वैधता: {coupon.expiryDate || 'असीमित'}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {coupon.timesUsed || 0}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''} बार प्रयुक्त
                      </span>
                    </div>

                    {coupon.usageLimit && (
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.round(((coupon.timesUsed || 0) / coupon.usageLimit) * 100))}%`
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => updateDiscount(coupon.id, { isActive: !coupon.isActive })}
                      className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer text-[11px] ${
                        coupon.isActive
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      {coupon.isActive ? 'अस्थायी रोकें (Deactivate)' : 'सक्रिय करें (Activate)'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(coupon)}
                        className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                        title="संपादित करें (Edit)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`क्या आप कूपन '${coupon.code}' को स्थायी रूप से हटाना चाहते हैं?`)) {
                            deleteDiscount(coupon.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="हटाएं (Delete)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
