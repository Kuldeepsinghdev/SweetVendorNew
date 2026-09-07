/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DiscountCoupon } from '../types';
import {
  Tag,
  CheckCircle2,
  XCircle,
  Percent,
  IndianRupee,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Store,
  Info
} from 'lucide-react';

interface CheckoutDiscountSectionProps {
  cityId: string;
  centerId: string;
  cartSubtotal: number;
  appliedCoupon: DiscountCoupon | null;
  discountAmount: number;
  onApplyCoupon: (coupon: DiscountCoupon, discount: number) => void;
  onRemoveCoupon: () => void;
}

export const CheckoutDiscountSection: React.FC<CheckoutDiscountSectionProps> = ({
  cityId,
  centerId,
  cartSubtotal,
  appliedCoupon,
  discountAmount,
  onApplyCoupon,
  onRemoveCoupon
}) => {
  const { language, discounts, validateCoupon } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAvailableOffers, setShowAvailableOffers] = useState<boolean>(true);

  // Filter valid coupons for this city & center
  const availableCoupons = discounts.filter((d) => {
    if (!d.isActive) return false;
    if (d.cityId !== 'all' && d.cityId !== cityId) return false;
    if (d.centerId && d.centerId !== 'all' && d.centerId !== centerId) return false;
    if (d.expiryDate && new Date().toISOString().split('T')[0] > d.expiryDate) return false;
    if (d.usageLimit && (d.timesUsed || 0) >= d.usageLimit) return false;
    return true;
  });

  const handleApply = (codeToApply: string) => {
    setErrorMessage(null);
    const cleanCode = codeToApply.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage(
        language === 'hi'
          ? 'कृपया कूपन कोड दर्ज करें।'
          : 'Please enter a coupon code.'
      );
      return;
    }

    const result = validateCoupon(cleanCode, cartSubtotal, cityId, centerId);
    if (!result.valid || !result.coupon) {
      setErrorMessage(result.message);
      return;
    }

    onApplyCoupon(result.coupon, result.discountAmount);
    setInputCode('');
    setErrorMessage(null);
  };

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-amber-300 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black">
            <Tag className="w-4 h-4 text-amber-800" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              {language === 'hi' ? 'कूपन व विशेष छूट (Discount & Offers)' : 'Coupons & Discounts'}
            </h4>
            <span className="text-[10px] text-slate-500">
              {language === 'hi'
                ? 'त्योहारी छूट पाने के लिए अपना प्रोमो कोड लागू करें'
                : 'Apply a promo code to avail discounts'}
            </span>
          </div>
        </div>

        {availableCoupons.length > 0 && !appliedCoupon && (
          <button
            type="button"
            onClick={() => setShowAvailableOffers(!showAvailableOffers)}
            className="text-[11px] font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
          >
            <span>{availableCoupons.length} {language === 'hi' ? 'ऑफ़र उपलब्ध' : 'offers available'}</span>
            {showAvailableOffers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Applied Coupon Banner */}
      {appliedCoupon ? (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 p-3 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-emerald-950 text-xs sm:text-sm tracking-wider bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                  {appliedCoupon.code}
                </span>
                <span className="text-[11px] font-bold text-emerald-900">
                  {language === 'hi' ? `🎉 ₹${discountAmount} की छूट लागू हो गई!` : `🎉 ₹${discountAmount} discount applied!`}
                </span>
              </div>
              <p className="text-[10.5px] text-emerald-800/90 truncate mt-0.5">
                {language === 'hi'
                  ? `${appliedCoupon.titleHi} (${appliedCoupon.descriptionHi || 'विशेष सहकार छूट'})`
                  : `${appliedCoupon.titleEn} (${appliedCoupon.descriptionEn || 'Special cooperative discount'})`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRemoveCoupon}
            className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-100 rounded-lg border border-rose-300 transition-colors shrink-0 cursor-pointer"
          >
            {language === 'hi' ? 'हटाएं' : 'Remove'}
          </button>
        </div>
      ) : (
        /* Coupon Input Box */
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                  setErrorMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApply(inputCode);
                  }
                }}
                placeholder={language === 'hi' ? 'कूपन कोड दर्ज करें (उदा. SAHAKAR50)' : 'Enter promo code (e.g. SAHAKAR50)'}
                className="w-full p-2.5 pl-8 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white"
              />
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => handleApply(inputCode)}
              disabled={!inputCode.trim()}
              className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black text-xs rounded-lg shadow transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              {language === 'hi' ? 'लागू करें' : 'Apply'}
            </button>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-lg text-xs flex items-center gap-1.5 animate-in fade-in">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Available Coupon Offers Drawer */}
      {!appliedCoupon && showAvailableOffers && availableCoupons.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-950">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'hi' ? 'उपलब्ध विशेष कूपन (क्लिक कर सीधे लागू करें):' : 'Available Offers:'}</span>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
            {availableCoupons.map((coupon) => {
              const meetsMinOrder = cartSubtotal >= coupon.minOrderAmount;
              const shortAmount = coupon.minOrderAmount - cartSubtotal;

              return (
                <div
                  key={coupon.id}
                  className={`p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between gap-2.5 ${
                    meetsMinOrder
                      ? 'bg-amber-50/70 border-amber-300 hover:border-amber-500'
                      : 'bg-slate-50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-950 text-xs px-2 py-0.5 bg-white rounded border border-amber-300 shadow-2xs">
                        {coupon.code}
                      </span>
                      <span className="font-bold text-slate-800 truncate">
                        {language === 'hi' ? coupon.titleHi : coupon.titleEn}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      {coupon.discountType === 'flat' ? (
                        <span className="font-semibold text-emerald-800">
                          {language === 'hi' ? `₹${coupon.discountValue} की सीधी छूट` : `₹${coupon.discountValue} off`}
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-800">
                          {language === 'hi'
                            ? `${coupon.discountValue}% छूट ${coupon.maxDiscountAmount ? `(अधिकतम ₹${coupon.maxDiscountAmount})` : ''}`
                            : `${coupon.discountValue}% off ${coupon.maxDiscountAmount ? `(maximum ₹${coupon.maxDiscountAmount})` : ''}`}
                        </span>
                      )}
                      {coupon.minOrderAmount > 0 && (
                        <span className="text-slate-500 ml-1.5">
                          • {language === 'hi' ? 'न्यूनतम ऑर्डर' : 'Minimum order'}: ₹{coupon.minOrderAmount}
                        </span>
                      )}
                    </div>

                    {!meetsMinOrder && (
                      <div className="text-[10px] text-amber-800 font-medium flex items-center gap-1">
                        <Info className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{language === 'hi' ? `लागू करने हेतु ₹${shortAmount} का सामान और जोड़ें` : `Add ₹${shortAmount} more to apply`}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApply(coupon.code)}
                    className={`px-3 py-1.5 rounded-lg font-black text-[11px] shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer ${
                      meetsMinOrder
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {language === 'hi' ? 'लागू करें' : 'Apply'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
