'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { submitMitraApplicationAction, type MitraApplicationState } from '@/lib/actions/mitra';
import type { Locale } from '@/src/lib/locale';

interface City {
  id: string;
  nameHi: string;
  nameEn: string;
  stateHi: string;
  isActive: boolean;
}

interface MitraApplyFormProps {
  locale: Locale;
  cities: City[];
}

export function MitraApplyForm({ locale, cities }: MitraApplyFormProps) {
  const hi = locale === 'hi';

  const [state, formAction, pending] = useActionState<MitraApplicationState, FormData>(
    submitMitraApplicationAction,
    {}
  );

  // Track selected city so we can auto-fill cityNameHi hidden field
  const [selectedCityNameHi, setSelectedCityNameHi] = useState('');

  function handleCityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const city = cities.find((c) => c.id === e.target.value);
    setSelectedCityNameHi(city?.nameHi ?? '');
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (state.appId) {
    return (
      <div className="rounded-3xl border-2 border-green-200 bg-white p-8 shadow-lg text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-2">
          <CheckCircle2 className="w-9 h-9 text-green-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-green-800">
            {hi ? 'आवेदन सफलतापूर्वक प्राप्त हुआ!' : 'Application Received!'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {hi
              ? 'आपका सहकार मित्र आवेदन प्राप्त हो गया है। हमारी टीम शीघ्र ही आपसे संपर्क करेगी।'
              : 'Your Sahakar Mitra application has been received. Our team will contact you soon.'}
          </p>
        </div>

        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-4 space-y-1">
          <p className="text-xs text-amber-700 font-medium">
            {hi ? 'आपका आवेदन संदर्भ नंबर:' : 'Your Application Reference Number:'}
          </p>
          <p className="text-2xl font-black font-mono text-amber-900 tracking-widest">
            {state.appId}
          </p>
          <p className="text-xs text-amber-600">
            {hi
              ? 'यह नंबर नोट करें — भविष्य में आवेदन स्थिति जानने के लिए काम आएगा।'
              : 'Please note this number for tracking your application status.'}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {hi ? 'मुख्य पृष्ठ पर वापस जाएँ' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  // ── Application form ──────────────────────────────────────────────────────
  return (
    <form
      action={formAction}
      className="rounded-3xl border-2 border-amber-200 bg-white p-6 sm:p-8 shadow-md space-y-6"
    >
      {/* Error alert */}
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700"
        >
          <span className="shrink-0 mt-0.5 text-rose-500">⚠</span>
          <span>{state.error}</span>
        </div>
      )}

      {/* Section: Location */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-600" />
          {hi ? 'स्थान' : 'Location'}
        </legend>

        <div className="space-y-1">
          <label htmlFor="cityId" className="block text-xs font-bold text-slate-700">
            {hi ? 'शहर / जिला *' : 'City / District *'}
          </label>
          <select
            id="cityId"
            name="cityId"
            required
            onChange={handleCityChange}
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          >
            <option value="">{hi ? '— शहर चुनें —' : '— Select city —'}</option>
            {cities
              .filter((c) => c.isActive)
              .map((city) => (
                <option key={city.id} value={city.id}>
                  {hi ? `${city.nameHi} (${city.stateHi})` : `${city.nameEn}`}
                </option>
              ))}
          </select>
          {/* Auto-filled hidden field */}
          <input type="hidden" name="cityNameHi" value={selectedCityNameHi} />
        </div>
      </fieldset>

      <hr className="border-amber-100" />

      {/* Section: Personal Details */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
          <Phone className="w-4 h-4 text-amber-600" />
          {hi ? 'व्यक्तिगत जानकारी' : 'Personal Details'}
        </legend>

        <div className="space-y-1">
          <label htmlFor="fullName" className="block text-xs font-bold text-slate-700">
            {hi ? 'पूरा नाम *' : 'Full Name *'}
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            minLength={2}
            maxLength={120}
            placeholder={hi ? 'आपका पूरा नाम' : 'Your full name'}
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="phone" className="block text-xs font-bold text-slate-700">
              {hi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              pattern="\d{10}"
              maxLength={10}
              placeholder="9876543210"
              className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-bold text-slate-700">
              {hi ? 'ईमेल (वैकल्पिक)' : 'Email (optional)'}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              maxLength={254}
              placeholder="example@email.com"
              className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>
        </div>
      </fieldset>

      <hr className="border-amber-100" />

      {/* Section: Address */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-extrabold text-amber-900 uppercase tracking-wide">
          {hi ? 'पता' : 'Address'}
        </legend>

        <div className="space-y-1">
          <label htmlFor="pincode" className="block text-xs font-bold text-slate-700">
            {hi ? 'पिनकोड *' : 'Pincode *'}
          </label>
          <input
            id="pincode"
            name="pincode"
            type="text"
            required
            maxLength={16}
            placeholder="000000"
            className="w-full sm:w-40 rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 font-mono"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="address" className="block text-xs font-bold text-slate-700">
            {hi ? 'पूरा पता *' : 'Full Address *'}
          </label>
          <textarea
            id="address"
            name="address"
            required
            maxLength={500}
            rows={3}
            placeholder={hi ? 'गली, मोहल्ला, शहर...' : 'Street, locality, city...'}
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
          />
        </div>
      </fieldset>

      <hr className="border-amber-100" />

      {/* Agreement */}
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-4">
        <input
          id="agreedToCenter"
          name="agreedToCenter"
          type="checkbox"
          defaultChecked
          value="on"
          className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-400 accent-amber-600 shrink-0 cursor-pointer"
        />
        <label htmlFor="agreedToCenter" className="text-xs text-amber-800 leading-relaxed cursor-pointer">
          {hi
            ? 'मैं स्वीकार करता/करती हूँ कि मैं सहकार भारती के नियमों और वितरण केंद्र की शर्तों के अनुसार कार्य करूँगा/करूँगी।'
            : 'I agree to operate in accordance with Sahakar Bharati\'s rules and distribution centre terms and conditions.'}
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3.5 text-sm font-black text-white shadow-md hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {pending ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {hi ? 'सबमिट हो रहा है...' : 'Submitting...'}
          </>
        ) : (
          <>
            {hi ? 'आगे बढ़ें / Submit Application' : 'Submit Application'}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        {hi
          ? 'पहले से पंजीकृत हैं? '
          : 'Already registered? '}
        <Link
          href={`/${locale}/login?next=/${locale}/mitra/portal`}
          className="font-bold text-orange-600 hover:underline"
        >
          {hi ? 'लॉगिन करें' : 'Sign in here'}
        </Link>
      </p>
    </form>
  );
}
