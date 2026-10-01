'use client';

import { BookOpen } from 'lucide-react';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Master Catalog Tab Component
 * 
 * Displays the master catalog of all sweets available in the system.
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function MasterCatalogTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const sweets = data.masterSweets || [];

  const grouped: Record<string, any[]> = {};
  for (const sweet of sweets) {
    const cat = sweet.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(sweet);
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).length === 0 ? (
        <p className="text-sm text-slate-500">{hi ? 'कोई मिठाई नहीं।' : 'No sweets.'}</p>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-bold text-purple-300 mb-2">{category}</h3>
            <div className="space-y-1">
              {items.map((sweet) => (
                <SweetRow key={sweet.id} sweet={sweet} hi={hi} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SweetRow({ sweet, hi }: { sweet: any; hi: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
      <BookOpen size={14} className="text-purple-400 shrink-0" />
      <span className="text-sm text-slate-100">{hi ? sweet.nameHi : sweet.nameEn}</span>
      {sweet.id && (
        <span className="ml-auto text-xs font-mono text-slate-500">{sweet.id}</span>
      )}
    </div>
  );
}
