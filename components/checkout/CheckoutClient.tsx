'use client';

/**
 * Checkout (migration Task 7) — server-authoritative money.
 *
 * The cart (useCart) holds only the customer's SELECTION (sweet id, variant,
 * quantity) plus display-only price hints. This component NEVER computes money
 * from those hints. Every rupee shown — subtotal, discount, total, and per-line
 * unit/line totals — comes from the server via `previewBookingAction`, and the
 * booking is written by `createBookingAction`, which re-prices from the DB.
 *
 *  - preview: recomputed on mount and whenever the cart lines, coupon code, or
 *    selected pickup centre change (coupon changes debounced ~500ms).
 *  - create:  fired once on "Place booking"; on success the cart is cleared and
 *    a success panel is shown with the server-computed totals + delivery OTP.
 */

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Trash2,
  Tag,
  MapPin,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';

import type { Locale } from '@/src/lib/locale';
import { useCart, type CartLine } from '@/components/cart/CartProvider';
import {
  previewBookingAction,
  createBookingAction,
  type PreviewResult,
  type CreateBookingResult,
} from '@/lib/actions/booking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type PaymentMethod = 'cash' | 'udhar';

interface PickupCenter {
  id: string;
  nameHi: string;
  nameEn: string;
  addressHi: string;
  addressEn: string;
}

interface CheckoutClientProps {
  locale: Locale;
  /**
   * Distribution/pickup centres for the cart's sale centre. Resolve like this:
   * the cart's saleCenterId is known from useCart(); you receive the list of
   * that centre's active distribution centres as `pickupCenters`.
   */
  pickupCenters: PickupCenter[];
  /** Prefill for the customer form (from the signed-in session). */
  defaultName: string;
  defaultPhone: string;
  /** Locale-prefixed href to return to the storefront, e.g. `/hi`. */
  homeHref: string;
}

/** Success shape narrowed out of CreateBookingResult for the success panel. */
type BookingSuccess = Extract<CreateBookingResult, { ok: true }>;

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function CheckoutClient({
  locale,
  pickupCenters,
  defaultName,
  defaultPhone,
  homeHref,
}: CheckoutClientProps) {
  const hi = locale === 'hi';
  const cart = useCart();

  // ── Form state ────────────────────────────────────────────────────────────
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod] = useState<PaymentMethod>('cash');
  const [selectedPickupCenterId, setSelectedPickupCenterId] = useState<string>(
    pickupCenters[0]?.id ?? ''
  );

  // ── Server-authoritative preview state ──────────────────────────────────────
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewPending, setPreviewPending] = useState(false);

  // ── Booking (create) state ───────────────────────────────────────────────────
  const [submitPending, startSubmit] = useTransition();
  const [booking, setBooking] = useState<BookingSuccess | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // A null saleCenterId means there is effectively no (valid) cart to price.
  const saleCenterId = cart.saleCenterId;
  const isEmpty = cart.lines.length === 0 || !saleCenterId;

  // Serialize the item selection so the preview effect only refires when the
  // actual selection (ids/variants/quantities) changes, not on every render.
  const itemsKey = useMemo(
    () =>
      cart.lines
        .map((l) => `${l.sweetId}:${l.variantLabel}:${l.quantity}`)
        .join('|'),
    [cart.lines]
  );

  // Guard against out-of-order responses: only the newest request may write.
  const previewSeq = useRef(0);

  useEffect(() => {
    if (!pickupCenters.some((center) => center.id === selectedPickupCenterId)) {
      setSelectedPickupCenterId(pickupCenters[0]?.id ?? '');
    }
  }, [pickupCenters, selectedPickupCenterId]);

  // ── Preview: mount + whenever lines / coupon / pickup centre change ───────────
  useEffect(() => {
    // Never call the server for an empty cart.
    if (isEmpty || !saleCenterId) {
      setPreview(null);
      setPreviewPending(false);
      return;
    }

    if (!pickupCenters.some((center) => center.id === selectedPickupCenterId)) {
      setPreview(null);
      setPreviewPending(false);
      return;
    }

    const items = cart.lines.map((l) => ({
      sweetId: l.sweetId,
      variantLabel: l.variantLabel,
      quantity: l.quantity,
    }));

    const seq = ++previewSeq.current;
    setPreviewPending(true);

    // Debounce so rapid coupon typing (and qty clicks) don't spam the server.
    const timer = setTimeout(() => {
      previewBookingAction({
        saleCenterId,
        centerId: selectedPickupCenterId,
        items,
        couponCode: couponCode.trim(),
      })
        .then((result) => {
          if (seq !== previewSeq.current) return; // stale — a newer request won
          setPreview(result);
        })
        .catch(() => {
          if (seq !== previewSeq.current) return;
          setPreview({
            ok: false,
            error: hi
              ? 'राशि की गणना नहीं हो सकी। कृपया पुनः प्रयास करें।'
              : 'Could not calculate totals. Please try again.',
          });
        })
        .finally(() => {
          if (seq !== previewSeq.current) return;
          setPreviewPending(false);
        });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, couponCode, selectedPickupCenterId, saleCenterId, isEmpty, hi, pickupCenters]);

  // Match a server-priced item back to a cart line by sweetId + variantLabel.
  const pricedFor = (line: CartLine) => {
    if (!preview || !preview.ok) return null;
    return (
      preview.items.find(
        (it) => it.sweetId === line.sweetId && it.variantLabel === line.variantLabel
      ) ?? null
    );
  };

  const previewOk = preview && preview.ok ? preview : null;
  const previewErr = preview && !preview.ok ? preview.error : null;

  const canSubmit =
    !isEmpty &&
    !!selectedPickupCenterId &&
    !!name.trim() &&
    /^\d{10}$/.test(phone.trim()) &&
    !submitPending;

  // ── Create: place the booking ─────────────────────────────────────────────────
  const handlePlaceBooking = () => {
    if (!saleCenterId || isEmpty || !selectedPickupCenterId) return;
    setSubmitError(null);

    const items = cart.lines.map((l) => ({
      sweetId: l.sweetId,
      variantLabel: l.variantLabel,
      quantity: l.quantity,
    }));

    startSubmit(async () => {
      const result = await createBookingAction({
        saleCenterId,
        centerId: selectedPickupCenterId,
        items,
        couponCode: couponCode.trim(),
        paymentMethod,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          pincode: pincode.trim(),
        },
      });

      if (result.ok) {
        cart.clear();
        setBooking(result);
      } else {
        setSubmitError(result.error);
      }
    });
  };

  // ── Success panel ───────────────────────────────────────────────────────────
  if (booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-10">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-emerald-300 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-xl font-black text-slate-900">
                {hi ? 'बुकिंग सफल!' : 'Booking confirmed!'}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {hi
                  ? 'आपकी प्री-बुकिंग दर्ज हो गई है।'
                  : 'Your pre-booking has been recorded.'}
              </p>
            </div>

            <dl className="mt-5 space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">{hi ? 'बुकिंग आईडी' : 'Booking ID'}</dt>
                <dd className="font-mono font-bold text-slate-900">{booking.bookingId}</dd>
              </div>
              {booking.invoiceId && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">{hi ? 'इनवॉइस' : 'Invoice'}</dt>
                  <dd>
                    <Link
                      href={`/invoices/${booking.invoiceId}`}
                      className="font-mono font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {booking.invoiceId}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">{hi ? 'डिलीवरी OTP' : 'Delivery OTP'}</dt>
                <dd className="font-mono text-lg font-black tracking-widest text-amber-900">
                  {booking.deliveryOtp}
                </dd>
              </div>
              <div className="mt-2 space-y-1 border-t border-amber-200 pt-2">
                <div className="flex items-center justify-between text-slate-600">
                  <dt>{hi ? 'उप-योग' : 'Subtotal'}</dt>
                  <dd className="font-mono">{inr(booking.subtotalAmount)}</dd>
                </div>
                {booking.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <dt>{hi ? 'छूट' : 'Discount'}</dt>
                    <dd className="font-mono">−{inr(booking.discountAmount)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-amber-200 pt-1 text-base font-black text-slate-900">
                  <dt>{hi ? 'कुल राशि' : 'Total'}</dt>
                  <dd className="font-mono">{inr(booking.totalAmount)}</dd>
                </div>
              </div>
            </dl>

            {/* Cash/Udhar — always show payment reminder since no online payment */}
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-100/70 p-3 text-sm text-amber-900">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {hi
                  ? 'भुगतान — मिठाई संग्रह के समय केंद्र पर नकद भुगतान करें।'
                  : 'Payment — pay in cash when collecting sweets at the pickup centre.'}
              </span>
            </div>

            <Link
              href={homeHref}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-3 font-bold text-white transition-colors hover:bg-amber-950"
            >
              <ArrowLeft className="h-4 w-4" />
              {hi ? 'दुकान पर वापस जाएँ' : 'Back to shop'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty cart ────────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-10">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {hi ? 'आपकी कार्ट खाली है' : 'Your cart is empty'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {hi
                ? 'बुकिंग करने के लिए कुछ मिठाइयाँ जोड़ें।'
                : 'Add some sweets to place a booking.'}
            </p>
            <Link
              href={homeHref}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-900 px-5 py-3 font-bold text-white transition-colors hover:bg-amber-950"
            >
              <ArrowLeft className="h-4 w-4" />
              {hi ? 'दुकान पर जाएँ' : 'Go to shop'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main checkout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-900 text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900">
              {hi ? 'चेकआउट' : 'Checkout'}
            </h1>
          </div>
          <Link
            href={homeHref}
            className="flex items-center gap-1.5 text-sm font-semibold text-amber-900 hover:text-amber-950"
          >
            <ArrowLeft className="h-4 w-4" />
            {hi ? 'वापस' : 'Back'}
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: line items + form */}
          <div className="space-y-6 lg:col-span-3">
            {/* Line items */}
            <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 text-sm font-extrabold text-slate-900">
                {hi ? 'आपकी मिठाइयाँ' : 'Your sweets'}
              </h2>
              <ul className="divide-y divide-slate-100">
                {cart.lines.map((line) => {
                  const priced = pricedFor(line);
                  const unit = priced ? priced.unitPrice : line.unitPriceHint;
                  const lineTotal = priced ? priced.totalAmount : line.unitPriceHint * line.quantity;
                  const authoritative = priced != null;
                  return (
                    <li
                      key={`${line.sweetId}:${line.variantLabel}`}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {hi ? line.sweetNameHi : line.sweetNameEn}
                        </p>
                        <p className="text-xs text-slate-500">
                          {line.variantLabel}
                          <span className="mx-1">·</span>
                          <span
                            className={`font-mono ${authoritative ? '' : 'text-slate-400'}`}
                          >
                            {inr(unit)}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={hi ? 'मात्रा घटाएँ' : 'Decrease quantity'}
                          onClick={() =>
                            cart.setQty(line.sweetId, line.variantLabel, line.quantity - 1)
                          }
                          className="h-7 w-7"
                        >
                          −
                        </Button>
                        <span className="w-7 text-center font-mono text-sm font-bold text-slate-900">
                          {line.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={hi ? 'मात्रा बढ़ाएँ' : 'Increase quantity'}
                          onClick={() =>
                            cart.setQty(line.sweetId, line.variantLabel, line.quantity + 1)
                          }
                          className="h-7 w-7"
                        >
                          +
                        </Button>
                      </div>

                      <div className="w-20 text-right">
                        <span
                          className={`font-mono text-sm font-bold ${
                            authoritative ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {inr(lineTotal)}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={hi ? 'हटाएँ' : 'Remove'}
                        onClick={() => cart.removeLine(line.sweetId, line.variantLabel)}
                        className="h-7 w-7 text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Pickup centre */}
            <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <MapPin className="h-4 w-4 text-amber-700" />
                {hi ? 'संग्रह केंद्र चुनें' : 'Choose pickup centre'}
              </h2>
              {pickupCenters.length === 0 ? (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  {hi
                    ? 'इस दुकान के लिए कोई सक्रिय संग्रह केंद्र उपलब्ध नहीं है।'
                    : 'No active pickup centre is available for this shop.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {pickupCenters.map((c) => (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                        selectedPickupCenterId === c.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pickupCenter"
                        value={c.id}
                        checked={selectedPickupCenterId === c.id}
                        onChange={() => setSelectedPickupCenterId(c.id)}
                        className="mt-1 accent-amber-700"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {hi ? c.nameHi : c.nameEn}
                        </p>
                        <p className="text-xs text-slate-500">
                          {hi ? c.addressHi : c.addressEn}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* Customer details */}
            <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 text-sm font-extrabold text-slate-900">
                {hi ? 'ग्राहक विवरण' : 'Customer details'}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                    {hi ? 'नाम' : 'Name'}
                  </span>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={hi ? 'आपका नाम' : 'Your name'}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                    {hi ? 'मोबाइल (10 अंक)' : 'Mobile (10 digits)'}
                  </span>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="font-mono"
                    placeholder="9876543210"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                    {hi ? 'ईमेल (वैकल्पिक)' : 'Email (optional)'}
                  </span>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                    {hi ? 'पिनकोड (वैकल्पिक)' : 'Pincode (optional)'}
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="font-mono"
                    placeholder="302001"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                    {hi ? 'पता (वैकल्पिक)' : 'Address (optional)'}
                  </span>
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder={hi ? 'आपका पता' : 'Your address'}
                  />
                </label>
              </div>
            </section>

            {/* Payment method — locked to cash on delivery */}
            <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <CreditCard className="h-4 w-4 text-amber-700" />
                {hi ? 'भुगतान विधि' : 'Payment method'}
              </h2>
              <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    {hi ? 'नकद — डिलीवरी के समय भुगतान करें' : 'Cash on Delivery'}
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {hi
                      ? 'मिठाई संग्रह के समय केंद्र पर नकद भुगतान करें।'
                      : 'Pay in cash when you collect your sweets at the pickup centre.'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right: coupon + totals + submit */}
          <div className="lg:col-span-2">
            <div className="space-y-4 lg:sticky lg:top-6">
              {/* Coupon */}
              <section className="rounded-2xl border border-amber-300 bg-white p-4 shadow-sm">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <Tag className="h-4 w-4 text-amber-700" />
                  {hi ? 'कूपन कोड' : 'Coupon code'}
                </h2>
                <div className="relative">
                  <Input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))
                    }
                    placeholder={hi ? 'उदा. SAHAKAR50' : 'e.g. SAHAKAR50'}
                    className="pl-8 font-mono text-xs font-bold uppercase tracking-wider"
                  />
                  <Tag className="pointer-events-none absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
                </div>
                {previewOk && couponCode.trim() && (
                  <p
                    className={`mt-2 text-xs ${
                      previewOk.discountValid ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {previewOk.discountMessage}
                  </p>
                )}
              </section>

              {/* Totals — server-authoritative */}
              <section className="rounded-2xl border border-amber-300 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-slate-900">
                    {hi ? 'राशि विवरण' : 'Order summary'}
                  </h2>
                  {previewPending && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {hi ? 'गणना हो रही है…' : 'Recalculating…'}
                    </span>
                  )}
                </div>

                {previewErr ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                    {previewErr}
                  </div>
                ) : (
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">{hi ? 'उप-योग' : 'Subtotal'}</dt>
                      <dd
                        className={`font-mono ${
                          previewOk ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {previewOk ? inr(previewOk.subtotalAmount) : inr(cart.displayTotalHint)}
                      </dd>
                    </div>
                    {previewOk && previewOk.discountAmount > 0 && (
                      <div className="flex items-center justify-between text-emerald-700">
                        <dt>{hi ? 'छूट' : 'Discount'}</dt>
                        <dd className="font-mono">−{inr(previewOk.discountAmount)}</dd>
                      </div>
                    )}
                    <div className="mt-1 flex items-center justify-between border-t border-amber-200 pt-2 text-base font-black text-slate-900">
                      <dt>{hi ? 'कुल राशि' : 'Total'}</dt>
                      <dd
                        className={`font-mono ${previewOk ? '' : 'text-slate-400'}`}
                      >
                        {previewOk ? inr(previewOk.totalAmount) : inr(cart.displayTotalHint)}
                      </dd>
                    </div>
                    {!previewOk && !previewPending && (
                      <p className="pt-1 text-[11px] text-slate-400">
                        {hi
                          ? 'अंतिम राशि सर्वर द्वारा तय की जाती है।'
                          : 'Final amount is confirmed by the server.'}
                      </p>
                    )}
                  </dl>
                )}
              </section>

              {/* Submit error */}
              {submitError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
                  {submitError}
                </div>
              )}

              {/* Place booking */}
              <Button
                onClick={handlePlaceBooking}
                disabled={!canSubmit}
                variant="default"
                className="w-full bg-amber-900 hover:bg-amber-950 disabled:bg-slate-300 disabled:text-slate-500 py-3.5 font-black text-white shadow active:scale-[0.99]"
              >
                {submitPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {hi ? 'बुकिंग हो रही है…' : 'Placing booking…'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {hi ? 'बुकिंग पक्की करें' : 'Place booking'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
