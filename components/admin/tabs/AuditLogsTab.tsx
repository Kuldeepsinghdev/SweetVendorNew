'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Audit Logs Tab Component
 * 
 * Displays system audit trail of admin actions for super admins.
 * Shows who performed what action and when.
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function AuditLogsTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const logs = data.auditLogs || [];
  const [pageSize, setPageSize] = useState<10 | 20>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const sortedLogs = [...logs].sort((a, b) => {
    const aTime = Date.parse(a.timestamp);
    const bTime = Date.parse(b.timestamp);
    if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return bTime - aTime;
    return b.timestamp.localeCompare(a.timestamp);
  });
  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageLogs = sortedLogs.slice((page - 1) * pageSize, page * pageSize);
  const firstVisibleLog = sortedLogs.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisibleLog = Math.min(page * pageSize, sortedLogs.length);

  return (
    <div className="space-y-3">
      {logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          <ScrollText size={28} className="mx-auto mb-2 opacity-60" />
          {hi ? 'कोई लॉग नहीं।' : 'No logs.'}
        </div>
      ) : (
        <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-xs text-slate-600" aria-live="polite">
            {hi
              ? `${firstVisibleLog}–${lastVisibleLog} / ${sortedLogs.length} लॉग`
              : `Showing ${firstVisibleLog}–${lastVisibleLog} of ${sortedLogs.length} logs`}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="audit-log-page-size" className="text-xs font-semibold text-slate-600">
              {hi ? 'प्रति पृष्ठ' : 'Rows per page'}
            </label>
            <select
              id="audit-log-page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) as 10 | 20);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {pageLogs.map((log) => (
            <article key={log.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-500">{hi ? 'समय' : 'Timestamp'}</p>
                  <p className="break-words text-sm text-slate-800">{log.timestamp}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-500">{hi ? 'कर्ता' : 'Actor'}</p>
                  <p className="break-words text-sm font-semibold text-slate-900">{log.actor}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-500">{hi ? 'कर्ता उपयोगकर्ता आईडी' : 'Actor user ID'}</p>
                  <p className="break-all font-mono text-xs text-slate-700">
                    {log.actorUserId || (hi ? 'उपलब्ध नहीं' : 'Not recorded')}
                  </p>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">{hi ? 'कार्रवाई' : 'Action'}</p>
                <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{log.actionHi}</p>
              </div>
              <p className="mt-3 break-all border-t border-slate-100 pt-2 font-mono text-[10px] text-slate-500">
                {hi ? 'लॉग आईडी' : 'Log ID'}: {log.id}
              </p>
            </article>
          ))}
        </div>
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-3" aria-label={hi ? 'लॉग पृष्ठ' : 'Audit log pages'}>
            <button
              type="button"
              onClick={() => setCurrentPage(page - 1)}
              disabled={page === 1}
              aria-label={hi ? 'पिछला पृष्ठ' : 'Previous page'}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              {hi ? 'पिछला' : 'Previous'}
            </button>
            <span className="text-xs font-medium text-slate-600">
              {hi ? `${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(page + 1)}
              disabled={page === totalPages}
              aria-label={hi ? 'अगला पृष्ठ' : 'Next page'}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {hi ? 'अगला' : 'Next'}
              <ChevronRight size={14} />
            </button>
          </nav>
        )}
        </>
      )}
    </div>
  );
}
