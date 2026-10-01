import type { Locale } from '@/src/lib/locale';

export function AboutContent({ locale }: { locale: Locale }) {
  const hi = locale === 'hi';

  return (
    <div className="space-y-3.5 leading-relaxed text-xs sm:text-sm text-slate-700">
      <p>
        <b>{hi ? 'सहकार भारती' : 'Sahakar Bharati'}</b>
        {hi
          ? ' का प्राथमिक उद्देश्य नागरिकों को बिना किसी मिलावट के, 100% शुद्ध गाय के देशी घी से निर्मित पारंपरिक मिठाइयाँ \'नो-प्रॉफ़िट, नो-लॉस\' सहकारी सिद्धांतों पर उपलब्ध कराना है।'
          : '\'s primary mission is to provide citizens with traditional sweets made from 100% pure cow ghee, prepared cooperatively on a no-profit, no-loss basis.'}
      </p>
      <p>
        {hi
          ? 'दीपावली व अन्य पावन पर्वों पर हमारे अधिकृत सहकारी वितरण केंद्रों के माध्यम से शुद्धता, अग्रिम प्री-बुकिंग और समयबद्ध वितरण सुनिश्चित किया जाता है।'
          : 'During Diwali and other sacred festivals, we ensure purity, advance pre-booking, and timely delivery through our authorized cooperative distribution centers.'}
      </p>
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1 text-amber-950 font-medium">
        <div>✓ {hi ? '100% शुद्ध गाय का देशी घी (प्रयोगशाला परीक्षित)' : '100% pure cow ghee (lab tested)'}</div>
        <div>✓ {hi ? 'बिना चांदी के वर्क (100% सात्विक एवं स्वास्थ्यवर्धक)' : 'No silver leaf (100% pure and health-promoting)'}</div>
        <div>✓ {hi ? 'न्यूनतम सहकारी मूल्य पर उच्चतम गुणवत्ता' : 'Highest quality at minimum cooperative price'}</div>
      </div>
    </div>
  );
}
