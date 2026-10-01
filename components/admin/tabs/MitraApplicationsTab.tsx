'use client';

import { useActionState, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  approveMitraAction,
  rejectMitraAction,
  type AdminActionState,
} from '@/lib/actions/admin';
import type { SessionUser } from '@/lib/auth/session';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

export default function MitraApplicationsTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  
  // Get the city admin's city
  const myCity = data.cities?.find((c) => c.adminUserId === session.sub) ?? data.cities?.[0];
  const myCityId = myCity?.id ?? '';
  
  // Filter pending applications
  const apps = data.mitraApplications?.filter((a) => a.status === 'pending') ?? [];
  
  if (apps.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <CheckCircle size={40} className="mx-auto mb-2 text-emerald-600 opacity-60" />
        <p>{hi ? 'कोई लंबित आवेदन नहीं।' : 'No pending applications.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {apps.map((app) => (
        <MitraAppCard 
          key={app.id} 
          app={app} 
          hi={hi} 
          distributionCenters={data.distributionCenters ?? []} 
        />
      ))}
    </div>
  );
}

function MitraAppCard({ 
  app, 
  hi, 
  distributionCenters 
}: { 
  app: any; 
  hi: boolean; 
  distributionCenters: any[] 
}) {
  const [approveState, approveAction, approvePending] = useActionState<AdminActionState, FormData>(
    approveMitraAction,
    {}
  );
  const [rejectState, rejectAction, rejectPending] = useActionState<AdminActionState, FormData>(
    rejectMitraAction,
    {}
  );
  const [showReject, setShowReject] = useState(false);

  if (approveState.ok) {
    return (
      <div className="bg-green-100 border border-green-300 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle size={20} className="text-green-600 shrink-0" />
        <p className="text-sm text-green-700">{hi ? 'स्वीकृत: ' : 'Approved: '}{app.fullName}</p>
      </div>
    );
  }
  if (rejectState.ok) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3 opacity-60">
        <XCircle size={20} className="text-red-400 shrink-0" />
        <p className="text-sm text-slate-400">{hi ? 'अस्वीकृत: ' : 'Rejected: '}{app.fullName}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-slate-100">{app.fullName}</p>
          <p className="text-xs text-slate-400">📞 {app.phone} · {app.cityNameHi}</p>
          {app.email && <p className="text-xs text-slate-500">✉️ {app.email}</p>}
          <p className="text-xs text-slate-500 mt-1">📍 {app.address}</p>
        </div>
        <span className="text-xs bg-amber-800/40 text-amber-300 px-2 py-0.5 rounded-full">{app.id}</span>
      </div>

      {app.agreedToCenter && (
        <p className="text-xs text-teal-400">✓ {hi ? 'मित्र केंद्र बनाने पर सहमति' : 'Agreed to open Mitra Kendra'}</p>
      )}

      {/* Show applicant's requested DC if any */}
      {app.centerId && (
        <p className="text-xs text-amber-400">
          🏪 {hi ? 'अनुरोधित वितरण केंद्र: ' : 'Requested DC: '}
          <span className="font-mono">{app.centerId}</span>
        </p>
      )}

      {(approveState.error || rejectState.error) && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} />
          {approveState.error ?? rejectState.error}
        </div>
      )}

      {/* Approve form with optional DC override */}
      <div className="flex gap-2 flex-wrap">
        <form action={approveAction} className="flex flex-col gap-2 flex-1 min-w-0">
          <input type="hidden" name="appId" value={app.id} />
          {/* DC override — pre-filled with applicant's choice, admin can change */}
          {distributionCenters.filter((dc) => dc.cityId === app.cityId).length > 0 && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {hi ? 'वितरण केंद्र नियुक्त करें' : 'Assign Distribution Center'}
              </label>
              <select
                name="distributionCenterId"
                defaultValue={app.centerId ?? ''}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">{hi ? '— केंद्र चुनें —' : '— Select center —'}</option>
                {distributionCenters
                  .filter((dc) => dc.cityId === app.cityId && dc.isActive)
                  .map((dc) => (
                    <option key={dc.id} value={dc.id}>
                      {hi ? dc.nameHi : dc.nameEn}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={approvePending}
            className="flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg"
          >
            {approvePending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {hi ? 'स्वीकृत करें' : 'Approve'}
          </button>
        </form>

        <button
          onClick={() => setShowReject((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 bg-slate-700 hover:bg-red-800 text-slate-300 hover:text-white rounded-lg"
        >
          <XCircle size={14} />
          {hi ? 'अस्वीकृत' : 'Reject'}
        </button>
      </div>

      {showReject && (
        <form action={rejectAction} className="space-y-2">
          <input type="hidden" name="appId" value={app.id} />
          <input
            type="text"
            name="reason"
            placeholder={hi ? 'अस्वीकृति का कारण…' : 'Reason for rejection…'}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          <button
            type="submit"
            disabled={rejectPending}
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg"
          >
            {rejectPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {hi ? 'अस्वीकृत करें' : 'Confirm Reject'}
          </button>
        </form>
      )}
    </div>
  );
}
