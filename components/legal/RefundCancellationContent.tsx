import type { Locale } from '@/src/lib/locale';

export function RefundCancellationContent({ locale }: { locale: Locale }) {
  const hi = locale === 'hi';

  return (
    <div className="space-y-3.5 leading-relaxed text-xs sm:text-sm text-slate-700">
      <p>
        <b>{hi ? 'वापसी एवं रिफंड नीति:' : 'Refund & Cancellation Policy:'}</b>
      </p>
      <ul className="list-disc list-inside space-y-1.5">
        <li>
          {hi
            ? 'कट-ऑफ़ तिथि (24 अगस्त) से पूर्व बुकिंग रद्द करने पर 100% राशि सीधे बैंक/UPI खाते में 24 घंटे के भीतर वापस कर दी जाएगी।'
            : 'If booking is cancelled before the cutoff date (August 24), 100% refund will be credited to the bank/UPI account within 24 hours.'}
        </li>
        <li>
          {hi
            ? 'कट-ऑफ़ तिथि के बाद मिठाई तैयार होने के कारण रद्दीकरण स्वीकार्य नहीं होगा।'
            : 'After the cutoff date, cancellation is not acceptable as sweets are already being prepared.'}
        </li>
        <li>
          {hi
            ? 'वितरण के समय यदि पैकिंग या गुणवत्ता में कोई त्रुटि पाई जाती है, तो काउंटर पर तुरंत प्रतिस्थापन (Replacement) उपलब्ध कराया जाएगा।'
            : 'If any defect in packaging or quality is found at the time of distribution, immediate replacement will be provided at the counter.'}
        </li>
      </ul>
    </div>
  );
}
