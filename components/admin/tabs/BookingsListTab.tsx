'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SessionUser } from '@/lib/auth/session';
import type { Locale } from '@/src/lib/locale';

import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * DashboardData structure containing pre-filtered bookings
 * Data is already filtered server-side based on user role
 * (Requirements 5.1, 5.2, 5.3, 23.3)
 */
export interface DashboardData {
  bookings: Booking[];
  cities?: City[];
  distributionCenters?: DistributionCenter[];
  [key: string]: any;
}

interface Booking {
  id: string;
  status: 'confirmed' | 'delivered' | 'cancelled';
  totalAmount: number;
  totalKg: number;
  paymentMethod: 'cash' | 'credit';
  paymentStatus?: string;
  deliveryOtp?: string;
  createdAt: string;
  cityId?: string;
  cityNameHi?: string;
  centerNameHi?: string;
  customer?: {
    name?: string;
    phone?: string;
  };
  items?: BookingItem[];
}

interface BookingItem {
  sweetId?: string;
  sweetNameHi?: string;
  nameHi?: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface City {
  id: string;
  nameHi: string;
  nameEn: string;
}

interface DistributionCenter {
  id: string;
  nameHi: string;
  nameEn: string;
}

/**
 * BookingsListTab Component
 * 
 * Reusable tab component for displaying bookings list across all admin roles.
 * Data is pre-filtered server-side based on user role (kendra/city_admin/super_admin).
 * 
 * Features:
 * - City and status filtering (when applicable based on role)
 * - Expandable booking details with item breakdown
 * - Bilingual support (Hindi/English)
 * - Responsive design
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 * 
 * @param props - TabContentProps containing session, data, and locale
 */
export default function BookingsListTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const { bookings, cities = [], distributionCenters = [] } = data;

  // Filter state - only show city filter if multiple cities exist in data
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Determine if city filter should be shown based on role
  // Super admin and city admin will have cities data, kendra won't
  const showCityFilter = cities.length > 1;

  // Apply client-side filters (data is already role-filtered server-side)
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filterCity !== 'all' && b.cityId !== filterCity) return false;
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      return true;
    });
  }, [bookings, filterCity, filterStatus]);

  const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        {showCityFilter && (
          <div>
            <label className="block text-xs font-bold text-amber-950 mb-1">
              {hi ? 'शहर' : 'City'}
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
            >
              <option value="all">{hi ? 'सभी शहर' : 'All Cities'}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {hi ? c.nameHi : c.nameEn}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-amber-950 mb-1">
            {hi ? 'स्थिति' : 'Status'}
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
          >
            <option value="all">{hi ? 'सभी' : 'All'}</option>
            <option value="confirmed">{hi ? 'पुष्टि' : 'Confirmed'}</option>
            <option value="delivered">{hi ? 'डिलीवर' : 'Delivered'}</option>
            <option value="cancelled">{hi ? 'रद्द' : 'Cancelled'}</option>
          </select>
        </div>
        <div className="self-end pb-2 text-xs font-medium text-amber-900/70">
          {filtered.length} {hi ? 'बुकिंग' : 'bookings'}
        </div>
      </div>

      {/* Booking rows */}
      <div className="bg-white border border-amber-200/80 rounded-2xl divide-y divide-amber-100 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 text-center">
            {hi ? 'कोई बुकिंग नहीं।' : 'No bookings.'}
          </p>
        ) : (
          filtered.slice(0, 100).map((b) => {
            const isExp = expandedId === b.id;
            const items: BookingItem[] = Array.isArray(b.items) ? b.items : [];
            return (
              <div key={b.id}>
                <button
                  onClick={() => setExpandedId(isExp ? null : b.id)}
                  className="w-full text-left px-4 py-3.5 hover:bg-amber-50/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-900">{b.id}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            b.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : b.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {b.customer?.name} · {b.customer?.phone}
                        {b.cityNameHi && ` · ${b.cityNameHi}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-sm text-amber-950">
                        {inr(b.totalAmount ?? 0)}
                      </p>
                      <p className="text-xs text-slate-500">{b.totalKg} kg</p>
                    </div>
                    {isExp ? (
                      <ChevronUp size={16} className="text-amber-700 shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    )}
                  </div>
                </button>
                {isExp && (
                  <div className="px-4 pb-4 space-y-2.5 bg-amber-50/30 border-t border-amber-100">
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-3">
                      {b.centerNameHi && (
                        <span>
                          <strong className="text-amber-950">{hi ? 'केंद्र:' : 'DC:'}</strong> {b.centerNameHi}
                        </span>
                      )}
                      {b.paymentMethod && b.paymentStatus && (
                        <span>
                          <strong className="text-amber-950">{hi ? 'भुगतान:' : 'Payment:'}</strong> {b.paymentMethod} /{' '}
                          {b.paymentStatus}
                        </span>
                      )}
                      {b.deliveryOtp && (
                        <span>
                          <strong className="text-amber-950">{hi ? 'OTP:' : 'OTP:'}</strong> {b.deliveryOtp}
                        </span>
                      )}
                      {b.createdAt && (
                        <span>
                          <strong className="text-amber-950">{hi ? 'दिनांक:' : 'Date:'}</strong> {typeof b.createdAt === 'string' ? b.createdAt : b.createdAt.toString()}
                        </span>
                      )}
                    </div>
                    {items.length > 0 && (
                      <table className="w-full text-xs border-t border-amber-200/70 pt-2 mt-2">
                        <thead>
                          <tr className="text-slate-500 border-b border-amber-100">
                            <th className="text-left py-1.5 font-bold">{hi ? 'मिठाई' : 'Sweet'}</th>
                            <th className="text-right py-1.5 font-bold">
                              {hi ? 'वेरिएंट' : 'Variant'}
                            </th>
                            <th className="text-right py-1.5 font-bold">
                              {hi ? 'मात्रा' : 'Qty'}
                            </th>
                            <th className="text-right py-1.5 font-bold">{hi ? 'दर' : 'Rate'}</th>
                            <th className="text-right py-1.5 font-bold">{hi ? 'योग' : 'Total'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100/60">
                          {items.map((item: BookingItem, i: number) => (
                            <tr key={i} className="text-slate-800">
                              <td className="py-1.5 font-medium">
                                {item.sweetNameHi ?? item.nameHi ?? item.sweetId}
                              </td>
                              <td className="text-right text-slate-600">{item.variantLabel}</td>
                              <td className="text-right font-mono font-medium">
                                {item.quantity}
                              </td>
                              <td className="text-right font-mono text-slate-600">
                                ₹{item.unitPrice}
                              </td>
                              <td className="text-right font-mono font-bold text-amber-950">
                                ₹{item.totalAmount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="text-amber-950 font-bold border-t border-amber-200">
                            <td colSpan={4} className="pt-2">
                              {hi ? 'कुल' : 'Total'}
                            </td>
                            <td className="text-right pt-2 font-mono text-sm">
                              {inr(b.totalAmount ?? 0)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
