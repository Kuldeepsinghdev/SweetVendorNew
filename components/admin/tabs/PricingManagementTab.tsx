'use client';

import { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { useActionState } from 'react';
import {
  upsertSweetPricingAction,
  type AdminActionState,
} from '@/lib/actions/admin';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Pricing Management Tab Component
 * 
 * Allows admins to manage sweet prices for sale centers.
 * Server Actions handle authorization and pricing updates.
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function PricingManagementTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const saleCenters = data.saleCenters || [];
  const masterSweets = data.masterSweets || [];

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-400">
        {hi ? 'मिठाई के लिए बिक्री केंद्र-वार कीमतें अपडेट करें।' : 'Update prices for sweets across sale centers.'}
      </div>

      <div className="space-y-3">
        {saleCenters.length === 0 ? (
          <p className="text-sm text-slate-500">{hi ? 'कोई बिक्री केंद्र नहीं।' : 'No sale centers.'}</p>
        ) : (
          saleCenters.map((sc) => (
            <PricingCard key={sc.id} saleCenter={sc} sweets={masterSweets} hi={hi} />
          ))
        )}
      </div>
    </div>
  );
}

function PricingCard({
  saleCenter,
  sweets,
  hi,
}: {
  saleCenter: any;
  sweets: any[];
  hi: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center justify-between"
      >
        <p className="font-bold text-slate-100">{hi ? saleCenter.nameHi : saleCenter.nameEn}</p>
        <span className="text-xs text-slate-500">{sweets.length} {hi ? 'मिठाई' : 'sweets'}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-3">
          {sweets.map((sweet) => (
            <PricingRow key={sweet.id} sweet={sweet} saleCenterId={saleCenter.id} hi={hi} />
          ))}
        </div>
      )}
    </div>
  );
}

function PricingRow({ sweet, saleCenterId, hi }: { sweet: any; saleCenterId: string; hi: boolean }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    upsertSweetPricingAction,
    {}
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="sweetId" value={sweet.id} />
      <input type="hidden" name="saleCenterId" value={saleCenterId} />

      <span className="flex-1 text-sm text-slate-300">{hi ? sweet.nameHi : sweet.nameEn}</span>

      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400">₹</span>
        <input
          type="number"
          name="pricePerKg"
          step="0.01"
          required
          className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          defaultValue={sweet.pricePerKg || ''}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs rounded font-bold flex items-center gap-1"
      >
        {pending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
      </button>

      {state.error && (
        <span className="text-xs text-red-400">{state.error}</span>
      )}
    </form>
  );
}
