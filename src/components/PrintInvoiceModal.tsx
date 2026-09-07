/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Booking } from '../types';
import { useApp } from '../context/AppContext';
import { X, Printer, FileText, CheckCircle, Shield } from 'lucide-react';

interface PrintInvoiceModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ booking, onClose }) => {
  const { language } = useApp();
  const [thermalMode, setThermalMode] = useState(false);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  // GST Calculation (5% total GST included in price or added)
  // Taxable Value = Amount / 1.05
  const totalAmount = booking.totalAmount;
  const taxableValue = Math.round((totalAmount / 1.05) * 100) / 100;
  const gstTotal = Math.round((totalAmount - taxableValue) * 100) / 100;
  const cgst = Math.round((gstTotal / 2) * 100) / 100;
  const sgst = Math.round((gstTotal / 2) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs print:p-0 print:bg-white print:static print:block">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:w-full print:p-0 print:static">
        {/* Modal Header */}
        <div className="p-3 bg-purple-900 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-300" />
            <h3 className="font-bold text-sm">
              {language === 'hi' ? 'टैक्स इनवॉइस (K-04)' : 'GST Tax Invoice'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setThermalMode(!thermalMode)}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-800 text-purple-200 border border-purple-700 hover:text-white"
            >
              {thermalMode ? 'A4 मोड' : '58mm मोड'}
            </button>
            <button onClick={onClose} className="p-1 hover:bg-purple-800 rounded text-purple-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 printable-area">
          <div
            className={`border border-slate-300 rounded p-4 bg-white space-y-3 font-sans text-xs ${
              thermalMode ? 'max-w-[280px] mx-auto text-[11px]' : ''
            }`}
          >
            {/* Seller Header */}
            <div className="text-center pb-3 border-b border-slate-200 space-y-0.5">
              <div className="font-black text-base text-slate-900 uppercase tracking-tight">
                {language === 'hi' ? booking.centerNameHi : booking.centerNameEn || booking.centerNameHi}
              </div>
              <p className="text-[10px] text-slate-600 leading-tight">
                {language === 'hi' ? booking.centerAddressHi : booking.centerAddressEn || booking.centerAddressHi}
              </p>
              <div className="font-mono text-[10px] font-bold text-slate-800 pt-1">
                GSTIN: 08AAAAA0000A1Z5 | HSN Code: 2106
              </div>
              <div className="font-bold text-amber-900 border-t border-slate-100 pt-1 text-xs">
                *** TAX INVOICE ***
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="flex justify-between font-mono text-[11px] text-slate-700 pb-2 border-b border-slate-100">
              <div>
                <span className="text-slate-400 block text-[9px]">INVOICE NO:</span>
                <span className="font-bold text-slate-900">
                  {booking.invoiceId || 'INV-JPR-000871'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[9px]">DATE & TIME:</span>
                <span className="font-semibold text-slate-900">
                  {booking.deliveredAt || new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="space-y-0.5 text-slate-700 bg-slate-50 p-2 rounded">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                {language === 'hi' ? 'ग्राहक विवरण (BUYER):' : 'BUYER DETAILS:'}
              </div>
              <div className="font-bold text-slate-900">{booking.customer?.name || ''}</div>
              <div className="font-mono text-[11px]">{booking.customer?.phone || ''}</div>
              {booking.customer?.address && (
                <div className="text-[10px] text-slate-600">{booking.customer.address}</div>
              )}
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase border-y border-slate-200">
                  <tr>
                    <th className="p-1">Item</th>
                    <th className="p-1 text-center">HSN</th>
                    <th className="p-1 text-right">Amt (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(booking?.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-1 font-medium text-slate-800">
                        {language === 'hi' ? item.sweetNameHi : item.sweetNameEn}
                        <span className="block text-[9px] font-mono text-slate-500">
                          {item.variantLabel} x {item.quantity}
                        </span>
                      </td>
                      <td className="p-1 text-center font-mono text-[10px] text-slate-500">2106</td>
                      <td className="p-1 text-right font-mono font-bold text-slate-800">
                        {item.totalAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GST Tax Breakdown Table */}
            <div className="border-t border-slate-200 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value (करयोग्य मूल्य):</span>
                <span className="font-mono">₹{taxableValue}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST @ 2.5%:</span>
                <span className="font-mono">₹{cgst}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST @ 2.5%:</span>
                <span className="font-mono">₹{sgst}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-1">
                <span>GRAND TOTAL (कुल मूल्य):</span>
                <span className="font-mono text-purple-900">₹{totalAmount}</span>
              </div>
            </div>

            {/* Payment Received Status */}
            <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>
                {booking.paymentMethod === 'cash'
                  ? language === 'hi' ? 'नगद भुगतान प्राप्त ✓' : 'Cash Received ✓'
                  : booking.paymentMethod === 'online'
                  ? language === 'hi' ? 'ऑनलाइन भुगतान प्राप्त ✓' : 'Online Paid ✓'
                  : language === 'hi' ? 'उधार - मित्र द्वारा चुकता किया गया' : 'Settled via Mitra'}
              </span>
            </div>

            {/* Signature & Footer */}
            <div className="pt-4 flex justify-between items-end text-[10px] text-slate-500">
              <div className="font-mono">
                E. & O.E.<br />
                धन्यवाद! पुन: पधारें।
              </div>
              <div className="text-right border-t border-slate-400 pt-1 font-mono">
                अधिकृत हस्ताक्षरकर्ता<br />
                ({language === 'hi' ? booking.centerNameHi : booking.centerNameEn || booking.centerNameHi})
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="w-full py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'इनवॉइस प्रिंट करें / PDF' : 'Print Invoice / PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
