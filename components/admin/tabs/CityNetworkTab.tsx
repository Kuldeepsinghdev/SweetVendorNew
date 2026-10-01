'use client';

import { MapPin } from 'lucide-react';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * City Network Tab Component
 * 
 * Displays all cities in the network with basic information.
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function CityNetworkTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const cities = data.allCities || data.cities || [];

  return (
    <div className="space-y-3">
      {cities.length === 0 ? (
        <p className="text-sm text-slate-500">{hi ? 'कोई शहर नहीं।' : 'No cities.'}</p>
      ) : (
        cities.map((city) => (
          <CityCard key={city.id} city={city} hi={hi} />
        ))
      )}
    </div>
  );
}

function CityCard({ city, hi }: { city: any; hi: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-2">
      <MapPin size={16} className="text-blue-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-100">{hi ? city.nameHi : city.nameEn}</p>
        {city.adminUserId && (
          <p className="text-xs text-slate-500 mt-0.5">
            {hi ? 'व्यवस्थापक:' : 'Admin:'} {city.adminUserId}
          </p>
        )}
      </div>
    </div>
  );
}
