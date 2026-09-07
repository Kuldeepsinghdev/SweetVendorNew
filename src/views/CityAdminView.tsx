/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CachedImage } from '../components/CachedImage';
import { MasterSweet, SaleCenter, MitraApplication } from '../types';
import { AddSweetModal } from '../components/AddSweetModal';
import { BookedVsDeliveredChart } from '../components/BookedVsDeliveredChart';
import { AdminHeaderNav } from '../components/AdminHeaderNav';
import { AdminAuthGuard } from '../components/AdminAuthGuard';
import { CityDiscountManager } from '../components/CityDiscountManager';
import {
  Building2,
  Users,
  Store,
  Plus,
  CheckCircle2,
  XCircle,
  Edit2,
  Phone,
  MapPin,
  Clock,
  Shield,
  Save,
  Send,
  Tag
} from 'lucide-react';

export const CityAdminView: React.FC = () => {
  const {
    language,
    cities,
    activeCity,
    setActiveCityId,
    mitras,
    approveMitraApplication,
    rejectMitraApplication,
    saleCenters,
    createSaleCenter,
    masterSweets,
    updateCitySweetPrice,
    openOtpModal,
    bookings
  } = useApp();

  // Tab state: 'dashboard' (A-01) | 'applications' (A-02) | 'add_center' (A-03) | 'pricing' (A-04) | 'discounts' (A-05)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'add_center' | 'pricing' | 'discounts'>('dashboard');

  // Rejection modal state
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('स्थान अथवा दूरभाष सत्यापन अपूर्ण');

  // Add Sale Center form state (A-03)
  const [centerNameHi, setCenterNameHi] = useState('');
  const [centerType, setCenterType] = useState<'standalone' | 'mitra_kendra'>('standalone');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [addressHi, setAddressHi] = useState('');
  const [pincode, setPincode] = useState('');
  const [timing, setTiming] = useState('10:00 AM - 8:00 PM');

  // Sweet Price Editor state
  const [editingPriceMap, setEditingPriceMap] = useState<{ [sweetId: string]: number }>({});
  const [isAddSweetModalOpen, setIsAddSweetModalOpen] = useState(false);

  const cityMitras = mitras.filter((m) => m.cityId === activeCity?.id);
  const pendingApps = cityMitras.filter((m) => m.status === 'pending');
  const cityCenters = saleCenters.filter((c) => c.cityId === activeCity?.id);
  const cityBookings = bookings.filter((b) => b.cityId === activeCity?.id);

  const handleApprove = (appId: string) => {
    approveMitraApplication(appId);
    alert(`आवेदन ${appId} स्वीकृत किया गया! आईडी एवं पासवर्ड SMS/ईमेल द्वारा भेज दिया गया।`);
  };

  const handleRejectSubmit = () => {
    if (rejectingAppId && rejectionReason) {
      rejectMitraApplication(rejectingAppId, rejectionReason);
      setRejectingAppId(null);
    }
  };

  const handleAddCenterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerPhone || ownerPhone.length < 10) return;

    openOtpModal(ownerPhone, language === 'hi' ? 'नया बिक्री केंद्र संचालक OTP सत्यापन' : 'New Sale Center Owner OTP Verification', () => {
      createSaleCenter({
        cityId: activeCity?.id || '',
        nameHi: centerNameHi,
        nameEn: centerNameHi,
        type: centerType,
        ownerName,
        ownerPhone,
        ownerEmail,
        addressHi,
        addressEn: addressHi,
        pincode,
        timing,
        isActive: true
      });
      alert(language === 'hi' ? `नया बिक्री केंद्र ${centerNameHi} जोड़ा गया!` : `New sale center ${centerNameHi} added!`);
      setActiveTab('dashboard');
      return true;
    });
  };

  return (
    <AdminAuthGuard requiredRole="city_admin">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Admin Navigation */}
        <AdminHeaderNav currentRole="city_admin" />

      {/* Role Identity Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-emerald-900 text-white p-4 rounded-xl shadow-md border-b-4 border-emerald-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-400 text-emerald-950 font-black flex items-center justify-center text-base shadow-sm border-2 border-white shrink-0">
            {language === 'hi' ? 'नगर' : 'CITY'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                {language === 'hi' ? `नगर एडमिन डैशबोर्ड — ${activeCity?.nameHi || ''}` : `City Admin Dashboard — ${activeCity?.nameEn || ''}`}
              </h2>
              <span className="bg-emerald-400 text-emerald-950 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                {cityCenters.length} {language === 'hi' ? 'बिक्री केंद्र' : 'centers'}
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              {language === 'hi'
                ? 'शहर मांग विश्लेषण, बिक्री केंद्र आवंटन एवं सहकार मित्र साख सीमा प्रबंधन।'
                : 'City demand analytics, center allocation & credit limits.'}
            </p>
          </div>
        </div>
      </div>

      {/* City Admin Header */}
      <div className="bg-emerald-950 text-white p-4 rounded-lg shadow-md border border-emerald-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-300" />
            <h3 className="font-black text-lg text-white">
              {language === 'hi'
                ? `${activeCity?.nameHi || ''} (${activeCity?.stateHi || ''}) — शहर एडमिन पैनल`
                : `${activeCity?.nameEn || ''} (${activeCity?.stateEn || ''}) — City Admin`}
            </h3>
          </div>
          <p className="text-xs text-emerald-200/80">
            {language === 'hi' ? 'एडमिन:' : 'Admin:'} {activeCity?.adminName || ''} | {language === 'hi' ? 'फ़ोन:' : 'Phone:'} {activeCity?.adminPhone || ''}
          </p>
        </div>

        {/* City Picker */}
        <select
          value={activeCity?.id || ''}
          onChange={(e) => setActiveCityId(e.target.value)}
          className="bg-emerald-900 border border-emerald-700 text-xs font-bold text-white p-2 rounded-lg focus:outline-none cursor-pointer"
        >
          {(cities || []).map((c) => (
            <option key={c.id} value={c.id}>
              {language === 'hi' ? c.nameHi : c.nameEn} ({language === 'hi' ? c.stateHi : c.stateEn})
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200 text-xs font-bold shadow-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'dashboard' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          {language === 'hi' ? '1. डैशबोर्ड (A-01)' : 'Dashboard'}
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 relative ${
            activeTab === 'applications' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          {language === 'hi' ? '2. मित्र आवेदन' : 'Mitra Applications'}
          {pendingApps.length > 0 && (
            <span className="ml-1 bg-rose-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
              {pendingApps.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('add_center')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'add_center' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          {language === 'hi' ? '3. + बिक्री केंद्र (A-03)' : '+ Add Center'}
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'pricing' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          {language === 'hi' ? '4. मूल्य दरें (A-04)' : 'City Pricing'}
        </button>
        <button
          onClick={() => setActiveTab('discounts')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'discounts' ? 'bg-emerald-900 text-white shadow-xs' : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? '5. 🏷️ छूट व कूपन' : '5. Discounts'}</span>
        </button>
      </div>

      {/* A-01 City Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Pending Applications Alert Banner */}
          {pendingApps.length > 0 && (
            <div className="p-3.5 sm:p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 font-medium">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-800 shrink-0" />
                <div>
                  <b className="block text-slate-900">{pendingApps.length} {language === 'hi' ? 'सहकार मित्र आवेदन समीक्षा हेतु प्रतीक्षित हैं!' : 'Sahakar Mitra applications await review!'}</b>
                  <span>{language === 'hi' ? 'कृपया समय पर सत्यापन कर स्वीकृत करें ताकि मित्र बुकिंग प्रारंभ कर सकें।' : 'Review and approve them so Mitras can begin booking.'}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('applications')}
                className="px-3 py-1.5 bg-amber-900 text-white font-bold rounded shadow-xs text-xs whitespace-nowrap shrink-0"
              >
                आवेदन देखें →
              </button>
            </div>
          )}

          {/* 3 Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-emerald-200 text-center space-y-1 shadow-xs">
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950">{cityCenters.length}</div>
              <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
                {language === 'hi' ? 'बिक्री केंद्र' : 'Centers'}
              </span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-emerald-200 text-center space-y-1 shadow-xs">
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950">{cityMitras.length}</div>
              <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
                {language === 'hi' ? 'सहकार मित्र' : 'Mitras'}
              </span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-emerald-200 text-center space-y-1 shadow-xs">
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950">{cityBookings.length}</div>
              <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">
                {language === 'hi' ? 'कुल शहर बुकिंग' : 'City Bookings'}
              </span>
            </div>
          </div>

          {/* Visual Analytics: Booked vs Delivered Chart across city centers */}
          <BookedVsDeliveredChart
            scope="city"
            cityId={activeCity?.id}
            title={language === 'hi' ? `${activeCity?.nameHi || 'नगर'}: केंद्र-वार मिठाई मांग बनाम वितरण` : `${activeCity?.nameEn || 'City'}: Booked vs. Delivered by Center`}
            subtitle={language === 'hi' ? 'शहर के सभी वितरण केंद्रों की मांग पूर्ति एवं वितरण विश्लेषण' : 'Demand fulfillment & delivery metrics for centers in this city'}
            height={300}
          />

          {/* Center Load Breakdown Table */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-emerald-200 space-y-3 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900">
              {language === 'hi' ? 'शहर बिक्री केंद्र भार विभाजन (Center Load Balancing)' : 'Center Load Breakdown'}
            </h4>

            <div className="border border-emerald-200 rounded overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[420px]">
                <thead className="bg-emerald-100 text-emerald-950 font-mono text-[11px] uppercase border-b border-emerald-200 font-bold">
                  <tr>
                    <th className="p-2.5">बिक्री केंद्र</th>
                    <th className="p-2.5">संचालक व संपर्क</th>
                    <th className="p-2.5 text-center">बुकिंग संख्या</th>
                    <th className="p-2.5 text-right">कुल मांग (Kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cityCenters.map((c) => {
                    const cBookings = cityBookings.filter((b) => b.centerId === c.id);
                    const totalKg = cBookings.reduce((sum, b) => sum + b.totalKg, 0);

                    return (
                      <tr key={c.id} className="hover:bg-emerald-50/50">
                        <td className="p-2.5 font-bold text-slate-800">
                          {language === 'hi' ? c.nameHi : c.nameEn}
                          <span className="block text-[10px] text-slate-500 font-normal">{language === 'hi' ? c.addressHi : c.addressEn}</span>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {c.ownerName} ({c.ownerPhone})
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                          {cBookings.length}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-900 text-sm">
                          {(totalKg || 0).toFixed(1)} kg
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* A-02 Mitra Application Review */}
      {activeTab === 'applications' && (
        <div className="bg-white p-5 rounded-lg border border-emerald-200 space-y-4 shadow-xs">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              {language === 'hi' ? 'सहकार मित्र आवेदन समीक्षा (A-02)' : 'Review Mitra Applications'}
            </h3>
            <p className="text-xs text-slate-500">
              सत्यापन उपरांत स्वीकृत करें। स्वीकृति पर ऑटो-जनरेटेड पासवर्ड मित्र को SMS/ईमेल से चला जाएगा।
            </p>
          </div>

          <div className="space-y-3">
            {cityMitras.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded border border-slate-200 bg-slate-50 flex flex-wrap justify-between items-start gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-900 text-sm">{m.id}</span>
                    <span className="font-bold text-slate-900 text-sm">{m.fullName}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        m.status === 'approved'
                          ? 'bg-emerald-200 text-emerald-950'
                          : m.status === 'pending'
                          ? 'bg-amber-200 text-amber-950'
                          : 'bg-rose-200 text-rose-950'
                      }`}
                    >
                      {m.status === 'approved' ? 'स्वीकृत ✓' : m.status === 'pending' ? 'प्रतीक्षित' : 'अस्वीकृत'}
                    </span>
                  </div>

                  <p className="text-slate-600 font-mono">फ़ोन: {m.phone} | ईमेल: {m.email}</p>
                  <p className="text-slate-600">पता: {m.address} ({m.pincode})</p>
                  {m.agreedToCenter && (
                    <span className="text-[11px] text-emerald-800 font-bold block pt-1">
                      ✓ बिक्री केंद्र स्थापित करने हेतु सहमत (स्वीकृति पर केंद्र स्वतः निर्मित होगा)
                    </span>
                  )}
                </div>

                {m.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(m.id)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow-xs"
                    >
                      स्वीकृत करें ✓
                    </button>
                    <button
                      onClick={() => setRejectingAppId(m.id)}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold text-xs shadow-xs"
                    >
                      अस्वीकृत
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rejection Modal */}
          {rejectingAppId && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded space-y-2 text-xs">
              <h4 className="font-bold text-rose-950">आवेदन {rejectingAppId} अस्वीकृति का कारण लिखें:</h4>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2 border border-rose-300 rounded bg-white"
              />
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setRejectingAppId(null)} className="px-3 py-1 border rounded">
                  रद्द करें
                </button>
                <button onClick={handleRejectSubmit} className="px-3 py-1 bg-rose-800 text-white rounded font-bold">
                  अस्वीकृत SMS भेजें
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* A-03 Add Sale Center */}
      {activeTab === 'add_center' && (
        <div className="bg-white p-6 rounded-lg border border-emerald-200 shadow-md space-y-4 max-w-lg mx-auto">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              {language === 'hi' ? 'नया बिक्री केंद्र जोड़ें (A-03)' : 'Add New Sale Center'}
            </h3>
            <p className="text-xs text-slate-500">
              संचालक के मोबाइल पर OTP सत्यापन उपरांत नया केंद्र तुरंत सक्रिय होगा।
            </p>
          </div>

          <form onSubmit={handleAddCenterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">केंद्र का नाम</label>
              <input
                type="text"
                required
                placeholder="सहकार भंडार, वैशाली नगर"
                value={centerNameHi}
                onChange={(e) => setCenterNameHi(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">केंद्र प्रकार</label>
              <select
                value={centerType}
                onChange={(e) => setCenterType(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded font-semibold"
              >
                <option value="standalone">स्वतंत्र बिक्री केंद्र (Standalone)</option>
                <option value="mitra_kendra">सहकार मित्र केंद्र (Mitra Kendra)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">संचालक नाम</label>
                <input
                  type="text"
                  required
                  placeholder="महेश शर्मा"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">मोबाइल नंबर (OTP हेतु)</label>
                <input
                  type="tel"
                  required
                  placeholder="98291XXXXX"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">पूरा पता व पिन</label>
              <input
                type="text"
                required
                placeholder="101, आम्रपाली मार्ग, जयपुर (302021)"
                value={addressHi}
                onChange={(e) => setAddressHi(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded text-xs shadow transition-colors"
            >
              OTP भेजें एवं केंद्र सक्रिय करें →
            </button>
          </form>
        </div>
      )}

      {/* A-04 Manage City Sweet Prices */}
      {activeTab === 'pricing' && (
        <div className="bg-white p-5 rounded-lg border border-emerald-200 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {language === 'hi' ? 'शहर मिठाई एवं मूल्य दर प्रबंधन (A-04)' : 'City Sweet Pricing'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'hi' ? `मास्टर कैटलॉग की मिठाइयों का अपने शहर ${activeCity.nameHi} हेतु प्रति किलो मूल्य निर्धारित करें।` : `Set per-kilogram prices for master catalog sweets in ${activeCity.nameEn}.`}
              </p>
            </div>

            <button
              onClick={() => setIsAddSweetModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-lg shadow flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ नई मिठाई जोड़ें (Add Sweet)</span>
            </button>
          </div>

          <div className="space-y-3">
            {masterSweets.map((sweet) => {
              const cityConfig = activeCity.sweets.find((cs) => cs.sweetId === sweet.id);
              const currentPrice = cityConfig ? cityConfig.pricePerKg : 1000;
              const isActive = cityConfig ? cityConfig.isActive : false;

              const editPrice =
                editingPriceMap[sweet.id] !== undefined ? editingPriceMap[sweet.id] : currentPrice;

              return (
                <div
                  key={sweet.id}
                  className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <CachedImage
                      src={sweet.imageUrl}
                      alt={language === 'hi' ? sweet.nameHi : sweet.nameEn}
                      className="w-10 h-10 rounded object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{language === 'hi' ? sweet.nameHi : sweet.nameEn}</div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        HSN: {sweet.hsnCode} | GST: {sweet.gstPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 font-mono">
                      <span>₹</span>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) =>
                          setEditingPriceMap({ ...editingPriceMap, [sweet.id]: Number(e.target.value) })
                        }
                        className="w-20 p-1 border rounded font-bold text-amber-900 bg-white"
                      />
                      <span>/ kg</span>
                    </div>

                    <button
                      onClick={() => {
                        updateCitySweetPrice(activeCity.id, sweet.id, editPrice, true);
                        alert(language === 'hi' ? `${sweet.nameHi} का नया मूल्य ₹${editPrice} सहेजा गया!` : `New price for ${sweet.nameEn} saved: ₹${editPrice}!`);
                      }}
                      className="px-3 py-1 bg-emerald-800 text-white rounded font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                    >
                      सहेजें
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <AddSweetModal
            isOpen={isAddSweetModalOpen}
            onClose={() => setIsAddSweetModalOpen(false)}
          />
        </div>
      )}

      {/* A-05 Discounts & Coupons Management */}
      {activeTab === 'discounts' && (
        <CityDiscountManager cityId={activeCity?.id || ''} />
      )}
      </div>
    </AdminAuthGuard>
  );
};
