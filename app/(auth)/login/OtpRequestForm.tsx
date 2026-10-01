'use client';

import { useActionState, useRef } from 'react';
import { Mail, Phone } from 'lucide-react';
import { requestOtpAction } from '@/lib/actions/otpAuth';
import type { Locale } from '@/src/lib/locale';

interface OtpRequestFormProps {
  locale?: Locale;
  onOtpRequested?: (email: string, expiresAt: string) => void;
}

export function OtpRequestForm({ locale = 'hi', onOtpRequested }: OtpRequestFormProps) {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: any, formData: FormData) => {
      const email = (formData.get('email') as string)?.trim().toLowerCase();
      const result = await requestOtpAction({
        email,
        locale,
      });

      if (result.success && result.otpExpiresAt && onOtpRequested) {
        // Log OTP details for development testing
        console.log(`✅ OTP generated successfully for: ${email}`);
        if (result.otp) {
          console.log(`📧 Generated OTP: ${result.otp} (expires in 10 minutes)`);
        }
        onOtpRequested(email, result.otpExpiresAt);
      }

      return result;
    },
    { success: false }
  );

  const hi = locale === 'hi';
  const isLoading = pending;

  return (
    <form action={formAction} className="space-y-4">
      {/* Method selector - Email enabled, Phone coming soon */}
      <div className="flex gap-2 p-1 bg-slate-800/60 rounded-2xl">
        <div className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow">
          <Mail className="w-4 h-4" />
          {hi ? 'ईमेल OTP' : 'Email OTP'}
        </div>
        <div
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed opacity-60"
          title={hi ? 'जल्द आ रहा है' : 'Coming Soon'}
        >
          <Phone className="w-4 h-4" />
          {hi ? 'SMS OTP' : 'SMS OTP'}
        </div>
      </div>

      {/* Error display */}
      {state.error && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs">
          {state.error}
        </div>
      )}

      {/* Email input - preserve value on error */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-xs font-bold text-slate-300 block">
          {hi ? 'पंजीकृत ईमेल' : 'Registered Email'}
        </label>
        <input
          ref={emailInputRef}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          required
          disabled={isLoading}
          autoComplete="email"
          placeholder={hi ? 'आपका ईमेल पता' : 'your@email.com'}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-500 disabled:opacity-60"
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl font-black text-sm shadow-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        {isLoading
          ? (hi ? 'OTP भेज रहे हैं…' : 'Sending OTP…')
          : (hi ? 'OTP प्राप्त करें' : 'Get OTP')}
      </button>

      {/* Help text */}
      <p className="text-xs text-slate-400 text-center">
        {hi
          ? 'हमें आपके ईमेल पर OTP कोड भेजेंगे।'
          : 'We will send an OTP code to your email.'}
      </p>
    </form>
  );
}
