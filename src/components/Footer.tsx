/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  FileText,
  Lock,
  RefreshCw,
  Award,
  HelpCircle,
  X,
  Store,
  ChevronRight,
  Heart
} from 'lucide-react';

type InfoModalType = 'about' | 'contact' | 'privacy' | 'terms' | 'refund' | 'purity' | 'faqs' | null;

export const Footer: React.FC = () => {
  const { role, setRole, language } = useApp();
  const [activeModal, setActiveModal] = useState<InfoModalType>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer className="bg-gradient-to-b from-amber-950 to-slate-950 text-amber-100/90 border-t-4 border-amber-500 pt-10 pb-24 sm:pb-12 px-4 no-print">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-amber-900/60">
            
            {/* Column 1: Organization & Mission */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🪔</span>
                <div>
                  <h3 className="font-black text-white text-base sm:text-lg leading-tight">
                    {language === 'hi' ? 'सहकार भारती' : 'Sahakar Bharati'}
                  </h3>
                  <p className="text-[11px] text-amber-300 font-bold">
                    {language === 'hi' ? 'उत्सव मिष्ठान वितरण एवं प्री-बुकिंग सेवा' : 'Festive Sweets Pre-booking Network'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-amber-200/80 leading-relaxed">
                {language === 'hi'
                  ? 'त्यौहारों पर मिलावट मुक्त, 100% गाय के शुद्ध देशी घी से निर्मित पौष्टिक व पारंपरिक मिष्ठान उचित सहकारी मूल्य पर उपलब्ध कराने हेतु समर्पित।'
                  : 'Dedicated to providing 100% pure cow desi ghee adulteration-free festival sweets at fair cooperative prices.'}
              </p>

              <div className="inline-flex items-center gap-2 bg-amber-900/60 text-amber-200 text-[11px] font-mono font-bold px-3 py-1 rounded-xl border border-amber-700/60">
                <span>GST: 08AAAAK4833E1ZV</span>
              </div>
            </div>

            {/* Column 2: Quick Links & Official Policies */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-800/60 pb-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>{language === 'hi' ? 'महत्वपूर्ण पृष्ठ व नीतियां' : 'Policies & Pages'}</span>
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => setActiveModal('about')}
                    className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'hi' ? 'हमारे बारे में (About Us)' : 'About Us'}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('purity')}
                    className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'hi' ? 'शुद्धता व FSSAI मानक' : 'Purity & FSSAI Standards'}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('privacy')}
                    className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'hi' ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('terms')}
                    className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'hi' ? 'नियम एवं शर्तें (Terms of Service)' : 'Terms & Conditions'}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('refund')}
                    className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'hi' ? 'रिफंड व रद्दीकरण नीति' : 'Refund & Cancellation Policy'}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('faqs')}
                    className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'hi' ? 'अक्सर पूछे जाने वाले सवाल (FAQs)' : 'FAQs'}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact Us & Store Timings */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-800/60 pb-2">
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>{language === 'hi' ? 'संपर्क व वितरण केंद्र' : 'Contact & Store'}</span>
              </h4>
              <div className="space-y-2.5 text-xs text-amber-200/90">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <b>{language === 'hi' ? 'आस्था उपभोक्ता भण्डार' : 'Aastha Consumer Store'}</b>
                    <br />
                    {language === 'hi' ? 'बजरिया टोंक रोड़, सवाई माधोपुर - 322001 (राजस्थान)' : 'Bajaria Tonk Road, Sawai Madhopur - 322001 (Rajasthan)'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{language === 'hi' ? 'प्रतिदिन: प्रातः 08:00 से रात्रि 09:00 बजे तक' : 'Daily: 08:00 AM to 09:00 PM'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="font-mono">support@sahakarsweets.org</span>
                </div>
              </div>
            </div>

            {/* Column 4: Helplines & Admin Portal Button */}
            <div className="space-y-3.5 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-800/60 pb-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{language === 'hi' ? 'अग्रिम बुकिंग हेल्पलाइन' : 'Helpline Numbers'}</span>
                </h4>
                <div className="space-y-1.5 pt-1 font-mono text-xs">
                  <div className="flex items-center justify-between bg-amber-900/40 p-1.5 rounded-lg border border-amber-800/50">
                    <span className="text-amber-300">{language === 'hi' ? 'हेल्पलाइन 1:' : 'Helpline 1:'}</span>
                    <a href="tel:9413753383" className="font-bold text-white hover:text-amber-300">
                      9413753383
                    </a>
                  </div>
                  <div className="flex items-center justify-between bg-amber-900/40 p-1.5 rounded-lg border border-amber-800/50">
                    <span className="text-amber-300">{language === 'hi' ? 'हेल्पलाइन 2:' : 'Helpline 2:'}</span>
                    <a href="tel:9875186011" className="font-bold text-white hover:text-amber-300">
                      9875186011
                    </a>
                  </div>
                  <div className="flex items-center justify-between bg-amber-900/40 p-1.5 rounded-lg border border-amber-800/50">
                    <span className="text-amber-300">{language === 'hi' ? 'हेल्पलाइन 3:' : 'Helpline 3:'}</span>
                    <a href="tel:9462919288" className="font-bold text-white hover:text-amber-300">
                      9462919288
                    </a>
                  </div>
                </div>
              </div>

              {/* Administrative Portal Section (At Bottom) */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'hi' ? 'प्रशासनिक प्रवेश (Admin Access):' : 'Admin Access:'}</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setRole('kendra')}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      role === 'kendra'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-emerald-700/50'
                    }`}
                    title={language === 'hi' ? 'बिक्री केंद्र प्रबंधन' : 'Sale Center Management'}
                  >
                    <span>{language === 'hi' ? '1. बिक्री केंद्र' : '1. Sale Center'}</span>
                  </button>
                  <button
                    onClick={() => setRole('city_admin')}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      role === 'city_admin'
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-purple-700/50'
                    }`}
                    title={language === 'hi' ? 'ज़िला/शहर एडमिन' : 'District/City Admin'}
                  >
                    <span>{language === 'hi' ? '2. शहर एडमिन' : '2. City Admin'}</span>
                  </button>
                  <button
                    onClick={() => setRole('super_admin')}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      role === 'super_admin'
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-700/50'
                    }`}
                    title="सुपर एडमिन"
                  >
                    <span>3. सुपर एडमिन</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Guarantee Strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-300/80 text-center sm:text-left">
            <div>
              © 2026 <b>सहकार भारती</b>. सर्वाधिकार सुरक्षित। (Rajasthan Cooperative Societies Pre-booking Network)
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
              <span>🌿 100% शुद्ध गाय का देशी घी • बिना चांदी वर्क • स्वदेशी अभियान</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Information Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border-2 border-amber-400 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            
            {/* Modal Header */}
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
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="text-xs sm:text-sm text-slate-700 space-y-3.5 leading-relaxed">
              {activeModal === 'about' && (
                <>
                  <p>
                    <b>सहकार भारती</b> का प्राथमिक उद्देश्य नागरिकों को बिना किसी मिलावट के, 100% शुद्ध गाय के देशी घी से निर्मित पारंपरिक मिठाइयाँ 'नो-प्रॉफ़िट, नो-लॉस' सहकारी सिद्धांतों पर उपलब्ध कराना है।
                  </p>
                  <p>
                    दीपावली व अन्य पावन पर्वों पर हमारे अधिकृत सहकारी वितरण केंद्रों के माध्यम से शुद्धता, अग्रिम प्री-बुकिंग और समयबद्ध वितरण सुनिश्चित किया जाता है।
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
                    हम गुणवत्ता और स्वच्छता के उच्चतम मानकों का पालन करते हैं। हमारी सभी मिष्ठानियां सख्त खाद्य सुरक्षा मानकों के तहत कुशल हलवाइयों द्वारा तैयार की जाती हैं।
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <b className="text-emerald-900 block mb-0.5">FSSAI एवं स्वच्छता मानक:</b>
                      <p className="text-emerald-800">
                        सभी कच्चे माल (काजू, मूंग दाल, बेसन, खोया) की सघन जांच के पश्चात ही निर्माण प्रक्रिया में उपयोग किया जाता है।
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <b className="text-amber-900 block mb-0.5">बिना चांदी वर्क की गारंटी:</b>
                      <p className="text-amber-800">
                        बाजार में मिलने वाले चांदी के वर्क में होने वाली मिलावट से बचाने हेतु हमारी काजू कतली पूरी तरह बिना वर्क निर्मित होती है।
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <p>
                    आपकी व्यक्तिगत जानकारी (नाम, मोबाइल नंबर, पता) हमारे पास पूरी तरह सुरक्षित है।
                  </p>
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
                    <li>वितरण तिथि (25 से 28 अगस्त 2026) के दौरान चयनित वितरण केंद्र (आस्था उपभोक्ता भण्डार) पर SMS/OTP दिखाकर मिठाई संग्रह करें।</li>
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
                <>
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <b className="text-slate-900 block">प्र. क्या होम डिलीवरी उपलब्ध है?</b>
                      <p className="text-slate-600 mt-1">
                        उत्तर: सहकार मित्र के माध्यम से सामूहिक बुकिंग पर मोहल्ले में डिलीवरी संभव है। व्यक्तिगत ग्राहक आस्था उपभोक्ता भण्डार केंद्र से OTP दिखाकर संग्रह कर सकते हैं।
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
                        उत्तर: पोर्टल पर 'सहकार मित्र बनें' विकल्प पर जाकर अपना आधार व बुनियादी जानकारी भरें। समिति द्वारा सत्यापन के बाद मित्र पोर्टल सक्रिय हो जाता है।
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-3">
              <button
                onClick={closeModal}
                className="w-full py-2.5 bg-amber-950 hover:bg-slate-900 text-amber-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                बंद करें (Close)
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
