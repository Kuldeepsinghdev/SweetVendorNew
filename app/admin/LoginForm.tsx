'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '@/lib/actions/auth';

const initialState: LoginState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error ? (
        <div
          role="alert"
          className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs"
        >
          {state.error}
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="phone" className="text-xs font-bold text-slate-300 block">
          अधिकृत मोबाइल नंबर (Authorized Mobile Number)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          required
          autoComplete="username"
          placeholder="10-digit number"
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm font-mono text-white focus:outline-none placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="pin" className="text-xs font-bold text-slate-300 block">
          सुरक्षा पिन / पासवर्ड (Security PIN)
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Enter your PIN"
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm font-mono text-white focus:outline-none placeholder:text-slate-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded-xl font-black text-sm shadow-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        {pending ? 'Signing in…' : 'प्रशासनिक लॉगिन करें (Secure Sign In)'}
      </button>
    </form>
  );
}
