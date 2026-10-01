'use client';

import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Mitra Ledger Tab Component
 * 
 * Displays the outstanding balance ledger for Mitra (retail partners) who have
 * made bookings on credit (udhar). This tab is visible to all admin roles.
 * 
 * Features:
 * - Aggregates outstanding amounts per Mitra
 * - Shows total amount vs delivered amount
 * - Calculates outstanding balance (total - delivered)
 * - Supports bilingual labels (Hindi/English)
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function MitraLedgerTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  
  // Aggregate outstanding (non-delivered credit bookings) per mitra
  const ledger: Record<
    string,
    { mitraName: string; totalAmount: number; deliveredAmount: number; bookingCount: number }
  > = {};

  for (const b of data.bookings) {
    // Only include bookings made by Mitra
    if ((b as any).bookedByRole !== 'mitra' || !(b as any).mitraId) continue;
    
    const mitraId = (b as any).mitraId;
    
    if (!ledger[mitraId]) {
      ledger[mitraId] = {
        mitraName: (b as any).mitraName ?? mitraId,
        totalAmount: 0,
        deliveredAmount: 0,
        bookingCount: 0,
      };
    }
    
    ledger[mitraId].totalAmount += Number((b as any).totalAmount ?? 0);
    ledger[mitraId].bookingCount += 1;
    
    // Add to delivered amount if booking is delivered and paid
    if (b.status === 'delivered' && (b as any).paymentStatus === 'paid') {
      ledger[mitraId].deliveredAmount += Number((b as any).totalAmount ?? 0);
    }
  }

  // Sort by outstanding amount (highest first)
  const rows = Object.entries(ledger).sort(
    (a, b) => b[1].totalAmount - b[1].deliveredAmount - (a[1].totalAmount - a[1].deliveredAmount)
  );

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300 grid grid-cols-3">
          <span>{hi ? 'मित्र नाम' : 'Mitra Name'}</span>
          <span className="text-right">{hi ? 'कुल' : 'Total'}</span>
          <span className="text-right">{hi ? 'बकाया' : 'Outstanding'}</span>
        </div>
        
        {/* Table Body */}
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {hi ? 'कोई मित्र बुकिंग नहीं।' : 'No mitra bookings.'}
          </p>
        ) : (
          rows.map(([mitraId, v]) => {
            const outstanding = v.totalAmount - v.deliveredAmount;
            return (
              <div key={mitraId} className="px-4 py-2.5 border-t border-slate-800 grid grid-cols-3 text-sm">
                {/* Mitra Name and Booking Count */}
                <div>
                  <p className="text-slate-100">{v.mitraName}</p>
                  <p className="text-xs text-slate-500">
                    {v.bookingCount} {hi ? 'बुकिंग' : 'bookings'}
                  </p>
                </div>
                
                {/* Total Amount */}
                <span className="text-right text-slate-300 font-mono self-center">
                  ₹{v.totalAmount.toLocaleString('en-IN')}
                </span>
                
                {/* Outstanding Amount with Color Coding */}
                <span
                  className={`text-right font-mono font-bold self-center ${
                    outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  ₹{outstanding.toLocaleString('en-IN')}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
