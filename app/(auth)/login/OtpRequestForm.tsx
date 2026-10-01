'use client';

import { useActionState, useRef } from 'react';
import { Mail, Phone } from 'lucide-react';
import { requestOtpAction } from '@/lib/actions/otpAuth';
import type { Locale } from '@/src/lib/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
        <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-orange-600 text-white font-bold text-sm">
          <Mail className="w-4 h-4" />
          {hi ? 'ईमेल OTP' : 'Email OTP'}
        </div>
        <div
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-300 text-slate-500 font-bold text-sm cursor-not-allowed opacity-60"
          title={hi ? 'जल्द आ रहा है' : 'Coming Soon'}
        >
          <Phone className="w-4 h-4" />
          {hi ? 'SMS OTP' : 'SMS OTP'}
        </div>
      </div>

      {/* Error display */}
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Email input - preserve value on error */}
      <div className="space-y-1">
        <Label htmlFor="email">
          {hi ? 'पंजीकृत ईमेल' : 'Registered Email'}
        </Label>
        <Input
          ref={emailInputRef}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          required
          disabled={isLoading}
          autoComplete="email"
          placeholder={hi ? 'आपका ईमेल पता' : 'your@email.com'}
          className="text-base"
        />
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading
          ? (hi ? 'OTP भेज रहे हैं…' : 'Sending OTP…')
          : (hi ? 'OTP प्राप्त करें' : 'Get OTP')}
      </Button>

      {/* Help text */}
      <p className="text-xs text-slate-600 text-center">
        {hi
          ? 'हमें आपके ईमेल पर OTP कोड भेजेंगे।'
          : 'We will send an OTP code to your email.'}
      </p>
    </form>
  );
}
