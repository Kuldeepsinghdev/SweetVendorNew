import type { Locale } from '@/src/lib/locale';

export function FaqContent({ locale }: { locale: Locale }) {
  const hi = locale === 'hi';

  return (
    <div className="space-y-3">
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <b className="text-slate-900 block">
          {hi ? 'प्र. क्या होम डिलीवरी उपलब्ध है?' : 'Q. Is home delivery available?'}
        </b>
        <p className="text-slate-600 mt-1">
          {hi
            ? 'उत्तर: सहकार मित्र के माध्यम से सामूहिक बुकिंग पर मोहल्ले में डिलीवरी संभव है। व्यक्तिगत ग्राहक आस्था उपभोक्ता भण्डार केंद्र से OTP दिखाकर संग्रह कर सकते हैं।'
            : 'Ans: Home delivery to the neighborhood is possible through Sahakar Mitra for group bookings. Individual customers can collect from Astha Consumer Store by showing OTP.'}
        </p>
      </div>
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <b className="text-slate-900 block">
          {hi ? 'प्र. अग्रिम बुकिंग रसीद कैसे प्राप्त होगी?' : 'Q. How will I receive the advance booking receipt?'}
        </b>
        <p className="text-slate-600 mt-1">
          {hi
            ? 'उत्तर: बुकिंग होते ही स्क्रीन पर डिजिटल रसीद एवं आपके मोबाइल पर तुरंत SMS व OTP प्रेषित किया जाता है।'
            : 'Ans: A digital receipt appears on the screen immediately after booking, and SMS/OTP is sent to your mobile right away.'}
        </p>
      </div>
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <b className="text-slate-900 block">
          {hi ? 'प्र. सहकार मित्र बनने की क्या प्रक्रिया है?' : 'Q. What is the process to become a Sahakar Mitra?'}
        </b>
        <p className="text-slate-600 mt-1">
          {hi
            ? 'उत्तर: पोर्टल पर \'सहकार मित्र बनें\' विकल्प पर जाकर अपना आधार व बुनियादी जानकारी भरें। समिति द्वारा सत्यापन के बाद मित्र पोर्टल सक्रिय हो जाता है।'
            : 'Ans: Go to the portal, click \'Become a Sahakar Mitra\', and fill in your Aadhar and basic details. After verification by the committee, your Mitra portal will be activated.'}
        </p>
      </div>
    </div>
  );
}
