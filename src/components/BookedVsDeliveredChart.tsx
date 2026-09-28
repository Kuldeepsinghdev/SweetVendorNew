/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  PackageCheck,
  Truck,
  Clock,
  Building2,
  Store,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  Percent
} from 'lucide-react';

interface BookedVsDeliveredChartProps {
  title?: string;
  subtitle?: string;
  scope?: 'national' | 'city' | 'mitra' | 'center' | 'all';
  cityId?: string;
  mitraId?: string;
  centerId?: string;
  showControls?: boolean;
  compact?: boolean;
  height?: number;
}

interface CenterMetric {
  id: string;
  name: string;
  nameHi: string;
  cityName: string;
  cityId: string;
  bookedKg: number;
  deliveredKg: number;
  pendingKg: number;
  fulfillmentRate: number;
  totalOrders: number;
  deliveredOrders: number;
  bookedAmount: number;
  deliveredAmount: number;
}

interface SweetMetric {
  sweetId: string;
  name: string;
  nameHi: string;
  bookedKg: number;
  deliveredKg: number;
  pendingKg: number;
  fulfillmentRate: number;
  totalBookings: number;
}

export const BookedVsDeliveredChart: React.FC<BookedVsDeliveredChartProps> = ({
  title,
  subtitle,
  scope = 'all',
  cityId,
  mitraId,
  centerId,
  showControls = true,
  compact = false,
  height = 320
}) => {
  const { bookings, saleCenters, cities, masterSweets, activeCity, language } = useApp();

  const [viewMode, setViewMode] = useState<'centers' | 'sweets'>('centers');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>(cityId || 'all');
  const [selectedSweetFilter, setSelectedSweetFilter] = useState<string>('all');
  const [unitMode, setUnitMode] = useState<'kg' | 'count'>('kg');

  // Filter bookings based on props and active filter selections
  const filteredBookings = useMemo(() => {
    return (bookings || []).filter((b) => {
      // Exclude cancelled bookings from demand calculations
      if (b.status === 'cancelled') return false;

      // Filter by scope/prop
      if (scope === 'mitra' && mitraId && b.mitraId !== mitraId) return false;
      if (scope === 'city' && cityId && b.cityId !== cityId) return false;
      if (scope === 'center' && centerId && b.centerId !== centerId) return false;

      // Interactive UI city filter
      if (selectedCityFilter !== 'all' && b.cityId !== selectedCityFilter) return false;

      return true;
    });
  }, [bookings, scope, mitraId, cityId, centerId, selectedCityFilter]);

  // Aggregate Center-wise Metrics
  const centerData: CenterMetric[] = useMemo(() => {
    // Determine relevant centers
    let centersToDisplay = saleCenters || [];
    if (scope === 'city' && cityId) {
      centersToDisplay = centersToDisplay.filter((c) => c.cityId === cityId);
    } else if (selectedCityFilter !== 'all') {
      centersToDisplay = centersToDisplay.filter((c) => c.cityId === selectedCityFilter);
    }

    if (centerId) {
      centersToDisplay = centersToDisplay.filter((c) => c.id === centerId);
    }

    return centersToDisplay.map((center) => {
      const centerBookings = filteredBookings.filter((b) => b.centerId === center.id);
      const parentCity = cities.find((c) => c.id === center.cityId);

      let bookedKg = 0;
      let deliveredKg = 0;
      let bookedAmount = 0;
      let deliveredAmount = 0;
      let deliveredOrders = 0;

      centerBookings.forEach((b) => {
        // Items filter if sweet filter is active
        const items = selectedSweetFilter === 'all'
          ? b.items
          : b.items.filter((item) => item.sweetId === selectedSweetFilter);

        const itemsKg = items.reduce((sum, it) => sum + (it.variantKg || 1) * (it.quantity || 0), 0);
        const itemsAmount = items.reduce((sum, it) => sum + (it.totalAmount || 0), 0);

        if (items.length > 0) {
          bookedKg += itemsKg;
          bookedAmount += itemsAmount;

          if (b.status === 'delivered') {
            deliveredKg += itemsKg;
            deliveredAmount += itemsAmount;
            deliveredOrders += 1;
          }
        }
      });

      const pendingKg = Math.max(0, bookedKg - deliveredKg);
      const fulfillmentRate = bookedKg > 0 ? Math.round((deliveredKg / bookedKg) * 100) : 0;

      return {
        id: center.id,
        name: language === 'hi' ? center.nameHi : center.nameEn,
        nameHi: center.nameHi,
        cityName: parentCity ? (language === 'hi' ? parentCity.nameHi : parentCity.nameEn) : '',
        cityId: center.cityId,
        bookedKg: Number(bookedKg.toFixed(1)),
        deliveredKg: Number(deliveredKg.toFixed(1)),
        pendingKg: Number(pendingKg.toFixed(1)),
        fulfillmentRate,
        totalOrders: centerBookings.length,
        deliveredOrders,
        bookedAmount,
        deliveredAmount
      };
    });
  }, [saleCenters, filteredBookings, cities, scope, cityId, centerId, selectedCityFilter, selectedSweetFilter, language]);

  // Aggregate Sweet-wise Metrics
  const sweetData: SweetMetric[] = useMemo(() => {
    return (masterSweets || []).map((sweet) => {
      let bookedKg = 0;
      let deliveredKg = 0;
      let totalBookings = 0;

      filteredBookings.forEach((b) => {
        const matchingItems = b.items.filter((it) => it.sweetId === sweet.id);
        if (matchingItems.length > 0) {
          const sKg = matchingItems.reduce((sum, it) => sum + (it.variantKg || 1) * (it.quantity || 0), 0);
          bookedKg += sKg;
          totalBookings += 1;

          if (b.status === 'delivered') {
            deliveredKg += sKg;
          }
        }
      });

      const pendingKg = Math.max(0, bookedKg - deliveredKg);
      const fulfillmentRate = bookedKg > 0 ? Math.round((deliveredKg / bookedKg) * 100) : 0;

      return {
        sweetId: sweet.id,
        name: language === 'hi' ? sweet.nameHi : sweet.nameEn,
        nameHi: sweet.nameHi,
        bookedKg: Number(bookedKg.toFixed(1)),
        deliveredKg: Number(deliveredKg.toFixed(1)),
        pendingKg: Number(pendingKg.toFixed(1)),
        fulfillmentRate,
        totalBookings
      };
    });
  }, [masterSweets, filteredBookings, language]);

  // High level totals
  const totals = useMemo(() => {
    const totalBookedKg = centerData.reduce((sum, c) => sum + c.bookedKg, 0);
    const totalDeliveredKg = centerData.reduce((sum, c) => sum + c.deliveredKg, 0);
    const totalPendingKg = Math.max(0, totalBookedKg - totalDeliveredKg);
    const overallRate = totalBookedKg > 0 ? Math.round((totalDeliveredKg / totalBookedKg) * 100) : 0;
    const totalOrders = centerData.reduce((sum, c) => sum + c.totalOrders, 0);
    const totalDeliveredOrders = centerData.reduce((sum, c) => sum + c.deliveredOrders, 0);

    return {
      bookedKg: Number(totalBookedKg.toFixed(1)),
      deliveredKg: Number(totalDeliveredKg.toFixed(1)),
      pendingKg: Number(totalPendingKg.toFixed(1)),
      overallRate,
      totalOrders,
      totalDeliveredOrders
    };
  }, [centerData]);

  // Chart data source based on current view mode
  const chartData = useMemo(() => {
    if (viewMode === 'sweets') {
      return sweetData.map((s) => ({
        label: s.name.length > 14 ? s.name.slice(0, 13) + '…' : s.name,
        fullLabel: s.name,
        'कुल बुक (Booked)': unitMode === 'kg' ? s.bookedKg : s.totalBookings,
        'वितरित (Delivered)': unitMode === 'kg' ? s.deliveredKg : Math.round((s.deliveredKg / (s.bookedKg || 1)) * s.totalBookings),
        pending: s.pendingKg,
        rate: s.fulfillmentRate,
        unit: unitMode === 'kg' ? 'kg' : 'ऑर्डर'
      }));
    }

    return centerData.map((c) => {
      // Shorten label for clean XAxis rendering
      const shortName = c.name.replace(/सहकार केंद्र — |आस्था उपभोक्ता भण्डार/g, '').trim() || c.name;
      return {
        label: shortName.length > 12 ? shortName.slice(0, 11) + '…' : shortName,
        fullLabel: `${c.name} ${c.cityName ? `(${c.cityName})` : ''}`,
        'कुल बुक (Booked)': unitMode === 'kg' ? c.bookedKg : c.totalOrders,
        'वितरित (Delivered)': unitMode === 'kg' ? c.deliveredKg : c.deliveredOrders,
        pending: c.pendingKg,
        rate: c.fulfillmentRate,
        cityName: c.cityName,
        unit: unitMode === 'kg' ? 'kg' : 'ऑर्डर'
      };
    });
  }, [viewMode, sweetData, centerData, unitMode]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      const bookedVal = payload.find((p: any) => p.dataKey === 'कुल बुक (Booked)')?.value || 0;
      const deliveredVal = payload.find((p: any) => p.dataKey === 'वितरित (Delivered)')?.value || 0;
      const unit = dataPoint?.unit || 'kg';
      const rate = dataPoint?.rate || 0;

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-amber-400/40 text-xs backdrop-blur-xs min-w-[200px] animate-in fade-in zoom-in-95 duration-100 z-50">
          <div className="font-extrabold text-amber-300 border-b border-slate-700/80 pb-1.5 mb-2 flex items-center justify-between gap-2">
            <span className="truncate">{dataPoint?.fullLabel || label}</span>
            <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">
              {rate}% पूर्ति
            </span>
          </div>

          <div className="space-y-1.5 font-medium">
            <div className="flex items-center justify-between gap-3 text-amber-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0 shadow-xs" />
                <span>{language === 'hi' ? 'कुल बुक (Booked):' : 'Total Booked:'}</span>
              </span>
              <span className="font-mono font-bold text-white text-sm">
                {bookedVal} {unit}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0 shadow-xs" />
                <span>{language === 'hi' ? 'वितरित (Delivered):' : 'Delivered:'}</span>
              </span>
              <span className="font-mono font-bold text-emerald-200 text-sm">
                {deliveredVal} {unit}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400/80" />
                <span>{language === 'hi' ? 'वितरण शेष (Pending):' : 'Pending:'}</span>
              </span>
              <span className="font-mono font-bold text-amber-300">
                {Math.max(0, bookedVal - deliveredVal).toFixed(1)} {unit}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const defaultTitle =
    scope === 'national'
      ? language === 'hi'
        ? 'राष्ट्रीय मिष्ठान प्री-बुकिंग बनाम वितरण तुलना'
        : 'National Sweets: Booked vs. Delivered Analytics'
      : scope === 'city'
      ? language === 'hi'
        ? `नगर केंद्र-वार मिठाई वितरण तुलना — ${activeCity?.nameHi || ''}`
        : `City Center-wise: Booked vs. Delivered — ${activeCity?.nameEn || ''}`
      : scope === 'mitra'
      ? language === 'hi'
        ? 'सहकार मित्र केंद्र-वार मांग एवं वितरण प्रगति'
        : 'Sahakar Mitra: Center-wise Demand & Delivery'
      : language === 'hi'
      ? 'बिक्री केंद्र-वार मिठाई बुक बनाम वितरण चार्ट'
      : 'Center-wise Sweets: Booked vs. Delivered Chart';

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-200/80 shadow-md p-4 sm:p-5 space-y-4 relative overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg shadow-2xs">
              <BarChart3 className="w-5 h-5 text-amber-800" />
            </div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
              {title || defaultTitle}
            </h3>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 ml-8">{subtitle}</p>}
        </div>

        {/* View mode buttons & Metric toggle */}
        {showControls && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* View Switcher: Centers vs Sweets */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('centers')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'centers'
                    ? 'bg-amber-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'केंद्र-वार' : 'Centers'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('sweets')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'sweets'
                    ? 'bg-amber-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'मिठाई-वार' : 'Sweets'}</span>
              </button>
            </div>

            {/* Unit Toggle: Kg vs Orders */}
            <div className="inline-flex p-0.5 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold font-mono">
              <button
                type="button"
                onClick={() => setUnitMode('kg')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  unitMode === 'kg'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'text-amber-900 hover:text-amber-950'
                }`}
              >
                Kg (किलो)
              </button>
              <button
                type="button"
                onClick={() => setUnitMode('count')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  unitMode === 'count'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'text-amber-900 hover:text-amber-950'
                }`}
              >
                ऑर्डर
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Filters Bar (Optional) */}
      {showControls && (cities.length > 1 || masterSweets.length > 1) && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
          <div className="flex items-center gap-1 text-amber-900 font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-700" />
            <span>{language === 'hi' ? 'फ़िल्टर:' : 'Filter:'}</span>
          </div>

          {/* City Filter if not already locked by prop */}
          {!cityId && cities.length > 1 && (
            <select
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              className="bg-white border border-amber-300 rounded-lg px-2 py-1 font-semibold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">{language === 'hi' ? 'सभी नगर (All Cities)' : 'All Cities'}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'hi' ? c.nameHi : c.nameEn}
                </option>
              ))}
            </select>
          )}

          {/* Sweet Filter */}
          <select
            value={selectedSweetFilter}
            onChange={(e) => setSelectedSweetFilter(e.target.value)}
            className="bg-white border border-amber-300 rounded-lg px-2 py-1 font-semibold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer max-w-[180px] truncate"
          >
            <option value="all">{language === 'hi' ? 'सभी मिठाइयाँ (All Sweets)' : 'All Sweets'}</option>
            {masterSweets.map((s) => (
              <option key={s.id} value={s.id}>
                {language === 'hi' ? s.nameHi : s.nameEn}
              </option>
            ))}
          </select>

          {/* Active summary mini tag */}
          <div className="ml-auto text-[11px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span>{totals.overallRate}% पूर्ति पूर्ण</span>
          </div>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 p-3 rounded-xl border border-amber-300/80 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'कुल बुक (Booked)' : 'Total Booked'}
            </span>
            <PackageCheck className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-950">
            {totals.bookedKg} <span className="text-xs font-normal text-amber-800">kg</span>
          </div>
          <div className="text-[10px] text-amber-700 font-medium">
            {totals.totalOrders} {language === 'hi' ? 'ऑर्डर दर्ज' : 'Orders'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 p-3 rounded-xl border border-emerald-300/80 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'वितरित (Delivered)' : 'Delivered'}
            </span>
            <Truck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-950">
            {totals.deliveredKg} <span className="text-xs font-normal text-emerald-800">kg</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">
            {totals.totalDeliveredOrders} {language === 'hi' ? 'ऑर्डर पूर्ण' : 'Delivered'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/70 p-3 rounded-xl border border-indigo-300/80 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-indigo-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'वितरण शेष (Pending)' : 'Pending'}
            </span>
            <Clock className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-indigo-950">
            {totals.pendingKg} <span className="text-xs font-normal text-indigo-800">kg</span>
          </div>
          <div className="text-[10px] text-indigo-700 font-medium">
            {totals.totalOrders - totals.totalDeliveredOrders} {language === 'hi' ? 'प्रतीक्षित' : 'Waiting'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100/70 p-3 rounded-xl border border-orange-300/80 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-orange-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'सप्लाई पूर्ति (Rate)' : 'Fulfillment'}
            </span>
            <Percent className="w-4 h-4 text-orange-700" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-orange-950">
            {totals.overallRate}%
          </div>
          <div className="w-full bg-orange-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, totals.overallRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Chart */}
      <div className="pt-2">
        {chartData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <Store className="w-8 h-8 mb-2 text-slate-300" />
            <p className="font-bold text-sm text-slate-600">
              {language === 'hi' ? 'चयनित मानदंड अनुसार कोई डेटा उपलब्ध नहीं है' : 'No booking data found for selected criteria'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'hi' ? 'नई बुकिंग दर्ज होने पर बार चार्ट स्वचालित रूप से अद्यतन होगा।' : 'Chart will update automatically when bookings are placed.'}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: chartData.length > 5 ? `${chartData.length * 90}px` : '100%', height: `${height}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                  barGap={4}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    interval={0}
                    angle={chartData.length > 4 ? -15 : 0}
                    textAnchor={chartData.length > 4 ? 'end' : 'middle'}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}${unitMode === 'kg' ? 'kg' : ''}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar
                    dataKey="कुल बुक (Booked)"
                    name={language === 'hi' ? 'कुल बुक (Booked)' : 'Total Booked'}
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-booked-${index}`} fill="#d97706" />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="वितरित (Delivered)"
                    name={language === 'hi' ? 'वितरित (Delivered)' : 'Delivered'}
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-delivered-${index}`} fill="#059669" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Mini Legend / Delivery Status Tip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-600 inline-block" />
            <span className="font-bold text-slate-700">{language === 'hi' ? 'कुल बुकिंग मांग (Booked)' : 'Booked'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
            <span className="font-bold text-slate-700">{language === 'hi' ? 'सफलतापूर्वक वितरित (Delivered)' : 'Delivered'}</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          {language === 'hi'
            ? '💡 डिलीवरी पुष्टि होने पर बार वास्तविक समय में अद्यतन होता है।'
            : '💡 Real-time synchronization upon OTP verification.'}
        </div>
      </div>
    </div>
  );
};
