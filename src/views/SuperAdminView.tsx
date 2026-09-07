/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CachedImage } from '../components/CachedImage';
import { MasterSweet } from '../types';
import { AddSweetModal } from '../components/AddSweetModal';
import { BookedVsDeliveredChart } from '../components/BookedVsDeliveredChart';
import { AdminHeaderNav } from '../components/AdminHeaderNav';
import { AdminAuthGuard } from '../components/AdminAuthGuard';
import {
  Crown,
  Globe,
  Calendar,
  Layers,
  FileSpreadsheet,
  Shield,
  Plus,
  Clock,
  Settings,
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const {
    language,
    festivals,
    activeFestival,
    addFestival,
    updateFestival,
    updateFestivalStatus,
    cities,
    addCity,
    updateCity,
    deleteCity,
    saleCenters,
    mitras,
    bookings,
    masterSweets,
    addMasterSweet,
    auditLogs,
    notificationTemplates
  } = useApp();

  // Tab state
  const [activeTab, setActiveTab] = useState<'national' | 'festivals' | 'cities' | 'master_catalog' | 'audit'>('national');

  // Festival Edit / Add Form state
  const [editingFest, setEditingFest] = useState<any | null>(null);
  const [isAddFestOpen, setIsAddFestOpen] = useState(false);
  const [festFormData, setFestFormData] = useState({
    nameHi: '',
    nameEn: '',
    startDate: '2026-10-10',
    cutoffDate: '2026-11-02',
    distributionStartDate: '2026-11-05',
    distributionEndDate: '2026-11-12',
    maxKgPerBooking: 10,
    defaultMitraCreditLimit: 25000
  });

  const [isAddSweetModalOpen, setIsAddSweetModalOpen] = useState(false);
  const [editingSweet, setEditingSweet] = useState<MasterSweet | null>(null);
  const [newSweetName, setNewSweetName] = useState('');
  const [newSweetCategory, setNewSweetCategory] = useState<'dry' | 'bengali' | 'traditional' | 'gift'>('dry');
  const [newSweetHsn, setNewSweetHsn] = useState('2106');
  const [newSweetGst, setNewSweetGst] = useState(5);
  const [newSweetDesc, setNewSweetDesc] = useState('');

  const editCity = (city: (typeof cities)[number]) => {
    const nameHi = prompt(language === 'hi' ? 'शहर का हिंदी नाम:' : 'City name:', city.nameHi);
    if (!nameHi) return;
    const nameEn = prompt('City English name:', city.nameEn) || city.nameEn;
    const stateEn = prompt('State name:', city.stateEn) || city.stateEn;
    const adminName = prompt(language === 'hi' ? 'शहर एडमिन का नाम:' : 'City admin name:', city.adminName) || city.adminName;
    const adminPhone = prompt(language === 'hi' ? 'शहर एडमिन मोबाइल नंबर:' : 'City admin phone:', city.adminPhone) || city.adminPhone;
    updateCity({ ...city, nameHi, nameEn, stateHi: city.stateHi, stateEn, districtHi: nameHi, adminName, adminPhone });
  };

  const toggleCityStatus = (city: (typeof cities)[number]) => {
    updateCity({ ...city, isActive: !city.isActive });
  };

  const totalNationalTonnes = (((bookings || []).reduce((sum, b) => sum + (b.totalKg || 0), 0)) / 1000).toFixed(2);
  const totalNationalValue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  const handleAddSweetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSweetName) return;

    const newSweet: MasterSweet = {
      id: `sweet_${Date.now()}`,
      nameHi: newSweetName,
      nameEn: newSweetName,
      category: newSweetCategory,
      hsnCode: newSweetHsn,
      gstPercent: newSweetGst,
      descriptionHi: newSweetDesc,
      descriptionEn: newSweetDesc,
      imageUrl: '/images/motichoor_ladoo_dmb_1785830283483.jpg',
      variants: [
        { label: '250g', weightInKg: 0.25 },
        { label: '500g', weightInKg: 0.5 },
        { label: '1kg', weightInKg: 1.0 }
      ],
      isPureVeg: true
    };

    addMasterSweet(newSweet);
    alert(`नई मिठाई ${newSweetName} मास्टर कैटलॉग में जोड़ी गई!`);
    setNewSweetName('');
    setNewSweetDesc('');
  };

  return (
    <AdminAuthGuard requiredRole="super_admin">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Admin Navigation */}
        <AdminHeaderNav currentRole="super_admin" />

      {/* Role Identity Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-white p-4 rounded-xl shadow-md border-b-4 border-rose-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-400 text-rose-950 font-black flex items-center justify-center text-base shadow-sm border-2 border-white shrink-0">
            राष्ट्रीय
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                {language === 'hi' ? 'राष्ट्रीय सुपर एडमिन पोर्टल' : 'National Super Admin Portal'}
              </h2>
              <span className="bg-rose-400 text-rose-950 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                सहकार भारती मुख्यालय
              </span>
            </div>
            <p className="text-xs text-rose-100/90 mt-0.5">
              {language === 'hi'
                ? 'उत्सव नियम, बुकिंग कट-ऑफ़ विंडो, मास्टर मिठाई कैटलॉग एवं नेटवर्क ऑडिट।'
                : 'Festival window rules, cutoff dates, master catalog & audit logs.'}
            </p>
          </div>
        </div>
      </div>

      {/* Super Admin Header */}
      <div className="bg-slate-900 text-white p-4 rounded-lg shadow-md border border-slate-700 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-400" />
          <div>
            <h3 className="font-black text-lg text-white">
              {language === 'hi' ? 'राष्ट्रीय सुपर एडमिन कंट्रोल (S-01)' : 'National Super Admin'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'hi' ? 'सहकार भारती राष्ट्रीय मिठाई एडवांस प्री-बुकिंग एवं गवर्नेंस नेटवर्क' : 'Sahakar Bharati national sweets pre-booking and governance network'}
            </p>
          </div>
        </div>

        <span className="bg-amber-400 text-amber-950 text-xs font-mono font-bold px-2.5 py-1 rounded">
          {language === 'hi' ? activeFestival?.nameHi || '' : activeFestival?.nameEn || ''}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 text-xs font-bold shadow-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('national')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'national' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'hi' ? '1. राष्ट्रीय डैशबोर्ड (S-01)' : '1. National Dashboard (S-01)'}
        </button>
        <button
          onClick={() => setActiveTab('festivals')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'festivals' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'hi' ? '2. उत्सव विंडो (S-02)' : '2. Festival Window (S-02)'}
        </button>
        <button
          onClick={() => setActiveTab('cities')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'cities' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'hi' ? '3. शहर प्रबंधन (S-03)' : '3. City Management (S-03)'}
        </button>
        <button
          onClick={() => setActiveTab('master_catalog')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'master_catalog' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'hi' ? '4. मास्टर कैटलॉग (S-04)' : '4. Master Catalog (S-04)'}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'audit' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'hi' ? '5. ऑडिट लॉग (S-05)' : '5. Audit Log (S-05)'}
        </button>
      </div>

      {/* S-01 National Dashboard */}
      {activeTab === 'national' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 text-center space-y-1 shadow-xs">
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">{cities.length}</div>
              <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">{language === 'hi' ? 'सक्रिय शहर' : 'Active Cities'}</span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 text-center space-y-1 shadow-xs">
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">{saleCenters.length}</div>
              <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">{language === 'hi' ? 'बिक्री केंद्र' : 'Sale Centers'}</span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 text-center space-y-1 shadow-xs">
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">{mitras.length}</div>
              <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">{language === 'hi' ? 'सहकार मित्र' : 'Sahakar Mitras'}</span>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 text-center space-y-1 shadow-xs">
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-900">{totalNationalTonnes} {language === 'hi' ? 'टन' : 'tonnes'}</div>
              <span className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider font-mono font-medium">{language === 'hi' ? 'कुल राष्ट्रीय मांग' : 'Total National Demand'}</span>
            </div>
          </div>

          {/* Visual Analytics: Booked vs Delivered Chart across centers & sweets */}
          <BookedVsDeliveredChart
            scope="national"
            title={language === 'hi' ? 'राष्ट्रीय स्तर: बिक्री केंद्र-वार मिठाई मांग बनाम वितरण विश्लेषण' : 'National Analytics: Sweets Booked vs. Delivered by Center'}
            subtitle={language === 'hi' ? 'सभी सक्रिय शहरों एवं बिक्री केंद्रों की वास्तविक समय बुकिंग और वितरण स्थिति' : 'Real-time fulfillment tracking across all active cities & centers'}
            height={330}
          />

          {/* City-wise Demand Table */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 space-y-3 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900">{language === 'hi' ? 'शहर-वार मिठाई मांग एवं मूल्य सारांश' : 'City-wise Sweet Demand & Price Summary'}</h4>
            <div className="border border-slate-200 rounded overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[480px]">
                <thead className="bg-slate-100 text-slate-900 font-mono text-[11px] uppercase border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-2.5">{language === 'hi' ? 'शहर / राज्य' : 'City / State'}</th>
                    <th className="p-2.5">{language === 'hi' ? 'प्रशासनिक प्रभारी' : 'Administrator'}</th>
                    <th className="p-2.5 text-center">{language === 'hi' ? 'केंद्र / मित्र' : 'Centers / Mitras'}</th>
                    <th className="p-2.5 text-right">{language === 'hi' ? 'कुल मांग (Kg)' : 'Total Demand (Kg)'}</th>
                    <th className="p-2.5 text-right">{language === 'hi' ? 'मूल्य (₹)' : 'Value (₹)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(cities || []).map((city) => {
                    const cBookings = (bookings || []).filter((b) => b.cityId === city.id);
                    const cKg = cBookings.reduce((sum, b) => sum + b.totalKg, 0);
                    const cVal = cBookings.reduce((sum, b) => sum + b.totalAmount, 0);
                    const cCentersCount = saleCenters.filter((c) => c.cityId === city.id).length;
                    const cMitrasCount = mitras.filter((m) => m.cityId === city.id).length;

                    return (
                      <tr key={city.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-800">
                          {language === 'hi' ? city.nameHi : city.nameEn} <span className="text-slate-500 font-normal">({language === 'hi' ? city.stateHi : city.stateEn})</span>
                        </td>
                        <td className="p-2.5 text-slate-700">{city.adminName}</td>
                        <td className="p-2.5 text-center font-mono">{cCentersCount} / {cMitrasCount}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-900">{(cKg || 0).toFixed(1)} kg</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">₹{cVal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* S-02 Festival Setup & Window Rules */}
      {activeTab === 'festivals' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {language === 'hi' ? 'उत्सव एवं बुकिंग विंडो नियम व तिथियां (S-02)' : 'Festival Window Rules & Dates'}
                </h3>
                <p className="text-xs text-slate-500">
                  त्योहार की वितरण तिथियां एवं कट-ऑफ़ तारीख़ बदलें। आपकी चुनी गई तिथियां पूरे ऐप (ग्राहक, मित्र, केंद्र) में लागू होंगी।
                </p>
              </div>

              {/* Add Festival Trigger Button */}
              <button
                onClick={() => {
                  setEditingFest(null);
                  setFestFormData({
                    nameHi: 'होली उत्सव 2027',
                    nameEn: 'Holi Festival 2027',
                    startDate: '2027-03-01',
                    cutoffDate: '2027-03-20',
                    distributionStartDate: '2027-03-24',
                    distributionEndDate: '2027-03-28',
                    maxKgPerBooking: 10,
                    defaultMitraCreditLimit: 25000
                  });
                  setIsAddFestOpen(true);
                }}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                  <span>{language === 'hi' ? '+ नया त्योहार विंडो जोड़ें' : '+ Add Festival Window'}</span>
              </button>
            </div>

            {/* Add or Edit Form Modal / Inline Box */}
            {(isAddFestOpen || editingFest) && (
              <div className="p-4 rounded-xl border-2 border-orange-400 bg-orange-50/60 space-y-4">
                <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                  <h4 className="font-bold text-sm text-orange-950 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>
                      {editingFest
                        ? (language === 'hi' ? `एडिट त्योहार विंडो: ${editingFest.nameHi}` : `Edit Festival: ${editingFest.nameEn}`)
                        : (language === 'hi' ? 'नया त्योहार विंडो जोड़ें' : 'Add New Festival Window')}
                    </span>
                  </h4>
                  <button
                    onClick={() => {
                      setIsAddFestOpen(false);
                      setEditingFest(null);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    ✕ रद्द करें
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingFest) {
                      updateFestival(editingFest.id, festFormData);
                      alert(language === 'hi' ? 'उत्सव विंडो की तिथियां अद्यतन कर दी गई हैं!' : 'Festival dates updated!');
                      setEditingFest(null);
                    } else {
                      const newFest: any = {
                        id: `fest_${Date.now()}`,
                        ...festFormData,
                        status: 'draft'
                      };
                      addFestival(newFest);
                      alert(language === 'hi' ? 'नया त्योहार विंडो सफलतापूर्वक जोड़ा गया!' : 'New festival added!');
                      setIsAddFestOpen(false);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">त्योहार का नाम (हिंदी):</label>
                      <input
                        type="text"
                        required
                        value={festFormData.nameHi}
                        onChange={(e) => setFestFormData({ ...festFormData, nameHi: e.target.value })}
                        className="w-full p-2 border rounded bg-white text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Festival Name (English):</label>
                      <input
                        type="text"
                        required
                        value={festFormData.nameEn}
                        onChange={(e) => setFestFormData({ ...festFormData, nameEn: e.target.value })}
                        className="w-full p-2 border rounded bg-white text-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-orange-200">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">बुकिंग आरंभ तिथि:</label>
                      <input
                        type="date"
                        required
                        value={festFormData.startDate}
                        onChange={(e) => setFestFormData({ ...festFormData, startDate: e.target.value })}
                        className="w-full p-1.5 border rounded font-mono font-bold text-slate-800 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-rose-800 mb-1">बुकिंग कट-ऑफ़ (अंतिम तिथि):</label>
                      <input
                        type="date"
                        required
                        value={festFormData.cutoffDate}
                        onChange={(e) => setFestFormData({ ...festFormData, cutoffDate: e.target.value })}
                        className="w-full p-1.5 border border-rose-300 rounded font-mono font-bold text-rose-900 cursor-pointer bg-rose-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-emerald-800 mb-1">वितरण प्रारंभ तिथि:</label>
                      <input
                        type="date"
                        required
                        value={festFormData.distributionStartDate}
                        onChange={(e) => setFestFormData({ ...festFormData, distributionStartDate: e.target.value })}
                        className="w-full p-1.5 border border-emerald-300 rounded font-mono font-bold text-emerald-900 cursor-pointer bg-emerald-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-emerald-800 mb-1">वितरण अंतिम तिथि:</label>
                      <input
                        type="date"
                        required
                        value={festFormData.distributionEndDate}
                        onChange={(e) => setFestFormData({ ...festFormData, distributionEndDate: e.target.value })}
                        className="w-full p-1.5 border border-emerald-300 rounded font-mono font-bold text-emerald-900 cursor-pointer bg-emerald-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">प्रति बुकिंग अधिकतम सीमा (Kg):</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={festFormData.maxKgPerBooking}
                        onChange={(e) => setFestFormData({ ...festFormData, maxKgPerBooking: Number(e.target.value) })}
                        className="w-full p-2 border rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">सहकार मित्र क्रेडिट लिमिट (₹):</label>
                      <input
                        type="number"
                        step="1000"
                        value={festFormData.defaultMitraCreditLimit}
                        onChange={(e) => setFestFormData({ ...festFormData, defaultMitraCreditLimit: Number(e.target.value) })}
                        className="w-full p-2 border rounded font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddFestOpen(false);
                        setEditingFest(null);
                      }}
                      className="px-3 py-1.5 border rounded font-bold text-slate-700 bg-white"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow-xs cursor-pointer"
                    >
                      {editingFest ? 'अद्यतन सुरक्षित करें (Save Changes)' : 'उत्सव बनाएं (Create Festival)'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {(festivals || []).map((f) => (
                <div key={f.id} className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>{language === 'hi' ? f.nameHi : f.nameEn}</span>
                      <span className="text-slate-500 font-normal">({f.nameEn})</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsAddFestOpen(false);
                          setEditingFest(f);
                          setFestFormData({
                            nameHi: f.nameHi,
                            nameEn: f.nameEn,
                            startDate: f.startDate,
                            cutoffDate: f.cutoffDate,
                            distributionStartDate: f.distributionStartDate,
                            distributionEndDate: f.distributionEndDate,
                            maxKgPerBooking: f.maxKgPerBooking,
                            defaultMitraCreditLimit: f.defaultMitraCreditLimit
                          });
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        ✏️ तिथि व नियम सम्पादित करें (Edit)
                      </button>

                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                        f.status === 'active' ? 'bg-emerald-200 text-emerald-950' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {f.status === 'active' ? 'सक्रिय विंडो (Active)' : f.status === 'completed' ? 'संपन्न (Completed)' : 'ड्राफ़्ट (Draft)'}
                      </span>

                      {f.status !== 'active' && (
                        <button
                          onClick={() => updateFestivalStatus(f.id, 'active')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded shadow-xs cursor-pointer"
                        >
                          सक्रिय करें
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">बुकिंग प्रारंभ:</span>
                      <b className="text-slate-800 text-xs">{f.startDate}</b>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-rose-300">
                      <span className="text-[10px] text-rose-700 block font-bold">कट-ऑफ़ (बंद):</span>
                      <b className="text-rose-900 text-xs">{f.cutoffDate}</b>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-300">
                      <span className="text-[10px] text-emerald-700 block font-bold">संग्रहण/वितरण अवधि (Collection Window):</span>
                      <b className="text-emerald-950 text-xs">{f.distributionStartDate} से {f.distributionEndDate}</b>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200">
                    <div>
                      <span className="text-[11px] text-slate-600">प्रति बुकिंग अधिकतम मात्रा:</span>
                      <b className="font-mono text-slate-900 ml-1">{f.maxKgPerBooking} kg</b>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600">डिफ़ॉल्ट मित्र उधार सीमा:</span>
                      <b className="font-mono text-slate-900 ml-1">₹{f.defaultMitraCreditLimit}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* S-03 City Network Management */}
      {activeTab === 'cities' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {language === 'hi' ? 'शहर नेटवर्क प्रबंधन (S-03)' : 'City Network Management'}
                </h3>
                <p className="text-xs text-slate-500">
                  सक्रिय शहरों का प्रबंधन करें, नए शहर जोड़ें एवं शहर एडमिन नियुक्त करें।
                </p>
              </div>

              <button
                onClick={() => {
                  const name = prompt('शहर का नाम दर्ज करें (जैसे: उदयपुर / जोधपुर):');
                  if (!name) return;
                  const state = prompt('राज्य का नाम दर्ज करें (जैसे: राजस्थान):') || 'राजस्थान';
                  const adminName = prompt('शहर एडमिन का नाम:') || 'अजय कुमार';
                  const adminPhone = prompt('शहर एडमिन मोबाइल नंबर:') || '9829099999';

                  const newC: any = {
                    id: name.toLowerCase().replace(/\s+/g, '_'),
                    nameHi: name,
                    nameEn: name,
                    stateHi: state,
                    stateEn: state,
                    districtHi: name,
                    adminName,
                    adminPhone,
                    isActive: true,
                    sweets: (masterSweets || []).map((s) => ({ sweetId: s.id, pricePerKg: 700, isActive: true }))
                  };

                  addCity(newC);
                  alert(`नया शहर ${name} सफलता पूर्वक जोड़ा गया!`);
                }}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>+ नया शहर जोड़ें</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {(cities || []).map((city) => (
                <div key={city.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">{language === 'hi' ? city.nameHi : city.nameEn} ({language === 'hi' ? city.stateHi : city.stateEn})</h4>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => toggleCityStatus(city)} className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800">
                        {city.isActive ? (language === 'hi' ? 'सक्रिय' : 'Active') : (language === 'hi' ? 'निष्क्रिय' : 'Inactive')}
                      </button>
                      <button type="button" onClick={() => editCity(city)} title={language === 'hi' ? 'शहर संपादित करें' : 'Edit city'} className="p-1.5 rounded text-blue-700 hover:bg-blue-100"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => { if (confirm(language === 'hi' ? `${city.nameHi} हटाएं?` : `Delete ${city.nameEn}?`)) deleteCity(city.id); }} title={language === 'hi' ? 'शहर हटाएं' : 'Delete city'} className="p-1.5 rounded text-rose-700 hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div><b>{language === 'hi' ? 'शहर एडमिन:' : 'City admin:'}</b> {city.adminName}</div>
                    <div><b>{language === 'hi' ? 'फ़ोन:' : 'Phone:'}</b> <span className="font-mono">{city.adminPhone}</span></div>
                    <div><b>{language === 'hi' ? 'मिठाइयाँ उपलब्ध:' : 'Available sweets:'}</b> <span className="font-mono font-bold">{(city.sweets || []).filter(s => s.isActive).length} {language === 'hi' ? 'प्रकार' : 'types'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* S-04 Master Sweets Catalog */}
      {activeTab === 'master_catalog' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {language === 'hi' ? 'राष्ट्रीय मास्टर मिठाई कैटलॉग (S-04)' : 'Master Sweets Catalog'}
                </h3>
                <p className="text-xs text-slate-500">
                  मिठाई का नाम, HSN कोड 2106, 5% GST दर एवं फ़ोटो गैलरी; मूल्य शहर एडमिन द्वारा संचालित होता है।
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingSweet(null);
                  setIsAddSweetModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-lg shadow flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ नई मिठाई जोड़ें (Add New Sweet)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(masterSweets || []).map((sweet) => (
                <div key={sweet.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-orange-300 transition-all space-y-2.5 text-xs shadow-2xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <CachedImage
                        src={sweet.imageUrl}
                        alt={sweet.nameHi}
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{language === 'hi' ? sweet.nameHi : sweet.nameEn}</h4>
                          {sweet.discountPercent ? (
                            <span className="bg-emerald-100 text-emerald-800 font-mono text-[9.5px] font-bold px-1.5 py-0.2 rounded shrink-0">
                              {sweet.discountPercent}% छूट
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{language === 'hi' ? sweet.descriptionHi : sweet.descriptionEn}</p>
                        <div className="font-mono text-[10px] text-slate-600 mt-1 font-semibold flex items-center gap-2">
                          <span>आधार मूल्य: ₹{sweet.basePrice || 600}/kg</span>
                          <span>| HSN: {sweet.hsnCode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Thumbnail gallery if multiple images exist */}
                    {sweet.images && sweet.images.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-mono">चित्र ({sweet.images.length}/3):</span>
                        <div className="flex items-center gap-1">
                          {sweet.images.slice(0, 3).map((img, idx) => (
                            <CachedImage
                              key={idx}
                              src={img}
                              alt="thumb"
                              className="w-6 h-6 rounded object-cover border border-slate-300"
                              showSkeleton={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-mono font-medium">
                      {sweet.variants ? sweet.variants.map((v) => v.label).join(', ') : '250g, 500g, 1kg'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSweet(sweet);
                        setIsAddSweetModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-amber-300/80 shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                      <span>{language === 'hi' ? 'संपादित करें' : 'Edit Sweet'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <AddSweetModal
            isOpen={isAddSweetModalOpen}
            onClose={() => {
              setIsAddSweetModalOpen(false);
              setEditingSweet(null);
            }}
            sweetToEdit={editingSweet}
          />
        </div>
      )}

      {/* S-05 Audit Log & DLT Templates */}
      {activeTab === 'audit' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-xs">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              {language === 'hi' ? 'सिस्टम ऑडिट लॉग एवं सूचना सेटिंग (S-05)' : 'Audit Log & Templates'}
            </h3>
            <p className="text-xs text-slate-500">
              सहकारी नियमों के तहत प्रशासनिक बदलावों की समय-मुहर रिकॉर्डिंग।
            </p>
          </div>

          <div className="space-y-2">
            {(auditLogs || []).map((log) => (
              <div key={log.id} className="p-3 rounded border border-slate-200 bg-slate-50 text-xs flex justify-between items-center">
                <div>
                  <b className="text-slate-900 block">{log.actor}</b>
                  <p className="text-slate-700">{log.actionHi}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </AdminAuthGuard>
  );
};
