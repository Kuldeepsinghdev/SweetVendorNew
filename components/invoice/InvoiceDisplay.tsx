'use client';

import { useEffect, useState } from 'react';
import { Printer, Download, AlertCircle, Loader2 } from 'lucide-react';

interface InvoiceItem {
  sweetId: string;
  sweetNameHi: string;
  sweetNameEn: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPincode?: string;
  mitraName?: string;
  festivalName: string;
  saleCenterName: string;
  pickupCenterName: string;
  items: InvoiceItem[];
  subtotalAmount: number;
  discountCode?: string;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
}

export function InvoiceDisplay({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        if (!res.ok) {
          if (res.status === 401) throw new Error('Please sign in to view this invoice.');
          if (res.status === 403) throw new Error('You do not have permission to view this invoice.');
          if (res.status === 404) throw new Error('Invoice not found.');
          throw new Error('Failed to load invoice');
        }
        const data = await res.json();
        setInvoice(data.invoice);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [invoiceId]);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <span className="ml-2 text-slate-600">Loading invoice...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-900">Error</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-8 text-slate-600">
        Invoice not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-amber-100 p-8 print:shadow-none print:border-none print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-8 border-b border-amber-100">
        <div>
          <h1 className="text-3xl font-black text-amber-900">🪔 सहकार भारती</h1>
          <p className="text-sm text-slate-600">Sahakar Bharati</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-lg font-bold text-slate-800">{invoice.invoiceNumber}</p>
          <p className="text-sm text-slate-600">{formatDate(invoice.invoiceDate)}</p>
          {invoice.dueDate && (
            <p className="text-xs text-amber-700">
              Due: {formatDate(invoice.dueDate)}
            </p>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Bill To */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wide text-slate-700 mb-3">
            Bill To
          </h3>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-slate-800">{invoice.customerName}</p>
            <p className="text-slate-600">📱 {invoice.customerPhone}</p>
            {invoice.customerEmail && (
              <p className="text-slate-600">✉️ {invoice.customerEmail}</p>
            )}
            {invoice.customerAddress && (
              <p className="text-slate-600">{invoice.customerAddress}</p>
            )}
            {invoice.customerPincode && (
              <p className="text-slate-600">{invoice.customerPincode}</p>
            )}
          </div>
        </div>

        {/* Delivery & Order Details */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wide text-slate-700 mb-3">
            Delivery Details
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-slate-600">Sale Center:</span>{' '}
              <span className="font-semibold text-slate-800">{invoice.saleCenterName}</span>
            </p>
            <p>
              <span className="text-slate-600">Pickup at:</span>{' '}
              <span className="font-semibold text-slate-800">{invoice.pickupCenterName}</span>
            </p>
            {invoice.festivalName && (
              <p>
                <span className="text-slate-600">Festival:</span>{' '}
                <span className="font-semibold text-slate-800">{invoice.festivalName}</span>
              </p>
            )}
            {invoice.mitraName && (
              <p>
                <span className="text-slate-600">Booked by:</span>{' '}
                <span className="font-semibold text-slate-800">{invoice.mitraName}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-amber-200">
              <th className="text-left py-3 px-2 font-bold text-xs uppercase tracking-wide text-slate-700">
                Item
              </th>
              <th className="text-center py-3 px-2 font-bold text-xs uppercase tracking-wide text-slate-700">
                Quantity
              </th>
              <th className="text-right py-3 px-2 font-bold text-xs uppercase tracking-wide text-slate-700">
                Unit Price
              </th>
              <th className="text-right py-3 px-2 font-bold text-xs uppercase tracking-wide text-slate-700">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-amber-50 hover:bg-amber-50/50">
                <td className="py-3 px-2">
                  <div className="font-semibold text-slate-800">{item.sweetNameHi}</div>
                  <div className="text-xs text-slate-600">{item.sweetNameEn}</div>
                  <div className="text-xs text-amber-700">{item.variantLabel}</div>
                </td>
                <td className="text-center py-3 px-2 text-slate-700 font-medium">
                  {item.quantity} kg
                </td>
                <td className="text-right py-3 px-2 text-slate-700 font-medium">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="text-right py-3 px-2 text-slate-800 font-bold">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80 space-y-2">
          <div className="flex justify-between py-2 border-b border-amber-100">
            <span className="text-slate-700">Subtotal:</span>
            <span className="font-semibold text-slate-800">
              {formatCurrency(invoice.subtotalAmount)}
            </span>
          </div>

          {invoice.discountAmount > 0 && (
            <div className="flex justify-between py-2 border-b border-amber-100 text-green-700">
              <span>
                Discount{invoice.discountCode ? ` (${invoice.discountCode})` : ''}:
              </span>
              <span className="font-semibold">-{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between py-3 bg-amber-50 px-3 rounded-lg border border-amber-200">
            <span className="font-bold text-amber-900">Total Amount:</span>
            <span className="font-black text-lg text-amber-900">
              {formatCurrency(invoice.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">
            Payment Method
          </p>
          <p className="text-sm font-semibold text-slate-800 capitalize">
            {invoice.paymentMethod === 'udhar' ? 'उधार (Credit)' : 'नकद (Cash)'}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">
            Payment Status
          </p>
          <p className="text-sm font-semibold">
            {invoice.paymentStatus === 'udhar_outstanding' ? (
              <span className="text-amber-700">उधार बकाया (Outstanding)</span>
            ) : (
              <span className="text-green-700">✓ Paid</span>
            )}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-amber-100 pt-4 text-center text-xs text-slate-500">
        <p>Thank you for your order!</p>
        <p>सहकार भारती - Sahakar Bharati</p>
      </div>

      {/* Print & Download Actions */}
      <div className="flex gap-3 mt-8 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Invoice
        </button>
        <button
          disabled
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 text-slate-600 font-semibold rounded-lg cursor-not-allowed"
          title="PDF download coming soon"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
    </div>
  );
}
