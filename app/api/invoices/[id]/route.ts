import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { getCustomerSession } from '@/lib/auth/customerSession';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify user is authenticated
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const invoiceId = params.id;
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // 2. Fetch invoice
    const invoiceRows = await db
      .select()
      .from(schema.invoices)
      .where(eq(schema.invoices.id, invoiceId))
      .limit(1);

    if (!invoiceRows.length) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = invoiceRows[0];

    // 3. Verify ownership (only Mitra who created booking can view)
    // Security: Mitras can only view invoices they created
    if (session.role === 'mitra' && invoice.mitraUserId !== session.sub) {
      return NextResponse.json(
        { error: 'Forbidden - not your invoice' },
        { status: 403 }
      );
    }

    // 4. Fetch related booking for additional context (optional)
    const bookingRows = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, invoice.bookingId))
      .limit(1);

    // 5. Return invoice data
    return NextResponse.json({
      ok: true,
      invoice,
      booking: bookingRows[0] || null,
    });
  } catch (error) {
    console.error('Invoice retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
