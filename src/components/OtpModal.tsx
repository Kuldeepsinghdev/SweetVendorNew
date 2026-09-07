/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, KeyRound, CheckCircle2, RotateCcw, MessageSquare, Phone } from 'lucide-react';

export const OtpModal: React.FC = () => {
  const { otpModalState, closeOtpModal, language } = useApp();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (otpModalState.isOpen) {
      setOtp(['', '', '', '', '', '']);
      setTimer(30);
      setErrorMsg('');
      setSuccess(false);
    }
  }, [otpModalState.isOpen]);

  useEffect(() => {
    let interval: any;
    if (otpModalState.isOpen && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpModalState.isOpen, timer]);

  if (!otpModalState.isOpen) return null;

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleDemoAutoFill = () => {
    setOtp(['1', '2', '3', '4', '5', '6']);
  };

  const handleVerify = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 4) {
      setErrorMsg(language === 'hi' ? 'कृपया पूर्ण 6 अंक का OTP दर्ज करें' : 'Please enter full 6-digit OTP');
      return;
    }

    if (otpModalState.onVerify) {
      const isOk = otpModalState.onVerify(fullOtp);
      if (!isOk) {
        setErrorMsg(language === 'hi' ? 'अमान्य OTP! पुनः प्रयास करें' : 'Invalid OTP! Please try again');
        return;
      }
    }

    setSuccess(true);
    setTimeout(() => {
      closeOtpModal();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 relative">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center mx-auto mb-2 font-bold shadow-inner">
            <Shield className="w-6 h-6 text-amber-800" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">
            {otpModalState.title || (language === 'hi' ? 'OTP सत्यापन (CM-02)' : 'OTP Verification')}
          </h3>
          <p className="text-xs text-slate-500">
            {language === 'hi' ? 'मोबाइल नंबर ' : 'Sent to mobile '}
            <span className="font-mono font-bold text-slate-700">
              {otpModalState.phone || '+91 98XXXXXX21'}
            </span>
            {language === 'hi' ? ' पर 6 अंकों का सुरक्षा कोड भेजा गया है।' : ''}
          </p>
        </div>

        {/* OTP Input Fields */}
        <div className="flex justify-center gap-1.5 sm:gap-2 my-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-input-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-8 sm:w-10 h-10 sm:h-12 border-2 border-slate-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-200 rounded text-center font-mono text-base sm:text-lg font-bold text-slate-800 focus:outline-none transition-all"
            />
          ))}
        </div>

        {/* Error message */}
        {errorMsg && (
          <p className="text-center text-xs font-medium text-rose-600 bg-rose-50 py-1 px-2 rounded border border-rose-200">
            {errorMsg}
          </p>
        )}

        {/* Success message */}
        {success && (
          <p className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-1 px-2 rounded border border-emerald-200 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {language === 'hi' ? 'सत्यापन सफल!' : 'Verified Successfully!'}
          </p>
        )}

        {/* Demo Helper & Resend Timer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <button
            onClick={handleDemoAutoFill}
            className="text-amber-800 hover:text-amber-950 font-bold underline text-[11px] flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3 text-amber-700" />
            {language === 'hi' ? 'डेमो: 123456 भरें' : 'Demo Auto-fill'}
          </button>

          {timer > 0 ? (
            <span className="font-mono text-[11px]">
              {language === 'hi' ? `पुनः भेजें — 00:${timer < 10 ? '0' : ''}${timer}` : `Resend in ${timer}s`}
            </span>
          ) : (
            <button
              onClick={() => setTimer(30)}
              className="text-amber-800 font-medium hover:underline flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              {language === 'hi' ? 'दोबारा OTP भेजें' : 'Resend OTP'}
            </button>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleVerify}
            className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-2.5 rounded text-xs shadow transition-colors flex items-center justify-center gap-2"
          >
            <span>{language === 'hi' ? 'सत्यापित करें' : 'Verify & Continue'}</span>
          </button>
          <button
            onClick={closeOtpModal}
            className="w-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium py-1.5 rounded text-xs transition-colors"
          >
            {language === 'hi' ? 'रद्द करें / नंबर बदलें' : 'Cancel / Change Number'}
          </button>
        </div>
      </div>
    </div>
  );
};
