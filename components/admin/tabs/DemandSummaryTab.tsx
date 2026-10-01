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
        <div className="text-xs bg-purple-900/40 border border-purple-700/40 rounded-lg px-3 py-2 text-purple-300">
          {hi ? 'उत्सव:' : 'Festival:'}{' '}
          <strong>{hi ? (activeFestival as any).nameHi : activeFestival.name}</strong>
          {(activeFestival as any).distributionStartDate && (
            <span className="text-purple-400 ml-2">
              {(activeFestival as any).distributionStartDate} → {(activeFestival as any).distributionEndDate}
            </span>
          )}
        </div>
      )}

      {/* Demand Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300 grid grid-cols-3">
          <span>{hi ? 'मिठाई' : 'Sweet'}</span>
          <span className="text-right">{hi ? 'बुकिंग' : 'Bookings'}</span>
          <span className="text-right">{hi ? 'किलो' : 'Kg'}</span>
        </div>
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {hi ? 'कोई मांग नहीं मिली।' : 'No demand found.'}
          </p>
        ) : (
          rows.map(([key, v]) => (
            <div key={key} className="px-4 py-2.5 border-t border-slate-800 grid grid-cols-3 text-sm">
              <span className="text-slate-100">{hi ? v.nameHi : v.nameEn}</span>
              <span className="text-right text-slate-400">{v.count}</span>
              <span className="text-right text-purple-300 font-mono">{v.totalKg.toFixed(1)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Shared StatCard Component
 * Displays a statistic with label and value in a colored card.
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
  const colorMap = {
    orange: 'from-orange-100 border-orange-200 text-orange-900',
    amber: 'from-amber-100 border-amber-200 text-amber-900',
    emerald: 'from-emerald-100 border-emerald-200 text-emerald-900',
  };
  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color] || colorMap.orange} to-amber-50 border rounded-xl p-4`}
    >
      <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}
