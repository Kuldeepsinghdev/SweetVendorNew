'use client';

import { useActionState, useState } from 'react';
import {
  Globe,
  Star,
  BookOpen,
  ScrollText,
  LayoutDashboard,
  CheckCircle,
  AlertCircle,
  Loader2,
  PlusCircle,
  Pencil,
} from 'lucide-react';
import {
  upsertFestivalAction,
  upsertMasterSweetAction,
  type AdminActionState,
} from '@/lib/actions/admin';
import type { SessionUser } from '@/lib/auth/session';
import type { Locale } from '@/src/lib/locale';

type Props = {
  session: SessionUser;
  festivals: any[];
  cities: any[];
  masterSweets: any[];
  saleCenters: any[];
  bookings: any[];
  auditLogs: any[];
  locale: Locale;
};

type Tab = 'summary' | 'festivals' | 'cities' | 'catalog' | 'audit';

const TABS: { id: Tab; labelHi: string; labelEn: string; icon: React.ReactNode }[] = [
  { id: 'summary', labelHi: 'राष्ट्रीय सारांश', labelEn: 'National Summary', icon: <LayoutDashboard size={15} /> },
  { id: 'festivals', labelHi: 'उत्सव', labelEn: 'Festivals', icon: <Star size={15} /> },
  { id: 'cities', labelHi: 'शहर', labelEn: 'Cities', icon: <Globe size={15} /> },
  { id: 'catalog', labelHi: 'मास्टर कैटलॉग', labelEn: 'Master Catalog', icon: <BookOpen size={15} /> },
  { id: 'audit', labelHi: 'ऑडिट लॉग', labelEn: 'Audit Log', icon: <ScrollText size={15} /> },
];

export default function SuperAdminClient({
  session,
  festivals,
  cities,
  masterSweets,
  saleCenters,
  bookings,
  auditLogs,
  locale,
}: Props) {
  const hi = locale === 'hi';
  const [tab, setTab] = useState<Tab>('summary');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-950 via-red-900 to-slate-900 p-5 border border-rose-800/40">
        <h1 className="text-xl font-black text-rose-200">
          {hi ? 'सुपर एडमिन पैनल' : 'Super Admin Panel'}
        </h1>
        <p className="text-xs text-rose-400 mt-0.5">{session.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
              tab === t.id
                ? 'bg-rose-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{hi ? t.labelHi : t.labelEn}</span>
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === 'summary' && (
        <SummaryTab cities={cities} saleCenters={saleCenters} bookings={bookings} hi={hi} />
      )}
      {tab === 'festivals' && (
        <FestivalsTab festivals={festivals} hi={hi} />
      )}
      {tab === 'cities' && (
        <CitiesTab cities={cities} hi={hi} />
      )}
      {tab === 'catalog' && (
        <CatalogTab masterSweets={masterSweets} hi={hi} />
      )}
      {tab === 'audit' && (
        <AuditLogTab logs={auditLogs} hi={hi} />
      )}
    </div>
  );
}

// ─── National Summary Tab ─────────────────────────────────────────────────────

function SummaryTab({
  cities,
  saleCenters,
  bookings,
  hi,
}: {
  cities: any[];
  saleCenters: any[];
  bookings: any[];
  hi: boolean;
}) {
  const totalKg = bookings.reduce((s, b) => s + Number(b.totalKg ?? 0), 0);
  const totalTonnes = (totalKg / 1000).toFixed(2);

  // City-wise demand
  const cityDemand: Record<string, { nameHi: string; nameEn: string; bookings: number; kg: number; amount: number }> = {};
  for (const b of bookings) {
    if (!cityDemand[b.cityId]) {
      const city = cities.find((c) => c.id === b.cityId);
      cityDemand[b.cityId] = {
        nameHi: b.cityNameHi ?? city?.nameHi ?? b.cityId,
        nameEn: city?.nameEn ?? b.cityId,
        bookings: 0,
        kg: 0,
        amount: 0,
      };
    }
    cityDemand[b.cityId].bookings += 1;
    cityDemand[b.cityId].kg += Number(b.totalKg ?? 0);
    cityDemand[b.cityId].amount += Number(b.totalAmount ?? 0);
  }
  const cityRows = Object.entries(cityDemand).sort((a, b) => b[1].kg - a[1].kg);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={hi ? 'शहर' : 'Cities'} value={cities.length} color="rose" />
        <StatCard label={hi ? 'केंद्र' : 'Centres'} value={saleCenters.length} color="red" />
        <StatCard label={hi ? 'कुल बुकिंग' : 'Total Bookings'} value={bookings.length} color="orange" />
        <StatCard label={hi ? 'कुल (टन)' : 'Total (Tonnes)'} value={`${totalTonnes}t`} color="amber" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300 grid grid-cols-4">
          <span>{hi ? 'शहर' : 'City'}</span>
          <span className="text-right">{hi ? 'बुकिंग' : 'Bookings'}</span>
          <span className="text-right">{hi ? 'किलो' : 'Kg'}</span>
          <span className="text-right">{hi ? 'राशि' : 'Amount'}</span>
        </div>
        <div className="divide-y divide-slate-800">
          {cityRows.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">{hi ? 'कोई डेटा नहीं।' : 'No data.'}</p>
          ) : (
            cityRows.map(([id, v]) => (
              <div key={id} className="px-4 py-2.5 grid grid-cols-4 text-sm">
                <span className="text-slate-100">{hi ? v.nameHi : v.nameEn}</span>
                <span className="text-right text-slate-400">{v.bookings}</span>
                <span className="text-right text-rose-300 font-mono">{v.kg.toFixed(1)}</span>
                <span className="text-right text-slate-400 font-mono">₹{v.amount.toLocaleString('en-IN')}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Festivals Tab ────────────────────────────────────────────────────────────

function FestivalsTab({ festivals, hi }: { festivals: any[]; hi: boolean }) {
  const [editingFestival, setEditingFestival] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {/* Festival list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300">{hi ? 'उत्सव सूची' : 'Festival List'}</span>
          <button
            onClick={() => { setEditingFestival(null); setShowForm(true); }}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-bold"
          >
            <PlusCircle size={13} /> {hi ? 'नया' : 'New'}
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {festivals.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">{hi ? 'कोई उत्सव नहीं।' : 'No festivals.'}</p>
          ) : (
            festivals.map((f) => (
              <div key={f.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-100">{f.nameHi}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        f.status === 'active'
                          ? 'bg-emerald-800/60 text-emerald-300'
                          : f.status === 'draft'
                          ? 'bg-amber-800/60 text-amber-300'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{f.nameEn}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {f.startDate} → {f.cutoffDate}
                    {' · '}
                    {hi ? 'वितरण:' : 'Dist:'} {f.distributionStartDate} → {f.distributionEndDate}
                  </p>
                  <p className="text-xs text-slate-500">
                    {hi ? `अधिकतम ${f.maxKgPerBooking} kg/बुकिंग` : `Max ${f.maxKgPerBooking} kg/booking`}
                  </p>
                </div>
                <button
                  onClick={() => { setEditingFestival(f); setShowForm(true); }}
                  className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded shrink-0"
                >
                  <Pencil size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <FestivalForm
          festival={editingFestival}
          hi={hi}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function FestivalForm({ festival, hi, onClose }: { festival: any | null; hi: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    upsertFestivalAction,
    {}
  );

  return (
    <div className="bg-slate-900 border border-rose-700/40 rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-rose-300 text-sm">
        {festival ? (hi ? 'उत्सव संपादित करें' : 'Edit Festival') : (hi ? 'नया उत्सव' : 'New Festival')}
      </h3>

      {state.error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} /> {state.error}
        </div>
      )}
      {state.ok && <p className="text-sm text-emerald-400">✓ {hi ? 'सहेजा गया' : 'Saved'}</p>}

      <form action={formAction} className="space-y-3">
        {festival?.id && <input type="hidden" name="id" value={festival.id} />}

        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'नाम (हिंदी)' : 'Name (Hindi)'}>
            <input type="text" name="nameHi" required defaultValue={festival?.nameHi ?? ''} className={inputCls} />
          </Field>
          <Field label={hi ? 'नाम (अंग्रेज़ी)' : 'Name (English)'}>
            <input type="text" name="nameEn" required defaultValue={festival?.nameEn ?? ''} className={inputCls} />
          </Field>
        </div>

        <Field label={hi ? 'स्थिति' : 'Status'}>
          <select name="status" defaultValue={festival?.status ?? 'draft'} className={inputCls}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'शुरू तारीख' : 'Start Date'}>
            <input type="date" name="startDate" required defaultValue={festival?.startDate ?? ''} className={inputCls} />
          </Field>
          <Field label={hi ? 'अंतिम तारीख' : 'Cutoff Date'}>
            <input type="date" name="cutoffDate" required defaultValue={festival?.cutoffDate ?? ''} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'वितरण शुरू' : 'Distribution Start'}>
            <input type="date" name="distributionStartDate" required defaultValue={festival?.distributionStartDate ?? ''} className={inputCls} />
          </Field>
          <Field label={hi ? 'वितरण समाप्त' : 'Distribution End'}>
            <input type="date" name="distributionEndDate" required defaultValue={festival?.distributionEndDate ?? ''} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'अधिकतम Kg/बुकिंग' : 'Max Kg/Booking'}>
            <input type="number" name="maxKgPerBooking" min="0.5" step="0.5" required defaultValue={festival?.maxKgPerBooking ?? 20} className={inputCls} />
          </Field>
          <Field label={hi ? 'मित्र क्रेडिट सीमा' : 'Mitra Credit Limit'}>
            <input type="number" name="defaultMitraCreditLimit" min="0" required defaultValue={festival?.defaultMitraCreditLimit ?? 25000} className={inputCls} />
          </Field>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm"
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

// ─── Cities Tab ───────────────────────────────────────────────────────────────

function CitiesTab({ cities, hi }: { cities: any[]; hi: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300 grid grid-cols-4">
        <span>{hi ? 'नाम' : 'Name'}</span>
        <span>{hi ? 'राज्य' : 'State'}</span>
        <span>{hi ? 'एडमिन' : 'Admin'}</span>
        <span className="text-right">{hi ? 'स्थिति' : 'Status'}</span>
      </div>
      <div className="divide-y divide-slate-800">
        {cities.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{hi ? 'कोई शहर नहीं।' : 'No cities.'}</p>
        ) : (
          cities.map((c) => (
            <div key={c.id} className="px-4 py-2.5 grid grid-cols-4 text-sm">
              <div>
                <p className="text-slate-100">{hi ? c.nameHi : c.nameEn}</p>
                <p className="text-xs text-slate-500 font-mono">{c.id}</p>
              </div>
              <span className="text-slate-400 self-center">{hi ? c.stateHi : c.stateEn}</span>
              <div className="self-center">
                <p className="text-slate-300 text-xs">{c.adminName}</p>
                <p className="text-slate-500 text-xs">{c.adminPhone}</p>
              </div>
              <div className="text-right self-center">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    c.isActive ? 'bg-emerald-800/50 text-emerald-300' : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {c.isActive ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'निष्क्रिय' : 'Inactive')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Master Catalog Tab ───────────────────────────────────────────────────────

function CatalogTab({ masterSweets, hi }: { masterSweets: any[]; hi: boolean }) {
  const [editingSweet, setEditingSweet] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300">
            {hi ? 'मास्टर मिठाई सूची' : 'Master Sweets'} ({masterSweets.length})
          </span>
          <button
            onClick={() => { setEditingSweet(null); setShowForm(true); }}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-bold"
          >
            <PlusCircle size={13} /> {hi ? 'नई मिठाई' : 'New Sweet'}
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {masterSweets.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">{hi ? 'कोई मिठाई नहीं।' : 'No sweets.'}</p>
          ) : (
            masterSweets.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">{hi ? s.nameHi : s.nameEn}</p>
                  <p className="text-xs text-slate-500">
                    {s.category} · GST {s.gstPercent}%
                    {s.basePrice ? ` · ₹${s.basePrice}/kg` : ''}
                    {' · '}{s.isPureVeg ? '🟢 Veg' : '🔴 Non-veg'}
                  </p>
                </div>
                <button
                  onClick={() => { setEditingSweet(s); setShowForm(true); }}
                  className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded shrink-0"
                >
                  <Pencil size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <MasterSweetForm
          sweet={editingSweet}
          hi={hi}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function MasterSweetForm({ sweet, hi, onClose }: { sweet: any | null; hi: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    upsertMasterSweetAction,
    {}
  );

  const defaultVariants = sweet?.variants
    ? JSON.stringify(sweet.variants)
    : '[{"label":"1kg","weightInKg":1}]';

  return (
    <div className="bg-slate-900 border border-rose-700/40 rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-rose-300 text-sm">
        {sweet ? (hi ? 'मिठाई संपादित करें' : 'Edit Sweet') : (hi ? 'नई मिठाई' : 'New Sweet')}
      </h3>

      {state.error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} /> {state.error}
        </div>
      )}
      {state.ok && <p className="text-sm text-emerald-400">✓ {hi ? 'सहेजा गया' : 'Saved'}</p>}

      <form action={formAction} className="space-y-3">
        <Field label="ID">
          <input
            type="text"
            name="id"
            required
            readOnly={!!sweet}
            defaultValue={sweet?.id ?? ''}
            className={`${inputCls} ${sweet ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'नाम (हिंदी)' : 'Name (Hindi)'}>
            <input type="text" name="nameHi" required defaultValue={sweet?.nameHi ?? ''} className={inputCls} />
          </Field>
          <Field label={hi ? 'नाम (अंग्रेज़ी)' : 'Name (English)'}>
            <input type="text" name="nameEn" required defaultValue={sweet?.nameEn ?? ''} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'श्रेणी' : 'Category'}>
            <select name="category" defaultValue={sweet?.category ?? 'traditional'} className={inputCls}>
              <option value="dry">Dry</option>
              <option value="bengali">Bengali</option>
              <option value="traditional">Traditional</option>
              <option value="gift">Gift</option>
              <option value="mawa">Mawa</option>
            </select>
          </Field>
          <Field label="HSN Code">
            <input type="text" name="hsnCode" defaultValue={sweet?.hsnCode ?? ''} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="GST %">
            <input type="number" name="gstPercent" min="0" max="100" step="0.5" required defaultValue={sweet?.gstPercent ?? 5} className={inputCls} />
          </Field>
          <Field label={hi ? 'आधार मूल्य' : 'Base Price (₹/kg)'}>
            <input type="number" name="basePrice" min="1" step="0.5" defaultValue={sweet?.basePrice ?? ''} className={inputCls} />
          </Field>
          <Field label={hi ? 'शेल्फ लाइफ' : 'Shelf Life (days)'}>
            <input type="number" name="shelfLifeDays" min="1" defaultValue={sweet?.shelfLifeDays ?? ''} className={inputCls} />
          </Field>
        </div>

        <Field label={hi ? 'विवरण (हिंदी)' : 'Description (Hindi)'}>
          <textarea name="descriptionHi" rows={2} defaultValue={sweet?.descriptionHi ?? ''} className={inputCls} />
        </Field>

        <Field label={hi ? 'चित्र URL' : 'Image URL'}>
          <input type="text" name="imageUrl" defaultValue={sweet?.imageUrl ?? ''} className={inputCls} />
        </Field>

        <Field label={hi ? 'वेरिएंट (JSON)' : 'Variants (JSON)'}>
          <textarea name="variants" rows={2} required defaultValue={defaultVariants} className={`${inputCls} font-mono text-xs`} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="isPureVeg" defaultChecked={sweet?.isPureVeg ?? true} className="accent-emerald-500" />
          {hi ? 'शुद्ध शाकाहारी' : 'Pure Veg'}
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm"
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

// ─── Audit Log Tab ────────────────────────────────────────────────────────────

function AuditLogTab({ logs, hi }: { logs: any[]; hi: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
      <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300">
        {hi ? 'हाल की गतिविधियां (अंतिम 100)' : 'Recent Activity (Last 100)'}
      </div>
      {logs.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">{hi ? 'कोई ऑडिट प्रविष्टि नहीं।' : 'No audit entries.'}</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="p-3">
            <p className="text-sm text-slate-100">{log.actionHi}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {log.actor} · {log.timestamp}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-600';

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
  color: 'rose' | 'red' | 'orange' | 'amber';
}) {
  const colorMap = {
    rose: 'from-rose-900/60 border-rose-700/40 text-rose-200',
    red: 'from-red-900/60 border-red-700/40 text-red-200',
    orange: 'from-orange-900/60 border-orange-700/40 text-orange-200',
    amber: 'from-amber-900/60 border-amber-700/40 text-amber-200',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} to-slate-900/80 border rounded-xl p-4`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}
