import type { Locale } from '@/src/lib/locale';

export function PrivacyPolicyContent({ locale }: { locale: Locale }) {
  const hi = locale === 'hi';

  return (
    <div className="space-y-3.5 leading-relaxed text-xs sm:text-sm text-slate-700">
      <p>
        {hi
          ? 'आपकी व्यक्तिगत जानकारी (नाम, मोबाइल नंबर, पता) हमारे पास पूरी तरह सुरक्षित है।'
          : 'Your personal information (name, mobile number, address) is completely secure with us.'}
      </p>
      <ul className="list-disc list-inside space-y-1.5">
        <li>
          {hi
            ? 'आपका मोबाइल नंबर केवल OTP सत्यापन और बुकिंग रसीद SMS/WhatsApp भेजने हेतु प्रयुक्त होता है।'
            : 'Your mobile number is used only for OTP verification and sending booking receipts via SMS/WhatsApp.'}
        </li>
        <li>
          {hi
            ? 'हम किसी भी तीसरे पक्ष (Third Party) के साथ आपका डेटा साझा या विक्रय नहीं करते।'
            : 'We do not share or sell your data with any third party.'}
        </li>
        <li>
          {hi
            ? 'भुगतान विवरण बैंक गेटवे द्वारा एन्क्रिप्टेड माध्यम से संसाधित होता है।'
            : 'Payment details are processed through encrypted bank gateway channels.'}
        </li>
      </ul>
    </div>
  );
}
