'use client';

import { useActionState, useState, useMemo } from 'react';
import {
  Globe,
  Star,
  BookOpen,
  ScrollText,
  LayoutDashboard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  PlusCircle,
  Pencil,
  Users,
  MapPin,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Building2,
  Tag,
} from 'lucide-react';
import {
  upsertFestivalAction,
  upsertMasterSweetAction,
  upsertCityAction,
  toggleCityActiveAction,
  approveMitraAction,
  rejectMitraAction,
  createSaleCenterAction,
  upsertSweetPricingAction,
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
  distributionCenters: any[];
  mitraApplications: any[];
  locale: Locale;
};

type Tab = 'summary' | 'festivals' | 'cities' | 'mitras' | 'catalog' | 'pricing' | 'bookings' | 'audit';

const TABS: { id: Tab; labelHi: string; labelEn: string; icon: React.ReactNode }[] = [
  { id: 'summary',  labelHi: 'राष्ट्रीय सारांश', labelEn: 'Summary',    icon: <LayoutDashboard size={15} /> },
  { id: 'festivals',labelHi: 'उत्सव',             labelEn: 'Festivals',  icon: <Star size={15} /> },
  { id: 'cities',   labelHi: 'शहर/संगठन',         labelEn: 'Cities',     icon: <Globe size={15} /> },
  { id: 'mitras',   labelHi: 'सहकार मित्र',       labelEn: 'Mitras',     icon: <Users size={15} /> },
  { id: 'catalog',  labelHi: 'मास्टर कैटलॉग',    labelEn: 'Catalog',    icon: <BookOpen size={15} /> },
  { id: 'pricing',  labelHi: 'मूल्य प्रबंधन',     labelEn: 'Pricing',    icon: <Tag size={15} /> },
  { id: 'bookings', labelHi: 'बुकिंग',             labelEn: 'Bookings',   icon: <ShoppingBag size={15} /> },
  { id: 'audit',    labelHi: 'ऑडिट लॉग',          labelEn: 'Audit Log',  icon: <ScrollText size={15} /> },
];

export default function SuperAdminClient({
  session,
  festivals,
  cities,
  masterSweets,
  saleCenters,
  bookings,
  auditLogs,
  distributionCenters,
  mitraApplications,
  locale,
}: Props) {
  const hi = locale === 'hi';
  const [tab, setTab] = useState<Tab>('summary');
  const pendingMitras = mitraApplications.filter((a) => a.status === 'pending');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700 p-5 border border-amber-200/20">
        <h1 className="text-xl font-black text-white">
          {hi ? 'सुपर एडमिन पैनल' : 'Super Admin Panel'}
        </h1>
        <p className="text-xs text-amber-100 mt-0.5">{session.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-amber-200 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
              tab === t.id
                ? 'bg-orange-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-800 hover:bg-amber-50'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{hi ? t.labelHi : t.labelEn}</span>
            {t.id === 'mitras' && pendingMitras.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                {pendingMitras.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === 'summary'  && <SummaryTab cities={cities} saleCenters={saleCenters} bookings={bookings} mitraApplications={mitraApplications} hi={hi} />}
      {tab === 'festivals'&& <FestivalsTab festivals={festivals} hi={hi} />}
      {tab === 'cities'   && <CitiesTab cities={cities} saleCenters={saleCenters} distributionCenters={distributionCenters} hi={hi} />}
      {tab === 'mitras'   && <MitrasTab mitraApplications={mitraApplications} cities={cities} hi={hi} />}
      {tab === 'catalog'  && <CatalogTab masterSweets={masterSweets} hi={hi} />}
      {tab === 'pricing'  && <PricingTab saleCenters={saleCenters} masterSweets={masterSweets} hi={hi} />}
      {tab === 'bookings' && <BookingsTab bookings={bookings} cities={cities} distributionCenters={distributionCenters} hi={hi} />}
      {tab === 'audit'    && <AuditLogTab logs={auditLogs} hi={hi} />}
    </div>
  );
}

// ─── National Summary ─────────────────────────────────────────────────────────

function SummaryTab({ cities, saleCenters, bookings, mitraApplications, hi }: {
  cities: any[]; saleCenters: any[]; bookings: any[]; mitraApplications: any[]; hi: boolean;
}) {
  const totalKg = bookings.reduce((s, b) => s + Number(b.totalKg ?? 0), 0);

  const cityDemand: Record<string, { nameHi: string; nameEn: string; bookings: number; kg: number; amount: number }> = {};
  for (const b of bookings) {
    if (!cityDemand[b.cityId]) {
      const city = cities.find((c) => c.id === b.cityId);
      cityDemand[b.cityId] = { nameHi: b.cityNameHi ?? city?.nameHi ?? b.cityId, nameEn: city?.nameEn ?? b.cityId, bookings: 0, kg: 0, amount: 0 };
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
        <StatCard label={hi ? 'कुल बुकिंग' : 'Bookings'} value={bookings.length} color="orange" />
        <StatCard label={hi ? 'कुल (किग्रा)' : 'Total Kg'} value={`${totalKg.toFixed(1)}`} color="amber" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label={hi ? 'कुल मित्र' : 'Total Mitras'} value={mitraApplications.filter(a => a.status === 'approved').length} color="rose" />
        <StatCard label={hi ? 'लंबित आवेदन' : 'Pending Apps'} value={mitraApplications.filter(a => a.status === 'pending').length} color="red" />
        <StatCard label={hi ? 'कुल राशि (₹)' : 'Total (₹)'} value={`₹${bookings.reduce((s,b)=>s+Number(b.totalAmount??0),0).toLocaleString('en-IN')}`} color="orange" />
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300 grid grid-cols-4">
          <span>{hi ? 'शहर' : 'City'}</span>
          <span className="text-right">{hi ? 'बुकिंग' : 'Bookings'}</span>
          <span className="text-right">{hi ? 'किलो' : 'Kg'}</span>
          <span className="text-right">{hi ? 'राशि' : 'Amount'}</span>
        </div>
        {cityRows.length === 0
          ? <p className="p-4 text-sm text-slate-500">{hi ? 'कोई डेटा नहीं।' : 'No data.'}</p>
          : cityRows.map(([id, v]) => (
            <div key={id} className="px-4 py-2.5 border-t border-slate-800 grid grid-cols-4 text-sm">
              <span className="text-slate-100">{hi ? v.nameHi : v.nameEn}</span>
              <span className="text-right text-slate-400">{v.bookings}</span>
              <span className="text-right text-rose-300 font-mono">{v.kg.toFixed(1)}</span>
              <span className="text-right text-slate-400 font-mono">₹{v.amount.toLocaleString('en-IN')}</span>
            </div>
          ))
        }
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300">{hi ? 'उत्सव सूची' : 'Festival List'}</span>
          <button onClick={() => { setEditingFestival(null); setShowForm(true); }} className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-bold">
            <PlusCircle size={13} /> {hi ? 'नया' : 'New'}
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {festivals.length === 0
            ? <p className="p-4 text-sm text-slate-500">{hi ? 'कोई उत्सव नहीं।' : 'No festivals.'}</p>
            : festivals.map((f) => (
              <div key={f.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-100">{f.nameHi}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${f.status === 'active' ? 'bg-emerald-800/60 text-emerald-300' : f.status === 'draft' ? 'bg-amber-800/60 text-amber-300' : 'bg-slate-700 text-slate-400'}`}>{f.status}</span>
                  </div>
                  <p className="text-xs text-slate-400">{f.nameEn}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.startDate} → {f.cutoffDate} · {hi ? 'वितरण:' : 'Dist:'} {f.distributionStartDate} → {f.distributionEndDate}</p>
                  <p className="text-xs text-slate-500">{hi ? `अधिकतम ${f.maxKgPerBooking} kg/बुकिंग` : `Max ${f.maxKgPerBooking} kg/booking`}</p>
                </div>
                <button onClick={() => { setEditingFestival(f); setShowForm(true); }} className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded shrink-0"><Pencil size={12} /></button>
              </div>
            ))
          }
        </div>
      </div>
      {showForm && <FestivalForm festival={editingFestival} hi={hi} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function FestivalForm({ festival, hi, onClose }: { festival: any | null; hi: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(upsertFestivalAction, {});
  return (
    <div className="bg-slate-900 border border-rose-700/40 rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-rose-300 text-sm">{festival ? (hi ? 'उत्सव संपादित करें' : 'Edit Festival') : (hi ? 'नया उत्सव' : 'New Festival')}</h3>
      {state.error && <div className="flex items-center gap-2 text-sm text-red-400"><AlertCircle size={14} /> {state.error}</div>}
      {state.ok && <p className="text-sm text-emerald-400">✓ {hi ? 'सहेजा गया' : 'Saved'}</p>}
      <form action={formAction} className="space-y-3">
        {festival?.id && <input type="hidden" name="id" value={festival.id} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'नाम (हिंदी)' : 'Name (Hindi)'}><input type="text" name="nameHi" required defaultValue={festival?.nameHi ?? ''} className={inputCls} /></Field>
          <Field label={hi ? 'नाम (अंग्रेज़ी)' : 'Name (English)'}><input type="text" name="nameEn" required defaultValue={festival?.nameEn ?? ''} className={inputCls} /></Field>
        </div>
        <Field label={hi ? 'स्थिति' : 'Status'}>
          <select name="status" defaultValue={festival?.status ?? 'draft'} className={inputCls}>
            <option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'शुरू तारीख' : 'Start Date'}><input type="date" name="startDate" required defaultValue={festival?.startDate ?? ''} className={inputCls} /></Field>
          <Field label={hi ? 'अंतिम तारीख' : 'Cutoff Date'}><input type="date" name="cutoffDate" required defaultValue={festival?.cutoffDate ?? ''} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'वितरण शुरू' : 'Dist. Start'}><input type="date" name="distributionStartDate" required defaultValue={festival?.distributionStartDate ?? ''} className={inputCls} /></Field>
          <Field label={hi ? 'वितरण समाप्त' : 'Dist. End'}><input type="date" name="distributionEndDate" required defaultValue={festival?.distributionEndDate ?? ''} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'अधिकतम Kg/बुकिंग' : 'Max Kg/Booking'}><input type="number" name="maxKgPerBooking" min="0.5" step="0.5" required defaultValue={festival?.maxKgPerBooking ?? 20} className={inputCls} /></Field>
          <Field label={hi ? 'मित्र क्रेडिट सीमा' : 'Mitra Credit Limit'}><input type="number" name="defaultMitraCreditLimit" min="0" required defaultValue={festival?.defaultMitraCreditLimit ?? 25000} className={inputCls} /></Field>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm">
            {pending ? <Loader2 size={14} className="animate-spin" /> : null}{hi ? 'सहेजें' : 'Save'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl text-sm">{hi ? 'रद्द' : 'Cancel'}</button>
        </div>
      </form>
    </div>
  );
}

// ─── Cities / Organisations Tab ───────────────────────────────────────────────

function CitiesTab({ cities, saleCenters, distributionCenters, hi }: { cities: any[]; saleCenters: any[]; distributionCenters: any[]; hi: boolean }) {
  const [editingCity, setEditingCity] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300">{hi ? 'शहर/संगठन' : 'Cities / Organisations'} ({cities.length})</span>
          <button onClick={() => { setEditingCity(null); setShowForm(true); }} className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-bold">
            <PlusCircle size={13} /> {hi ? 'नया शहर' : 'New City'}
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {cities.length === 0
            ? <p className="p-4 text-sm text-slate-500">{hi ? 'कोई शहर नहीं।' : 'No cities.'}</p>
            : cities.map((c) => {
              const citySCs = saleCenters.filter((sc) => sc.cityId === c.id);
              const cityDCs = distributionCenters.filter((dc) => dc.cityId === c.id);
              const isExpanded = expandedCity === c.id;
              return (
                <div key={c.id}>
                  <div className="px-4 py-3 flex items-start gap-3">
                    <button onClick={() => setExpandedCity(isExpanded ? null : c.id)} className="mt-1 text-slate-500 hover:text-slate-300">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-100 text-sm">{hi ? c.nameHi : c.nameEn}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${c.isActive ? 'bg-emerald-800/50 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                          {c.isActive ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'निष्क्रिय' : 'Inactive')}
                        </span>
                        <span className="text-[10px] text-slate-500">{citySCs.length} {hi ? 'केंद्र' : 'centres'} · {cityDCs.length} {hi ? 'वितरण केंद्र' : 'DCs'}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{hi ? c.stateHi : c.stateEn} · {c.adminName} · {c.adminPhone}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => { setEditingCity(c); setShowForm(true); }} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg" title={hi ? 'संपादित' : 'Edit'}><Pencil size={12} /></button>
                      <ToggleCityButton cityId={c.id} isActive={c.isActive} hi={hi} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-10 pb-3 space-y-1">
                      {citySCs.map((sc) => {
                        const scDCs = cityDCs.filter((dc) => dc.saleCenterId === sc.id);
                        return (
                          <div key={sc.id} className="text-xs bg-slate-800/60 rounded-lg px-3 py-2">
                            <p className="font-bold text-slate-200">{hi ? sc.nameHi : sc.nameEn} <span className="text-slate-500 font-normal">({sc.type})</span></p>
                            {scDCs.map((dc) => (
                              <p key={dc.id} className="text-slate-400 ml-3 mt-0.5">↳ {hi ? dc.nameHi : dc.nameEn} — {dc.phone}{dc.contactPerson ? ` (${dc.contactPerson})` : ''}</p>
                            ))}
                          </div>
                        );
                      })}
                      {citySCs.length === 0 && <p className="text-xs text-slate-500 italic">{hi ? 'कोई बिक्री केंद्र नहीं' : 'No sale centres yet'}</p>}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      </div>
      {showForm && <CityForm city={editingCity} hi={hi} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function ToggleCityButton({ cityId, isActive, hi }: { cityId: string; isActive: boolean; hi: boolean }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(toggleCityActiveAction, {});
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={cityId} />
      <button type="submit" disabled={pending} className={`p-1.5 rounded-lg text-xs font-bold ${isActive ? 'bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-red-300' : 'bg-slate-800 hover:bg-emerald-900 text-slate-400 hover:text-emerald-300'}`}
        title={isActive ? (hi ? 'निष्क्रिय करें' : 'Deactivate') : (hi ? 'सक्रिय करें' : 'Activate')}>
        {pending ? <Loader2 size={12} className="animate-spin" /> : (isActive ? '✕' : '✓')}
      </button>
    </form>
  );
}

function CityForm({ city, hi, onClose }: { city: any | null; hi: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(upsertCityAction, {});
  return (
    <div className="bg-slate-900 border border-rose-700/40 rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-rose-300 text-sm">{city ? (hi ? 'शहर संपादित करें' : 'Edit City') : (hi ? 'नया शहर' : 'New City')}</h3>
      {state.error && <div className="flex items-center gap-2 text-sm text-red-400"><AlertCircle size={14} /> {state.error}</div>}
      {state.ok && <p className="text-sm text-emerald-400">✓ {hi ? 'सहेजा गया' : 'Saved'}</p>}
      <form action={formAction} className="space-y-3">
        <Field label="ID (slug, e.g. sawai_madhopur)">
          <input type="text" name="id" required readOnly={!!city} defaultValue={city?.id ?? ''} className={`${inputCls} ${city ? 'opacity-60 cursor-not-allowed' : ''}`} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'नाम (हिंदी)' : 'Name (Hindi)'}><input type="text" name="nameHi" required defaultValue={city?.nameHi ?? ''} className={inputCls} /></Field>
          <Field label={hi ? 'नाम (अंग्रेज़ी)' : 'Name (English)'}><input type="text" name="nameEn" required defaultValue={city?.nameEn ?? ''} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'राज्य (हिंदी)' : 'State (Hindi)'}><input type="text" name="stateHi" required defaultValue={city?.stateHi ?? ''} className={inputCls} /></Field>
          <Field label={hi ? 'राज्य (अंग्रेज़ी)' : 'State (English)'}><input type="text" name="stateEn" defaultValue={city?.stateEn ?? ''} className={inputCls} /></Field>
        </div>
        <Field label={hi ? 'जिला (हिंदी)' : 'District (Hindi)'}><input type="text" name="districtHi" defaultValue={city?.districtHi ?? ''} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'एडमिन नाम' : 'Admin Name'}><input type="text" name="adminName" required defaultValue={city?.adminName ?? ''} className={inputCls} /></Field>
          <Field label={hi ? 'एडमिन फ़ोन' : 'Admin Phone'}><input type="tel" name="adminPhone" maxLength={10} required defaultValue={city?.adminPhone ?? ''} className={inputCls} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="isActive" defaultChecked={city?.isActive ?? true} className="accent-rose-500" />
          {hi ? 'सक्रिय' : 'Active'}
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm">
            {pending ? <Loader2 size={14} className="animate-spin" /> : null}{hi ? 'सहेजें' : 'Save'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl text-sm">{hi ? 'रद्द' : 'Cancel'}</button>
        </div>
      </form>
    </div>
  );
}

// ─── Mitras Tab ───────────────────────────────────────────────────────────────

function MitrasTab({ mitraApplications, cities, hi }: { mitraApplications: any[]; cities: any[]; hi: boolean }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const filtered = filter === 'all' ? mitraApplications : mitraApplications.filter((a) => a.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${filter === f ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
            {f === 'all' ? (hi ? 'सभी' : 'All') : f === 'pending' ? (hi ? 'लंबित' : 'Pending') : f === 'approved' ? (hi ? 'स्वीकृत' : 'Approved') : (hi ? 'अस्वीकृत' : 'Rejected')}
            {' '}({f === 'all' ? mitraApplications.length : mitraApplications.filter(a => a.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <div className="text-center py-10 text-slate-500 text-sm">{hi ? 'कोई आवेदन नहीं।' : 'No applications.'}</div>
        : <div className="space-y-3">{filtered.map((app) => <MitraAppRow key={app.id} app={app} hi={hi} />)}</div>
      }
    </div>
  );
}

function MitraAppRow({ app, hi }: { app: any; hi: boolean }) {
  const [approveState, approveAction, approvePending] = useActionState<AdminActionState, FormData>(approveMitraAction, {});
  const [rejectState, rejectAction, rejectPending] = useActionState<AdminActionState, FormData>(rejectMitraAction, {});
  const [showReject, setShowReject] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isPending = app.status === 'pending';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-100">{app.fullName}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              app.status === 'pending' ? 'bg-amber-800/50 text-amber-300' :
              app.status === 'approved' ? 'bg-emerald-800/50 text-emerald-300' :
              'bg-red-800/50 text-red-300'
            }`}>{app.status}</span>
            <span className="text-[10px] text-slate-500 font-mono">{app.id}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">📞 {app.phone} · {app.cityNameHi}</p>
          {app.email && <p className="text-xs text-slate-500">✉️ {app.email}</p>}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-slate-500 hover:text-slate-300">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="text-xs text-slate-400 space-y-0.5 border-t border-slate-800 pt-2">
          <p>📍 {app.address}{app.pincode ? `, ${app.pincode}` : ''}</p>
          {app.agreedToCenter && <p className="text-teal-400">✓ {hi ? 'मित्र केंद्र बनाने पर सहमति' : 'Agreed to open Mitra Kendra'}</p>}
          {app.rejectionReason && <p className="text-red-400">{hi ? 'कारण: ' : 'Reason: '}{app.rejectionReason}</p>}
          <p className="text-slate-500">{hi ? 'तारीख: ' : 'Date: '}{app.createdAt}</p>
        </div>
      )}

      {(approveState.ok || rejectState.ok) && (
        <p className="text-xs text-emerald-400">✓ {hi ? 'अपडेट हो गया' : 'Updated'}</p>
      )}
      {(approveState.error || rejectState.error) && (
        <p className="text-xs text-red-400">{approveState.error ?? rejectState.error}</p>
      )}

      {isPending && !approveState.ok && !rejectState.ok && (
        <div className="flex gap-2 flex-wrap pt-1">
          <form action={approveAction}>
            <input type="hidden" name="appId" value={app.id} />
            <button type="submit" disabled={approvePending} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg">
              {approvePending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              {hi ? 'स्वीकृत करें' : 'Approve'}
            </button>
          </form>
          <button onClick={() => setShowReject(!showReject)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-slate-700 hover:bg-red-800 text-slate-300 hover:text-white rounded-lg">
            <XCircle size={12} />{hi ? 'अस्वीकृत' : 'Reject'}
          </button>
        </div>
      )}

      {showReject && isPending && (
        <form action={rejectAction} className="flex gap-2">
          <input type="hidden" name="appId" value={app.id} />
          <input type="text" name="reason" required placeholder={hi ? 'कारण…' : 'Reason…'} className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-600" />
          <button type="submit" disabled={rejectPending} className="px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg">
            {rejectPending ? <Loader2 size={12} className="animate-spin" /> : (hi ? 'पुष्टि' : 'Confirm')}
          </button>
        </form>
      )}
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
          <span className="text-xs font-bold text-slate-300">{hi ? 'मास्टर मिठाई सूची' : 'Master Sweets'} ({masterSweets.length})</span>
          <button onClick={() => { setEditingSweet(null); setShowForm(true); }} className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-bold">
            <PlusCircle size={13} /> {hi ? 'नई मिठाई' : 'New Sweet'}
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {masterSweets.length === 0
            ? <p className="p-4 text-sm text-slate-500">{hi ? 'कोई मिठाई नहीं।' : 'No sweets.'}</p>
            : masterSweets.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">{hi ? s.nameHi : s.nameEn}</p>
                  <p className="text-xs text-slate-500">{s.category} · GST {s.gstPercent}%{s.basePrice ? ` · ₹${s.basePrice}/kg` : ''} · {s.isPureVeg ? '🟢 Veg' : '🔴 Non-veg'}</p>
                </div>
                <button onClick={() => { setEditingSweet(s); setShowForm(true); }} className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded shrink-0"><Pencil size={12} /></button>
              </div>
            ))
          }
        </div>
      </div>
      {showForm && <MasterSweetForm sweet={editingSweet} hi={hi} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function MasterSweetForm({ sweet, hi, onClose }: { sweet: any | null; hi: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(upsertMasterSweetAction, {});
  const defaultVariants = sweet?.variants ? JSON.stringify(sweet.variants) : '[{"label":"1 kg (एक किलो)","weightInKg":1},{"label":"500g (आधा किलो)","weightInKg":0.5}]';
  return (
    <div className="bg-slate-900 border border-rose-700/40 rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-rose-300 text-sm">{sweet ? (hi ? 'मिठाई संपादित करें' : 'Edit Sweet') : (hi ? 'नई मिठाई' : 'New Sweet')}</h3>
      {state.error && <div className="flex items-center gap-2 text-sm text-red-400"><AlertCircle size={14} /> {state.error}</div>}
      {state.ok && <p className="text-sm text-emerald-400">✓ {hi ? 'सहेजा गया' : 'Saved'}</p>}
      <form action={formAction} className="space-y-3">
        <Field label="ID"><input type="text" name="id" required readOnly={!!sweet} defaultValue={sweet?.id ?? ''} className={`${inputCls} ${sweet ? 'opacity-60 cursor-not-allowed' : ''}`} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'नाम (हिंदी)' : 'Name (Hindi)'}><input type="text" name="nameHi" required defaultValue={sweet?.nameHi ?? ''} className={inputCls} /></Field>
          <Field label={hi ? 'नाम (अंग्रेज़ी)' : 'Name (English)'}><input type="text" name="nameEn" required defaultValue={sweet?.nameEn ?? ''} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={hi ? 'श्रेणी' : 'Category'}>
            <select name="category" defaultValue={sweet?.category ?? 'traditional'} className={inputCls}>
              <option value="dry">Dry</option><option value="bengali">Bengali</option><option value="traditional">Traditional</option><option value="gift">Gift</option><option value="mawa">Mawa</option>
            </select>
          </Field>
          <Field label="HSN Code"><input type="text" name="hsnCode" defaultValue={sweet?.hsnCode ?? '2106'} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="GST %"><input type="number" name="gstPercent" min="0" max="100" step="0.5" required defaultValue={sweet?.gstPercent ?? 5} className={inputCls} /></Field>
          <Field label={hi ? 'आधार मूल्य (₹/kg)' : 'Base Price (₹/kg)'}><input type="number" name="basePrice" min="1" step="0.5" defaultValue={sweet?.basePrice ?? ''} className={inputCls} /></Field>
          <Field label={hi ? 'शेल्फ लाइफ (दिन)' : 'Shelf Life (days)'}><input type="number" name="shelfLifeDays" min="1" defaultValue={sweet?.shelfLifeDays ?? ''} className={inputCls} /></Field>
        </div>
        <Field label={hi ? 'विवरण (हिंदी)' : 'Description (Hindi)'}><textarea name="descriptionHi" rows={2} defaultValue={sweet?.descriptionHi ?? ''} className={inputCls} /></Field>
        <Field label={hi ? 'चित्र URL' : 'Image URL'}><input type="text" name="imageUrl" defaultValue={sweet?.imageUrl ?? ''} className={inputCls} /></Field>
        <Field label={hi ? 'वेरिएंट (JSON)' : 'Variants (JSON)'}><textarea name="variants" rows={2} required defaultValue={defaultVariants} className={`${inputCls} font-mono text-xs`} /></Field>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="isPureVeg" defaultChecked={sweet?.isPureVeg ?? true} className="accent-emerald-500" />{hi ? 'शुद्ध शाकाहारी' : 'Pure Veg'}
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm">
            {pending ? <Loader2 size={14} className="animate-spin" /> : null}{hi ? 'सहेजें' : 'Save'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl text-sm">{hi ? 'रद्द' : 'Cancel'}</button>
        </div>
      </form>
    </div>
  );
}

// ─── Pricing Management Tab ───────────────────────────────────────────────────

function PricingTab({ saleCenters, masterSweets, hi }: { saleCenters: any[]; masterSweets: any[]; hi: boolean }) {
  const [selectedCenter, setSelectedCenter] = useState(saleCenters[0]?.id ?? '');
  return (
    <div className="space-y-4">
      <Field label={hi ? 'बिक्री केंद्र चुनें' : 'Select Sale Centre'}>
        <select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} className={inputCls}>
          {saleCenters.map((c) => <option key={c.id} value={c.id}>{c.nameHi}</option>)}
        </select>
      </Field>
      <div className="space-y-2">
        {masterSweets.map((sweet) => <PricingRow key={sweet.id} sweet={sweet} saleCenterId={selectedCenter} hi={hi} />)}
        {masterSweets.length === 0 && <p className="text-sm text-slate-500 p-4">{hi ? 'कोई मिठाई नहीं।' : 'No sweets.'}</p>}
      </div>
    </div>
  );
}

function PricingRow({ sweet, saleCenterId, hi }: { sweet: any; saleCenterId: string; hi: boolean }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(upsertSweetPricingAction, {});
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
          <input type="number" name="pricePerKg" min="1" step="0.5" defaultValue={sweet.basePrice ?? 200} required className="w-24 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-600 text-right" />
          <label className="flex items-center gap-1 text-xs text-slate-400">
            <input type="checkbox" name="isActive" defaultChecked className="accent-rose-500" />{hi ? 'सक्रिय' : 'Active'}
          </label>
          <button type="submit" disabled={pending || !saleCenterId} className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg">
            {pending ? <Loader2 size={12} className="animate-spin" /> : (hi ? 'सेव' : 'Save')}
          </button>
        </form>
      </div>
      {state.ok && <p className="text-xs text-emerald-400 mt-1">✓ {hi ? 'सहेजा गया' : 'Saved'}</p>}
      {state.error && <p className="text-xs text-red-400 mt-1">{state.error}</p>}
    </div>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────────

function BookingsTab({ bookings, cities, distributionCenters, hi }: { bookings: any[]; cities: any[]; distributionCenters: any[]; hi: boolean }) {
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filterCity !== 'all' && b.cityId !== filterCity) return false;
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      return true;
    });
  }, [bookings, filterCity, filterStatus]);

  const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div>
          <label className="block text-xs text-slate-400 mb-1">{hi ? 'शहर' : 'City'}</label>
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">{hi ? 'सभी शहर' : 'All Cities'}</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{hi ? c.nameHi : c.nameEn}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">{hi ? 'स्थिति' : 'Status'}</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">{hi ? 'सभी' : 'All'}</option>
            <option value="confirmed">{hi ? 'पुष्टि' : 'Confirmed'}</option>
            <option value="delivered">{hi ? 'डिलीवर' : 'Delivered'}</option>
            <option value="cancelled">{hi ? 'रद्द' : 'Cancelled'}</option>
          </select>
        </div>
        <div className="self-end text-xs text-slate-500">{filtered.length} {hi ? 'बुकिंग' : 'bookings'}</div>
      </div>

      {/* Booking rows */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        {filtered.length === 0
          ? <p className="p-4 text-sm text-slate-500">{hi ? 'कोई बुकिंग नहीं।' : 'No bookings.'}</p>
          : filtered.slice(0, 100).map((b) => {
            const isExp = expandedId === b.id;
            const items: any[] = Array.isArray(b.items) ? b.items : [];
            return (
              <div key={b.id}>
                <button onClick={() => setExpandedId(isExp ? null : b.id)} className="w-full text-left px-4 py-3 hover:bg-slate-800/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-rose-300">{b.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${b.status === 'confirmed' ? 'bg-blue-800/50 text-blue-300' : b.status === 'delivered' ? 'bg-emerald-800/50 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>{b.status}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{b.customer?.name} · {b.customer?.phone} · {b.cityNameHi}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-sm text-slate-100">{inr(b.totalAmount)}</p>
                      <p className="text-xs text-slate-500">{b.totalKg} kg</p>
                    </div>
                    {isExp ? <ChevronUp size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
                  </div>
                </button>
                {isExp && (
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2">
                      <span>{hi ? 'केंद्र:' : 'DC:'} {b.centerNameHi}</span>
                      <span>{hi ? 'भुगतान:' : 'Payment:'} {b.paymentMethod} / {b.paymentStatus}</span>
                      <span>{hi ? 'OTP:' : 'OTP:'} {b.deliveryOtp}</span>
                      <span>{hi ? 'दिनांक:' : 'Date:'} {b.createdAt}</span>
                    </div>
                    {items.length > 0 && (
                      <table className="w-full text-xs border-t border-slate-800 pt-2">
                        <thead><tr className="text-slate-500"><th className="text-left py-1">{hi ? 'मिठाई' : 'Sweet'}</th><th className="text-right py-1">{hi ? 'वेरिएंट' : 'Variant'}</th><th className="text-right py-1">{hi ? 'मात्रा' : 'Qty'}</th><th className="text-right py-1">{hi ? 'दर' : 'Rate'}</th><th className="text-right py-1">{hi ? 'योग' : 'Total'}</th></tr></thead>
                        <tbody>
                          {items.map((item: any, i: number) => (
                            <tr key={i} className="text-slate-300">
                              <td className="py-0.5">{item.sweetNameHi ?? item.nameHi ?? item.sweetId}</td>
                              <td className="text-right">{item.variantLabel}</td>
                              <td className="text-right font-mono">{item.quantity}</td>
                              <td className="text-right font-mono">₹{item.unitPrice}</td>
                              <td className="text-right font-mono">₹{item.totalAmount}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot><tr className="text-slate-100 font-bold border-t border-slate-700"><td colSpan={4} className="pt-1">{hi ? 'कुल' : 'Total'}</td><td className="text-right pt-1 font-mono">{inr(b.totalAmount)}</td></tr></tfoot>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────

function AuditLogTab({ logs, hi }: { logs: any[]; hi: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
      <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300">{hi ? 'हाल की गतिविधियां (अंतिम 100)' : 'Recent Activity (Last 100)'}</div>
      {logs.length === 0
        ? <p className="p-4 text-sm text-slate-500">{hi ? 'कोई ऑडिट प्रविष्टि नहीं।' : 'No audit entries.'}</p>
        : logs.map((log) => (
          <div key={log.id} className="p-3">
            <p className="text-sm text-slate-100">{log.actionHi}</p>
            <p className="text-xs text-slate-500 mt-0.5">{log.actor} · {log.timestamp}</p>
          </div>
        ))
      }
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-600';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: 'rose' | 'red' | 'orange' | 'amber' }) {
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
