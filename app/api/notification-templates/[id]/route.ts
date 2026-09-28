import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { notificationTemplates } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { handle, ok } from '@/lib/api/handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const template = await request.json();
    const result = await db
      .update(notificationTemplates)
      .set(template)
      .where(eq(notificationTemplates.id, id))
      .returning();
    return ok(result[0]);
  });
}
