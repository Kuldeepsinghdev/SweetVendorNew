/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking } from '../types';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal';
import { PrintReceiptModal } from '../components/PrintReceiptModal';
import { BookedVsDeliveredChart } from '../components/BookedVsDeliveredChart';
import { AdminHeaderNav } from '../components/AdminHeaderNav';
import { AdminAuthGuard } from '../components/AdminAuthGuard';
import { getDatesBetween } from '../utils/dateUtils';
import {
  Store,
  Search,
  CheckCircle2,
  FileText,
  DollarSign,
  QrCode,
  Users,
  Calendar,
  AlertCircle,
  Clock,
  Printer,
  Send
} from 'lucide-react';

export const KendraFlowView: React.FC = () => {
  const {
    language,
    activeCity,
    saleCenters,
    activeCenterId,
    setActiveCenterId,
    bookings,
    deliverBooking,
    activeFestival
  } = useApp();

  // Selected center for active city
  const cityCenters = (saleCenters || []).filter((c) => !activeCity?.id || c.cityId === activeCity.id);
  const currentCenter = cityCenters.find((c) => c.id === activeCenterId) || cityCenters[0] || saleCenters[0];

  // Tab state: 'summary' (K-01) | 'orders' (K-02) | 'delivery' (K-03) | 'ledger' (K-05)
  const [activeTab, setActiveTab] = useState<'summary' | 'orders' | 'delivery' | 'ledger'>('summary');

  // Delivery lookup & OTP form state
  const [lookupQuery, setLookupQuery] = useState('9462919288');
  const [selectedBookingForDelivery, setSelectedBookingForDelivery] = useState<Booking | null>(
    bookings.find((b) => b.centerId === currentCenter?.id && b.status === 'confirmed') || null
  );
  const [enteredOtp, setEnteredOtp] = useState('');
  const [deliveryResultMsg, setDeliveryResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Invoice modal state
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);

  // Search filter in Orders tab
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'mitra' | 'direct' | 'udhar'>('all');

  // Bookings for this center
  const centerBookings = bookings.filter((b) => b.centerId === currentCenter?.id);

  // K-01 Sweet-wise demand calculation (Halwai / Production Planning)
  const sweetDemandMap: { [sweetId: string]: { nameHi: string; nameEn: string; totalKg: number; totalAmount: number } } = {};
  centerBookings.forEach((b) => {
    b.items.forEach((item) => {
      if (!sweetDemandMap[item.sweetId]) {
        sweetDemandMap[item.sweetId] = {
          nameHi: item.sweetNameHi,
          nameEn: item.sweetNameEn,
          totalKg: 0,
          totalAmount: 0
        };
      }
      sweetDemandMap[item.sweetId].totalKg += item.variantKg * item.quantity;
      sweetDemandMap[item.sweetId].totalAmount += item.totalAmount;
    });
  });

  // Date-wise demand split dynamically calculated for active festival distribution window
  const activeFestivalDates = activeFestival ? getDatesBetween(activeFestival.distributionStartDate, activeFestival.distributionEndDate) : [];
  const dateDemandMap: { [date: string]: number } = {};
  activeFestivalDates.forEach((d) => {
    dateDemandMap[d.date] = 0;
  });

  centerBookings.forEach((b) => {
    if (dateDemandMap[b.pickupDate] !== undefined) {
      dateDemandMap[b.pickupDate] += b.totalKg;
    } else {
      dateDemandMap[b.pickupDate] = b.totalKg;
    }
  });

  // K-05 Mitra-wise ledger calculation
  const mitraLedgerMap: {
    [mitraId: string]: { mitraName: string; bookingsCount: number; totalOutstanding: number; totalValue: number };
  } = {};
  centerBookings
    .filter((b) => b.bookedByRole === 'mitra' && b.mitraId)
    .forEach((b) => {
      const mId = b.mitraId!;
      if (!mitraLedgerMap[mId]) {
        mitraLedgerMap[mId] = {
          mitraName: b.mitraName || (language === 'hi' ? 'सहकार मित्र' : 'Sahakar Mitra'),
          bookingsCount: 0,
          totalOutstanding: 0,
          totalValue: 0
        };
      }
      mitraLedgerMap[mId].bookingsCount += 1;
      mitraLedgerMap[mId].totalValue += b.totalAmount;
      if (b.paymentMethod === 'udhar' && b.paymentStatus === 'udhar_outstanding') {
        mitraLedgerMap[mId].totalOutstanding += b.totalAmount;
      }
    });

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForDelivery) return;

    const res = deliverBooking(selectedBookingForDelivery.id, enteredOtp);
    if (res.success) {
      setDeliveryResultMsg({ success: true, text: language === 'hi' ? 'OTP सत्यापित! डिलीवरी पूर्ण एवं इनवॉइस जारी।' : 'OTP verified! Delivery completed and invoice issued.' });
      setInvoiceBooking(selectedBookingForDelivery);
      setEnteredOtp('');
    } else {
      setDeliveryResultMsg({ success: false, text: res.message });
    }
  };

  return (
    <AdminAuthGuard requiredRole="kendra">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Admin Navigation */}
        <AdminHeaderNav currentRole="kendra" />

      {/* Role Identity Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 text-white p-4 rounded-xl shadow-md border-b-4 border-purple-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-300 text-purple-950 font-black flex items-center justify-center text-base shadow-sm border-2 border-white shrink-0">
            केंद्र
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                {language === 'hi' ? 'बिक्री केंद्र (Kendra) प्रबंधन' : 'Sale Center Management'}
              </h2>
              <span className="bg-purple-300 text-purple-950 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                {language === 'hi' ? activeCity?.nameHi || '' : activeCity?.nameEn || ''}
              </span>
            </div>
            <p className="text-xs text-purple-100/90 mt-0.5">
              {language === 'hi'
                ? 'प्राप्त बुकिंग्स का स्टॉक आवंटन, तिथि-वार मांग एवं ग्राहक डिलीवरी इनवॉइस।'
                : 'Manage center stock dispatches & customer pickup invoices.'}
            </p>
          </div>
        </div>
      </div>

      {/* Center Switcher Header */}
      <div className="bg-purple-950 text-white p-4 rounded-lg shadow-md border border-purple-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-purple-300" />
            <h3 className="font-black text-lg text-white">{language === 'hi' ? currentCenter?.nameHi || '' : currentCenter?.nameEn || ''}</h3>
            <span className="bg-purple-800 text-purple-200 text-xs font-mono px-2 py-0.5 rounded border border-purple-600">
              {currentCenter?.type === 'standalone'
                ? language === 'hi' ? 'स्वतंत्र केंद्र' : 'Standalone Center'
                : language === 'hi' ? 'सहकार मित्र केंद्र' : 'Sahakar Mitra Center'}
            </span>
          </div>
          <p className="text-xs text-purple-200/80 mt-0.5">{language === 'hi' ? currentCenter?.addressHi || '' : currentCenter?.addressEn || ''}</p>
        </div>

        {/* Kendra Selector */}
        <select
          value={currentCenter?.id || activeCenterId}
          onChange={(e) => setActiveCenterId(e.target.value)}
          className="bg-purple-900 border border-purple-700 text-xs font-bold text-white p-2 rounded focus:outline-none cursor-pointer"
        >
          {cityCenters.map((c) => (
            <option key={c.id} value={c.id}>
              {language === 'hi' ? c.nameHi : c.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200 text-xs font-bold shadow-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'summary' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:bg-purple-50'
          }`}
        >
          {language === 'hi' ? '1. मांग सारांश (K-01)' : 'Demand Summary'}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'orders' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:bg-purple-50'
          }`}
        >
          {language === 'hi' ? '2. बुकिंग सूची (K-02)' : 'Bookings List'}
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'delivery' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:bg-purple-50'
          }`}
        >
          {language === 'hi' ? '3. OTP डिलीवरी (K-03)' : 'OTP Handover'}
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'ledger' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:bg-purple-50'
          }`}
        >
          {language === 'hi' ? '4. मित्र हिसाब (K-05)' : 'Mitra Ledger'}
        </button>
      </div>

      {/* K-01 Demand Summary (Production Planning for Halwai) */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-purple-200 text-center space-y-1 shadow-xs">
              <div className="text-xl sm:text-2xl font-black font-mono text-purple-950">{centerBookings.length}</div>
              <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
                {language === 'hi' ? 'कुल बुकिंग' : 'Bookings'}
              </span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-purple-200 text-center space-y-1 shadow-xs">
              <div className="text-xl sm:text-2xl font-black font-mono text-purple-950">
                {(centerBookings || []).reduce((s, b) => s + (b.totalKg || 0), 0).toFixed(1)} kg
              </div>
              <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
                {language === 'hi' ? 'कुल मांग (Kg)' : 'Total Kg'}
              </span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-purple-200 text-center space-y-1 shadow-xs">
              <div className="text-xl sm:text-2xl font-black font-mono text-purple-950">
                ₹{centerBookings.reduce((s, b) => s + b.totalAmount, 0)}
              </div>
              <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
                {language === 'hi' ? 'कुल मूल्य' : 'Total Value'}
              </span>
            </div>
          </div>

          {/* Booked vs Delivered Chart for this center */}
          <BookedVsDeliveredChart
            scope="center"
            centerId={currentCenter?.id}
            title={language === 'hi' ? `${currentCenter?.nameHi || 'केंद्र'}: मिठाई बुक बनाम वितरण चार्ट` : `${currentCenter?.nameEn || 'Center'}: Sweets Booked vs. Delivered`}
            subtitle={language === 'hi' ? 'इस केंद्र पर दर्ज बुकिंग एवं ग्राहकों को सफलतापूर्वक डिलीवरी प्रगति' : 'Delivery progress for sweets ordered at this center'}
            height={280}
          />

          {/* Sweet-wise Demand Table */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-purple-200 space-y-3 shadow-xs">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {language === 'hi' ? 'मिठाई-वार कुल मांग (हलवाई हेतु उत्पादन योजना)' : 'Sweet-wise Demand Summary'}
                </h4>
                <p className="text-xs text-slate-500">
                  यह आँकड़ा प्री-बुकिंग कट-ऑफ़ के आधार पर उत्पादन/आपूर्ति तय करता है।
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-bold text-slate-700 flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF/प्रिंट</span>
              </button>
            </div>

            <div className="border border-purple-200 rounded overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[360px]">
                <thead className="bg-purple-100 text-purple-950 font-mono text-[11px] uppercase border-b border-purple-200 font-bold">
                  <tr>
                    <th className="p-2.5">मिठाई का नाम</th>
                    <th className="p-2.5 text-center">आवश्यक मात्रा (Kg)</th>
                    <th className="p-2.5 text-right">अनुमानित मूल्य (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.keys(sweetDemandMap).map((sId) => {
                    const item = sweetDemandMap[sId];
                    return (
                      <tr key={sId} className="hover:bg-purple-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{language === 'hi' ? item.nameHi : item.nameEn || item.nameHi}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-purple-900 text-sm">
                          {(item?.totalKg || 0).toFixed(1)} kg
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                          ₹{item.totalAmount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Date-wise Demand Split Table */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-purple-200 space-y-3 shadow-xs">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-700" />
                <span>{language === 'hi' ? 'तिथि-वार वितरण मांग विभाजन (Collection Schedule)' : 'Date-wise Pickup Split'}</span>
              </h4>
              <span className="text-xs text-purple-900 font-mono font-bold bg-purple-50 border border-purple-200 px-2.5 py-1 rounded">
                {activeFestival.distributionStartDate} से {activeFestival.distributionEndDate}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-xs font-mono">
              {activeFestivalDates.map((d) => (
                <div key={d.date} className="p-2.5 bg-purple-50/80 rounded-lg border border-purple-200 flex flex-col justify-between">
                  <span className="text-slate-700 block text-[11px] font-bold">{d.labelHi} ({d.dayHi.slice(0, 3)})</span>
                  <b className="text-sm sm:text-base font-black text-purple-950 mt-1">
                    {(dateDemandMap[d.date] || 0).toFixed(1)} kg
                  </b>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* K-02 Order Lookup & List */}
      {activeTab === 'orders' && (
        <div className="bg-white p-5 rounded-lg border border-purple-200 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {language === 'hi' ? 'केंद्र बुकिंग सूची (K-02)' : 'Bookings List'}
              </h3>
              <p className="text-xs text-slate-500">
                ग्राहक व मित्र द्वारा दर्ज सभी बुकिंग।
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1 text-xs">
              {(['all', 'mitra', 'direct', 'udhar'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  className={`px-3 py-1 rounded font-medium ${
                    orderFilter === f ? 'bg-purple-900 text-white font-bold' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {f === 'all' ? 'सभी' : f === 'mitra' ? 'सहकार मित्र' : f === 'direct' ? 'प्रत्यक्ष' : 'उधार'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {centerBookings
              .filter((b) => {
                if (orderFilter === 'mitra') return b.bookedByRole === 'mitra';
                if (orderFilter === 'direct') return b.bookedByRole === 'customer';
                if (orderFilter === 'udhar') return b.paymentMethod === 'udhar';
                return true;
              })
              .map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded border border-slate-200 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{b.id}</span>
                      <span className="font-bold text-slate-800">{b.customer?.name || ''}</span>
                      <span className="font-mono text-slate-500">({b.customer?.phone || ''})</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          b.bookedByRole === 'mitra' ? 'bg-amber-100 text-amber-900' : 'bg-cyan-100 text-cyan-900'
                        }`}
                      >
                        {b.bookedByRole === 'mitra' ? `मित्र: ${b.mitraName}` : 'प्रत्यक्ष ग्राहक'}
                      </span>
                    </div>

                    <p className="text-slate-600 mt-1">
                      {(b?.items || []).map((i) => `${language === 'hi' ? i.sweetNameHi : i.sweetNameEn} (${i.variantLabel} x ${i.quantity})`).join(', ')}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span>वितरण तिथि: {b.pickupDate}</span>
                      <span>डिलीवरी OTP: <b className="font-mono text-purple-900">{b.deliveryOtp}</b></span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-mono font-bold text-sm text-purple-950">₹{b.totalAmount}</div>
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => {
                          setSelectedBookingForDelivery(b);
                          setActiveTab('delivery');
                        }}
                        className="px-2.5 py-1 bg-purple-900 text-white rounded font-bold text-[11px]"
                      >
                        सौंपें (Deliver)
                      </button>
                      {b.invoiceId && (
                        <button
                          onClick={() => setInvoiceBooking(b)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold text-[11px]"
                        >
                          इनवॉइस
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* K-03 Delivery OTP Verification */}
      {activeTab === 'delivery' && (
        <div className="bg-white p-6 rounded-lg border border-purple-200 shadow-md max-w-lg mx-auto space-y-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              {language === 'hi' ? 'मिठाई डिलीवरी — OTP सत्यापन (K-03)' : 'Delivery Handover & OTP'}
            </h3>
            <p className="text-xs text-slate-500">
              ग्राहक के मोबाइल पर भेजा गया 4-अंकीय OTP दर्ज करें और मिठाई सौंपें।
            </p>
          </div>

          {/* Phone lookup */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'hi' ? 'ग्राहक का मोबाइल नंबर / बुकिंग ID' : 'Mobile / Booking ID'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="9829098245"
                className="flex-1 p-2 border border-slate-300 rounded text-xs font-mono font-bold"
              />
              <button
                onClick={() => {
                  const found = centerBookings.find(
                    (b) => b.customer?.phone?.includes(lookupQuery) || b.id.includes(lookupQuery)
                  );
                  if (found) setSelectedBookingForDelivery(found);
                }}
                className="px-3 py-2 bg-purple-900 text-white font-bold rounded text-xs"
              >
                खोजें
              </button>
            </div>
          </div>

          {/* Selected Booking Box */}
          {selectedBookingForDelivery && (
            <div className="p-4 bg-purple-50 rounded border border-purple-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="font-mono text-purple-950">{selectedBookingForDelivery.id}</span>
                <span className="text-slate-800">{selectedBookingForDelivery.customer?.name || ''}</span>
              </div>

              <div className="text-slate-600">
                {(selectedBookingForDelivery?.items || []).map((i) => `${language === 'hi' ? i.sweetNameHi : i.sweetNameEn} (${i.variantLabel} x ${i.quantity})`).join(', ')}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                <div>
                  <span className="text-slate-500 block">कुल देय बकाया:</span>
                  <span className="font-mono font-black text-sm text-purple-900">
                    ₹{selectedBookingForDelivery.totalAmount} ({selectedBookingForDelivery.paymentMethod})
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold ${
                    selectedBookingForDelivery.status === 'delivered'
                      ? 'bg-emerald-200 text-emerald-950'
                      : 'bg-amber-200 text-amber-950'
                  }`}
                >
                  {selectedBookingForDelivery.status === 'delivered' ? 'वितरित ✓' : 'प्रतीक्षित'}
                </span>
              </div>
            </div>
          )}

          {/* OTP Verification Form */}
          {selectedBookingForDelivery && selectedBookingForDelivery.status !== 'delivered' && (
            <form onSubmit={handleDeliverySubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ग्राहक द्वारा प्राप्त 4-अंकीय डिलीवरी OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder={`डेमो OTP: ${selectedBookingForDelivery.deliveryOtp}`}
                  className="w-full p-2.5 border-2 border-purple-300 rounded font-mono font-black text-center text-lg focus:outline-none focus:border-purple-800"
                />
              </div>

              {deliveryResultMsg && (
                <div
                  className={`p-2 rounded text-xs font-bold text-center ${
                    deliveryResultMsg.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  {deliveryResultMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded text-xs shadow-md transition-colors"
              >
                OTP सत्यापन एवं डिलीवरी पूर्ण करें (जारी करें टैक्स इनवॉइस) →
              </button>
            </form>
          )}
        </div>
      )}

      {/* K-05 Mitra Dues / Bayaaka Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white p-5 rounded-lg border border-purple-200 space-y-4 shadow-xs">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              {language === 'hi' ? 'मित्र-वार उधार एवं वसूली हिसाब (K-05)' : 'Mitra Dues Ledger'}
            </h3>
            <p className="text-xs text-slate-500">
              प्रत्येक सहकार मित्र द्वारा दर्ज उधार बुकिंग एवं बकाया वसूली का हिसाब।
            </p>
          </div>

          <div className="border border-purple-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-100 text-purple-950 font-mono text-[11px] uppercase border-b border-purple-200 font-bold">
                <tr>
                  <th className="p-2.5">सहकार मित्र</th>
                  <th className="p-2.5 text-center">बुकिंग संख्या</th>
                  <th className="p-2.5 text-right">कुल व्यवसाय</th>
                  <th className="p-2.5 text-right">उधार बकाया</th>
                  <th className="p-2.5 text-center">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(mitraLedgerMap).map((mId) => {
                  const m = mitraLedgerMap[mId];
                  return (
                    <tr key={mId} className="hover:bg-purple-50/50">
                      <td className="p-2.5 font-bold text-slate-800">{m.mitraName} ({mId})</td>
                      <td className="p-2.5 text-center font-mono font-bold">{m.bookingsCount}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">₹{m.totalValue}</td>
                      <td className="p-2.5 text-right font-mono font-black text-amber-900">₹{m.totalOutstanding}</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => alert(`SMS याददाश्त ${m.mitraName} को भेजी गई!`)}
                          className="px-2.5 py-1 bg-amber-800 text-white rounded text-[10.5px] font-bold flex items-center justify-center gap-1 mx-auto"
                        >
                          <Send className="w-3 h-3" />
                          <span>याद दिलाएँ (SMS)</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Tax Invoice Modal */}
      {invoiceBooking && (
        <PrintInvoiceModal
          booking={invoiceBooking}
          onClose={() => setInvoiceBooking(null)}
        />
      )}
      </div>
    </AdminAuthGuard>
  );
};
