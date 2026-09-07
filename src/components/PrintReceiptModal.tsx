/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Booking } from '../types';
import { useApp } from '../context/AppContext';
import { SahakarLogo } from './SahakarLogo';
import { X, Printer, Share2, MapPin, Calendar, QrCode, ShieldCheck, Download } from 'lucide-react';

interface PrintReceiptModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({ booking, onClose }) => {
  const { language } = useApp();

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = language === 'hi'
      ? `*सहकार भारती — प्री-बुकिंग रसीद*\nऑर्डर नंबर: ${booking.id}\nग्राहक: ${booking.customer?.name || ''}\nकुल मात्रा: ${booking.totalKg} kg | राशि: ₹${booking.totalAmount}\nसंग्रह केंद्र: ${booking.centerNameHi}\nसंग्रह तिथि: ${booking.pickupDate}\nडिलीवरी OTP: ${booking.deliveryOtp}`
      : `*Sahakar Bharati — Pre-booking Receipt*\nOrder ID: ${booking.id}\nCustomer: ${booking.customer?.name || ''}\nQuantity: ${booking.totalKg} kg | Amount: ₹${booking.totalAmount}\nPickup Center: ${booking.centerNameEn || booking.centerNameHi}\nPickup Date: ${booking.pickupDate}\nDelivery OTP: ${booking.deliveryOtp}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs print:p-0 print:bg-white print:static print:block">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:w-full print:p-0 print:static">
        {/* Modal Header */}
        <div className="p-3 bg-amber-900 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <h3 className="font-bold text-sm">
              {language === 'hi' ? 'प्री-बुक रसीद (M-09 / C-06)' : 'Pre-Book Receipt'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-amber-800 rounded text-amber-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Content (Printable area) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 printable-area">
          <div className="border-2 border-dashed border-amber-300 rounded p-4 bg-amber-50/40 space-y-3 font-sans text-xs">
            {/* Header / Logo */}
            <div className="text-center pb-2 border-b border-amber-200 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <SahakarLogo size="sm" />
                <div className="font-black text-lg text-amber-950 tracking-tight">सहकार भारती</div>
              </div>
              <p className="text-[10px] font-mono text-amber-800 uppercase tracking-wider font-semibold">
                — प्री-बुकिंग रसीद —
              </p>
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-600 pt-1">
                <span className="font-bold text-slate-900">{booking.id}</span>
                <span>{booking.createdAt}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-1 text-slate-700 bg-white p-2.5 rounded border border-amber-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'hi' ? 'ग्राहक:' : 'Customer:'}</span>
                <span className="font-bold text-slate-900">{booking.customer?.name || 'ग्राहक'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'hi' ? 'मोबाइल:' : 'Mobile:'}</span>
                <span className="font-mono">{booking.customer?.phone || '-'}</span>
              </div>
              {booking.mitraName && (
                <div className="flex justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="text-amber-800 font-medium">
                    {language === 'hi' ? 'सहकार मित्र:' : 'Mitra:'}
                  </span>
                  <span className="font-semibold text-slate-800">{booking.mitraName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div>
              <div className="font-bold text-[11px] text-amber-900 mb-1 font-mono uppercase">
                {language === 'hi' ? 'बुकिंग मिठाई विवरण' : 'Items Pre-booked'}
              </div>
              <div className="border border-slate-200 rounded overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-100 text-amber-900 font-mono text-[10px] uppercase border-b border-amber-200">
                    <tr>
                      <th className="p-1.5">{language === 'hi' ? 'मिठाई' : 'Sweet'}</th>
                      <th className="p-1.5 text-center">{language === 'hi' ? 'मात्रा' : 'Qty'}</th>
                      <th className="p-1.5 text-right">{language === 'hi' ? 'राशि' : 'Amt'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(booking?.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5 font-medium text-slate-800">
                          {language === 'hi' ? item.sweetNameHi : item.sweetNameEn}
                          <span className="block text-[10px] font-mono text-slate-500">
                            {item.variantLabel} x {item.quantity}
                          </span>
                        </td>
                        <td className="p-1.5 text-center font-mono font-medium">
                          {((item.variantKg || 0) * (item.quantity || 0)).toFixed(2)} kg
                        </td>
                        <td className="p-1.5 text-right font-mono font-bold text-slate-800">
                          ₹{item.totalAmount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Discount line if present */}
            {booking?.discountAmount && booking.discountAmount > 0 ? (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'hi' ? 'मूल उप-योग:' : 'Subtotal:'}</span>
                  <span className="font-mono">₹{booking.subtotalAmount || (booking.totalAmount + booking.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>{language === 'hi' ? `छूट कूपन (${booking.discountCode}):` : `Discount (${booking.discountCode}):`}</span>
                  <span className="font-mono">-₹{booking.discountAmount}</span>
                </div>
              </div>
            ) : null}

            {/* Total & Payment status */}
            <div className="flex justify-between items-center p-2.5 bg-amber-900 text-white rounded font-bold">
              <div>
                <span>{language === 'hi' ? 'कुल राशि:' : 'Total Amount:'}</span>
                <span className="block text-[10px] font-normal text-amber-200">
                  {(booking?.totalKg || 0).toFixed(2)} kg कुल मात्रा
                </span>
              </div>
              <div className="text-right">
                <div className="font-mono text-base">₹{booking.totalAmount}</div>
                <span
                  className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-semibold ${
                    booking.paymentMethod === 'udhar'
                      ? 'bg-amber-200 text-amber-950'
                      : 'bg-emerald-300 text-emerald-950'
                  }`}
                >
                  {booking.paymentMethod === 'udhar'
                    ? language === 'hi' ? 'उधार' : 'Udhar'
                    : booking.paymentMethod === 'cash'
                    ? language === 'hi' ? 'नगद' : 'Cash'
                    : language === 'hi' ? 'ऑनलाइन भुगतान ✓' : 'Online Paid'}
                </span>
              </div>
            </div>

            {/* Zoho Payments Transaction Details */}
            {booking.zohoPaymentId && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-[11px] text-emerald-950 font-mono space-y-1">
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1 text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Zoho Payments सुरक्षित भुगतान</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 uppercase">
                    {booking.zohoPaymentMode || 'UPI/Card'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-emerald-900/90 pt-0.5 border-t border-emerald-200">
                  <span>Txn ID: {booking.zohoPaymentId}</span>
                  {booking.invoiceId && <span>Inv: {booking.invoiceId}</span>}
                </div>
              </div>
            )}

            {/* Pick-up Center Box */}
            <div className="p-3 bg-white border border-amber-300 rounded space-y-1.5">
              <div className="font-bold text-xs text-amber-950 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'hi' ? 'मिठाई संग्रह केंद्र' : 'Collection Center'}</span>
              </div>
              <div className="text-xs font-semibold text-slate-800">{language === 'hi' ? booking.centerNameHi : booking.centerNameEn || booking.centerNameHi || 'Sahakar Center'}</div>
              <p className="text-[11px] text-slate-600 leading-tight">{language === 'hi' ? booking.centerAddressHi : booking.centerAddressEn || booking.centerAddressHi || 'Jaipur, Rajasthan'}</p>
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-700 font-mono">
                <span className="flex items-center gap-1 text-slate-900 font-bold">
                  <Calendar className="w-3 h-3 text-amber-800" />
                  {booking.pickupDate || '-'}
                </span>
                <span>संपर्क: {booking.centerPhone || '-'}</span>
              </div>
            </div>

            {/* Delivery OTP & QR Code */}
            <div className="text-center p-3 bg-white border border-slate-200 rounded space-y-2">
              <p className="text-[11px] font-bold text-slate-800">
                {language === 'hi'
                  ? 'मिठाई लेते समय केंद्र पर यह QR कोड / OTP बताएँ:'
                  : 'Show this QR Code / OTP at the center during pickup:'}
              </p>
              
              {/* QR Visual SVG */}
              <div className="w-24 h-24 mx-auto bg-slate-900 text-white p-2 rounded flex items-center justify-center font-mono text-[9px] shadow-inner">
                <div className="border-2 border-white p-1 text-center w-full h-full flex flex-col justify-between items-center">
                  <QrCode className="w-12 h-12 text-white" />
                  <span className="font-bold tracking-widest">{booking.deliveryOtp || '-'}</span>
                </div>
              </div>

              <div className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded inline-block">
                डिलीवरी OTP: <span className="text-lg tracking-wider">{booking.deliveryOtp || '-'}</span>
              </div>
            </div>

            {/* Note */}
            <p className="text-[10px] text-slate-500 text-center italic">
              * यह केवल प्री-बुकिंग रसीद है, टैक्स इनवॉइस मिठाई हैंडओवर के समय केंद्र द्वारा जारी किया जाएगा।
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2 no-print">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'WhatsApp शेयर' : 'Share WhatsApp'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'प्रिंट / PDF' : 'Print / PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
