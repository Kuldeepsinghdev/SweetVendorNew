'use client';

import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * National Summary Tab Component
 * 
 * Displays nationwide dashboard overview for super admins.
 * Shows aggregated statistics across all cities and sale centers.
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function NationalSummaryTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const { bookings = [], cities = [], saleCenters = [], mitraApplications = [] } = data;

  const totalKg = bookings.reduce((s, b) => s + Number(b.totalKg ?? 0), 0);
  const totalBookings = bookings.filter(b => b.status !== 'cancelled').length;
  const pendingMitras = mitraApplications.filter(m => m.status === 'pending').length;

  const cityDemand: Record<string, { nameHi: string; bookings: number; kg: number }> = {};
  for (const b of bookings) {
    if (!cityDemand[b.cityId]) {
      const city = cities.find((c) => c.id === b.cityId);
      cityDemand[b.cityId] = {
        nameHi: b.cityNameHi ?? city?.nameHi ?? b.cityId,
        bookings: 0,
        kg: 0,
      };
    }
    cityDemand[b.cityId].bookings += 1;
    cityDemand[b.cityId].kg += Number(b.totalKg ?? 0);
  }

  const cityRows = Object.entries(cityDemand).sort((a, b) => b[1].kg - a[1].kg);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={hi ? 'कुल शहर' : 'Total Cities'} value={cities.length} />
        <StatCard label={hi ? 'बिक्री केंद्र' : 'Sale Centers'} value={saleCenters.length} />
        <StatCard label={hi ? 'कुल बुकिंग' : 'Bookings'} value={totalBookings} />
        <StatCard label={hi ? 'कुल किग्रा' : 'Total Kg'} value={`${totalKg.toFixed(1)}`} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300 grid grid-cols-3">
          <span>{hi ? 'शहर' : 'City'}</span>
          <span className="text-right">{hi ? 'बुकिंग' : 'Bookings'}</span>
          <span className="text-right">{hi ? 'किलो' : 'Kg'}</span>
        </div>
        {cityRows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{hi ? 'कोई डेटा नहीं।' : 'No data.'}</p>
        ) : (
          cityRows.map(([id, v]) => (
            <div key={id} className="px-4 py-2.5 border-t border-slate-800 grid grid-cols-3 text-sm">
              <span className="text-slate-100">{v.nameHi}</span>
              <span className="text-right text-slate-400">{v.bookings}</span>
              <span className="text-right text-amber-300 font-mono">{v.kg.toFixed(1)}</span>
            </div>
          ))
        )}
      </div>

      {pendingMitras > 0 && (
        <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl p-3">
          <p className="text-sm text-amber-300">
            {pendingMitras} {hi ? 'लंबित आवेदन' : 'pending applications'}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-3">
      <p className="text-xs uppercase tracking-widest font-semibold text-slate-500">{label}</p>
      <p className="text-lg font-black mt-1 text-slate-100">{value}</p>
    </div>
  );
}
