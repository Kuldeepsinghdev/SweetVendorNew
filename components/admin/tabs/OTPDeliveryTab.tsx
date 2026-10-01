'use client';

import { useActionState, useState, useMemo } from 'react';
import {
  Package,
  Search,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { deliverBookingAction, type DeliverBookingState } from '@/lib/actions/mitra';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * OTP Delivery Tab Component
 * 
 * Allows kendra users to search for bookings and complete delivery
 * by verifying the customer's OTP.
 * 
 * **Validates: Requirements 23.1, 23.2, 23.3, 23.5, 13.5**
 * 
 * Features:
 * - Search bookings by ID or phone number
 * - Display booking details with items summary
 * - OTP verification form
 * - Success confirmation with invoice ID
 * - Bilingual support (Hindi/English)
 * 
 * @param props - TabContentProps containing session, data, and locale
 */
export default function OTPDeliveryTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const bookings = data.bookings || [];

  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [state, formAction, pending] = useActionState<DeliverBookingState, FormData>(
    deliverBookingAction,
    {}
  );

  // Filter bookings that are eligible for delivery (not yet delivered)
  const deliverableBookings = useMemo(() => {
    return bookings.filter((b) => b.status !== 'delivered');
  }, [bookings]);

  // Search functionality: filter by booking ID or customer phone
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    
    return deliverableBookings
      .filter(
        (b) =>
          b.id.toLowerCase().includes(q) || 
          (b.customer?.phone ?? '').includes(q)
      )
      .slice(0, 8); // Limit to 8 results
  }, [deliverableBookings, search]);

  // Handle booking selection from search results
  const handleSelectBooking = (b: any) => {
    setSelectedBooking(b);
    setSearch('');
  };

  // Success state: Show delivery completion confirmation
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
      {/* Search Input */}
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

      {/* Search Results Dropdown */}
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
                <p className="text-xs text-slate-400">
                  {b.customer?.name} · {b.customer?.phone}
                </p>
              </div>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300" />
            </button>
          ))}
        </div>
      )}

      {/* Selected Booking Card with OTP Form */}
      {selectedBooking && !state.invoiceId && (
        <div className="bg-slate-900 border border-purple-700/40 rounded-xl p-4 space-y-4">
          {/* Booking Details */}
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

            {/* Items Summary */}
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

          {/* OTP Verification Form */}
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

            {/* Error Message */}
            {state.error && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle size={14} />
                {state.error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-xl transition"
            >
              {pending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              {hi ? 'डिलीवरी पूर्ण करें' : 'Complete Delivery'}
            </button>
          </form>

          {/* Cancel Button */}
          <button
            onClick={() => setSelectedBooking(null)}
            className="w-full text-xs text-slate-500 hover:text-slate-300 text-center py-1"
          >
            {hi ? 'रद्द करें' : 'Cancel'}
          </button>
        </div>
      )}

      {/* Empty State: No Search Query */}
      {!selectedBooking && searchResults.length === 0 && search.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          <Package size={32} className="mx-auto mb-2 opacity-40" />
          {hi ? 'बुकिंग ID या ग्राहक फ़ोन से खोजें।' : 'Search by booking ID or customer phone.'}
        </div>
      )}

      {/* Empty State: No Results */}
      {!selectedBooking && search.length > 0 && searchResults.length === 0 && (
        <div className="text-center py-6 text-slate-500 text-sm">
          {hi ? 'कोई बुकिंग नहीं मिली।' : 'No matching booking found.'}
        </div>
      )}
    </div>
  );
}
