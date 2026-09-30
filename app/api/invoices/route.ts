import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { getCustomerSession } from '@/lib/auth/customerSession';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const pageSize = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // 3. Build query based on role
    let invoiceRows;
    if (session.role === 'mitra') {
      // Security: Mitras can only view their own invoices
      invoiceRows = await db
        .select()
        .from(schema.invoices)
        .where(eq(schema.invoices.mitraUserId, session.sub))
        .orderBy(desc(schema.invoices.createdAt))
        .limit(pageSize);
    } else {
      // Admins can view all invoices
      invoiceRows = await db
        .select()
        .from(schema.invoices)
        .orderBy(desc(schema.invoices.createdAt))
        .limit(pageSize);
    }

    // 4. Return invoice list
    return NextResponse.json({
      ok: true,
      invoices: invoiceRows,
      count: invoiceRows.length,
    });
  } catch (error) {
    console.error('Invoice list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
