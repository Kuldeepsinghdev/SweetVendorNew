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
  MapPin,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  approveMitraAction,
  rejectMitraAction,
  createSaleCenterAction,
  upsertSweetPricingAction,
  upsertDiscountAction,
  upsertDistributionCenterAction,
  toggleDistributionCenterAction,
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
  distributionCenters: any[];
  locale: Locale;
};

type Tab = 'dashboard' | 'mitra' | 'center' | 'dc' | 'pricing' | 'discounts';

const TABS: { id: Tab; labelHi: string; labelEn: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', labelHi: 'डैशबोर्ड', labelEn: 'Dashboard', icon: <LayoutDashboard size={15} /> },
  { id: 'mitra', labelHi: 'मित्र आवेदन', labelEn: 'Mitra Apps', icon: <ClipboardCheck size={15} /> },
  { id: 'center', labelHi: '+ बिक्री केंद्र', labelEn: '+ Sale Centre', icon: <PlusCircle size={15} /> },
  { id: 'dc', labelHi: 'वितरण केंद्र', labelEn: 'Dist. Centers', icon: <MapPin size={15} /> },
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
  distributionCenters,
  locale,
}: Props) {
  const hi = locale === 'hi';
  const [tab, setTab] = useState<Tab>('dashboard');

  const pendingApps = mitraApps.filter((a) => a.status === 'pending');

  const myCity = cities.find((c) => c.adminUserId === session.sub) ?? cities[0];
  const myCityId = myCity?.id ?? '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700 p-5 border border-amber-200/20">
        <h1 className="text-xl font-black text-white">
          {hi ? 'शहर प्रशासक पैनल' : 'City Admin Panel'}
        </h1>
        <p className="text-xs text-amber-100 mt-0.5">
          {myCity ? (hi ? myCity.nameHi : myCity.nameEn) : session.name}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="flex gap-1 bg-white p-1 rounded-xl border border-amber-200 flex-wrap h-auto">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="relative flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg transition-all data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow text-slate-600 hover:text-slate-800 hover:bg-amber-50"
            >
              {t.icon}
              <span className="hidden sm:inline">{hi ? t.labelHi : t.labelEn}</span>
              {t.id === 'mitra' && pendingApps.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                  {pendingApps.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab
            saleCenters={saleCenters}
            mitraApps={mitraApps}
            bookings={bookings}
            cities={cities}
            hi={hi}
          />
        </TabsContent>
        <TabsContent value="mitra">
          <MitraAppsTab apps={pendingApps} hi={hi} cityId={myCityId} distributionCenters={distributionCenters} />
        </TabsContent>
        <TabsContent value="center">
          <CreateCenterTab cities={cities} session={session} hi={hi} myCityId={myCityId} />
        </TabsContent>
        <TabsContent value="dc">
          <DistributionCentersTab
            distributionCenters={distributionCenters}
            saleCenters={saleCenters}
            cities={cities}
            hi={hi}
            myCityId={myCityId}
          />
        </TabsContent>
        <TabsContent value="pricing">
          <PricingTab saleCenters={saleCenters} masterSweets={masterSweets} hi={hi} />
        </TabsContent>
        <TabsContent value="discounts">
          <DiscountsTab discounts={discounts} cities={cities} hi={hi} myCityId={myCityId} />
        </TabsContent>
      </Tabs>
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

      <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-amber-50 text-xs font-bold text-amber-900">
          {hi ? 'शहर-वार मांग' : 'City-wise Demand'}
        </div>
        <div className="divide-y divide-amber-100">
          {cityRows.length === 0 ? (
            <p className="p-4 text-sm text-amber-900">{hi ? 'कोई डेटा नहीं।' : 'No data.'}</p>
          ) : (
            cityRows.map(([id, v]) => (
              <div key={id} className="px-4 py-2.5 grid grid-cols-3 text-sm">
                <span className="text-amber-950">{v.nameHi}</span>
                <span className="text-right text-amber-800">{v.bookings} {hi ? 'बुकिंग' : 'bookings'}</span>
                <span className="text-right text-orange-600 font-mono font-bold">{v.kg.toFixed(1)} kg</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mitra Apps Tab ───────────────────────────────────────────────────────────

function MitraAppsTab({ apps, hi, cityId, distributionCenters }: { apps: any[]; hi: boolean; cityId: string; distributionCenters: any[] }) {
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
        <MitraAppCard key={app.id} app={app} hi={hi} distributionCenters={distributionCenters} />
      ))}
    </div>
  );
}

function MitraAppCard({ app, hi, distributionCenters }: { app: any; hi: boolean; distributionCenters: any[] }) {
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

// ─── Distribution Centers Tab ─────────────────────────────────────────────────

function DistributionCentersTab({
  distributionCenters,
  saleCenters,
  cities,
  hi,
  myCityId,
}: {
  distributionCenters: any[];
  saleCenters: any[];
  cities: any[];
  hi: boolean;
  myCityId: string;
}) {
  const [editingDc, setEditingDc] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Filter DCs for this city's sale centers
  const mySaleCenterIds = new Set(
    saleCenters.filter((sc) => !myCityId || sc.cityId === myCityId).map((sc) => sc.id)
  );
  const myDCs = distributionCenters.filter((dc) => mySaleCenterIds.has(dc.saleCenterId));

  return (
    <div className="space-y-4">
      {/* DC List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300">
            {hi ? 'वितरण केंद्र' : 'Distribution Centers'} ({myDCs.length})
          </span>
          <button
            onClick={() => { setEditingDc(null); setShowForm(true); }}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
          >
            <PlusCircle size={13} /> {hi ? 'नया केंद्र' : 'New Center'}
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {myDCs.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              {hi ? 'कोई वितरण केंद्र नहीं। ऊपर "+ नया केंद्र" पर क्लिक करें।' : 'No distribution centers. Click "+ New Center" above.'}
            </p>
          ) : (
            myDCs.map((dc) => <DcRow key={dc.id} dc={dc} saleCenters={saleCenters} hi={hi} onEdit={() => { setEditingDc(dc); setShowForm(true); }} />)
          )}
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <DcForm
          dc={editingDc}
          saleCenters={saleCenters.filter((sc) => !myCityId || sc.cityId === myCityId)}
          cities={cities}
          myCityId={myCityId}
          hi={hi}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function DcRow({
  dc,
  saleCenters,
  hi,
  onEdit,
}: {
  dc: any;
  saleCenters: any[];
  hi: boolean;
  onEdit: () => void;
}) {
  const [toggleState, toggleAction, togglePending] = useActionState<AdminActionState, FormData>(
    toggleDistributionCenterAction,
    {}
  );
  const sc = saleCenters.find((s) => s.id === dc.saleCenterId);

  return (
    <div className="px-4 py-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-slate-100 text-sm">{hi ? dc.nameHi : dc.nameEn}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            dc.isActive ? 'bg-emerald-800/50 text-emerald-300' : 'bg-slate-700 text-slate-400'
          }`}>
            {dc.isActive ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'निष्क्रिय' : 'Inactive')}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{hi ? dc.addressHi : dc.addressEn}</p>
        {dc.contactPerson && (
          <p className="text-xs text-teal-400 mt-0.5">👤 {dc.contactPerson}</p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">
          📞 {dc.phone}
          {sc && <span className="ml-2">· {hi ? sc.nameHi : sc.nameEn}</span>}
        </p>
        {toggleState.error && <p className="text-xs text-red-400 mt-1">{toggleState.error}</p>}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg"
          title={hi ? 'संपादित करें' : 'Edit'}
        >
          <Pencil size={13} />
        </button>
        <form action={toggleAction}>
          <input type="hidden" name="id" value={dc.id} />
          <button
            type="submit"
            disabled={togglePending}
            className={`p-1.5 rounded-lg text-xs font-bold ${
              dc.isActive
                ? 'bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-red-300'
                : 'bg-slate-800 hover:bg-emerald-900 text-slate-400 hover:text-emerald-300'
            }`}
            title={dc.isActive ? (hi ? 'निष्क्रिय करें' : 'Deactivate') : (hi ? 'सक्रिय करें' : 'Activate')}
          >
            {togglePending ? <Loader2 size={13} className="animate-spin" /> : (dc.isActive ? '✕' : '✓')}
          </button>
        </form>
      </div>
    </div>
  );
}

function DcForm({
  dc,
  saleCenters,
  cities,
  myCityId,
  hi,
  onClose,
}: {
  dc: any | null;
  saleCenters: any[];
  cities: any[];
  myCityId: string;
  hi: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    upsertDistributionCenterAction,
    {}
  );
  const [selectedSaleCenterId, setSelectedSaleCenterId] = useState(dc?.saleCenterId ?? saleCenters[0]?.id ?? '');

  // Auto-resolve cityId from selected sale center
  const resolvedCityId = saleCenters.find((sc) => sc.id === selectedSaleCenterId)?.cityId ?? myCityId;

  return (
    <div className="bg-slate-900 border border-emerald-700/40 rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-emerald-300 text-sm">
        {dc ? (hi ? 'वितरण केंद्र संपादित करें' : 'Edit Distribution Center') : (hi ? 'नया वितरण केंद्र' : 'New Distribution Center')}
      </h3>

      {state.error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} /> {state.error}
        </div>
      )}
      {state.ok && <p className="text-sm text-emerald-400">✓ {hi ? 'सहेजा गया' : 'Saved'}</p>}

      <form action={formAction} className="space-y-3">
        {dc?.id && <input type="hidden" name="id" value={dc.id} />}
        <input type="hidden" name="cityId" value={resolvedCityId} />

        <Field label={hi ? 'बिक्री केंद्र' : 'Sale Centre'}>
          <select
            name="saleCenterId"
            value={selectedSaleCenterId}
            onChange={(e) => setSelectedSaleCenterId(e.target.value)}
            required
            className={inputCls}
          >
            {saleCenters.map((sc) => (
              <option key={sc.id} value={sc.id}>{hi ? sc.nameHi : sc.nameEn}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'नाम (हिंदी)' : 'Name (Hindi)'}>
            <input type="text" name="nameHi" required defaultValue={dc?.nameHi ?? ''} className={inputCls} />
          </Field>
          <Field label={hi ? 'नाम (अंग्रेज़ी)' : 'Name (English)'}>
            <input type="text" name="nameEn" defaultValue={dc?.nameEn ?? ''} className={inputCls} />
          </Field>
        </div>

        <Field label={hi ? 'पता (हिंदी)' : 'Address (Hindi)'}>
          <textarea name="addressHi" rows={2} required defaultValue={dc?.addressHi ?? ''} className={inputCls} />
        </Field>

        <Field label={hi ? 'पता (अंग्रेज़ी)' : 'Address (English)'}>
          <textarea name="addressEn" rows={2} defaultValue={dc?.addressEn ?? ''} className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'फ़ोन (10 अंक)' : 'Phone (10 digits)'}>
            <input type="tel" name="phone" maxLength={10} required defaultValue={dc?.phone ?? ''} className={inputCls} />
          </Field>
          <Field label={hi ? 'पिनकोड' : 'Pincode'}>
            <input type="text" name="pincode" maxLength={16} defaultValue={dc?.pincode ?? ''} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'समय' : 'Timing'}>
            <input type="text" name="timing" placeholder="09:00 AM - 06:00 PM" defaultValue={dc?.timing ?? ''} className={inputCls} />
          </Field>
          <Field label={hi ? 'संपर्क व्यक्ति' : 'Contact Person'}>
            <input type="text" name="contactPerson" maxLength={120} defaultValue={dc?.contactPerson ?? ''} className={inputCls} />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="isActive" defaultChecked={dc?.isActive ?? true} className="accent-emerald-500" />
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
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl text-sm"
          >
            {hi ? 'रद्द' : 'Cancel'}
          </button>
        </div>
      </form>
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
