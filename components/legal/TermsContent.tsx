import type { Locale } from '@/src/lib/locale';

export function TermsContent({ locale }: { locale: Locale }) {
  const hi = locale === 'hi';

  return (
    <div className="space-y-3.5 leading-relaxed text-xs sm:text-sm text-slate-700">
      <p>
        <b>{hi ? 'बुकिंग एवं वितरण संबंधी नियम:' : 'Booking & Distribution Terms:'}</b>
      </p>
      <ol className="list-decimal list-inside space-y-1.5">
        <li>
          {hi
            ? 'त्यौहार विशेष मिठाईयों के लिए अग्रिम बुकिंग पर 100% अग्रिम राशि जमा करना अनिवार्य है।'
            : 'For festival-special sweets, 100% advance payment is mandatory for pre-booking.'}
        </li>
        <li>
          {hi
            ? 'कट-ऑफ़ तिथि (24 अगस्त 2026) के उपरांत अग्रिम बुकिंग स्वीकार्य नहीं होगी।'
            : 'No advance bookings will be accepted after the cutoff date (August 24, 2026).'}
        </li>
        <li>
          {hi
            ? 'वितरण तिथि (25 से 28 अगस्त 2026) के दौरान चयनित वितरण केंद्र (आस्था उपभोक्ता भण्डार) पर SMS/OTP दिखाकर मिठाई संग्रह करें।'
            : 'During distribution dates (August 25-28, 2026), collect sweets from the selected distribution center (Astha Consumer Store) by showing SMS/OTP.'}
        </li>
        <li>
          {hi
            ? 'निर्धारित अंतिम तिथि के भीतर संग्रह न करने की स्थिति में ताजी मिठाई का सुरक्षित भंडारण संभव नहीं होगा।'
            : 'If sweets are not collected within the stipulated final date, safe storage of fresh sweets cannot be guaranteed.'}
        </li>
      </ol>
    </div>
  );
}
