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
 */
export function CustomerLoginForm({ next, locale = 'hi' }: { next?: string; locale?: Locale }) {
  const [state, formAction, pending] = useActionState(customerLoginAction, initialState);
  const [method, setMethod] = useState<LoginMethod>('phone');
  const hi = locale === 'hi';

  const tabBase =
    'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all';
  const tabActive = 'bg-orange-600 text-white shadow';
  const tabInactive = 'bg-slate-100 text-slate-600 hover:bg-slate-200';

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setMethod('phone')}
          className={`${tabBase} ${method === 'phone' ? tabActive : tabInactive}`}
          aria-pressed={method === 'phone'}
        >
          <Smartphone className="w-3.5 h-3.5" />
          {hi ? 'मोबाइल + पिन' : 'Mobile + PIN'}
        </button>
        <button
          type="button"
          onClick={() => setMethod('email')}
          className={`${tabBase} ${method === 'email' ? tabActive : tabInactive}`}
          aria-pressed={method === 'email'}
        >
          <Mail className="w-3.5 h-3.5" />
          {hi ? 'ईमेल + पासवर्ड' : 'Email + Password'}
        </button>
      </div>

      <form key={method} action={formAction} className="space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="method" value={method} />

        {state.error ? (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs"
          >
            {state.error}
          </div>
        ) : null}

        {method === 'phone' ? (
          <>
            <div className="space-y-1">
              <label htmlFor="phone" className="text-xs font-bold text-slate-700 block">
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
                className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-orange-500 rounded-xl text-sm font-mono text-slate-900 focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="pin" className="text-xs font-bold text-slate-700 block">
                {hi ? 'सुरक्षा पिन' : 'Security PIN'}
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                required
                autoComplete="current-password"
                placeholder={hi ? 'पहली बार लॉगिन पर 4 अंकों का पिन सेट करें' : 'Set a 4-digit PIN on first login'}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-orange-500 rounded-xl text-sm font-mono text-slate-900 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold text-slate-700 block">
                {hi ? 'ईमेल' : 'Email'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-orange-500 rounded-xl text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-bold text-slate-700 block">
                {hi ? 'पासवर्ड' : 'Password'}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder={hi ? 'पासवर्ड दर्ज करें (पहली बार: नया पासवर्ड बनाएं)' : 'Enter password (first login: choose a new password)'}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-orange-500 rounded-xl text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 rounded-xl font-black text-sm shadow-lg bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {pending
            ? hi ? 'साइन इन हो रहा है…' : 'Signing in…'
            : hi ? 'लॉगिन करें' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
