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
      <div className="flex gap-3 flex-wrap">
        {showCityFilter && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {hi ? 'शहर' : 'City'}
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-600"
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
          <label className="block text-xs text-slate-400 mb-1">
            {hi ? 'स्थिति' : 'Status'}
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-600"
          >
            <option value="all">{hi ? 'सभी' : 'All'}</option>
            <option value="confirmed">{hi ? 'पुष्टि' : 'Confirmed'}</option>
            <option value="delivered">{hi ? 'डिलीवर' : 'Delivered'}</option>
            <option value="cancelled">{hi ? 'रद्द' : 'Cancelled'}</option>
          </select>
        </div>
        <div className="self-end text-xs text-slate-500">
          {filtered.length} {hi ? 'बुकिंग' : 'bookings'}
        </div>
      </div>

      {/* Booking rows */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
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
                  className="w-full text-left px-4 py-3 hover:bg-slate-800/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-rose-300">{b.id}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            b.status === 'confirmed'
                              ? 'bg-blue-800/50 text-blue-300'
                              : b.status === 'delivered'
                              ? 'bg-emerald-800/50 text-emerald-300'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {b.customer?.name} · {b.customer?.phone}
                        {b.cityNameHi && ` · ${b.cityNameHi}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-sm text-slate-100">
                        {inr(b.totalAmount ?? 0)}
                      </p>
                      <p className="text-xs text-slate-500">{b.totalKg} kg</p>
                    </div>
                    {isExp ? (
                      <ChevronUp size={14} className="text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown size={14} className="text-slate-500 shrink-0" />
                    )}
                  </div>
                </button>
                {isExp && (
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2">
                      {b.centerNameHi && (
                        <span>
                          {hi ? 'केंद्र:' : 'DC:'} {b.centerNameHi}
                        </span>
                      )}
                      {b.paymentMethod && b.paymentStatus && (
                        <span>
                          {hi ? 'भुगतान:' : 'Payment:'} {b.paymentMethod} /{' '}
                          {b.paymentStatus}
                        </span>
                      )}
                      {b.deliveryOtp && (
                        <span>
                          {hi ? 'OTP:' : 'OTP:'} {b.deliveryOtp}
                        </span>
                      )}
                      {b.createdAt && (
                        <span>
                          {hi ? 'दिनांक:' : 'Date:'} {typeof b.createdAt === 'string' ? b.createdAt : b.createdAt.toString()}
                        </span>
                      )}
                    </div>
                    {items.length > 0 && (
                      <table className="w-full text-xs border-t border-slate-800 pt-2">
                        <thead>
                          <tr className="text-slate-500">
                            <th className="text-left py-1">{hi ? 'मिठाई' : 'Sweet'}</th>
                            <th className="text-right py-1">
                              {hi ? 'वेरिएंट' : 'Variant'}
                            </th>
                            <th className="text-right py-1">
                              {hi ? 'मात्रा' : 'Qty'}
                            </th>
                            <th className="text-right py-1">{hi ? 'दर' : 'Rate'}</th>
                            <th className="text-right py-1">{hi ? 'योग' : 'Total'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item: BookingItem, i: number) => (
                            <tr key={i} className="text-slate-300">
                              <td className="py-0.5">
                                {item.sweetNameHi ?? item.nameHi ?? item.sweetId}
                              </td>
                              <td className="text-right">{item.variantLabel}</td>
                              <td className="text-right font-mono">
                                {item.quantity}
                              </td>
                              <td className="text-right font-mono">
                                ₹{item.unitPrice}
                              </td>
                              <td className="text-right font-mono">
                                ₹{item.totalAmount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="text-slate-100 font-bold border-t border-slate-700">
                            <td colSpan={4} className="pt-1">
                              {hi ? 'कुल' : 'Total'}
                            </td>
                            <td className="text-right pt-1 font-mono">
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
