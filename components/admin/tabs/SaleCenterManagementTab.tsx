'use client';

import { Building2 } from 'lucide-react';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Sale Center Management Tab Component
 * 
 * Displays and manages sale centers for city admin users.
 * Allows viewing existing sale centers.
 * 
 * @requirements 23.1, 23.2, 23.3, 23.5, 13.5
 * @note Create/edit functionality is in Phase 1 task 8 extension
 */
export default function SaleCenterManagementTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const saleCenters = data.saleCenters || [];

  return (
    <div className="space-y-4">
      {/* Sale Centers List */}
      <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
          <h3 className="text-sm font-bold text-amber-900">
            {hi ? 'बिक्री केंद्र' : 'Sale Centres'} ({saleCenters.length})
          </h3>
        </div>

        {saleCenters.length === 0 ? (
          <div className="px-4 py-6 text-center text-amber-900">
            <Building2 size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">{hi ? 'कोई बिक्री केंद्र नहीं।' : 'No sale centres found.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-amber-100">
            {saleCenters.map((center) => (
              <div key={center.id} className="px-4 py-3">
                <p className="font-semibold text-amber-900">{center.name}</p>
                <p className="text-xs text-amber-700">{hi ? 'आईडी:' : 'ID:'} {center.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 italic">
        {hi ? 'संपूर्ण संपादन क्षमता Phase 1 कार्य 8 में होगी।' : 'Full editing capability in Phase 1 task 8.'}
      </p>
    </div>
  );
}
