import { Suspense } from 'react';
import { KeyRound } from 'lucide-react';
import { getLocale } from '@/lib/locale/server';
import { ResetPasswordForm } from './ResetPasswordForm';

/**
 * Public password-reset page. Reached from the emailed reset link:
 *   /reset-password?token=...
 * Not under the protected /dashboard group, so it is publicly accessible.
 */
export default async function ResetPasswordPage() {
  const locale = await getLocale();
  const hi = locale === 'hi';

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 text-white rounded-3xl shadow-2xl border-2 border-amber-400/80 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-900 p-6 border-b border-slate-700/80">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-500/20 text-amber-300 border-amber-500/30">
            <KeyRound className="w-3.5 h-3.5" />
            <span>{hi ? 'सुरक्षित पासवर्ड रीसेट' : 'Secure Password Reset'}</span>
          </div>
          <h1 className="mt-3 text-xl font-black">
            {hi ? 'अपना पासवर्ड रीसेट करें' : 'Reset your password'}
          </h1>
          <p className="text-xs text-amber-300/90 mt-0.5">
            {hi
              ? 'अपने सहकार भारती खाते के लिए नया पासवर्ड चुनें।'
              : 'Choose a new password for your Sahakar Bharati account.'}
          </p>
        </div>

        <div className="p-6">
          {/* ResetPasswordForm reads ?token from search params — needs Suspense */}
          <Suspense
            fallback={
              <p className="text-sm text-slate-400">
                {hi ? 'लोड हो रहा है…' : 'Loading…'}
              </p>
            }
          >
            <ResetPasswordForm hi={hi} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
