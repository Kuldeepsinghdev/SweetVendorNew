import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { bookings } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok } from '@/lib/api/handler';

/**
 * POST /api/zoho-payments/webhook
 * Standard Zoho Payments webhook listener. Marks a booking paid on success.
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const event = (await request.json().catch(() => ({}))) || {};
    console.log('Received Zoho Payments Webhook Event:', event?.event_type || event?.type);

    const eventType = event?.event_type || event?.type;
    const paymentData = event?.data?.payment || event?.payment || event?.data;

    if (eventType === 'payment.succeeded' || eventType === 'payment_link.paid') {
      const orderId = paymentData?.order_id || event?.order_id;
      const paymentId = paymentData?.payment_id || event?.payment_id;
      if (orderId) {
        try {
          await db
            .update(bookings)
            .set({
              paymentMethod: 'online',
              paymentStatus: 'paid',
              zohoPaymentId: paymentId || `zpay_wh_${Date.now()}`,
              zohoPaymentMode: paymentData?.payment_mode || 'online',
            })
            .where(eq(bookings.id, orderId));
        } catch (dbErr) {
          console.error('Webhook database update error:', dbErr);
        }
      }
    }

    return ok({ received: true });
  });
}
