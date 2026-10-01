'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, BadgePercent } from 'lucide-react';
import { useActionState } from 'react';
import {
  upsertDiscountAction,
  type AdminActionState,
} from '@/lib/actions/admin';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Discounts/Coupons Tab Component
 * 
 * Manages discount codes and coupons for cities.
 * Server Actions handle authorization and discount creation/updates.
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function DiscountsCouponsTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const discounts = data.discounts || [];
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsCreating(!isCreating)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold flex items-center gap-2"
      >
        <BadgePercent size={16} />
        {hi ? '+ नई छूट' : '+ New Discount'}
      </button>

      {isCreating && (
        <CreateDiscountForm hi={hi} onSuccess={() => setIsCreating(false)} />
      )}

      <div className="space-y-2">
        {discounts.length === 0 ? (
          <p className="text-sm text-slate-500">{hi ? 'कोई छूट नहीं।' : 'No discounts.'}</p>
        ) : (
          discounts.map((discount) => (
            <DiscountCard key={discount.id} discount={discount} hi={hi} />
          ))
        )}
      </div>
    </div>
  );
}

function CreateDiscountForm({ hi, onSuccess }: { hi: boolean; onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    upsertDiscountAction,
    {}
  );

  if (state.ok) {
    onSuccess();
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="action" value="create" />

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            {hi ? 'कूपन कोड' : 'Coupon Code'}
          </label>
          <input
            type="text"
            name="code"
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 uppercase"
            placeholder="e.g., SAVE10"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            {hi ? 'छूट प्रतिशत' : 'Discount %'}
          </label>
          <input
            type="number"
            name="discountPercent"
            required
            step="0.01"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
            min="0"
            max="100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {hi ? 'शुरुआत' : 'Valid From'}
            </label>
            <input
              type="date"
              name="validFrom"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {hi ? 'समाप्ति' : 'Valid Until'}
            </label>
            <input
              type="date"
              name="validUntil"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {state.error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle size={14} />
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          {hi ? 'बनाएं' : 'Create'}
        </button>
      </form>
    </div>
  );
}

function DiscountCard({ discount, hi }: { discount: any; hi: boolean }) {
  const isActive = new Date(discount.validUntil) > new Date();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-purple-300">{discount.code}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isActive
                ? 'bg-emerald-800/40 text-emerald-300'
                : 'bg-slate-700 text-slate-400'
            }`}>
              {isActive ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'समाप्त' : 'Expired')}
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            {discount.discountPercent}% {hi ? 'छूट' : 'off'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {hi ? 'वैध:' : 'Valid:'} {discount.validFrom} → {discount.validUntil}
          </p>
        </div>
      </div>
    </div>
  );
}
