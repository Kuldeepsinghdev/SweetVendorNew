'use client';

import { useActionState } from 'react';
import { addAuditNoteAction, type ActionResult } from '@/lib/actions/auditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: ActionResult = { ok: false };

export function AddNoteForm() {
  const [state, formAction, pending] = useActionState(
    addAuditNoteAction,
    initial
  );

  return (
    <form action={formAction} className="space-y-2">
      <Label htmlFor="note">
        ऑडिट नोट जोड़ें (Add audit note)
      </Label>
      <div className="flex gap-2">
        <Input
          id="note"
          name="note"
          type="text"
          maxLength={500}
          required
          placeholder="e.g. Verified daily stock reconciliation"
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? 'Saving…' : 'Add'}
        </Button>
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
