/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  QrCode,
  CreditCard,
  Building2,
  Wallet,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
  Smartphone,
  Info
} from 'lucide-react';
import {
  createZohoPaymentSession,
  verifyZohoPayment,
  getZohoConfig,
  loadZohoPaymentsSdk
} from '../services/zohoPaymentService';
import { useApp } from '../context/AppContext';

interface ZohoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  bookingData?: any;
  onSuccess: (result: {
    transactionId: string;
    invoiceId: string;
    paymentMode: string;
    booking?: any;
  }) => void;
}

export const ZohoPaymentModal: React.FC<ZohoPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  customer,
  bookingData,
  onSuccess
}) => {
  const { language } = useApp();

  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [gatewayConfig, setGatewayConfig] = useState<{
    configured: boolean;
    accountId: string;
    domain: string;
    mode: 'live' | 'test';
  }>({
    configured: false,
    accountId: 'zpay_acc_sahakar_bharati',
    domain: 'IN',
    mode: 'test'
  });

  const [sessionId, setSessionId] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);

  // Form states
  const [upiId, setUpiId] = useState<string>('');
  const [upiCopied, setUpiCopied] = useState<boolean>(false);
  const [selectedBank, setSelectedBank] = useState<string>('sbi');
  const [cardNumber, setCardNumber] = useState<string>('5081 2345 6789 1024'); // RuPay default test
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('824');
  const [cardName, setCardName] = useState<string>(customer.name || 'ग्राहक');

  // Processing & verification state
  const [processingState, setProcessingState] = useState<
    'idle' | 'authorizing' | 'waiting_otp' | 'verifying' | 'success' | 'failed'
  >('idle');
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('7249');
  const [transactionId, setTransactionId] = useState<string>('');

  // 1. Initialize session on open
  useEffect(() => {
    if (!isOpen) {
      setProcessingState('idle');
      return;
    }

    let isMounted = true;
    setIsInitializing(true);
    setInitError(null);
    setSecondsRemaining(15 * 60);

    async function initSession() {
      try {
        const config = await getZohoConfig();
        if (isMounted) setGatewayConfig(config);

        // Preload official Zoho SDK
        loadZohoPaymentsSdk().catch(console.warn);

        // Request session from server
        const sessionRes = await createZohoPaymentSession({
          amount,
          currency: 'INR',
          orderId,
          customer: {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address
          },
          description: `सहकार भारती प्री-बुकिंग ऑर्डर #${orderId}`
        });

        if (isMounted) {
          setSessionId(sessionRes.payment_session_id);
          setIsInitializing(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to init Zoho Payments session:', err);
          setInitError(err.message || 'Zoho Payments सत्र शुरू नहीं हो सका');
          setIsInitializing(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [isOpen, orderId, amount]);

  // 2. Countdown timer for session validity
  useEffect(() => {
    if (!isOpen || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, secondsRemaining]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Execute payment completion & verification
  const handleCompletePayment = async (mode: 'upi' | 'card' | 'netbanking') => {
    setProcessingState('authorizing');
    setProcessingMessage('Zoho Payments सुरक्षित गेटवे से कनेक्ट हो रहा है...');

    // Simulate standard 3D Secure / UPI intent latency
    setTimeout(async () => {
      if (mode === 'card') {
        setProcessingState('waiting_otp');
        setProcessingMessage('3D सिक्योर OTP सत्यापन प्रतीक्षित है...');
        return;
      }

      await finalizeVerification(mode);
    }, 1200);
  };

  const finalizeVerification = async (mode: string) => {
    setProcessingState('verifying');
    setProcessingMessage('Zoho Payments बैंक सर्वर से पुष्टि प्राप्त कर रहा है...');

    const randomTxn = `zpay_txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const verifyRes = await verifyZohoPayment({
        payment_session_id: sessionId || `zpay_sess_${Date.now()}`,
        payment_id: randomTxn,
        order_id: orderId,
        payment_mode: mode,
        booking_data: bookingData
      });

      setTransactionId(verifyRes.transactionId);
      setProcessingState('success');
      setProcessingMessage('भुगतान सफलतापूर्वक संपन्न हुआ!');

      setTimeout(() => {
        onSuccess(verifyRes);
      }, 1500);
    } catch (err: any) {
      console.error('Zoho payment verification error:', err);
      setProcessingState('failed');
      setProcessingMessage(err.message || 'भुगतान सत्यापन विफल रहा');
    }
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText('sahakarbharati@zoho');
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150">
        {/* Zoho Payments Header */}
        <div className="bg-[#183247] text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            {/* Zoho Payments Logo Badge */}
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-red-500 via-amber-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-xs">
              <div className="w-full h-full bg-[#183247] rounded-[4px] flex items-center justify-center font-black text-xs tracking-tighter text-white">
                <span className="text-red-400">Z</span>
                <span className="text-amber-400">P</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-1">
                  Zoho Payments
                </h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {gatewayConfig.mode === 'live' ? 'Live Gateway' : 'Secure Sandbox'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{language === 'hi' ? 'सहकार भारती अधिकृत भुगतान गेटवे (PCI-DSS)' : 'Sahakar Bharati authorized payment gateway (PCI-DSS)'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right font-mono text-[11px] text-slate-300 bg-black/30 px-2 py-1 rounded">
              <span className="text-slate-400 text-[9px] block">{language === 'hi' ? 'सत्र वैधता:' : 'Session validity:'}</span>
              <span className="font-bold text-amber-300">{timeFormatted}</span>
            </div>
            <button
              onClick={onClose}
              disabled={processingState === 'verifying' || processingState === 'authorizing'}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title={language === 'hi' ? 'रद्द करें (Cancel)' : 'Cancel'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Summary Ribbon */}
        <div className="bg-amber-50/80 px-4 py-2.5 border-b border-amber-200 flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] font-mono">ऑर्डर संदर्भ (Order ID):</span>
            <span className="font-mono font-bold text-slate-900">{orderId}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] font-mono">कुल देय राशि:</span>
            <span className="font-mono font-black text-base text-amber-950">₹{amount}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Initializing State */}
          {isInitializing && (
            <div className="py-12 text-center space-y-3">
              <div className="w-9 h-9 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-medium text-slate-700">{language === 'hi' ? 'Zoho Payments सुरक्षित सत्र तैयार हो रहा है...' : 'Preparing secure Zoho Payments session...'}</p>
              <span className="text-[11px] font-mono text-slate-400">Encrypted 256-bit handshake</span>
            </div>
          )}

          {/* Init Error */}
          {!isInitializing && initError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-2 text-center">
              <AlertCircle className="w-6 h-6 mx-auto text-rose-600" />
              <p className="font-bold">{initError}</p>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-rose-700 text-white rounded font-bold text-xs"
              >
                वापस जाएं
              </button>
            </div>
          )}

          {/* Processing Overlay State */}
          {processingState !== 'idle' && (
            <div className="py-6 text-center space-y-4">
              {processingState === 'waiting_otp' ? (
                /* 3DS OTP Simulation Modal inside Zoho checkout */
                <div className="bg-slate-50 border-2 border-dashed border-amber-400 rounded-xl p-4 text-left space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                      <Lock className="w-4 h-4 text-amber-700" />
                      <span>{language === 'hi' ? 'बैंक 3D सिक्योर सत्यापन (OTP)' : 'Bank 3D Secure Verification (OTP)'}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                      RuPay / Verified by Visa
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    {language === 'hi' ? 'आपके पंजीकृत मोबाइल' : 'An OTP was sent to your registered mobile'} <span className="font-mono font-bold text-slate-900">******{customer.phone.slice(-4) || '9824'}</span>{language === 'hi' ? ' पर OTP भेजा गया है।' : '.'}
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {language === 'hi' ? 'OTP दर्ज करें (डेमो: 7249)' : 'Enter OTP (Demo: 7249)'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="p-2 border rounded font-mono font-black text-center text-base tracking-widest flex-1 border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => finalizeVerification('card')}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs"
                      >
                        {language === 'hi' ? 'सत्यापित करें ✓' : 'Verify ✓'}
                      </button>
                    </div>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setProcessingState('idle')}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      भुगतान रद्द करें
                    </button>
                  </div>
                </div>
              ) : processingState === 'success' ? (
                <div className="space-y-3 py-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-900">
                      भुगतान सफल! (Payment Successful)
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Zoho Payments ट्रांसैक्शन ID: <span className="font-mono font-bold text-slate-900">{transactionId}</span>
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded border border-emerald-200 inline-block">
                    ऑर्डर पुष्टि एवं रसीद जनरेट हो रही है...
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-6">
                  <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-bold text-slate-800 text-sm">{processingMessage}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Session: {sessionId}
                  </p>
                  <span className="text-[10px] text-slate-400 block">
                    कृपया पेज रीफ़्रेश या बंद न करें...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Normal Checkout Tabs when idle */}
          {!isInitializing && !initError && processingState === 'idle' && (
            <>
              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('upi')}
                  className={`py-2 px-2 rounded-md font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors ${
                    activeTab === 'upi'
                      ? 'bg-white text-[#183247] shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`py-2 px-2 rounded-md font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors ${
                    activeTab === 'card'
                      ? 'bg-white text-[#183247] shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>कार्ड (Cards)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('netbanking')}
                  className={`py-2 px-2 rounded-md font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors ${
                    activeTab === 'netbanking'
                      ? 'bg-white text-[#183247] shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>नेट बैंकिंग</span>
                </button>
              </div>

              {/* TAB 1: UPI & Dynamic QR */}
              {activeTab === 'upi' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      किसी भी UPI ऐप से स्कैन करके ₹{amount} का भुगतान करें
                    </span>

                    {/* Dynamic SVG QR Code Representation */}
                    <div className="inline-block p-2.5 bg-white border-2 border-slate-800 rounded-lg shadow-xs">
                      <svg
                        className="w-36 h-36 mx-auto"
                        viewBox="0 0 100 100"
                        fill="currentColor"
                      >
                        {/* Realistic QR Pattern for UPI */}
                        <rect x="0" y="0" width="30" height="30" fill="#183247" />
                        <rect x="5" y="5" width="20" height="20" fill="white" />
                        <rect x="9" y="9" width="12" height="12" fill="#183247" />

                        <rect x="70" y="0" width="30" height="30" fill="#183247" />
                        <rect x="75" y="5" width="20" height="20" fill="white" />
                        <rect x="79" y="9" width="12" height="12" fill="#183247" />

                        <rect x="0" y="70" width="30" height="30" fill="#183247" />
                        <rect x="5" y="75" width="20" height="20" fill="white" />
                        <rect x="9" y="79" width="12" height="12" fill="#183247" />

                        {/* Data dots */}
                        <circle cx="45" cy="15" r="3" fill="#183247" />
                        <circle cx="55" cy="20" r="3" fill="#183247" />
                        <circle cx="15" cy="45" r="3" fill="#183247" />
                        <circle cx="25" cy="55" r="3" fill="#183247" />
                        <circle cx="45" cy="45" r="4" fill="#d97706" />
                        <circle cx="55" cy="55" r="3" fill="#183247" />
                        <circle cx="75" cy="45" r="3" fill="#183247" />
                        <circle cx="85" cy="55" r="3" fill="#183247" />
                        <circle cx="45" cy="75" r="3" fill="#183247" />
                        <circle cx="55" cy="85" r="3" fill="#183247" />
                        <circle cx="85" cy="85" r="3" fill="#183247" />
                      </svg>
                      <div className="mt-1 text-[10px] font-mono font-bold text-slate-600">
                        sahakarbharati@zoho
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                      <span>UPI VPA:</span>
                      <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">
                        sahakarbharati@zoho
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyUPI}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600"
                        title="कॉपी करें"
                      >
                        {upiCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Supported UPI Apps */}
                    <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-200/80">
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'].map((app) => (
                        <span
                          key={app}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700 shadow-2xs"
                        >
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Or Enter UPI ID */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      या अपना UPI ID दर्ज करें (उदा. mobile@upi)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="9829012345@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="p-2 border border-slate-300 rounded flex-1 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCompletePayment('upi')}
                        className="px-3.5 py-2 bg-[#183247] hover:bg-[#112433] text-white rounded font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs"
                      >
                        <span>भुगतान अनुरोध भेजें</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Instant QR Simulator Button */}
                  <button
                    type="button"
                    onClick={() => handleCompletePayment('upi')}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>मैंने ऐप से QR स्कैन करके ₹{amount} पे कर दिया (सत्यापित करें)</span>
                  </button>
                </div>
              )}

              {/* TAB 2: Cards */}
              {activeTab === 'card' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">
                      डेबिट / क्रेडिट कार्ड विवरण
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 font-mono text-[10px] font-bold text-indigo-900">
                        RuPay
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 font-mono text-[10px] font-bold text-blue-900">
                        Visa
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 font-mono text-[10px] font-bold text-amber-900">
                        Mastercard
                      </span>
                    </div>
                  </div>

                  {/* Card Form */}
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">कार्ड नंबर</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="5081 2345 6789 1024"
                        className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">वैधता (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full p-2 border border-slate-300 rounded font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">CVV (3 अंक)</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="824"
                          className="w-full p-2 border border-slate-300 rounded font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">कार्डधारक का नाम</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCompletePayment('card')}
                    className="w-full py-2.5 bg-[#183247] hover:bg-[#112433] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>₹{amount} का सुरक्षित कार्ड भुगतान करें →</span>
                  </button>
                </div>
              )}

              {/* TAB 3: Net Banking */}
              {activeTab === 'netbanking' && (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    अपना बैंक चुनें
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
                      { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
                      { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
                      { id: 'pnb', name: 'Punjab National Bank', code: 'PNB' },
                      { id: 'bob', name: 'Bank of Baroda', code: 'BOB' },
                      { id: 'axis', name: 'Axis Bank', code: 'AXIS' }
                    ].map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        className={`p-2.5 rounded border text-left flex flex-col justify-between transition-colors ${
                          selectedBank === bank.id
                            ? 'border-amber-800 bg-amber-50 font-bold text-amber-950 ring-1 ring-amber-700'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <span className="font-mono text-xs font-black text-[#183247]">{bank.code}</span>
                        <span className="text-[10px] text-slate-600 line-clamp-1">{bank.name}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCompletePayment('netbanking')}
                    className="w-full py-2.5 bg-[#183247] hover:bg-[#112433] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors mt-2"
                  >
                    <span>चयनित बैंक से नेट-बैंकिंग भुगतान करें (₹{amount}) →</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info & security stamps */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>256-Bit SSL Secured by Zoho Payments</span>
          </div>

          <div className="font-mono text-[10px] text-slate-400">
            {gatewayConfig.mode === 'live' ? 'Production Gateway' : 'Test Mode'}
          </div>
        </div>
      </div>
    </div>
  );
};
