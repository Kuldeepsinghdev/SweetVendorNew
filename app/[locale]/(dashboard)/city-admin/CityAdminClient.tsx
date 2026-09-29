'use client';

import { useActionState, useState, useMemo } from 'react';
import {
  Building2,
  Users,
  ClipboardCheck,
  Tag,
  LayoutDashboard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  PlusCircle,
  BadgePercent,
} from 'lucide-react';
import {
  approveMitraAction,
  rejectMitraAction,
  createSaleCenterAction,
  upsertSweetPricingAction,
  upsertDiscountAction,
  type AdminActionState,
} from '@/lib/actions/admin';
import type { SessionUser } from '@/lib/auth/session';
import type { Locale } from '@/src/lib/locale';

type Props = {
  session: SessionUser;
  mitraApps: any[];
  saleCenters: any[];
  masterSweets: any[];
  bookings: any[];
  discounts: any[];
  cities: any[];
  locale: Locale;
};

type Tab = 'dashboard' | 'mitra' | 'center' | 'pricing' | 'discounts';

const TABS: { id: Tab; labelHi: string; labelEn: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', labelHi: 'डैशबोर्ड', labelEn: 'Dashboard', icon: <LayoutDashboard size={15} /> },
  { id: 'mitra', labelHi: 'मित्र आवेदन', labelEn: 'Mitra Apps', icon: <ClipboardCheck size={15} /> },
  { id: 'center', labelHi: '+ बिक्री केंद्र', labelEn: '+ Sale Centre', icon: <PlusCircle size={15} /> },
  { id: 'pricing', labelHi: 'मूल्य दरें', labelEn: 'Pricing', icon: <Building2 size={15} /> },
  { id: 'discounts', labelHi: 'कूपन/छूट', labelEn: 'Coupons', icon: <BadgePercent size={15} /> },
];

export default function CityAdminClient({
  session,
  mitraApps,
  saleCenters,
  masterSweets,
  bookings,
  discounts,
  cities,
  locale,
}: Props) {
  const hi = locale === 'hi';
  const [tab, setTab] = useState<Tab>('dashboard');

  const pendingApps = mitraApps.filter((a) => a.status === 'pending');

  // City context — city admin manages their city
  const myCity = cities.find((c) => c.adminUserId === session.sub) ?? cities[0];
  const myCityId = myCity?.id ?? '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 p-5 border border-emerald-800/40">
        <h1 className="text-xl font-black text-emerald-200">
          {hi ? 'शहर प्रशासक पैनल' : 'City Admin Panel'}
        </h1>
        <p className="text-xs text-emerald-400 mt-0.5">
          {myCity ? (hi ? myCity.nameHi : myCity.nameEn) : session.name}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
              tab === t.id
                ? 'bg-emerald-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{hi ? t.labelHi : t.labelEn}</span>
            {t.id === 'mitra' && pendingApps.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                {pendingApps.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === 'dashboard' && (
        <DashboardTab
          saleCenters={saleCenters}
          mitraApps={mitraApps}
          bookings={bookings}
          cities={cities}
          hi={hi}
        />
      )}
      {tab === 'mitra' && (
        <MitraAppsTab apps={pendingApps} hi={hi} cityId={myCityId} />
      )}
      {tab === 'center' && (
        <CreateCenterTab cities={cities} session={session} hi={hi} myCityId={myCityId} />
      )}
      {tab === 'pricing' && (
        <PricingTab saleCenters={saleCenters} masterSweets={masterSweets} hi={hi} />
      )}
      {tab === 'discounts' && (
        <DiscountsTab discounts={discounts} cities={cities} hi={hi} myCityId={myCityId} />
      )}
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({
  saleCenters,
  mitraApps,
  bookings,
  cities,
  hi,
}: {
  saleCenters: any[];
  mitraApps: any[];
  bookings: any[];
  cities: any[];
  hi: boolean;
}) {
  // City-wise demand table
  const cityDemand: Record<string, { nameHi: string; bookings: number; kg: number }> = {};
  for (const b of bookings) {
    if (!cityDemand[b.cityId]) {
      const city = cities.find((c) => c.id === b.cityId);
      cityDemand[b.cityId] = { nameHi: b.cityNameHi ?? city?.nameHi ?? b.cityId, bookings: 0, kg: 0 };
    }
    cityDemand[b.cityId].bookings += 1;
    cityDemand[b.cityId].kg += Number(b.totalKg ?? 0);
  }
  const cityRows = Object.entries(cityDemand).sort((a, b) => b[1].kg - a[1].kg);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={hi ? 'बिक्री केंद्र' : 'Sale Centres'} value={saleCenters.length} color="emerald" />
        <StatCard label={hi ? 'सहकार मित्र' : 'Mitras'} value={mitraApps.filter((a) => a.status === 'approved').length} color="teal" />
        <StatCard label={hi ? 'कुल बुकिंग' : 'Bookings'} value={bookings.length} color="cyan" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300">
          {hi ? 'शहर-वार मांग' : 'City-wise Demand'}
        </div>
        <div className="divide-y divide-slate-800">
          {cityRows.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">{hi ? 'कोई डेटा नहीं।' : 'No data.'}</p>
          ) : (
            cityRows.map(([id, v]) => (
              <div key={id} className="px-4 py-2.5 grid grid-cols-3 text-sm">
                <span className="text-slate-100">{v.nameHi}</span>
                <span className="text-right text-slate-400">{v.bookings} {hi ? 'बुकिंग' : 'bookings'}</span>
                <span className="text-right text-emerald-300 font-mono">{v.kg.toFixed(1)} kg</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mitra Apps Tab ───────────────────────────────────────────────────────────

function MitraAppsTab({ apps, hi, cityId }: { apps: any[]; hi: boolean; cityId: string }) {
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
        <MitraAppCard key={app.id} app={app} hi={hi} />
      ))}
    </div>
  );
}

function MitraAppCard({ app, hi }: { app: any; hi: boolean }) {
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
      <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle size={20} className="text-emerald-400 shrink-0" />
        <p className="text-sm text-emerald-300">{hi ? 'स्वीकृत: ' : 'Approved: '}{app.fullName}</p>
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

      {(approveState.error || rejectState.error) && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} />
          {approveState.error ?? rejectState.error}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <form action={approveAction}>
          <input type="hidden" name="appId" value={app.id} />
          <button
            type="submit"
            disabled={approvePending}
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg"
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

// ─── Create Sale Center Tab ───────────────────────────────────────────────────

function CreateCenterTab({
  cities,
  session,
  hi,
  myCityId,
}: {
  cities: any[];
  session: SessionUser;
  hi: boolean;
  myCityId: string;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    createSaleCenterAction,
    {}
  );

  if (state.ok) {
    return (
      <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-6 text-center space-y-2">
        <CheckCircle size={40} className="mx-auto text-emerald-400" />
        <p className="text-emerald-200 font-bold">{hi ? 'बिक्री केंद्र सफलतापूर्वक बनाया गया!' : 'Sale centre created successfully!'}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h2 className="font-bold text-emerald-300">
        {hi ? 'नया बिक्री केंद्र' : 'New Sale Centre'}
      </h2>

      {state.error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} />
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="cityId" value={myCityId} />

        <Field label={hi ? 'केंद्र का नाम (हिंदी)' : 'Centre Name (Hindi)'}>
          <input type="text" name="nameHi" required className={inputCls} />
        </Field>

        <Field label={hi ? 'प्रकार' : 'Type'}>
          <select name="type" required className={inputCls}>
            <option value="standalone">{hi ? 'स्वतंत्र' : 'Standalone'}</option>
            <option value="mitra_kendra">{hi ? 'मित्र केंद्र' : 'Mitra Kendra'}</option>
          </select>
        </Field>

        <Field label={hi ? 'स्वामी का नाम' : 'Owner Name'}>
          <input type="text" name="ownerName" required className={inputCls} />
        </Field>

        <Field label={hi ? 'स्वामी का फ़ोन' : 'Owner Phone'}>
          <input type="tel" name="ownerPhone" maxLength={10} required className={inputCls} />
        </Field>

        <Field label={hi ? 'स्वामी का ईमेल' : 'Owner Email'}>
          <input type="email" name="ownerEmail" className={inputCls} />
        </Field>

        <Field label={hi ? 'पता (हिंदी)' : 'Address (Hindi)'}>
          <textarea name="addressHi" rows={2} className={inputCls} />
        </Field>

        <Field label={hi ? 'पिनकोड' : 'Pincode'}>
          <input type="text" name="pincode" maxLength={16} className={inputCls} />
        </Field>

        <Field label={hi ? 'समय' : 'Timing'}>
          <input type="text" name="timing" placeholder="09:00 AM - 08:00 PM" className={inputCls} />
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
          {hi ? 'केंद्र बनाएं' : 'Create Centre'}
        </button>
      </form>
    </div>
  );
}

// ─── Pricing Tab ──────────────────────────────────────────────────────────────

function PricingTab({
  saleCenters,
  masterSweets,
  hi,
}: {
  saleCenters: any[];
  masterSweets: any[];
  hi: boolean;
}) {
  const [selectedCenter, setSelectedCenter] = useState(saleCenters[0]?.id ?? '');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1">{hi ? 'बिक्री केंद्र चुनें' : 'Select Sale Centre'}</label>
        <select
          value={selectedCenter}
          onChange={(e) => setSelectedCenter(e.target.value)}
          className={inputCls}
        >
          {saleCenters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameHi}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {masterSweets.map((sweet) => (
          <SweetPricingRow key={sweet.id} sweet={sweet} saleCenterId={selectedCenter} hi={hi} />
        ))}
        {masterSweets.length === 0 && (
          <p className="text-sm text-slate-500 p-4">{hi ? 'कोई मिठाई नहीं।' : 'No sweets found.'}</p>
        )}
      </div>
    </div>
  );
}

function SweetPricingRow({
  sweet,
  saleCenterId,
  hi,
}: {
  sweet: any;
  saleCenterId: string;
  hi: boolean;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    upsertSweetPricingAction,
    {}
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-100 truncate">{hi ? sweet.nameHi : sweet.nameEn}</p>
          <p className="text-xs text-slate-500">{sweet.category}</p>
        </div>
        <form action={formAction} className="flex items-center gap-2 shrink-0">
          <input type="hidden" name="saleCenterId" value={saleCenterId} />
          <input type="hidden" name="sweetId" value={sweet.id} />
          <input
            type="number"
            name="pricePerKg"
            min="1"
            step="0.5"
            defaultValue={sweet.basePrice ?? 200}
            required
            className="w-24 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-right"
          />
          <label className="flex items-center gap-1 text-xs text-slate-400">
            <input type="checkbox" name="isActive" defaultChecked className="accent-emerald-500" />
            {hi ? 'सक्रिय' : 'Active'}
          </label>
          <button
            type="submit"
            disabled={pending || !saleCenterId}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg"
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : (hi ? 'सेव' : 'Save')}
          </button>
        </form>
      </div>
      {state.ok && <p className="text-xs text-emerald-400 mt-1">✓ {hi ? 'सहेजा गया' : 'Saved'}</p>}
      {state.error && <p className="text-xs text-red-400 mt-1">{state.error}</p>}
    </div>
  );
}

// ─── Discounts Tab ────────────────────────────────────────────────────────────

function DiscountsTab({
  discounts,
  cities,
  hi,
  myCityId,
}: {
  discounts: any[];
  cities: any[];
  hi: boolean;
  myCityId: string;
}) {
  const [editingDiscount, setEditingDiscount] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    upsertDiscountAction,
    {}
  );

  const myCityDiscounts = discounts.filter((d) => d.cityId === myCityId || !myCityId);

  return (
    <div className="space-y-4">
      {/* Existing coupons */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        <div className="px-4 py-2 bg-slate-800/60 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300">{hi ? 'कूपन सूची' : 'Coupon List'}</span>
          <button
            onClick={() => { setEditingDiscount(null); setShowForm(true); }}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
          >
            <PlusCircle size={13} /> {hi ? 'नया' : 'New'}
          </button>
        </div>
        {myCityDiscounts.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{hi ? 'कोई कूपन नहीं।' : 'No coupons.'}</p>
        ) : (
          myCityDiscounts.map((d) => (
            <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm text-emerald-300">{d.code}</p>
                <p className="text-xs text-slate-400">{d.titleHi}</p>
                <p className="text-xs text-slate-500">
                  {d.discountType === 'percentage' ? `${d.discountValue}%` : `₹${d.discountValue}`}
                  {' · '}{d.isActive ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'निष्क्रिय' : 'Inactive')}
                  {' · '}{hi ? `${d.timesUsed} बार उपयोग` : `Used ${d.timesUsed}x`}
                </p>
              </div>
              <button
                onClick={() => { setEditingDiscount(d); setShowForm(true); }}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-1 rounded"
              >
                {hi ? 'संपादित' : 'Edit'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-slate-900 border border-emerald-700/40 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-emerald-300 text-sm">
            {editingDiscount ? (hi ? 'कूपन संपादित करें' : 'Edit Coupon') : (hi ? 'नया कूपन' : 'New Coupon')}
          </h3>

          {state.error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={14} />
              {state.error}
            </div>
          )}
          {state.ok && (
            <p className="text-sm text-emerald-400">✓ {hi ? 'सहेजा गया' : 'Saved'}</p>
          )}

          <form action={formAction} className="space-y-3">
            {editingDiscount && <input type="hidden" name="id" value={editingDiscount.id} />}
            <input type="hidden" name="cityId" value={myCityId} />

            <Field label={hi ? 'कोड' : 'Code'}>
              <input
                type="text"
                name="code"
                required
                defaultValue={editingDiscount?.code ?? ''}
                className={`${inputCls} uppercase`}
              />
            </Field>

            <Field label={hi ? 'शीर्षक (हिंदी)' : 'Title (Hindi)'}>
              <input type="text" name="titleHi" required defaultValue={editingDiscount?.titleHi ?? ''} className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={hi ? 'प्रकार' : 'Type'}>
                <select name="discountType" defaultValue={editingDiscount?.discountType ?? 'flat'} className={inputCls}>
                  <option value="flat">{hi ? 'फ्लैट' : 'Flat (₹)'}</option>
                  <option value="percentage">{hi ? 'प्रतिशत' : 'Percentage (%)'}</option>
                </select>
              </Field>

              <Field label={hi ? 'मूल्य' : 'Value'}>
                <input
                  type="number"
                  name="discountValue"
                  min="1"
                  required
                  defaultValue={editingDiscount?.discountValue ?? ''}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={hi ? 'न्यूनतम ऑर्डर' : 'Min Order (₹)'}>
                <input type="number" name="minOrderAmount" min="0" defaultValue={editingDiscount?.minOrderAmount ?? 0} className={inputCls} />
              </Field>
              <Field label={hi ? 'अधिकतम छूट' : 'Max Discount (₹)'}>
                <input type="number" name="maxDiscountAmount" min="0" defaultValue={editingDiscount?.maxDiscountAmount ?? ''} className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={hi ? 'शुरू तारीख' : 'Start Date'}>
                <input type="date" name="startDate" defaultValue={editingDiscount?.startDate ?? ''} className={inputCls} />
              </Field>
              <Field label={hi ? 'समाप्ति तारीख' : 'Expiry Date'}>
                <input type="date" name="expiryDate" defaultValue={editingDiscount?.expiryDate ?? ''} className={inputCls} />
              </Field>
            </div>

            <Field label={hi ? 'उपयोग सीमा' : 'Usage Limit'}>
              <input type="number" name="usageLimit" min="0" defaultValue={editingDiscount?.usageLimit ?? ''} className={inputCls} />
            </Field>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="isActive" defaultChecked={editingDiscount?.isActive ?? true} className="accent-emerald-500" />
              {hi ? 'सक्रिय' : 'Active'}
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm"
              >
                {pending ? <Loader2 size={14} className="animate-spin" /> : null}
                {hi ? 'सहेजें' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl text-sm"
              >
                {hi ? 'रद्द' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: 'emerald' | 'teal' | 'cyan';
}) {
  const colorMap = {
    emerald: 'from-emerald-900/60 border-emerald-700/40 text-emerald-200',
    teal: 'from-teal-900/60 border-teal-700/40 text-teal-200',
    cyan: 'from-cyan-900/60 border-cyan-700/40 text-cyan-200',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} to-slate-900/80 border rounded-xl p-4`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}
