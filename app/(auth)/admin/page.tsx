import { Shield } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { LanguageToggle } from '@/components/LanguageToggle';
import { getLocale } from '@/lib/locale/server';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; denied?: string }>;
}) {
  const locale = await getLocale();
  const hi = locale === 'hi';

  const { next, denied } = await searchParams;

  // Already signed in → go straight to the dashboard.
  const session = await getSession();
  if (session) redirect('/admin/dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden">
          <div className="bg-amber-50 p-6 border-b border-amber-100 flex justify-between items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-100 text-amber-700 border-amber-300">
                <Shield className="w-3.5 h-3.5" />
                <span>{hi ? 'प्रशासनिक सुरक्षा द्वार' : 'Secure Admin Gateway'}</span>
              </div>
              <h1 className="mt-3 text-xl font-black text-slate-900">
                {hi ? 'प्रशासनिक पोर्टल लॉगिन' : 'Admin Portal Login'}
              </h1>
              <p className="text-xs text-amber-600/90 mt-0.5">
                {hi ? 'सहकार भारती प्रशासनिक नियंत्रण' : 'Sahakar Bharati Admin Control'}
              </p>
            </div>
            <LanguageToggle locale={locale} />
          </div>

          <div className="p-6 space-y-4">
            {denied ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
                {hi
                  ? 'आपके खाते के पास इस पृष्ठ के लिए पर्याप्त अनुमति नहीं है।'
                  : 'Your account does not have sufficient permission for this page.'}
              </div>
            ) : null}
            <LoginForm next={next} locale={locale} />
          </div>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
