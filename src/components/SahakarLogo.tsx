/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SahakarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SahakarLogo: React.FC<SahakarLogoProps> = ({ size = 'md', className = '' }) => {
  // Size classes
  let sizeClasses = 'w-9 h-9 sm:w-10 sm:h-10';
  let topTextClasses = 'text-[9px] sm:text-[10px]';
  let bottomTextClasses = 'text-[7.5px] sm:text-[8.5px]';

  if (size === 'sm') {
    sizeClasses = 'w-8 h-8';
    topTextClasses = 'text-[8.5px]';
    bottomTextClasses = 'text-[7px]';
  } else if (size === 'lg') {
    sizeClasses = 'w-12 h-12';
    topTextClasses = 'text-[11px]';
    bottomTextClasses = 'text-[9px]';
  } else if (size === 'xl') {
    sizeClasses = 'w-16 h-16';
    topTextClasses = 'text-[15px]';
    bottomTextClasses = 'text-[12px]';
  }

  return (
    <div
      className={`rounded-full bg-amber-400 text-slate-950 font-black flex flex-col items-center justify-center shadow-md border-2 border-white shrink-0 overflow-hidden relative leading-none select-none ${sizeClasses} ${className}`}
    >
      <span className={`font-black tracking-tighter text-orange-950 ${topTextClasses}`}>
        सहकार
      </span>
      <span className={`font-extrabold tracking-widest text-orange-900 uppercase ${bottomTextClasses}`}>
        भारती
      </span>
    </div>
  );
};
