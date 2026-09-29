/**
 * Public site footer (Server Component).
 *
 * Static organization, contact, and helpline content renders on the server;
 * only the policy links + their modals are a client island (FooterPolicyModals).
 * Ported from the SPA Footer; the language now comes from the locale prop rather
 * than AppContext.
 */

import { PhoneCall, Mail, MapPin, Clock, Award } from 'lucide-react';
import { FooterPolicyModals } from './FooterPolicyModals';
import type { Locale } from '@/src/lib/locale';

const HELPLINES = ['9413753383', '9875186011', '9462919288'];

export function SiteFooter({ locale }: { locale: Locale }) {
  const hi = locale === 'hi';

  return (
    <footer className="bg-gradient-to-b from-amber-950 to-slate-950 text-amber-100/90 border-t-4 border-amber-500 pt-10 pb-24 sm:pb-12 px-4 no-print">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-amber-900/60">
          {/* Column 1: Organization & mission */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🪔</span>
              <div>
                <h3 className="font-black text-white text-base sm:text-lg leading-tight">
                  {hi ? 'सहकार भारती' : 'Sahakar Bharati'}
                </h3>
                <p className="text-[11px] text-amber-300 font-bold">
                  {hi ? 'उत्सव मिष्ठान वितरण एवं प्री-बुकिंग सेवा' : 'Festive Sweets Pre-booking Network'}
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              {hi
                ? 'त्यौहारों पर मिलावट मुक्त, 100% गाय के शुद्ध देशी घी से निर्मित पौष्टिक व पारंपरिक मिष्ठान उचित सहकारी मूल्य पर उपलब्ध कराने हेतु समर्पित।'
                : 'Dedicated to providing 100% pure cow desi ghee adulteration-free festival sweets at fair cooperative prices.'}
            </p>
            <div className="inline-flex items-center gap-2 bg-amber-900/60 text-amber-200 text-[11px] font-mono font-bold px-3 py-1 rounded-xl border border-amber-700/60">
              <span>GST: 08AAAAK4833E1ZV</span>
            </div>
          </div>

          {/* Column 2: Policies (client island) */}
          <FooterPolicyModals locale={locale} />

          {/* Column 3: Contact & store */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-800/60 pb-2">
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>{hi ? 'संपर्क व वितरण केंद्र' : 'Contact & Store'}</span>
            </h4>
            <div className="space-y-2.5 text-xs text-amber-200/90">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <b>{hi ? 'आस्था उपभोक्ता भण्डार' : 'Aastha Consumer Store'}</b>
                  <br />
                  {hi
                    ? 'बजरिया टोंक रोड़, सवाई माधोपुर - 322001 (राजस्थान)'
                    : 'Bajaria Tonk Road, Sawai Madhopur - 322001 (Rajasthan)'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {hi ? 'प्रतिदिन: प्रातः 08:00 से रात्रि 09:00 बजे तक' : 'Daily: 08:00 AM to 09:00 PM'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="font-mono">support@sahakarsweets.org</span>
              </div>
            </div>
          </div>

          {/* Column 4: Helplines */}
          <div className="space-y-3.5 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-800/60 pb-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{hi ? 'अग्रिम बुकिंग हेल्पलाइन' : 'Helpline Numbers'}</span>
              </h4>
              <div className="space-y-1.5 pt-1 font-mono text-xs">
                {HELPLINES.map((num, i) => (
                  <div
                    key={num}
                    className="flex items-center justify-between bg-amber-900/40 p-1.5 rounded-lg border border-amber-800/50"
                  >
                    <span className="text-amber-300">
                      {hi ? `हेल्पलाइन ${i + 1}:` : `Helpline ${i + 1}:`}
                    </span>
                    <a href={`tel:${num}`} className="font-bold text-white hover:text-amber-300">
                      {num}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-300/80 text-center sm:text-left">
          <div>
            © 2026 <b>सहकार भारती</b>. सर्वाधिकार सुरक्षित। (Rajasthan Cooperative Societies Pre-booking
            Network)
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
            <span>🌿 100% शुद्ध गाय का देशी घी • बिना चांदी वर्क • स्वदेशी अभियान</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
