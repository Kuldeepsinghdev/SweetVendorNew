'use client';

import { useActionState, useState, useMemo } from 'react';
import {
  Package,
  Search,
  CheckCircle,
  ClipboardList,
  Users,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { deliverBookingAction, type DeliverBookingState } from '@/lib/actions/mitra';
import type { SessionUser } from '@/lib/auth/session';
import type { Locale } from '@/src/lib/locale';

type Props = {
  session: SessionUser;
  bookings: any[];
  centers: any[];
  festivals: any[];
  locale: Locale;
};

type Tab = 'demand' | 'bookings' | 'otp' | 'ledger';

const TABS: { id: Tab; labelHi: string; labelEn: string; icon: React.ReactNode }[] = [
  { id: 'demand', labelHi: 'मांग सारांश', labelEn: 'Demand Summary', icon: <TrendingUp size={15} /> },
  { id: 'bookings', labelHi: 'बुकिंग सूची', labelEn: 'Bookings', icon: <ClipboardList size={15} /> },
  { id: 'otp', labelHi: 'OTP डिलीवरी', labelEn: 'OTP Delivery', icon: <Package size={15} /> },
  { id: 'ledger', labelHi: 'मित्र बकाया', labelEn: 'Mitra Ledger', icon: <Users size={15} /> },
];

export default function KendraClient({ session, bookings, centers, festivals, locale }: Props) {
  const hi = locale === 'hi';
  const [tab, setTab] = useState<Tab>('demand');

  // Filter bookings relevant to this kendra's center (matching by ownerUserId → session.sub)
  const myCenter = centers.find(
    (c) => c.ownerUserId === session.sub
  );
  const centerBookings = useMemo(
    () =>
      myCenter
        ? bookings.filter(
            (b) =>
              (b.centerId === myCenter.id || b.saleCenterId === myCenter.id) &&
              (b.status === 'confirmed' ||
                b.status === 'payment_pending' ||
                b.status === 'pending' ||
                b.status === 'delivered')
          )
        : bookings.filter(
            (b) =>
              b.status === 'confirmed' ||
              b.status === 'payment_pending' ||
              b.status === 'pending' ||
              b.status === 'delivered'
          ),
    [bookings, myCenter]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700 p-5 border border-amber-200/20">
        <h1 className="text-xl font-black text-white">
          {hi ? 'बिक्री केंद्र पोर्टल' : 'Sale Centre Portal'}
        </h1>
        <p className="text-xs text-amber-100 mt-0.5">
          {myCenter?.nameHi ?? (hi ? 'केंद्र लोड हो रहा है…' : 'Loading centre…')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="flex gap-1 bg-white p-1 rounded-xl border border-amber-200 h-auto">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg transition-all data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow text-slate-600 hover:text-slate-800 hover:bg-amber-50"
            >
              {t.icon}
              <span className="hidden sm:inline">{hi ? t.labelHi : t.labelEn}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="demand"><DemandSummaryTab bookings={centerBookings} festivals={festivals} hi={hi} /></TabsContent>
        <TabsContent value="bookings"><BookingsListTab bookings={centerBookings} hi={hi} /></TabsContent>
        <TabsContent value="otp"><OTPDeliveryTab bookings={centerBookings} hi={hi} /></TabsContent>
        <TabsContent value="ledger"><MitraLedgerTab bookings={centerBookings} hi={hi} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Demand Summary Tab ───────────────────────────────────────────────────────

function DemandSummaryTab({
  bookings,
  festivals,
  hi,
}: {
  bookings: any[];
  festivals: any[];
  hi: boolean;
}) {
  // Aggregate kg demand per sweet across all confirmed/pending bookings
  const sweetDemand: Record<string, { nameHi: string; nameEn: string; totalKg: number; count: number }> =
    {};

  for (const booking of bookings) {
    if (booking.status === 'delivered') continue;
    const items: any[] = Array.isArray(booking.items) ? booking.items : [];
    for (const item of items) {
      const key = item.sweetId ?? item.id ?? 'unknown';
      if (!sweetDemand[key]) {
        sweetDemand[key] = {
          nameHi: item.nameHi ?? item.name ?? key,
          nameEn: item.nameEn ?? item.name ?? key,
          totalKg: 0,
          count: 0,
        };
      }
      sweetDemand[key].totalKg += Number(item.weightInKg ?? item.qty ?? 0);
      sweetDemand[key].count += 1;
    }
  }

  const rows = Object.entries(sweetDemand).sort((a, b) => b[1].totalKg - a[1].totalKg);
  const totalKg = rows.reduce((s, [, v]) => s + v.totalKg, 0);
  const activeFestival = festivals.find((f) => f.status === 'active');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={hi ? 'कुल बुकिंग' : 'Total Bookings'}
          value={bookings.filter((b) => b.status !== 'delivered').length}
          color="orange"
        />
        <StatCard
          label={hi ? 'कुल किलो मांग' : 'Total Kg Demand'}
          value={`${totalKg.toFixed(1)} kg`}
          color="amber"
        />
      </div>

      {activeFestival && (
        <div className="text-xs bg-purple-900/40 border border-purple-700/40 rounded-lg px-3 py-2 text-purple-300">
          {hi ? 'उत्सव:' : 'Festival:'}{' '}
          <strong>{hi ? activeFestival.nameHi : activeFestival.nameEn}</strong>
          {activeFestival.distributionStartDate && (
            <span className="text-purple-400 ml-2">
              {activeFestival.distributionStartDate} → {activeFestival.distributionEndDate}
            </span>
          )}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300 grid grid-cols-3">
          <span>{hi ? 'मिठाई' : 'Sweet'}</span>
          <span className="text-right">{hi ? 'बुकिंग' : 'Bookings'}</span>
          <span className="text-right">{hi ? 'किलो' : 'Kg'}</span>
        </div>
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {hi ? 'कोई मांग नहीं मिली।' : 'No demand found.'}
          </p>
        ) : (
          rows.map(([key, v]) => (
            <div key={key} className="px-4 py-2.5 border-t border-slate-800 grid grid-cols-3 text-sm">
              <span className="text-slate-100">{hi ? v.nameHi : v.nameEn}</span>
              <span className="text-right text-slate-400">{v.count}</span>
              <span className="text-right text-purple-300 font-mono">{v.totalKg.toFixed(1)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Bookings List Tab ────────────────────────────────────────────────────────

function BookingsListTab({ bookings, hi }: { bookings: any[]; hi: boolean }) {
  const [filter, setFilter] = useState<'all' | 'udhar' | 'mitra'>('all');

  const filtered = useMemo(() => {
    if (filter === 'udhar') return bookings.filter((b) => b.paymentMethod === 'credit');
    if (filter === 'mitra') return bookings.filter((b) => b.bookedByRole === 'mitra');
    return bookings;
  }, [bookings, filter]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['all', 'udhar', 'mitra'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${
              filter === f
                ? 'bg-purple-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'all' ? (hi ? 'सभी' : 'All') : f === 'udhar' ? (hi ? 'उधार' : 'Credit') : (hi ? 'मित्र' : 'Mitra')}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 self-center">{filtered.length} {hi ? 'बुकिंग' : 'bookings'}</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{hi ? 'कोई बुकिंग नहीं।' : 'No bookings.'}</p>
        ) : (
          filtered.map((b) => (
            <BookingRow key={b.id} booking={b} hi={hi} />
          ))
        )}
      </div>
    </div>
  );
}

function BookingRow({ booking: b, hi }: { booking: any; hi: boolean }) {
  const statusColor =
    b.status === 'delivered'
      ? 'text-emerald-400'
      : b.status === 'confirmed'
      ? 'text-blue-400'
      : 'text-amber-400';

  return (
    <div className="p-3 text-sm space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-purple-300">{b.id}</span>
        <span className={`text-xs font-bold ${statusColor}`}>{b.status}</span>
      </div>
      <div className="text-slate-100">{b.customer?.name ?? '—'}</div>
      <div className="text-xs text-slate-400 flex gap-3">
        <span>📞 {b.customer?.phone ?? '—'}</span>
        <span>⚖️ {b.totalKg} kg</span>
        <span>₹{b.totalAmount}</span>
        {b.bookedByRole === 'mitra' && b.mitraName && (
          <span className="text-indigo-400">मित्र: {b.mitraName}</span>
        )}
      </div>
    </div>
  );
}

// ─── OTP Delivery Tab ─────────────────────────────────────────────────────────

function OTPDeliveryTab({ bookings, hi }: { bookings: any[]; hi: boolean }) {
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [state, formAction, pending] = useActionState<DeliverBookingState, FormData>(
    deliverBookingAction,
    {}
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return bookings
      .filter(
        (b) =>
          b.status !== 'delivered' &&
          (b.id.toLowerCase().includes(q) || (b.customer?.phone ?? '').includes(q))
      )
      .slice(0, 8);
  }, [bookings, search]);

  // Auto-select if only one result
  const handleSelectBooking = (b: any) => {
    setSelectedBooking(b);
    setSearch('');
  };

  if (state.invoiceId) {
    return (
      <div className="bg-gradient-to-br from-emerald-900 via-green-950 to-slate-900 border border-emerald-700/40 rounded-2xl p-6 text-center space-y-3">
        <CheckCircle className="mx-auto text-emerald-400" size={48} />
        <h2 className="text-lg font-black text-emerald-200">
          {hi ? 'डिलीवरी सफल!' : 'Delivery Complete!'}
        </h2>
        <p className="text-sm text-emerald-300">
          {hi ? 'बुकिंग:' : 'Booking:'} <strong className="font-mono">{state.bookingId}</strong>
        </p>
        <p className="text-sm text-emerald-300">
          {hi ? 'इनवॉइस:' : 'Invoice:'} <strong className="font-mono">{state.invoiceId}</strong>
        </p>
        <button
          onClick={() => {
            setSelectedBooking(null);
            setSearch('');
          }}
          className="mt-2 px-4 py-2 text-sm font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg"
        >
          {hi ? 'अगली डिलीवरी' : 'Next Delivery'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedBooking(null);
          }}
          placeholder={hi ? 'बुकिंग ID या फ़ोन नंबर खोजें…' : 'Search booking ID or phone…'}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
      </div>

      {/* Search results dropdown */}
      {searchResults.length > 0 && !selectedBooking && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl divide-y divide-slate-800 overflow-hidden">
          {searchResults.map((b) => (
            <button
              key={b.id}
              onClick={() => handleSelectBooking(b)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-mono text-purple-300">{b.id}</p>
                <p className="text-xs text-slate-400">{b.customer?.name} · {b.customer?.phone}</p>
              </div>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300" />
            </button>
          ))}
        </div>
      )}

      {/* Selected booking card */}
      {selectedBooking && !state.invoiceId && (
        <div className="bg-slate-900 border border-purple-700/40 rounded-xl p-4 space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-start">
              <span className="font-mono text-sm text-purple-300">{selectedBooking.id}</span>
              <span className="text-xs bg-amber-800/40 text-amber-300 px-2 py-0.5 rounded-full">
                {selectedBooking.status}
              </span>
            </div>
            <p className="font-bold text-slate-100">{selectedBooking.customer?.name}</p>
            <p className="text-xs text-slate-400">📞 {selectedBooking.customer?.phone}</p>
            <div className="flex gap-4 text-xs text-slate-400 pt-1">
              <span>⚖️ {selectedBooking.totalKg} kg</span>
              <span>₹{selectedBooking.totalAmount}</span>
              <span className="text-slate-500">OTP: ••••</span>
            </div>
            {/* Items summary */}
            {Array.isArray(selectedBooking.items) && selectedBooking.items.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {selectedBooking.items.map((item: any, i: number) => (
                  <div key={i} className="text-xs text-slate-400 flex justify-between">
                    <span>{item.nameHi ?? item.name}</span>
                    <span>{item.weightInKg ?? item.qty} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OTP form */}
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="bookingId" value={selectedBooking.id} />
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {hi ? 'ग्राहक OTP दर्ज करें' : 'Enter Customer OTP'}
              </label>
              <input
                type="text"
                name="otp"
                maxLength={16}
                required
                placeholder="______"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-center text-2xl font-mono tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
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
              className="w-full flex items-center justify-center gap-2 py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-xl transition"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {hi ? 'डिलीवरी पूर्ण करें' : 'Complete Delivery'}
            </button>
          </form>

          <button
            onClick={() => setSelectedBooking(null)}
            className="w-full text-xs text-slate-500 hover:text-slate-300 text-center py-1"
          >
            {hi ? 'रद्द करें' : 'Cancel'}
          </button>
        </div>
      )}

      {!selectedBooking && searchResults.length === 0 && search.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          <Package size={32} className="mx-auto mb-2 opacity-40" />
          {hi ? 'बुकिंग ID या ग्राहक फ़ोन से खोजें।' : 'Search by booking ID or customer phone.'}
        </div>
      )}

      {!selectedBooking && search.length > 0 && searchResults.length === 0 && (
        <div className="text-center py-6 text-slate-500 text-sm">
          {hi ? 'कोई बुकिंग नहीं मिली।' : 'No matching booking found.'}
        </div>
      )}
    </div>
  );
}

// ─── Mitra Ledger Tab ─────────────────────────────────────────────────────────

function MitraLedgerTab({ bookings, hi }: { bookings: any[]; hi: boolean }) {
  // Aggregate outstanding (non-delivered credit bookings) per mitra
  const ledger: Record<
    string,
    { mitraName: string; totalAmount: number; deliveredAmount: number; bookingCount: number }
  > = {};

  for (const b of bookings) {
    if (b.bookedByRole !== 'mitra' || !b.mitraId) continue;
    if (!ledger[b.mitraId]) {
      ledger[b.mitraId] = {
        mitraName: b.mitraName ?? b.mitraId,
        totalAmount: 0,
        deliveredAmount: 0,
        bookingCount: 0,
      };
    }
    ledger[b.mitraId].totalAmount += Number(b.totalAmount ?? 0);
    ledger[b.mitraId].bookingCount += 1;
    if (b.status === 'delivered' && b.paymentStatus === 'paid') {
      ledger[b.mitraId].deliveredAmount += Number(b.totalAmount ?? 0);
    }
  }

  const rows = Object.entries(ledger).sort(
    (a, b) => b[1].totalAmount - b[1].deliveredAmount - (a[1].totalAmount - a[1].deliveredAmount)
  );

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300 grid grid-cols-3">
          <span>{hi ? 'मित्र नाम' : 'Mitra Name'}</span>
          <span className="text-right">{hi ? 'कुल' : 'Total'}</span>
          <span className="text-right">{hi ? 'बकाया' : 'Outstanding'}</span>
        </div>
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {hi ? 'कोई मित्र बुकिंग नहीं।' : 'No mitra bookings.'}
          </p>
        ) : (
          rows.map(([mitraId, v]) => {
            const outstanding = v.totalAmount - v.deliveredAmount;
            return (
              <div key={mitraId} className="px-4 py-2.5 border-t border-slate-800 grid grid-cols-3 text-sm">
                <div>
                  <p className="text-slate-100">{v.mitraName}</p>
                  <p className="text-xs text-slate-500">{v.bookingCount} {hi ? 'बुकिंग' : 'bookings'}</p>
                </div>
                <span className="text-right text-slate-300 font-mono self-center">₹{v.totalAmount.toLocaleString('en-IN')}</span>
                <span
                  className={`text-right font-mono font-bold self-center ${
                    outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  ₹{outstanding.toLocaleString('en-IN')}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Shared StatCard ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: 'orange' | 'amber' | 'emerald' | 'amber';
}) {
  const colorMap = {
    orange: 'from-orange-100 border-orange-200 text-orange-900',
    amber: 'from-amber-100 border-amber-200 text-amber-900',
    emerald: 'from-emerald-100 border-emerald-200 text-emerald-900',
  };
  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color] || colorMap.orange} to-amber-50 border rounded-xl p-4`}
    >
      <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}
