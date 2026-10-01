import type { Locale } from '@/src/lib/locale';

export function PurityFssaiContent({ locale }: { locale: Locale }) {
  const hi = locale === 'hi';

  return (
    <div className="space-y-3.5 leading-relaxed text-xs sm:text-sm text-slate-700">
      <p>
        {hi
          ? 'हम गुणवत्ता और स्वच्छता के उच्चतम मानकों का पालन करते हैं। हमारी सभी मिष्ठानियां सख्त खाद्य सुरक्षा मानकों के तहत कुशल हलवाइयों द्वारा तैयार की जाती हैं।'
          : 'We adhere to the highest standards of quality and hygiene. All our sweets are prepared by skilled confectioners under strict food safety standards.'}
      </p>
      <div className="space-y-2">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <b className="text-emerald-900 block mb-0.5">
            {hi ? 'FSSAI एवं स्वच्छता मानक:' : 'FSSAI & Hygiene Standards:'}
          </b>
          <p className="text-emerald-800">
            {hi
              ? 'सभी कच्चे माल (काजू, मूंग दाल, बेसन, खोया) की सघन जांच के पश्चात ही निर्माण प्रक्रिया में उपयोग किया जाता है।'
              : 'All raw materials (cashew, moong dal, gram flour, khoya) are thoroughly inspected before use in the manufacturing process.'}
          </p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <b className="text-amber-900 block mb-0.5">
            {hi ? 'बिना चांदी वर्क की गारंटी:' : 'No Silver Leaf Guarantee:'}
          </b>
          <p className="text-amber-800">
            {hi
              ? 'बाजार में मिलने वाले चांदी के वर्क में होने वाली मिलावट से बचाने हेतु हमारी काजू कतली पूरी तरह बिना वर्क निर्मित होती है।'
              : 'To protect from adulterations found in market silver leaf, our kaju katli is made entirely without any leaf garnish.'}
          </p>
        </div>
      </div>
    </div>
  );
}
