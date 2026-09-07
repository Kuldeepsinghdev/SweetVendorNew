/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Calendar, Clock, AlertCircle, ShieldCheck, HeartHandshake } from 'lucide-react';

export const FestivalBanner: React.FC = () => {
  const { activeFestival, activeCity, language, isBookingWindowOpen } = useApp();

  const name = language === 'hi' ? activeFestival?.nameHi || 'उत्सव' : activeFestival?.nameEn || 'Festival';
  
  // Festival-based themes
  let bgGradient = 'from-amber-700 via-orange-800 to-amber-900';
  let bannerTag = language === 'hi' ? 'विशेष उत्सव मिष्ठान भंडार' : 'Special Festival Sweet Store';
  let bannerSubtext = language === 'hi'
    ? 'सहकार भारती द्वारा शुद्धता व सामाजिक सहकारिता का संकल्प।'
    : 'Sahakar Bharati commitment to purity and cooperative values.';
  let themeEmoji = '🪔';

  if (name.includes('दीपावली') || name.toLowerCase().includes('diwali')) {
    bgGradient = 'from-orange-800 via-amber-900 to-rose-950';
    bannerTag = language === 'hi' ? 'दीपावली महा-उत्सव 2026 स्पेशल' : 'Diwali Festival 2026 Special';
    bannerSubtext = language === 'hi' ? 'शुद्ध देशी गाय के घी एवं ताज़ा मेवों से निर्मित पावन मिष्ठान' : 'Sacred sweets made with pure cow ghee and fresh dry fruits';
    themeEmoji = '🪔';
  } else if (name.includes('होली') || name.toLowerCase().includes('holi')) {
    bgGradient = 'from-orange-700 via-pink-800 to-purple-900';
    bannerTag = language === 'hi' ? 'होली रंगोत्सव महा-प्रसाद स्पेशल' : 'Holi Festival Special';
    bannerSubtext = language === 'hi' ? 'शुद्ध मावा गुझिया, मालपुआ एवं केसरिया ठंडाई' : 'Pure mawa gujiya, malpua and kesariya thandai';
    themeEmoji = '🎨';
  } else if (name.includes('गणेश') || name.toLowerCase().includes('ganesh')) {
    bgGradient = 'from-amber-800 via-orange-900 to-yellow-950';
    bannerTag = language === 'hi' ? 'गणेशोत्सव महाप्रसाद प्री-बुकिंग' : 'Ganesh Festival Pre-booking';
    bannerSubtext = language === 'hi' ? 'भगवान श्री गणेश हेतु केसर मोदक व बूंदी लड्डू' : 'Kesari modak and boondi laddoo for Lord Ganesha';
    themeEmoji = '🌺';
  }

  return (
    <div className={`bg-gradient-to-r ${bgGradient} text-white border-b-2 border-amber-400/60 shadow-inner px-3 py-2.5 sm:py-3 transition-all`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3">
        {/* Left: Festival Info */}
        <div className="flex items-center gap-2.5 min-w-0 text-center md:text-left">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400/20 border-2 border-amber-300/80 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-xs">
            {themeEmoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
              <span className="bg-amber-400 text-amber-950 text-[10px] sm:text-xs font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                {bannerTag}
              </span>
              <span className="text-amber-200 text-xs font-bold font-mono">
                {language === 'hi' ? `${activeCity?.nameHi || ''} मंडल` : `${activeCity?.nameEn || ''} District`}
              </span>
            </div>
            <p className="text-xs text-amber-100/90 font-medium truncate mt-0.5">
              {bannerSubtext}
            </p>
          </div>
        </div>

        {/* Right: Key Window Dates */}
        <div className="flex items-center justify-center md:justify-end gap-2 text-xs font-mono flex-wrap shrink-0">
          <div className="bg-blue-950/70 border border-blue-400/50 text-blue-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {language === 'hi' ? 'वितरण:' : 'Pickup:'}{' '}
              <b className="text-amber-200">{activeFestival?.distributionStartDate || ''} {language === 'hi' ? 'से' : 'to'} {activeFestival?.distributionEndDate || ''}</b>
            </span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-xs ${
            isBookingWindowOpen
              ? 'bg-amber-950/80 text-amber-200 border-amber-400/60'
              : 'bg-rose-950/90 text-rose-200 border-rose-500 font-bold'
          }`}>
            {isBookingWindowOpen ? (
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>
              {isBookingWindowOpen
                ? language === 'hi'
                  ? `अंतिम तिथि: ${activeFestival?.cutoffDate || ''}`
                  : `Cutoff: ${activeFestival?.cutoffDate || ''}`
                : language === 'hi'
                ? 'बुकिंग बंद है'
                : 'Closed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
