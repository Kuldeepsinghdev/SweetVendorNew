'use client';

import { Star } from 'lucide-react';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Festival Management Tab Component
 * 
 * Displays active and upcoming festivals.
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function FestivalManagementTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const festivals = data.festivals || [];

  const activeFestivals = festivals.filter((f) => f.isActive);
  const upcomingFestivals = festivals.filter((f) => !f.isActive && new Date(f.startDate) > new Date());

  return (
    <div className="space-y-4">
      {activeFestivals.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-emerald-300 mb-2">
            {hi ? 'सक्रिय उत्सव' : 'Active Festivals'}
          </h3>
          <div className="space-y-2">
            {activeFestivals.map((f) => (
              <FestivalCard key={f.id} festival={f} hi={hi} isActive />
            ))}
          </div>
        </div>
      )}

      {upcomingFestivals.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-amber-300 mb-2">
            {hi ? 'आने वाले उत्सव' : 'Upcoming Festivals'}
          </h3>
          <div className="space-y-2">
            {upcomingFestivals.map((f) => (
              <FestivalCard key={f.id} festival={f} hi={hi} isActive={false} />
            ))}
          </div>
        </div>
      )}

      {festivals.length === 0 && (
        <p className="text-sm text-slate-500">{hi ? 'कोई उत्सव नहीं।' : 'No festivals.'}</p>
      )}
    </div>
  );
}

function FestivalCard({ festival, hi, isActive }: { festival: any; hi: boolean; isActive: boolean }) {
  return (
    <div className={`border rounded-xl p-3 flex items-start gap-2 ${
      isActive
        ? 'bg-emerald-900/20 border-emerald-700/40'
        : 'bg-slate-900 border-slate-800'
    }`}>
      <Star size={16} className={isActive ? 'text-emerald-400 shrink-0 mt-0.5' : 'text-amber-400 shrink-0 mt-0.5'} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-100">{hi ? festival.nameHi : festival.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {festival.startDate} → {festival.endDate}
        </p>
      </div>
      {isActive && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-300 shrink-0">
          {hi ? 'सक्रिय' : 'Active'}
        </span>
      )}
    </div>
  );
}
