'use client';

import { useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useActionState } from 'react';
import {
  upsertDistributionCenterAction,
  toggleDistributionCenterAction,
  type AdminActionState,
} from '@/lib/actions/admin';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Distribution Centers Tab Component
 * 
 * Allows city admins to manage distribution centers (DCs) for their city.
 * Features create/edit DCs and toggle active status.
 * 
 * Authorization is enforced server-side in Server Actions.
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function DistributionCentersTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const distributionCenters = data.distributionCenters || [];
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-4">
      {/* Create DC Button */}
      <button
        onClick={() => setIsCreating(!isCreating)}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold"
      >
        {hi ? '+ नया केंद्र' : '+ New Center'}
      </button>

      {/* Create DC Form */}
      {isCreating && (
        <CreateDistributionCenterForm hi={hi} onSuccess={() => setIsCreating(false)} />
      )}

      {/* DC List */}
      <div className="space-y-2">
        {distributionCenters.length === 0 ? (
          <p className="text-sm text-slate-500">{hi ? 'कोई वितरण केंद्र नहीं।' : 'No distribution centers.'}</p>
        ) : (
          distributionCenters.map((dc) => (
            <DistributionCenterCard key={dc.id} dc={dc} hi={hi} />
          ))
        )}
      </div>
    </div>
  );
}

function CreateDistributionCenterForm({ hi, onSuccess }: { hi: boolean; onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    upsertDistributionCenterAction,
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
            {hi ? 'नाम (हिंदी)' : 'Name (Hindi)'}
          </label>
          <input
            type="text"
            name="nameHi"
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            {hi ? 'नाम (अंग्रेजी)' : 'Name (English)'}
          </label>
          <input
            type="text"
            name="nameEn"
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            {hi ? 'पता' : 'Address'}
          </label>
          <input
            type="text"
            name="address"
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
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
          className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          {hi ? 'बनाएं' : 'Create'}
        </button>
      </form>
    </div>
  );
}

function DistributionCenterCard({ dc, hi }: { dc: any; hi: boolean }) {
  const [toggleState, toggleAction, togglePending] = useActionState<AdminActionState, FormData>(
    toggleDistributionCenterAction,
    {}
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
      <div className="flex-1">
        <p className="font-bold text-slate-100">{hi ? dc.nameHi : dc.nameEn}</p>
        <p className="text-xs text-slate-500">📍 {dc.address}</p>
      </div>
      <form action={toggleAction}>
        <input type="hidden" name="dcId" value={dc.id} />
        <button
          type="submit"
          disabled={togglePending}
          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
            dc.isActive
              ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          } disabled:opacity-50`}
        >
          {togglePending && <Loader2 size={12} className="animate-spin" />}
          {dc.isActive ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'निष्क्रिय' : 'Inactive')}
        </button>
      </form>
    </div>
  );
}
