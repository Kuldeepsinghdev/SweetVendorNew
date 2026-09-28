'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, schema } from '@/lib/db';
import { requireRoleOrThrow, AuthorizationError } from '@/lib/auth/rbac';

/**
 * Proof-of-concept secured mutation. Demonstrates the mandated write path for
 * every Server Action in this app:
 *   1. requireRoleOrThrow  (deny by default, server-verified session)
 *   2. Zod validation      (never trust the client payload)
 *   3. Drizzle write       (parameterized query)
 *   4. revalidatePath      (refresh the affected RSC)
 */
const NoteSchema = z.object({
  note: z.string().trim().min(1, 'Note is required').max(500),
});

export type ActionResult = { ok: boolean; error?: string };

export async function addAuditNoteAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    // City-admin or higher may write audit notes.
    session = await requireRoleOrThrow('city_admin');
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { ok: false, error: e.message };
    }
    throw e;
  }

  const parsed = NoteSchema.safeParse({ note: formData.get('note') });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    await db.insert(schema.auditLogs).values({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      actor: `${session.name} (${session.role})`,
      actionHi: parsed.data.note,
      timestamp: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    });
  } catch (e) {
    console.error('addAuditNoteAction DB write failed:', e);
    return { ok: false, error: 'Could not save the note. Please try again.' };
  }

  revalidatePath('/dashboard');
  return { ok: true };
}
