import { Shield } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; denied?: string }>;
}) {
  const { next, denied } = await searchParams;

  // Already signed in → go straight to the dashboard.
  const session = await getSession();
  if (session) redirect('/dashboard');

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 text-white rounded-3xl shadow-2xl border-2 border-amber-400/80 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-900 p-6 border-b border-slate-700/80">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-500/20 text-amber-300 border-amber-500/30">
            <Shield className="w-3.5 h-3.5" />
            <span>प्रशासनिक सुरक्षा द्वार</span>
          </div>
          <h1 className="mt-3 text-xl font-black">Admin Portal Login</h1>
          <p className="text-xs text-amber-300/90 mt-0.5">
            सहकार भारती प्रशासनिक नियंत्रण
          </p>
        </div>

        <div className="p-6 space-y-4">
          {denied ? (
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
              आपके खाते के पास इस पृष्ठ के लिए पर्याप्त अनुमति नहीं है (Insufficient
              permissions).
            </div>
          ) : null}
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
