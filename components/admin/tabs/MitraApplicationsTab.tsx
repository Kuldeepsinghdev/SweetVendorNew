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
  repairApprovedMitraAction,
  rejectMitraAction,
  type AdminActionState,
} from '@/lib/actions/admin';
import type { SessionUser } from '@/lib/auth/session';
import { isMitraApplicationUnapproved, type TabContentProps } from '@/lib/admin/dashboard-tabs';

export default function MitraApplicationsTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const [activeStatus, setActiveStatus] = useState<'approved' | 'unapproved'>('approved');
  
  // Get the city admin's city
  const myCity = data.cities?.find((c) => c.adminUserId === session.sub) ?? data.cities?.[0];
  const myCityId = myCity?.id ?? '';

  const applications = data.mitraApplications ?? [];
  const approvedApps = applications.filter((app) => app.status === 'approved');
  const unapprovedApps = applications.filter(isMitraApplicationUnapproved);
  const apps = activeStatus === 'approved' ? approvedApps : unapprovedApps;

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label={hi ? 'मित्र आवेदन स्थिति' : 'Mitra application status'} className="flex gap-2 border-b border-slate-700">
        {([
          { id: 'approved', label: hi ? 'स्वीकृत' : 'Approved', count: approvedApps.length },
          { id: 'unapproved', label: hi ? 'अस्वीकृत नहीं' : 'UnApproved', count: unapprovedApps.length },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            id={`mitra-applications-${tab.id}-tab`}
            type="button"
            role="tab"
            aria-selected={activeStatus === tab.id}
            aria-controls="mitra-applications-panel"
            onClick={() => setActiveStatus(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              activeStatus === tab.id
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-75">{tab.count}</span>
          </button>
        ))}
      </div>

      <div id="mitra-applications-panel" role="tabpanel" aria-labelledby={`mitra-applications-${activeStatus}-tab`} className="space-y-3">
        {apps.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <CheckCircle size={40} className="mx-auto mb-2 text-emerald-600 opacity-60" />
            <p>{activeStatus === 'approved'
              ? (hi ? 'कोई स्वीकृत आवेदन नहीं।' : 'No approved applications.')
              : (hi ? 'कोई अस्वीकृत नहीं किया गया आवेदन नहीं।' : 'No unapproved applications.')}</p>
          </div>
        ) : (
          apps.map((app) => (
            <MitraAppCard
              key={app.id}
              app={app}
              hi={hi}
              distributionCenters={data.distributionCenters ?? []}
            />
          ))
        )}
      </div>
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
  const [repairState, repairAction, repairPending] = useActionState<AdminActionState, FormData>(
    repairApprovedMitraAction,
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
  if (repairState.ok) {
    return (
      <div className="bg-green-100 border border-green-300 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle size={20} className="text-green-600 shrink-0" />
        <p className="text-sm text-green-700">
          {hi ? 'मित्र खाता सेटअप हुआ: ' : 'Mitra account set up: '}{app.fullName}
        </p>
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

      {app.distributionCenterIds?.length > 0 || app.centerId ? (
        <p className="text-xs text-amber-400">
          🏪 {hi ? 'चयनित वितरण केंद्र: ' : 'Selected distribution centers: '}
          <span className="font-mono">{(app.distributionCenterIds?.length ? app.distributionCenterIds : [app.centerId]).join(', ')}</span>
        </p>
      ) : null}

      {(approveState.error || rejectState.error || repairState.error) && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} />
          {approveState.error ?? rejectState.error ?? repairState.error}
        </div>
      )}

      {app.status !== 'pending' && (
        <p className={`text-xs font-semibold ${app.status === 'approved' ? 'text-emerald-400' : 'text-slate-400'}`}>
          {app.status === 'approved'
            ? (hi ? 'स्वीकृत' : 'Approved')
            : (hi ? 'अस्वीकृत' : 'Rejected')}
        </p>
      )}

      {app.status === 'approved' && !app.userId && (
        <form action={repairAction} className="space-y-2 rounded-lg border border-amber-700/50 bg-amber-900/20 p-3">
          <input type="hidden" name="appId" value={app.id} />
          <p className="text-xs text-amber-200">
            {hi
              ? 'खाता सेटअप नहीं हुआ। कृपया ऐसा मोबाइल नंबर दें जो किसी अन्य खाते में उपयोग न हो।'
              : 'Account not set up. Enter a phone number that is not used by another account.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              required
              aria-label={hi ? 'नया मोबाइल नंबर' : 'New phone number'}
              placeholder={hi ? '10 अंकों का मोबाइल नंबर' : '10-digit phone number'}
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={repairPending}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-500 disabled:opacity-50"
            >
              {repairPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {hi ? 'खाता सेटअप करें' : 'Set up account'}
            </button>
          </div>
        </form>
      )}

      {/* Approve form with optional DC override */}
      {app.status === 'pending' && <div className="flex gap-2 flex-wrap">
        <form action={approveAction} className="flex flex-col gap-2 flex-1 min-w-0">
          <input type="hidden" name="appId" value={app.id} />
          {distributionCenters.some((dc) => dc.cityId === app.cityId && dc.isActive) && (
            <fieldset className="space-y-2 rounded-lg border border-slate-700 bg-slate-800/60 p-3">
              <legend className="px-1 text-xs font-semibold text-slate-300">
                {hi ? 'स्वीकृति के लिए केंद्र' : 'Centers assigned on approval'}
              </legend>
              {distributionCenters
                .filter((dc) => dc.cityId === app.cityId && dc.isActive)
                .map((dc) => {
                  const selectedIds = app.distributionCenterIds?.length
                    ? app.distributionCenterIds
                    : app.centerId ? [app.centerId] : [];
                  return (
                    <label key={dc.id} className="flex items-start gap-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        name="distributionCenterIds"
                        value={dc.id}
                        defaultChecked={selectedIds.includes(dc.id)}
                        className="mt-0.5 accent-orange-500"
                      />
                      <span>{hi ? dc.nameHi : dc.nameEn}</span>
                    </label>
                  );
                })}
            </fieldset>
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
      </div>}

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
