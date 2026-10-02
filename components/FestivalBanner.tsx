/**
 * Festival banner (Server Component, prop-driven).
 *
 * The SPA version pulled the active festival, city, and booking window from
 * AppContext. Here the caller (an RSC that has already queried the DB) passes
 * them as props, so this renders entirely on the server with no client JS.
 * Theme (gradient/tag/emoji) is derived from the festival name, matching the
 * SPA's presentation.
 */

import { Calendar, Clock, AlertCircle } from 'lucide-react';
import type { Locale } from '@/src/lib/locale';

export interface FestivalBannerProps {
  locale: Locale;
  festival: {
    nameHi: string;
    nameEn: string;
    cutoffDate: string;
    distributionStartDate: string;
    distributionEndDate: string;
  } | null;
  cityNameHi?: string;
  cityNameEn?: string;
  isBookingWindowOpen: boolean;
}

export function FestivalBanner({
  locale,
  festival,
  cityNameHi,
  cityNameEn,
  isBookingWindowOpen,
}: FestivalBannerProps) {
  const hi = locale === 'hi';
  const name = String(hi ? festival?.nameHi || 'उत्सव' : festival?.nameEn || 'Festival');

  let bgGradient = 'from-amber-700 via-orange-800 to-amber-900';
  let bannerTag = hi ? 'विशेष उत्सव मिष्ठान भंडार' : 'Special Festival Sweet Store';
  let bannerSubtext = hi
    ? 'सहकार भारती द्वारा शुद्धता व सामाजिक सहकारिता का संकल्प।'
    : 'Sahakar Bharati commitment to purity and cooperative values.';
  let themeEmoji = '🪔';

  const lower = name.toLowerCase();
  if (name.includes('दीपावली') || lower.includes('diwali')) {
    bgGradient = 'from-orange-800 via-amber-900 to-rose-950';
    bannerTag = hi ? 'दीपावली महा-उत्सव 2026 स्पेशल' : 'Diwali Festival 2026 Special';
    bannerSubtext = hi
      ? 'शुद्ध देशी गाय के घी एवं ताज़ा मेवों से निर्मित पावन मिष्ठान'
      : 'Sacred sweets made with pure cow ghee and fresh dry fruits';
    themeEmoji = '🪔';
  } else if (name.includes('होली') || lower.includes('holi')) {
    bgGradient = 'from-orange-700 via-pink-800 to-purple-900';
    bannerTag = hi ? 'होली रंगोत्सव महा-प्रसाद स्पेशल' : 'Holi Festival Special';
    bannerSubtext = hi
      ? 'शुद्ध मावा गुझिया, मालपुआ एवं केसरिया ठंडाई'
      : 'Pure mawa gujiya, malpua and kesariya thandai';
    themeEmoji = '🎨';
  } else if (name.includes('गणेश') || lower.includes('ganesh')) {
    bgGradient = 'from-amber-800 via-orange-900 to-yellow-950';
    bannerTag = hi ? 'गणेशोत्सव महाप्रसाद प्री-बुकिंग' : 'Ganesh Festival Pre-booking';
    bannerSubtext = hi
      ? 'भगवान श्री गणेश हेतु केसर मोदक व बूंदी लड्डू'
      : 'Kesari modak and boondi laddoo for Lord Ganesha';
    themeEmoji = '🌺';
  }

  const cityLabel = hi ? cityNameHi || '' : cityNameEn || '';

  return (
    <div
      className={`bg-gradient-to-r ${bgGradient} text-white border-b-2 border-amber-400/60 shadow-inner px-3 py-2.5 sm:py-3 transition-all`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 min-w-0 text-center md:text-left">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400/20 border-2 border-amber-300/80 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-xs">
            {themeEmoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
              <span className="bg-amber-400 text-amber-950 text-[10px] sm:text-xs font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                {bannerTag}
              </span>
              {cityLabel && (
                <span className="text-amber-200 text-xs font-bold font-mono">
                  {hi ? `${cityLabel} मंडल` : `${cityLabel} District`}
                </span>
              )}
            </div>
            <p className="text-xs text-amber-100/90 font-medium truncate mt-0.5">{bannerSubtext}</p>
          </div>
        </div>

        <div className="flex items-center justify-center md:justify-end gap-2 text-xs font-mono flex-wrap shrink-0">
          <div className="bg-blue-950/70 border border-blue-400/50 text-blue-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {hi ? 'वितरण:' : 'Pickup:'}{' '}
              <b className="text-amber-200">
                {festival?.distributionStartDate || ''} {hi ? 'से' : 'to'}{' '}
                {festival?.distributionEndDate || ''}
              </b>
            </span>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-xs ${
              isBookingWindowOpen
                ? 'bg-amber-950/80 text-amber-200 border-amber-400/60'
                : 'bg-rose-950/90 text-rose-200 border-rose-500 font-bold'
            }`}
          >
            {isBookingWindowOpen ? (
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>
              {isBookingWindowOpen
                ? hi
                  ? `अंतिम तिथि: ${festival?.cutoffDate || ''}`
                  : `Cutoff: ${festival?.cutoffDate || ''}`
                : hi
                  ? 'बुकिंग बंद है'
                  : 'Closed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
