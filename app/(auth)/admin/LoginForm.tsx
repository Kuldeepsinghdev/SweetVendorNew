'use client';

import { useActionState, useState } from 'react';
import { Mail, Smartphone } from 'lucide-react';
import { loginAction, type LoginState } from '@/lib/actions/auth';
import type { Locale } from '@/src/lib/locale';

type LoginMethod = 'phone' | 'email';

const initialState: LoginState = {};

export function LoginForm({ next, locale = 'hi' }: { next?: string; locale?: Locale }) {
  const [method, setMethod] = useState<LoginMethod>('phone');
  const hi = locale === 'hi';

  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  const tabBase =
    'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all';
  const tabActive = 'bg-amber-500 text-white shadow';
  const tabInactive = 'bg-slate-100 text-slate-600 hover:bg-slate-200';

  return (
    <div className="space-y-4">
      {/* Method selector */}
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
        {state.error ? (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs"
          >
            {state.error}
          </div>
        ) : null}
        <input type="hidden" name="method" value={method} />
        {next && <input type="hidden" name="next" value={next} />}

        {method === 'phone' ? (
          <>
            <div className="space-y-1">
              <label htmlFor="phone" className="text-xs font-bold text-slate-700 block">
                {hi ? 'अधिकृत मोबाइल नंबर' : 'Authorized Mobile Number'}
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
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm font-mono text-slate-900 focus:outline-none placeholder:text-slate-400"
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
                placeholder={hi ? 'अपना पिन दर्ज करें' : 'Enter your PIN'}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm font-mono text-slate-900 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold text-slate-700 block">
                {hi ? 'अधिकृत ईमेल' : 'Authorized Email'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
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
                placeholder={hi ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-xl font-black text-sm shadow-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {isPending
            ? (hi ? 'साइन इन हो रहा है…' : 'Signing in…')
            : (hi ? 'प्रशासनिक लॉगिन करें' : 'Secure Sign In')}
        </button>
      </form>
    </div>
  );
}
