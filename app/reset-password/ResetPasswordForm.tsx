'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs">
          This reset link is missing its token. Please use the link from your
          email, or request a new password reset.
        </div>
        <Link
          href="/admin"
          className="block text-center py-3 rounded-xl font-black text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all"
        >
          Back to login
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-200 text-sm">
          Your password has been updated. You can now sign in with your new
          password.
        </div>
        <Link
          href="/admin"
          className="block text-center py-3 rounded-xl font-black text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all"
        >
          Go to login
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(
          data.error ||
            'This reset link is invalid or has expired. Please request a new one.'
        );
        return;
      }
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div
          role="alert"
          className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="password" className="text-xs font-bold text-slate-300 block">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirm" className="text-xs font-bold text-slate-300 block">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your new password"
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl font-black text-sm shadow-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        {submitting ? 'Updating…' : 'Update password'}
      </button>

      <Link
        href="/admin"
        className="block text-center text-xs font-bold text-slate-400 hover:text-slate-200"
      >
        Back to login
      </Link>
    </form>
  );
}
