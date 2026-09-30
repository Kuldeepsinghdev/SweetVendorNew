'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Eye, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetch('/api/invoices?limit=50');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to load invoices');
        }
        const data = await res.json();
        setInvoices(data.invoices || []);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, [router]);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">✓ Paid</span>;
      case 'udhar_outstanding':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded">उधार (Credit)</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl font-black text-amber-900">Your Invoices</h1>
          </div>
          <p className="text-slate-600">View and manage all your bookings and invoices</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <span className="ml-2 text-slate-600">Loading invoices...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center">
            <FileText className="w-12 h-12 text-amber-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold mb-2">No invoices yet</p>
            <p className="text-slate-600 text-sm">
              Your invoices will appear here once you create a booking.
            </p>
          </div>
        ) : (
          /* Invoices Table */
          <div className="overflow-x-auto rounded-lg border border-amber-100 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50">
                  <th className="text-left px-6 py-4 font-bold text-xs uppercase tracking-wide text-amber-900">
                    Invoice #
                  </th>
                  <th className="text-left px-6 py-4 font-bold text-xs uppercase tracking-wide text-amber-900">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 font-bold text-xs uppercase tracking-wide text-amber-900">
                    Customer
                  </th>
                  <th className="text-right px-6 py-4 font-bold text-xs uppercase tracking-wide text-amber-900">
                    Amount
                  </th>
                  <th className="text-left px-6 py-4 font-bold text-xs uppercase tracking-wide text-amber-900">
                    Status
                  </th>
                  <th className="text-center px-6 py-4 font-bold text-xs uppercase tracking-wide text-amber-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr
                    key={inv.id}
                    className={`border-b border-amber-50 hover:bg-amber-50/50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/20'
                    }`}
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {inv.customerName}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(inv.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
