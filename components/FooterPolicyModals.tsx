'use client';

/**
 * Footer policy links + their info modals (client island).
 *
 * The footer itself is a Server Component; only the policy buttons and the
 * modal they open need interactivity, so they live here. Bilingual policy copy
 * is preserved verbatim from the SPA footer.
 */

import { useState } from 'react';
import { FileText, ChevronRight, X } from 'lucide-react';
import type { Locale } from '@/src/lib/locale';

type InfoModalType =
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'refund'
  | 'purity'
  | 'faqs'
  | null;

export function FooterPolicyModals({ locale }: { locale: Locale }) {
  const hi = locale === 'hi';
  const [activeModal, setActiveModal] = useState<InfoModalType>(null);
  const close = () => setActiveModal(null);

  const links: { key: Exclude<InfoModalType, null>; label: string }[] = [
    { key: 'about', label: hi ? 'हमारे बारे में (About Us)' : 'About Us' },
    { key: 'purity', label: hi ? 'शुद्धता व FSSAI मानक' : 'Purity & FSSAI Standards' },
    { key: 'privacy', label: hi ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy' },
    { key: 'terms', label: hi ? 'नियम एवं शर्तें (Terms of Service)' : 'Terms & Conditions' },
    { key: 'refund', label: hi ? 'रिफंड व रद्दीकरण नीति' : 'Refund & Cancellation Policy' },
    { key: 'faqs', label: hi ? 'अक्सर पूछे जाने वाले सवाल (FAQs)' : 'FAQs' },
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-800/60 pb-2">
        <FileText className="w-4 h-4 text-amber-400" />
        <span>{hi ? 'महत्वपूर्ण पृष्ठ व नीतियां' : 'Policies & Pages'}</span>
      </h4>
      <ul className="space-y-2 text-xs">
        {links.map((l) => (
          <li key={l.key}>
            <button
              onClick={() => setActiveModal(l.key)}
              className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
            >
              <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
              <span>{l.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border-2 border-amber-400 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪔</span>
                <h3 className="text-lg font-black text-slate-900">
                  {activeModal === 'about' && 'हमारे बारे में (About Us)'}
                  {activeModal === 'contact' && 'संपर्क एवं सहायता (Contact & Support)'}
                  {activeModal === 'privacy' && 'गोपनीयता नीति (Privacy Policy)'}
                  {activeModal === 'terms' && 'नियम एवं शर्तें (Terms & Conditions)'}
                  {activeModal === 'refund' && 'रिफंड एवं वापसी नीति (Refund Policy)'}
                  {activeModal === 'purity' && 'शुद्धता एवं FSSAI खाद्य सुरक्षा मानक'}
                  {activeModal === 'faqs' && 'अक्सर पूछे जाने वाले सवाल (FAQs)'}
                </h3>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 space-y-3.5 leading-relaxed">
              {activeModal === 'about' && (
                <>
                  <p>
                    <b>सहकार भारती</b> का प्राथमिक उद्देश्य नागरिकों को बिना किसी मिलावट के, 100% शुद्ध गाय के
                    देशी घी से निर्मित पारंपरिक मिठाइयाँ 'नो-प्रॉफ़िट, नो-लॉस' सहकारी सिद्धांतों पर उपलब्ध कराना है।
                  </p>
                  <p>
                    दीपावली व अन्य पावन पर्वों पर हमारे अधिकृत सहकारी वितरण केंद्रों के माध्यम से शुद्धता, अग्रिम
                    प्री-बुकिंग और समयबद्ध वितरण सुनिश्चित किया जाता है।
                  </p>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1 text-amber-950 font-medium">
                    <div>✓ 100% शुद्ध गाय का देशी घी (प्रयोगशाला परीक्षित)</div>
                    <div>✓ बिना चांदी के वर्क (100% सात्विक एवं स्वास्थ्यवर्धक)</div>
                    <div>✓ न्यूनतम सहकारी मूल्य पर उच्चतम गुणवत्ता</div>
                  </div>
                </>
              )}

              {activeModal === 'purity' && (
                <>
                  <p>
                    हम गुणवत्ता और स्वच्छता के उच्चतम मानकों का पालन करते हैं। हमारी सभी मिष्ठानियां सख्त खाद्य
                    सुरक्षा मानकों के तहत कुशल हलवाइयों द्वारा तैयार की जाती हैं।
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <b className="text-emerald-900 block mb-0.5">FSSAI एवं स्वच्छता मानक:</b>
                      <p className="text-emerald-800">
                        सभी कच्चे माल (काजू, मूंग दाल, बेसन, खोया) की सघन जांच के पश्चात ही निर्माण प्रक्रिया में
                        उपयोग किया जाता है।
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <b className="text-amber-900 block mb-0.5">बिना चांदी वर्क की गारंटी:</b>
                      <p className="text-amber-800">
                        बाजार में मिलने वाले चांदी के वर्क में होने वाली मिलावट से बचाने हेतु हमारी काजू कतली पूरी
                        तरह बिना वर्क निर्मित होती है।
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <p>आपकी व्यक्तिगत जानकारी (नाम, मोबाइल नंबर, पता) हमारे पास पूरी तरह सुरक्षित है।</p>
                  <ul className="list-disc list-inside space-y-1.5">
                    <li>आपका मोबाइल नंबर केवल OTP सत्यापन और बुकिंग रसीद SMS/WhatsApp भेजने हेतु प्रयुक्त होता है।</li>
                    <li>हम किसी भी तीसरे पक्ष (Third Party) के साथ आपका डेटा साझा या विक्रय नहीं करते।</li>
                    <li>भुगतान विवरण बैंक गेटवे द्वारा एन्क्रिप्टेड माध्यम से संसाधित होता है।</li>
                  </ul>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p>
                    <b>बुकिंग एवं वितरण संबंधी नियम:</b>
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>त्यौहार विशेष मिठाईयों के लिए अग्रिम बुकिंग पर 100% अग्रिम राशि जमा करना अनिवार्य है।</li>
                    <li>कट-ऑफ़ तिथि (24 अगस्त 2026) के उपरांत अग्रिम बुकिंग स्वीकार्य नहीं होगी।</li>
                    <li>
                      वितरण तिथि (25 से 28 अगस्त 2026) के दौरान चयनित वितरण केंद्र (आस्था उपभोक्ता भण्डार) पर
                      SMS/OTP दिखाकर मिठाई संग्रह करें।
                    </li>
                    <li>निर्धारित अंतिम तिथि के भीतर संग्रह न करने की स्थिति में ताजी मिठाई का सुरक्षित भंडारण संभव नहीं होगा।</li>
                  </ol>
                </>
              )}

              {activeModal === 'refund' && (
                <>
                  <p>
                    <b>वापसी एवं रिफंड नीति:</b>
                  </p>
                  <ul className="list-disc list-inside space-y-1.5">
                    <li>कट-ऑफ़ तिथि (24 अगस्त) से पूर्व बुकिंग रद्द करने पर 100% राशि सीधे बैंक/UPI खाते में 24 घंटे के भीतर वापस कर दी जाएगी।</li>
                    <li>कट-ऑफ़ तिथि के बाद मिठाई तैयार होने के कारण रद्दीकरण स्वीकार्य नहीं होगा।</li>
                    <li>वितरण के समय यदि पैकिंग या गुणवत्ता में कोई त्रुटि पाई जाती है, तो काउंटर पर तुरंत प्रतिस्थापन (Replacement) उपलब्ध कराया जाएगा।</li>
                  </ul>
                </>
              )}

              {activeModal === 'faqs' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <b className="text-slate-900 block">प्र. क्या होम डिलीवरी उपलब्ध है?</b>
                    <p className="text-slate-600 mt-1">
                      उत्तर: सहकार मित्र के माध्यम से सामूहिक बुकिंग पर मोहल्ले में डिलीवरी संभव है। व्यक्तिगत ग्राहक
                      आस्था उपभोक्ता भण्डार केंद्र से OTP दिखाकर संग्रह कर सकते हैं।
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <b className="text-slate-900 block">प्र. अग्रिम बुकिंग रसीद कैसे प्राप्त होगी?</b>
                    <p className="text-slate-600 mt-1">
                      उत्तर: बुकिंग होते ही स्क्रीन पर डिजिटल रसीद एवं आपके मोबाइल पर तुरंत SMS व OTP प्रेषित किया जाता है।
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <b className="text-slate-900 block">प्र. सहकार मित्र बनने की क्या प्रक्रिया है?</b>
                    <p className="text-slate-600 mt-1">
                      उत्तर: पोर्टल पर 'सहकार मित्र बनें' विकल्प पर जाकर अपना आधार व बुनियादी जानकारी भरें। समिति
                      द्वारा सत्यापन के बाद मित्र पोर्टल सक्रिय हो जाता है।
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <button
                onClick={close}
                className="w-full py-2.5 bg-amber-950 hover:bg-slate-900 text-amber-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
