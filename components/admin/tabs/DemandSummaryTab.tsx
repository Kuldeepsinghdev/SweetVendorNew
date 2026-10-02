'use client';

import { TrendingUp } from 'lucide-react';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Demand Summary Tab Component
 * 
 * Displays aggregated sweet demand across all confirmed/pending bookings.
 * Shows total bookings, total kg demand, and per-sweet breakdown.
 * 
 * @component
 * @requirements 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function DemandSummaryTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const { bookings, festivals } = data;

  // Aggregate kg demand per sweet across all confirmed/pending bookings
  const sweetDemand: Record<string, { nameHi: string; nameEn: string; totalKg: number; count: number }> =
    {};

  for (const booking of bookings) {
    if (booking.status === 'delivered') continue;
    const items: any[] = Array.isArray((booking as any).items) ? (booking as any).items : [];
    for (const item of items) {
      const key = item.sweetId ?? item.id ?? 'unknown';
      if (!sweetDemand[key]) {
        sweetDemand[key] = {
          nameHi: item.nameHi ?? item.name ?? key,
          nameEn: item.nameEn ?? item.name ?? key,
          totalKg: 0,
          count: 0,
        };
      }
      sweetDemand[key].totalKg += Number(item.weightInKg ?? item.qty ?? 0);
      sweetDemand[key].count += 1;
    }
  }

  const rows = Object.entries(sweetDemand).sort((a, b) => b[1].totalKg - a[1].totalKg);
  const totalKg = rows.reduce((s, [, v]) => s + v.totalKg, 0);
  const activeFestival = festivals.find((f) => (f as any).status === 'active');

  return (
    <div className="space-y-4">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={hi ? 'कुल बुकिंग' : 'Total Bookings'}
          value={bookings.filter((b) => b.status !== 'delivered').length}
          color="orange"
        />
        <StatCard
          label={hi ? 'कुल किलो मांग' : 'Total Kg Demand'}
          value={`${totalKg.toFixed(1)} kg`}
          color="amber"
        />
      </div>

      {/* Active Festival Notice */}
      {activeFestival && (
        <div className="text-xs bg-amber-100/80 border border-amber-300 rounded-xl px-3.5 py-2.5 text-amber-950 font-medium flex items-center gap-2">
          <span className="font-bold">{hi ? 'सक्रिय उत्सव:' : 'Active Festival:'}</span>
          <span className="text-orange-800 font-bold">
            {hi ? (activeFestival as any).nameHi : activeFestival.name}
          </span>
          {(activeFestival as any).distributionStartDate && (
            <span className="text-amber-800/80 ml-auto font-mono text-[11px]">
              {(activeFestival as any).distributionStartDate} → {(activeFestival as any).distributionEndDate}
            </span>
          )}
        </div>
      )}

      {/* Demand Breakdown Table */}
      <div className="bg-white border border-amber-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-amber-100/70 border-b border-amber-200 text-xs font-bold text-amber-950 grid grid-cols-3">
          <span>{hi ? 'मिठाई' : 'Sweet'}</span>
          <span className="text-right">{hi ? 'बुकिंग' : 'Bookings'}</span>
          <span className="text-right">{hi ? 'किलो' : 'Kg'}</span>
        </div>
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500 text-center">
            {hi ? 'कोई मांग नहीं मिली।' : 'No demand found.'}
          </p>
        ) : (
          rows.map(([key, v]) => (
            <div key={key} className="px-4 py-2.5 border-t border-amber-100/80 grid grid-cols-3 text-sm hover:bg-amber-50/50 transition-colors">
              <span className="text-slate-900 font-medium">{hi ? v.nameHi : v.nameEn}</span>
              <span className="text-right text-slate-600 font-mono">{v.count}</span>
              <span className="text-right text-orange-700 font-bold font-mono">{v.totalKg.toFixed(1)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Shared StatCard Component
 * Displays a statistic with label and value in a warm theme card.
 */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: 'orange' | 'amber' | 'emerald';
}) {
  return (
    <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs">
      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">{label}</p>
      <p className="text-2xl font-black mt-1 text-amber-950 font-mono">{value}</p>
    </div>
  );
}
