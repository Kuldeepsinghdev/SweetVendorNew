'use client';

import { useActionState, useState } from 'react';
import { Mail, Smartphone } from 'lucide-react';
import { customerLoginAction, type CustomerLoginState } from '@/lib/actions/customerAuth';
import type { Locale } from '@/src/lib/locale';

const initialState: CustomerLoginState = {};

type LoginMethod = 'phone' | 'email';

/**
 * Customer / Mitra login form. Establishes the server-side customer cookie
 * session via `customerLoginAction` — no localStorage, no client-held identity.
 * 
 * Supports two authentication methods:
 *   1. Phone + PIN (traditional)
 *   2. Email + Password
 */
export function CustomerLoginForm({ next, locale = 'hi' }: { next?: string; locale?: Locale }) {
  const [state, formAction, pending] = useActionState(customerLoginAction, initialState);
  const [method, setMethod] = useState<LoginMethod>('phone');

  const hi = locale === 'hi';

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setMethod('phone')}
          aria-pressed={method === 'phone'}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            method === 'phone'
              ? 'bg-amber-500 text-white shadow'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          {hi ? 'मोबाइल + पिन' : 'Mobile + PIN'}
        </button>
        <button
          type="button"
          onClick={() => setMethod('email')}
          aria-pressed={method === 'email'}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            method === 'email'
              ? 'bg-amber-500 text-white shadow'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          {hi ? 'ईमेल + पासवर्ड' : 'Email + Password'}
        </button>
      </div>

      <form key={method} action={formAction} className="space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <input type="hidden" name="method" value={method} />

        {state.error ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {state.error}
          </div>
        ) : null}

        {method === 'phone' ? (
          <>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs font-bold text-slate-600 block">
                {hi ? 'मोबाइल नंबर' : 'Mobile Number'}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                autoComplete="username"
                placeholder={hi ? '10 अंकों का नंबर' : '10-digit number'}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-amber-400 rounded-xl text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 font-mono"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pin" className="text-xs font-bold text-slate-600 block">
                {hi ? 'सुरक्षा पिन' : 'Security PIN'}
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                minLength={4}
                maxLength={4}
                required
                autoComplete="current-password"
                title={hi ? 'पिन 4 अंकों का होना चाहिए' : 'PIN must be exactly 4 digits'}
                placeholder={hi ? 'पहली बार लॉगिन पर 4 अंकों का पिन सेट करें' : 'Set a 4-digit PIN on first login'}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-amber-400 rounded-xl text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 font-mono"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-slate-600 block">
                {hi ? 'ईमेल' : 'Email'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-amber-400 rounded-xl text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold text-slate-600 block">
                {hi ? 'पासवर्ड' : 'Password'}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder={hi ? 'पासवर्ड दर्ज करें' : 'Enter password'}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-amber-400 rounded-xl text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="text-right">
              <a
                href="/reset-password"
                className="text-xs text-slate-500 hover:text-amber-600 hover:underline transition-colors"
              >
                {hi ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
              </a>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 rounded-xl font-black text-sm shadow-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {pending
            ? hi ? 'साइन इन हो रहा है…' : 'Signing in…'
            : hi ? 'लॉगिन करें' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
