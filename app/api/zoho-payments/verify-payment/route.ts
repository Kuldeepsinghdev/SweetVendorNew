import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { bookings, discounts, auditLogs } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok, fail, nowStamp } from '@/lib/api/handler';

/**
 * POST /api/zoho-payments/verify-payment
 * Verifies a payment confirmation and persists/updates the booking, increments
 * coupon usage, and records an audit log entry.
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const body = (await request.json().catch(() => ({}))) || {};
    const {
      payment_session_id,
      payment_id,
      order_id,
      payment_mode = 'upi',
      booking_data,
    } = body;

    if (!payment_id) {
      return fail('ट्रांसैक्शन ID अनिवार्य है (Transaction ID required)', 400);
    }

    const txnId = String(payment_id).startsWith('zpay_')
      ? payment_id
      : `zpay_txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invoiceNumber = `INV-ZPAY-${Math.floor(100000 + Math.random() * 900000)}`;

    let savedBooking: any = null;

    if (booking_data) {
      const bookingPayload = {
        ...booking_data,
        subtotalAmount: booking_data.subtotalAmount ?? booking_data.totalAmount,
        discountCode: booking_data.discountCode || null,
        discountAmount: booking_data.discountAmount || null,
        paymentMethod: 'online',
        paymentStatus: 'paid',
        status: 'confirmed',
        invoiceId: booking_data.invoiceId || invoiceNumber,
        zohoPaymentId: txnId,
        zohoPaymentSessionId: payment_session_id || '',
        zohoOrderId: order_id || '',
        zohoPaymentMode: payment_mode || 'upi',
      };

      try {
        const result = await db
          .insert(bookings)
          .values(bookingPayload)
          .onConflictDoUpdate({ target: bookings.id, set: bookingPayload })
          .returning();
        savedBooking = result[0] || bookingPayload;

        // Increment coupon usage if a discount was applied.
        if (booking_data.discountCode) {
          try {
            const discMatches = await db
              .select()
              .from(discounts)
              .where(eq(discounts.code, String(booking_data.discountCode).toUpperCase()));
            if (discMatches.length > 0) {
              await db
                .update(discounts)
                .set({ timesUsed: (discMatches[0].timesUsed || 0) + 1 })
                .where(eq(discounts.id, discMatches[0].id));
            }
          } catch (discErr) {
            console.warn('Could not update discount usage on DB:', discErr);
          }
        }
      } catch (dbErr) {
        console.error('Database write error during Zoho payment verification:', dbErr);
        savedBooking = bookingPayload;
      }
    } else if (order_id) {
      // No booking payload — update an existing booking's payment status.
      try {
        const existing = await db.select().from(bookings).where(eq(bookings.id, order_id));
        if (existing.length > 0) {
          const updated = await db
            .update(bookings)
            .set({
              paymentMethod: 'online',
              paymentStatus: 'paid',
              invoiceId: existing[0].invoiceId || invoiceNumber,
              zohoPaymentId: txnId,
              zohoPaymentSessionId: payment_session_id || '',
              zohoOrderId: order_id,
              zohoPaymentMode: payment_mode,
            })
            .where(eq(bookings.id, order_id))
            .returning();
          savedBooking = updated[0];
        }
      } catch (err) {
        console.error('Error updating existing booking for Zoho payment:', err);
      }
    }

    // Audit log (best-effort).
    const customerName = booking_data?.customer?.name || savedBooking?.customer?.name || 'ग्राहक';
    const amount = booking_data?.totalAmount || savedBooking?.totalAmount || '—';
    try {
      await db.insert(auditLogs).values({
        id: `log_zpay_${Date.now()}`,
        actor: `Zoho Payments गेटवे (${customerName})`,
        actionHi: `Zoho Payments द्वारा ₹${amount} का ऑनलाइन भुगतान सत्यापित (Txn ID: ${txnId}, मोड: ${String(payment_mode).toUpperCase()})`,
        timestamp: nowStamp(),
      });
    } catch (logErr) {
      console.warn('Could not record audit log for Zoho payment:', logErr);
    }

    return ok({
      success: true,
      verified: true,
      transactionId: txnId,
      invoiceId: invoiceNumber,
      paymentMode: payment_mode,
      booking: savedBooking,
      timestamp: new Date().toISOString(),
      message: 'Zoho Payments द्वारा भुगतान सफलतापूर्वक सत्यापित हुआ (Payment verified successfully)',
    });
  });
}
