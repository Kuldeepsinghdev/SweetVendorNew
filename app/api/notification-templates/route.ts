import { db } from '@/src/db';
import { notificationTemplates } from '@/src/db/schema';
import { handle, ok } from '@/lib/api/handler';

export async function GET() {
  return handle(async () => {
    const data = await db.select().from(notificationTemplates);
    return ok(data);
  });
}
