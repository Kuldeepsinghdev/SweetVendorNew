'use client';

/**
 * Mitra portal client island (Task 9).
 *
 * Receives pre-loaded data from the Server Component page. Manages tab state
 * and renders the mitra dashboard: stats, bookings, and a link to the checkout
 * flow for new bookings. The booking write uses the existing createBookingAction
 * via the standard cart+checkout flow at /[locale]/checkout.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  Plus,
  ShoppingBag,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Phone,
  Package,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { customerLogoutAction } from '@/lib/actions/customerAuth';
import type { Locale } from '@/src/lib/locale';

interface MitraPortalClientProps {
  locale: Locale;
  session: {
    sub: string;
    name: string;
    phone: string;
    centerId?: string | null;
    cityId?: string | null;
  };
  bookings: any[];
  festivals: any[];
  cities: any[];
  checkoutHref: string;
  assignedDcNameHi?: string | null;
  assignedDcNameEn?: string | null;
}

type Tab = 'dashboard' | 'bookings' | 'new_booking';

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function statusBadge(status: string, hi: boolean) {
  const map: Record<string, { bg: string; label: string; labelHi: string }> = {
    confirmed: { bg: 'bg-blue-100 text-blue-800', label: 'Confirmed', labelHi: 'पुष्टि' },
    delivered: { bg: 'bg-emerald-100 text-emerald-800', label: 'Delivered', labelHi: 'डिलीवर' },
    cancelled: { bg: 'bg-rose-100 text-rose-800', label: 'Cancelled', labelHi: 'रद्द' },
    payment_pending: { bg: 'bg-amber-100 text-amber-800', label: 'Pmt Pending', labelHi: 'भुगतान बाकी' },
  };
  const s = map[status] ?? { bg: 'bg-slate-100 text-slate-700', label: status, labelHi: status };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${s.bg}`}>
      {hi ? s.labelHi : s.label}
    </span>
  );
}

export function MitraPortalClient({
  locale,
  session,
  bookings,
  festivals,
  cities,
  checkoutHref,
  assignedDcNameHi,
  assignedDcNameEn,
}: MitraPortalClientProps) {
  const hi = locale === 'hi';
  const [tab, setTab] = useState<Tab>('dashboard');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'udhar' | 'delivered'>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const totalKg = bookings.reduce((s, b) => s + (b.totalKg ?? 0), 0);
  const totalValue = bookings.reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const udharOutstanding = bookings
    .filter((b) => b.paymentMethod === 'udhar' && b.paymentStatus === 'udhar_outstanding')
    .reduce((s, b) => s + (b.totalAmount ?? 0), 0);

  const activeFestival = festivals.find((f) => f.status === 'active') ?? festivals[0];
  const cityName = cities.find((c) => c.id === session.cityId);

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'udhar')
      return b.paymentMethod === 'udhar' && b.paymentStatus === 'udhar_outstanding';
    if (bookingFilter === 'delivered') return b.status === 'delivered';
    return true;
  });

  const recent = [...bookings]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 5);

  const tabs: { key: Tab; label: string; labelHi: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', labelHi: 'डैशबोर्ड', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'bookings', label: 'My Bookings', labelHi: 'मेरी बुकिंग', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'new_booking', label: 'New Booking', labelHi: 'नई बुकिंग', icon: <Plus className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Identity banner */}
      <div className="bg-gradient-to-r from-amber-900 via-yellow-900 to-amber-950 text-white p-4 rounded-xl shadow-md border-b-4 border-yellow-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 text-yellow-950 font-black flex items-center justify-center text-sm shadow-sm border-2 border-white shrink-0">
            मित्र
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                {hi ? 'सहकार मित्र पोर्टल' : 'Sahakar Mitra Portal'}
              </h2>
              {activeFestival && (
                <span className="bg-yellow-400 text-yellow-950 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  {hi ? activeFestival.nameHi : activeFestival.nameEn}
                </span>
              )}
            </div>
            <p className="text-xs text-yellow-100/90 mt-0.5">
              {session.name} — {session.phone}
              {cityName ? ` · ${hi ? cityName.nameHi : cityName.nameEn}` : ''}
              {(assignedDcNameHi || assignedDcNameEn) ? ` · ${hi ? (assignedDcNameHi ?? assignedDcNameEn) : (assignedDcNameEn ?? assignedDcNameHi)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-950/80 border border-yellow-500/50 rounded-lg px-3 py-1.5 text-xs font-mono text-center">
            <span className="text-yellow-200 block text-[10px]">
              {hi ? 'उधार बकाया' : 'Udhar Due'}
            </span>
            <b className={`text-sm ${udharOutstanding > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
              {inr(udharOutstanding)}
            </b>
          </div>
          <form action={customerLogoutAction}>
            <button
              type="submit"
              className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-200 hover:text-white rounded-lg border border-rose-500/40 text-xs cursor-pointer"
              title={hi ? 'लॉगआउट' : 'Logout'}
              aria-label={hi ? 'लॉगआउट' : 'Logout'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
              tab === t.key
                ? 'bg-amber-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            {t.icon}
            {hi ? t.labelHi : t.label}
          </button>
        ))}
      </div>

      {/* ── Dashboard tab ── */}
      {tab === 'dashboard' && (
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <BookOpen className="w-4 h-4 text-amber-600" />, val: bookings.length, labelHi: 'कुल बुकिंग', labelEn: 'Total Bookings' },
              { icon: <Package className="w-4 h-4 text-amber-600" />, val: `${totalKg.toFixed(1)} kg`, labelHi: 'कुल मात्रा', labelEn: 'Total Kg' },
              { icon: <CreditCard className="w-4 h-4 text-amber-600" />, val: inr(totalValue), labelHi: 'कुल राशि', labelEn: 'Total Value' },
              {
                icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
                val: inr(udharOutstanding),
                labelHi: 'उधार बकाया',
                labelEn: 'Udhar Due',
              },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-amber-200 p-3.5 shadow-xs text-center space-y-1">
                <div className="flex justify-center">{s.icon}</div>
                <div className="text-base sm:text-lg font-black font-mono text-amber-950">{s.val}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  {hi ? s.labelHi : s.labelEn}
                </div>
              </div>
            ))}
          </div>

          {/* Recent bookings */}
          <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">
              {hi ? 'हाल की बुकिंग' : 'Recent Bookings'}
            </h3>
            {recent.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                {hi ? 'अभी कोई बुकिंग नहीं है।' : 'No bookings yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 font-mono border-b border-slate-100">
                      <th className="text-left py-2 pr-3">ID</th>
                      <th className="text-left py-2 pr-3">{hi ? 'ग्राहक' : 'Customer'}</th>
                      <th className="text-right py-2 pr-3">{hi ? 'राशि' : 'Amount'}</th>
                      <th className="text-left py-2">{hi ? 'स्थिति' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((b) => (
                      <tr key={b.id} className="border-b border-slate-50">
                        <td className="py-2 pr-3 font-mono text-amber-900 font-bold">{b.id}</td>
                        <td className="py-2 pr-3 text-slate-700">{b.customer?.name ?? '—'}</td>
                        <td className="py-2 pr-3 text-right font-mono font-bold">{inr(b.totalAmount)}</td>
                        <td className="py-2">{statusBadge(b.status, hi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bookings tab ── */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'udhar', 'delivered'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setBookingFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  bookingFilter === f
                    ? 'bg-amber-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? (hi ? 'सभी' : 'All') : f === 'udhar' ? (hi ? 'उधार बकाया' : 'Udhar Due') : hi ? 'डिलीवर' : 'Delivered'}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl border border-amber-200 p-8 text-center text-sm text-slate-500">
              {hi ? 'कोई बुकिंग नहीं मिली।' : 'No bookings found.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBookings.map((b) => {
                const isExp = expandedBookingId === b.id;
                const items: any[] = Array.isArray(b.items) ? b.items : [];
                return (
                  <div key={b.id} className="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden">
                    {/* Clickable header row */}
                    <button
                      type="button"
                      onClick={() => setExpandedBookingId(isExp ? null : b.id)}
                      className="w-full text-left p-3 hover:bg-amber-50/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-amber-900 text-xs">{b.id}</div>
                            <div className="text-[10px] text-slate-400 font-mono">OTP: {b.deliveryOtp}</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 text-xs truncate">{b.customer?.name ?? '—'}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              {b.customer?.phone ?? '—'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="font-mono font-bold text-xs text-slate-900">{inr(b.totalAmount)}</div>
                            <div className="text-[10px] text-slate-400">{(b.totalKg ?? 0).toFixed(1)} kg</div>
                          </div>
                          {statusBadge(b.status, hi)}
                          {isExp ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                      </div>
                    </button>

                    {/* Expandable detail panel */}
                    {isExp && (
                      <div className="border-t border-amber-100 bg-amber-50/30 p-3 space-y-3 text-xs">
                        {/* Meta */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
                          <span><span className="text-slate-400">{hi ? 'केंद्र:' : 'DC:'}</span> {b.centerNameHi}</span>
                          <span><span className="text-slate-400">{hi ? 'भुगतान:' : 'Payment:'}</span> {b.paymentMethod}</span>
                          <span><span className="text-slate-400">{hi ? 'तारीख:' : 'Date:'}</span> {b.createdAt}</span>
                          <span><span className="text-slate-400">{hi ? 'स्थिति:' : 'Status:'}</span> {b.paymentStatus}</span>
                          {b.pickupDate && <span><span className="text-slate-400">{hi ? 'डिलीवरी:' : 'Pickup:'}</span> {b.pickupDate}</span>}
                        </div>

                        {/* Items table */}
                        {items.length > 0 && (
                          <div className="rounded-lg overflow-hidden border border-amber-200">
                            <table className="w-full text-xs">
                              <thead className="bg-amber-100 text-amber-900">
                                <tr>
                                  <th className="text-left px-2 py-1.5">{hi ? 'मिठाई' : 'Sweet'}</th>
                                  <th className="text-right px-2 py-1.5">{hi ? 'मात्रा' : 'Qty'}</th>
                                  <th className="text-right px-2 py-1.5">{hi ? 'दर' : 'Rate'}</th>
                                  <th className="text-right px-2 py-1.5">{hi ? 'योग' : 'Total'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-amber-100">
                                {items.map((item: any, i: number) => (
                                  <tr key={i} className="bg-white">
                                    <td className="px-2 py-1.5">
                                      <div>{item.sweetNameHi ?? item.nameHi ?? item.sweetId}</div>
                                      <div className="text-[10px] text-slate-400">{item.variantLabel}</div>
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-mono">{item.quantity}</td>
                                    <td className="px-2 py-1.5 text-right font-mono">₹{item.unitPrice}</td>
                                    <td className="px-2 py-1.5 text-right font-mono font-bold">₹{item.totalAmount}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-amber-50 font-bold">
                                <tr>
                                  <td colSpan={3} className="px-2 py-1.5 text-amber-900">{hi ? 'कुल' : 'Total'}</td>
                                  <td className="px-2 py-1.5 text-right font-mono text-amber-900">{inr(b.totalAmount)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}

                        {/* Address if available */}
                        {b.customer?.address && (
                          <p className="text-slate-500">📍 {b.customer.address}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── New booking tab ── */}
      {tab === 'new_booking' && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-xs space-y-5 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {hi ? 'नई बुकिंग करें' : 'Place a New Booking'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {hi
                ? 'कैटलॉग से मिठाइयाँ चुनें, कार्ट में जोड़ें, और चेकआउट पर बुकिंग पूर्ण करें।'
                : 'Browse the catalog, add sweets to the cart, then complete the booking at checkout.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded-xl text-sm transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              {hi ? 'कैटलॉग देखें' : 'Browse Catalog'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={checkoutHref}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold rounded-xl text-sm transition-colors"
            >
              {hi ? 'चेकआउट करें' : 'Go to Checkout'}
            </Link>
          </div>
          <p className="text-[11px] text-slate-400">
            {hi
              ? 'बुकिंग उत्सव कट-ऑफ़ तिथि तक ही स्वीकार्य है।'
              : 'Bookings accepted until the festival cutoff date.'}
          </p>
        </div>
      )}
    </div>
  );
}
