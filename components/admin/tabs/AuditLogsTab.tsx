'use client';

import { ScrollText } from 'lucide-react';
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

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800/60 text-xs font-bold text-slate-300 grid grid-cols-4">
          <span>{hi ? 'समय' : 'Time'}</span>
          <span>{hi ? 'उपयोगकर्ता' : 'User'}</span>
          <span>{hi ? 'क्रिया' : 'Action'}</span>
          <span>{hi ? 'विवरण' : 'Details'}</span>
        </div>

        {logs.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{hi ? 'कोई लॉग नहीं।' : 'No logs.'}</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {logs.slice(0, 50).map((log) => (
              <div key={log.id} className="px-4 py-2.5 grid grid-cols-4 text-sm">
                <span className="text-slate-400 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-slate-300 text-xs font-mono">{log.userId}</span>
                <span className="text-purple-300">{log.action}</span>
                <span className="text-slate-500 text-xs truncate">{log.details}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {logs.length > 50 && (
        <p className="text-xs text-slate-500">{hi ? 'सबसे हाल के 50 लॉग दिखा रहे हैं।' : 'Showing latest 50 logs.'}</p>
      )}
    </div>
  );
}
