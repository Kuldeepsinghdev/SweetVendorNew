'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { submitMitraApplicationAction, type MitraApplicationState } from '@/lib/actions/mitra';
import type { Locale } from '@/src/lib/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface City {
  id: string;
  nameHi: string;
  nameEn: string;
  stateHi: string;
  isActive: boolean;
}

interface DistributionCenter {
  id: string;
  cityId: string;
  nameHi: string;
  nameEn: string;
  addressHi?: string;
  addressEn?: string;
  isActive: boolean;
}

interface MitraApplyFormProps {
  locale: Locale;
  cities: City[];
  distributionCenters: DistributionCenter[];
}

export function MitraApplyForm({ locale, cities, distributionCenters }: MitraApplyFormProps) {
  const hi = locale === 'hi';

  const [state, formAction, pending] = useActionState<MitraApplicationState, FormData>(
    submitMitraApplicationAction,
    {}
  );

  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedCityNameHi, setSelectedCityNameHi] = useState('');
  const [selectedDistributionCenterIds, setSelectedDistributionCenterIds] = useState<string[]>([]);

  function handleCityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const city = cities.find((c) => c.id === e.target.value);
    setSelectedCityId(e.target.value);
    setSelectedCityNameHi(city?.nameHi ?? '');
    setSelectedDistributionCenterIds([]);
  }

  const cityDCs = selectedCityId
    ? distributionCenters.filter((dc) => dc.cityId === selectedCityId && dc.isActive)
    : [];

  // ── Success screen ────────────────────────────────────────────────────────
  if (state.appId) {
    return (
      <Card className="border-2 border-green-200">
        <CardContent className="pt-8 text-center space-y-5">
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
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {hi ? 'मुख्य पृष्ठ पर वापस जाएँ' : 'Back to Home'}
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Application form ──────────────────────────────────────────────────────
  return (
    <form
      action={formAction}
      className="rounded-3xl border-2 border-amber-200 bg-white p-6 sm:p-8 shadow-md space-y-6"
    >
      {state.error && (
        <Alert variant="destructive">
          <span className="mr-2">⚠</span>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Section: Location */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-600" />
          {hi ? 'स्थान' : 'Location'}
        </legend>

        <div className="space-y-1">
          <Label htmlFor="cityId">
            {hi ? 'शहर / जिला *' : 'City / District *'}
          </Label>
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
          <input type="hidden" name="cityNameHi" value={selectedCityNameHi} />
        </div>

        {selectedCityId && (
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              {hi ? 'वितरण केंद्र चुनें' : 'Choose distribution centers'}
            </Label>
            {cityDCs.length > 0 ? (
              <fieldset className="space-y-2">
                <legend className="text-xs text-slate-500">
                  {hi
                    ? 'आप उसी शहर के एक या अधिक केंद्र चुन सकते हैं।'
                    : 'Select one or more centers in this city.'}
                </legend>
                {cityDCs.map((dc) => (
                  <label
                    key={dc.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                      selectedDistributionCenterIds.includes(dc.id)
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-amber-200 bg-white hover:bg-amber-50/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="distributionCenterIds"
                      value={dc.id}
                      checked={selectedDistributionCenterIds.includes(dc.id)}
                      onChange={(event) => {
                        setSelectedDistributionCenterIds((current) =>
                          event.target.checked
                            ? [...current, dc.id]
                            : current.filter((id) => id !== dc.id)
                        );
                      }}
                      className="mt-1 h-4 w-4 accent-orange-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900">{hi ? dc.nameHi : dc.nameEn}</span>
                      {(dc.addressHi || dc.addressEn) && (
                        <span className="mt-0.5 block text-xs text-slate-600">{hi ? dc.addressHi || dc.addressEn : dc.addressEn || dc.addressHi}</span>
                      )}
                    </span>
                  </label>
                ))}
                <p className="text-xs font-semibold text-amber-800">
                  {hi
                    ? `${selectedDistributionCenterIds.length} केंद्र चुने गए`
                    : `${selectedDistributionCenterIds.length} centers selected`}
                </p>
              </fieldset>
            ) : (
              <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-700 italic">
                {hi
                  ? 'इस शहर के लिए अभी कोई वितरण केंद्र उपलब्ध नहीं है। प्रशासक द्वारा नियुक्त किया जाएगा।'
                  : 'No distribution centers available for this city yet. One will be assigned by the admin.'}
              </p>
            )}
          </div>
        )}
      </fieldset>

      <hr className="border-amber-100" />

      {/* Section: Personal Details */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
          <Phone className="w-4 h-4 text-amber-600" />
          {hi ? 'व्यक्तिगत जानकारी' : 'Personal Details'}
        </legend>

        <div className="space-y-1">
          <Label htmlFor="fullName">
            {hi ? 'पूरा नाम *' : 'Full Name *'}
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            required
            minLength={2}
            maxLength={120}
            placeholder={hi ? 'आपका पूरा नाम' : 'Your full name'}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="phone">
              {hi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              pattern="\d{10}"
              maxLength={10}
              placeholder="9876543210"
              className="font-mono"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">
              {hi ? 'ईमेल *' : 'Email *'}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
              placeholder="example@email.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="password">
              {hi ? 'पासवर्ड *' : 'Password *'}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              placeholder={hi ? 'कम से कम 8 अक्षर' : 'At least 8 characters'}
              autoComplete="new-password"
            />
            <p className="text-xs text-amber-600/80">
              {hi
                ? 'कम से कम 8 अक्षर, एक अक्षर और एक संख्या होनी चाहिए'
                : 'At least 8 characters, one letter and one number'}
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">
              {hi ? 'पासवर्ड की पुष्टि करें *' : 'Confirm Password *'}
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              maxLength={128}
              placeholder={hi ? 'पासवर्ड दोबारा दर्ज करें' : 'Re-enter password'}
              autoComplete="new-password"
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
          <Label htmlFor="address">
            {hi ? 'पूरा पता *' : 'Full Address *'}
          </Label>
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

        <div className="space-y-1">
          <Label htmlFor="pincode">
            {hi ? 'पिनकोड *' : 'Pincode *'}
          </Label>
          <Input
            id="pincode"
            name="pincode"
            type="text"
            required
            maxLength={16}
            placeholder="000000"
            className="w-full sm:w-40 font-mono"
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
            : "I agree to operate in accordance with Sahakar Bharati's rules and distribution centre terms and conditions."}
        </label>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-orange-600 text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 transition-colors duration-200 font-semibold"
      >
        {pending ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
            {hi ? 'सबमिट हो रहा है...' : 'Submitting...'}
          </>
        ) : (
          <>
            {hi ? 'आगे बढ़ें / Submit Application' : 'Submit Application'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-slate-400">
        {hi ? 'पहले से पंजीकृत हैं? ' : 'Already registered? '}
        <Link
          href="/login?next=/mitra/portal"
          className="font-bold text-orange-600 hover:underline"
        >
          {hi ? 'लॉगिन करें' : 'Sign in here'}
        </Link>
      </p>
    </form>
  );
}
