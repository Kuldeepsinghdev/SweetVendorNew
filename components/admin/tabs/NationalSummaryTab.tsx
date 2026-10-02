'use client';

import {
  CalendarDays,
  MapPin,
  Package,
  ShoppingBag,
  Store,
  Users,
  Weight,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { isMitraApplicationUnapproved, type TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * National Summary Tab Component
 * 
 * Displays nationwide dashboard overview for super admins.
 * Shows aggregated statistics across all cities and sale centers.
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function NationalSummaryTab({ data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const bookings = data.bookings ?? [];
  const cities = data.allCities ?? data.cities ?? [];
  const saleCenters = data.allSaleCenters ?? data.saleCenters ?? [];
  const distributionCenters = data.distributionCenters ?? [];
  const mitraApplications = data.mitraApplications ?? [];
  const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled');

  const totalKg = activeBookings.reduce((sum, booking) => sum + Number(booking.totalKg ?? 0), 0);
  const totalBookings = activeBookings.length;
  const unapprovedMitras = mitraApplications.filter(isMitraApplicationUnapproved).length;
  const activeCityCount = cities.filter((city) => city.isActive !== false).length;
  const activeSaleCenterCount = saleCenters.filter((center) => center.isActive !== false).length;
  const activeDistributionCenterCount = distributionCenters.filter((center) => center.isActive !== false).length;

  const cityRows = cities.map((city) => {
    const cityBookings = activeBookings.filter((booking) => booking.cityId === city.id);
    const cityName = (hi ? city.nameHi : city.nameEn)?.trim() || city.nameHi?.trim() || city.nameEn?.trim() || city.id;
    return {
      city,
      cityName,
      bookings: cityBookings.length,
      kg: cityBookings.reduce((sum, booking) => sum + Number(booking.totalKg ?? 0), 0),
      saleCenters: saleCenters.filter((center) => center.cityId === city.id && center.isActive !== false).length,
      unapprovedMitras: mitraApplications.filter((application) => application.cityId === city.id && isMitraApplicationUnapproved(application)).length,
    };
  }).sort((a, b) => b.kg - a.kg || a.cityName.localeCompare(b.cityName));

  const activeFestivals = data.festivals.filter((festival) => festival.status === 'active');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label={hi ? 'सक्रिय शहर' : 'Active cities'}
          value={activeCityCount}
          detail={hi ? `${cities.length} कुल शहर` : `${cities.length} total cities`}
          icon={<MapPin size={17} />}
          tone="orange"
        />
        <StatCard
          label={hi ? 'बिक्री केंद्र' : 'Sale centers'}
          value={activeSaleCenterCount}
          detail={hi ? 'सक्रिय केंद्र' : 'Active centers'}
          icon={<Store size={17} />}
          tone="blue"
        />
        <StatCard
          label={hi ? 'संग्रह केंद्र' : 'Pickup centers'}
          value={activeDistributionCenterCount}
          detail={hi ? 'सक्रिय केंद्र' : 'Active centers'}
          icon={<ShoppingBag size={17} />}
          tone="teal"
        />
        <StatCard
          label={hi ? 'बुकिंग' : 'Bookings'}
          value={totalBookings}
          detail={hi ? 'रद्द बुकिंग छोड़कर' : 'Excludes cancelled bookings'}
          icon={<Package size={17} />}
          tone="green"
        />
        <StatCard
          label={hi ? 'कुल मात्रा' : 'Total volume'}
          value={`${totalKg.toFixed(1)} kg`}
          detail={hi ? 'बुक की गई मात्रा' : 'Booked quantity'}
          icon={<Weight size={17} />}
          tone="amber"
        />
        <StatCard
          label={hi ? 'स्वीकृत नहीं हुए मित्र आवेदन' : 'Unapproved Mitra applications'}
          value={unapprovedMitras}
          detail={hi ? `${mitraApplications.length} कुल आवेदन` : `${mitraApplications.length} total applications`}
          icon={<Users size={17} />}
          tone="rose"
        />
      </div>

      {activeFestivals.length > 0 && (
        <section className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-orange-950">
            <CalendarDays size={17} className="text-orange-700" />
            {hi ? 'सक्रिय उत्सव' : 'Active festivals'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeFestivals.map((festival) => (
              <div key={festival.id} className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs">
                <span className="font-bold text-slate-900">{hi ? festival.nameHi : festival.nameEn || festival.name}</span>
                <span className="ml-2 text-slate-600">
                  {hi ? 'बुकिंग कटऑफ़' : 'Booking cutoff'}: {festival.cutoffDate || '—'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <h2 className="text-sm font-bold text-amber-950">
            {hi ? 'शहर के अनुसार प्रदर्शन' : 'Performance by city'}
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            {hi ? 'बुकिंग, मात्रा, केंद्र और गैर-स्वीकृत आवेदन' : 'Bookings, volume, centers, and unapproved applications'}
          </p>
        </div>

        {cityRows.length === 0 ? (
          <p className="p-5 text-sm text-slate-600">{hi ? 'कोई शहर उपलब्ध नहीं।' : 'No cities available.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">{hi ? 'शहर' : 'City'}</th>
                  <th className="px-3 py-3 text-right">{hi ? 'बिक्री केंद्र' : 'Sale centers'}</th>
                  <th className="px-3 py-3 text-right">{hi ? 'बुकिंग' : 'Bookings'}</th>
                  <th className="px-3 py-3 text-right">{hi ? 'किलो' : 'Kg'}</th>
                  <th className="px-4 py-3 text-right">{hi ? 'गैर-स्वीकृत मित्र' : 'Unapproved Mitras'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cityRows.map((row) => {
                  const location = [row.city.districtHi, hi ? row.city.stateHi : row.city.stateEn].filter(Boolean).join(', ');
                  return (
                    <tr key={row.city.id} className="align-top hover:bg-amber-50/60">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{row.cityName}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{location || row.city.id}</p>
                        {row.city.adminName && (
                          <p className="mt-1 text-xs text-slate-500">
                            {hi ? 'व्यवस्थापक' : 'Admin'}: {row.city.adminName}{row.city.adminPhone ? ` · ${row.city.adminPhone}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-blue-800">{row.saleCenters}</td>
                      <td className="px-3 py-3 text-right font-semibold text-emerald-800">{row.bookings}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-amber-800">{row.kg.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-700">{row.unapprovedMitras}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 font-bold text-slate-900">
                <tr>
                  <td className="px-4 py-3">{hi ? 'कुल' : 'Total'}</td>
                  <td className="px-3 py-3 text-right">{activeSaleCenterCount}</td>
                  <td className="px-3 py-3 text-right">{totalBookings}</td>
                  <td className="px-3 py-3 text-right font-mono">{totalKg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right">{unapprovedMitras}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  tone: 'orange' | 'blue' | 'teal' | 'green' | 'amber' | 'rose';
}) {
  const tones = {
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    teal: 'border-teal-200 bg-teal-50 text-teal-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-slate-600">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black leading-none text-slate-950">{value}</p>
      <p className="mt-1.5 text-xs text-slate-600">{detail}</p>
    </article>
  );
}
