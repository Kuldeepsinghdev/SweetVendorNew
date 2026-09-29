import { desc } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { requireRole } from '@/lib/auth/rbac';
import { AddNoteForm } from './AddNoteForm';
import { getLocale } from '@/lib/locale/server';

// Always render fresh; this page reflects DB writes immediately.
export const dynamic = 'force-dynamic';

export default async function RecordsPage() {
  const locale = await getLocale();
  const hi = locale === 'hi';

  // Authoritative role check (super_admin required for the records view).
  await requireRole('super_admin');

  let logs: (typeof schema.auditLogs.$inferSelect)[] = [];
  try {
    logs = await db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(25);
  } catch (e) {
    console.error('RecordsPage: failed to load audit logs:', e);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-amber-300">
          {hi ? 'रिकॉर्ड — ऑडिट लॉग' : 'Records — Audit Log'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {hi
            ? 'डेटाबेस से सर्वर-रेंडर किया गया। सर्वर-साइड RBAC द्वारा सुरक्षित।'
            : 'Server-rendered from the database. Protected by server-side RBAC.'}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <AddNoteForm />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        {logs.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {hi ? 'अभी तक कोई ऑडिट प्रविष्टि नहीं।' : 'No audit entries yet.'}
          </p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-3 text-sm">
              <div className="text-slate-100">{log.actionHi}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {log.actor} · {log.timestamp}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
