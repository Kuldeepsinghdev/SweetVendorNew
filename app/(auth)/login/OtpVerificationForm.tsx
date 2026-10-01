'use client';

import { useActionState, useEffect, useState } from 'react';
import { verifyOtpAction } from '@/lib/actions/otpAuth';
import type { Locale } from '@/src/lib/locale';
import { ChevronLeft, AlertTriangle } from 'lucide-react';

interface OtpVerificationFormProps {
  email: string;
  locale?: Locale;
  otpExpiresAt: string;
  onSuccess?: () => void;
  onBackClick?: () => void;
}

/**
 * Format milliseconds into MM:SS countdown display
 */
function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function OtpVerificationForm({
  email,
  locale = 'hi',
  otpExpiresAt,
  onSuccess,
  onBackClick,
}: OtpVerificationFormProps) {
  const [state, formAction, pending] = useActionState<
    { success: false; error: string; attemptsRemaining?: number },
    FormData
  >(
    async (_prev: any, formData: FormData) => {
      const otpCode = (formData.get('otp') as string)?.trim();
      const result = await verifyOtpAction({
        email,
        otpCode,
        locale,
      });
      return result;
    },
    { success: false, error: '' }
  );

  const hi = locale === 'hi';
  const isLoading = pending;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const expiryTime = new Date(otpExpiresAt).getTime();
    const now = new Date().getTime();
    const remaining = expiryTime - now;

    if (remaining <= 0) {
      setIsExpired(true);
      setTimeLeft(0);
      return;
    }

    setTimeLeft(remaining);

    // Update every second
    const interval = setInterval(() => {
      const updatedRemaining = expiryTime - new Date().getTime();
      if (updatedRemaining <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(updatedRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  // Auto-redirect on successful verification (NextJS redirect happens in action)
  useEffect(() => {
    // Note: redirect always throws, so this won't be reached on success
    // Component is included for completeness
  }, [onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBackClick}
          disabled={isLoading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          {hi ? 'वापस' : 'Back'}
        </button>
        <p className="text-xs text-slate-400 flex-1">
          {hi ? `${email} पर भेजे गए OTP को दर्ज करें` : `Enter the OTP sent to ${email}`}
        </p>
      </div>

      {/* Error alert */}
      {state.error && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs">
          <div className="flex items-start gap-2">
            {state.attemptsRemaining !== undefined && state.attemptsRemaining < 3 && (
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p>{state.error}</p>
              {state.attemptsRemaining !== undefined && (
                <p className="text-xs mt-1">
                  {hi
                    ? `${state.attemptsRemaining} प्रयास बचे हैं`
                    : `${state.attemptsRemaining} attempts remaining`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OTP input - 6 digit code */}
      <div className="space-y-2">
        <label htmlFor="otp" className="text-xs font-bold text-slate-300 block">
          {hi ? '6 अंकीय OTP कोड' : '6-digit OTP Code'}
        </label>
        <input
          id="otp"
          name="otp"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          disabled={isLoading || isExpired}
          autoComplete="one-time-code"
          placeholder={hi ? '000000' : '000000'}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-500 text-center text-2xl tracking-widest font-mono disabled:opacity-60"
          autoFocus
        />
      </div>

      {/* Countdown timer */}
      <div className={`text-center text-sm font-semibold ${isExpired ? 'text-rose-400' : 'text-slate-300'}`}>
        {isExpired ? (
          <span>{hi ? 'OTP समाप्त हो गया है' : 'OTP has expired'}</span>
        ) : (
          <span>{hi ? 'समय शेष:' : 'Time remaining:'} {formatCountdown(timeLeft)}</span>
        )}
      </div>

      {/* Expired banner */}
      {isExpired && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
          {hi
            ? 'आपका OTP समाप्त हो गया है। कृपया एक नया अनुरोध करें।'
            : 'Your OTP has expired. Please request a new one.'}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading || isExpired}
        className="w-full py-3 rounded-xl font-black text-sm shadow-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        {isLoading
          ? (hi ? 'सत्यापन जारी है…' : 'Verifying…')
          : (hi ? 'OTP सत्यापित करें' : 'Verify OTP')}
      </button>

      {/* Request new OTP button */}
      <button
        type="button"
        onClick={onBackClick}
        disabled={isLoading}
        className="w-full py-3 rounded-xl font-black text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        {hi ? 'नया OTP अनुरोध करें' : 'Request New OTP'}
      </button>
    </form>
  );
}
