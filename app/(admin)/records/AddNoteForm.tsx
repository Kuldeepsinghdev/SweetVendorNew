'use client';

import { useActionState } from 'react';
import { addAuditNoteAction, type ActionResult } from '@/lib/actions/auditLog';

const initial: ActionResult = { ok: false };

export function AddNoteForm() {
  const [state, formAction, pending] = useActionState(
    addAuditNoteAction,
    initial
  );

  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor="note" className="text-xs font-bold text-slate-300 block">
        ऑडिट नोट जोड़ें (Add audit note)
      </label>
      <div className="flex gap-2">
        <input
          id="note"
          name="note"
          type="text"
          maxLength={500}
          required
          placeholder="e.g. Verified daily stock reconciliation"
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-lg text-sm text-white focus:outline-none placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Add'}
        </button>
      </div>
      {state.error ? (
        <p className="text-xs text-rose-400">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-xs text-emerald-400">Saved.</p>
      ) : null}
    </form>
  );
}
