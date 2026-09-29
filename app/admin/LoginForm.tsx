'use client';

import { useActionState, useState } from 'react';
import { Mail, Smartphone } from 'lucide-react';
import { loginAction, type LoginState } from '@/lib/actions/auth';
import type { Locale } from '@/src/lib/locale';

const initialState: LoginState = {};

type LoginMethod = 'phone' | 'email';

export function LoginForm({ next, locale = 'hi' }: { next?: string; locale?: Locale }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [method, setMethod] = useState<LoginMethod>('phone');
  const hi = locale === 'hi';

  const tabBase =
    'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all';
  const tabActive = 'bg-amber-500 text-slate-950 shadow';
  const tabInactive = 'bg-slate-800 text-slate-300 hover:bg-slate-700';

  return (
    <div className="space-y-4">
      {/* Method selector */}
      <div className="flex gap-2 p-1 bg-slate-800/60 rounded-2xl">
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
        <input type="hidden" name="method" value={method} />

        {state.error ? (
          <div
            role="alert"
            className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs"
          >
            {state.error}
          </div>
        ) : null}

        {method === 'phone' ? (
          <>
            <div className="space-y-1">
              <label htmlFor="phone" className="text-xs font-bold text-slate-300 block">
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
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm font-mono text-white focus:outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="pin" className="text-xs font-bold text-slate-300 block">
                {hi ? 'सुरक्षा पिन' : 'Security PIN'}
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                required
                autoComplete="current-password"
                placeholder={hi ? 'अपना पिन दर्ज करें' : 'Enter your PIN'}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm font-mono text-white focus:outline-none placeholder:text-slate-500"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold text-slate-300 block">
                {hi ? 'अधिकृत ईमेल' : 'Authorized Email'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-bold text-slate-300 block">
                {hi ? 'पासवर्ड' : 'Password'}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder={hi ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-500"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 rounded-xl font-black text-sm shadow-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {pending
            ? (hi ? 'साइन इन हो रहा है…' : 'Signing in…')
            : (hi ? 'प्रशासनिक लॉगिन करें' : 'Secure Sign In')}
        </button>
      </form>
    </div>
  );
}
