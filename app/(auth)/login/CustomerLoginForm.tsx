'use client';

import { useActionState, useState } from 'react';
import { Mail, Smartphone } from 'lucide-react';
import { customerLoginAction, type CustomerLoginState } from '@/lib/actions/customerAuth';
import type { Locale } from '@/src/lib/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OtpRequestForm } from './OtpRequestForm';
import { OtpVerificationForm } from './OtpVerificationForm';

const initialState: CustomerLoginState = {};

type LoginMethod = 'phone' | 'email' | 'otp';
type OtpStep = 'request' | 'verify';

/**
 * Customer / Mitra login form. Establishes the server-side customer cookie
 * session via `customerLoginAction` — no localStorage, no client-held identity.
 * 
 * Supports three authentication methods:
 *   1. Phone + PIN (traditional)
 *   2. Email + Password
 *   3. Email + OTP (new)
 */
export function CustomerLoginForm({ next, locale = 'hi' }: { next?: string; locale?: Locale }) {
  const [state, formAction, pending] = useActionState(customerLoginAction, initialState);
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [otpStep, setOtpStep] = useState<OtpStep>('request');
  const [otpEmail, setOtpEmail] = useState<string>('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string>('');

  const hi = locale === 'hi';

  // Early return for OTP UI
  if (method === 'otp' && otpStep === 'request') {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          onClick={() => setMethod('phone')}
          variant="outline"
          className="w-full gap-1.5"
        >
          <Smartphone className="w-3.5 h-3.5" />
          {hi ? 'अन्य विकल्प' : 'Other Options'}
        </Button>
        <OtpRequestForm
          locale={locale}
          onOtpRequested={(expiresAt) => {
            setOtpExpiresAt(expiresAt);
            setOtpStep('verify');
          }}
        />
      </div>
    );
  }

  if (method === 'otp' && otpStep === 'verify') {
    return (
      <OtpVerificationForm
        email={otpEmail}
        locale={locale}
        otpExpiresAt={otpExpiresAt}
        onBackClick={() => {
          setOtpStep('request');
          setOtpEmail('');
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        <Button
          type="button"
          onClick={() => setMethod('phone')}
          variant={method === 'phone' ? 'default' : 'ghost'}
          aria-pressed={method === 'phone'}
          className="flex-1 gap-1.5"
        >
          <Smartphone className="w-3.5 h-3.5" />
          {hi ? 'मोबाइल + पिन' : 'Mobile + PIN'}
        </Button>
        <Button
          type="button"
          onClick={() => {
            setMethod('otp');
            setOtpStep('request');
          }}
          variant={method === 'otp' ? 'default' : 'ghost'}
          aria-pressed={method === 'otp'}
          className="flex-1 gap-1.5"
        >
          <Mail className="w-3.5 h-3.5" />
          {hi ? 'ईमेल + OTP' : 'Email + OTP'}
        </Button>
      </div>

      <form key={method} action={formAction} className="space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <input type="hidden" name="method" value={method} />

        {state.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        {method === 'phone' ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="phone">
                {hi ? 'मोबाइल नंबर' : 'Mobile Number'}
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                autoComplete="username"
                placeholder={hi ? '10 अंकों का नंबर' : '10-digit number'}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pin">
                {hi ? 'सुरक्षा पिन' : 'Security PIN'}
              </Label>
              <Input
                id="pin"
                name="pin"
                type="password"
                required
                autoComplete="current-password"
                placeholder={hi ? 'पहली बार लॉगिन पर 4 अंकों का पिन सेट करें' : 'Set a 4-digit PIN on first login'}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <Label htmlFor="email">
                {hi ? 'ईमेल' : 'Email'}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">
                {hi ? 'पासवर्ड' : 'Password'}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder={hi ? 'पासवर्ड दर्ज करें (पहली बार: नया पासवर्ड बनाएं)' : 'Enter password (first login: choose a new password)'}
              />
            </div>
          </>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="w-full"
        >
          {pending
            ? hi ? 'साइन इन हो रहा है…' : 'Signing in…'
            : hi ? 'लॉगिन करें' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
