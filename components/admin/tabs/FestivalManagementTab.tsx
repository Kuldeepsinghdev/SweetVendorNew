'use client';

import { useActionState, useState } from 'react';
import { AlertCircle, CalendarDays, Loader2, Pencil, Plus, Power, Star, Trash2 } from 'lucide-react';
import {
  deleteFestivalAction,
  toggleFestivalActiveAction,
  upsertFestivalAction,
  type AdminActionState,
} from '@/lib/actions/admin';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Festival Management Tab Component
 * 
 * Displays active and upcoming festivals.
 * 
 * Requirements: 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function FestivalManagementTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const festivals = data.festivals || [];
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFestivalId, setEditingFestivalId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-800">
          {hi ? 'उत्सव' : 'Festivals'} <span className="text-slate-500">({festivals.length})</span>
        </h2>
        <button
          type="button"
          onClick={() => {
            setEditingFestivalId(null);
            setShowCreateForm((value) => !value);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700"
        >
          <Plus size={16} />
          {hi ? 'नया उत्सव' : 'Add festival'}
        </button>
      </div>

      {showCreateForm && <FestivalForm hi={hi} onClose={() => setShowCreateForm(false)} />}

      {festivals.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-white p-8 text-center text-sm text-slate-500">
          <Star size={28} className="mx-auto mb-2 opacity-50" />
          {hi ? 'कोई उत्सव नहीं।' : 'No festivals.'}
        </div>
      )}

      <div className="space-y-2">
        {festivals.map((festival) => editingFestivalId === festival.id ? (
          <FestivalForm
            key={`edit-${festival.id}`}
            festival={festival}
            hi={hi}
            onClose={() => setEditingFestivalId(null)}
          />
        ) : (
          <FestivalCard
            key={festival.id}
            festival={festival}
            hi={hi}
            onEdit={() => {
              setShowCreateForm(false);
              setEditingFestivalId(festival.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FestivalForm({
  festival,
  hi,
  onClose,
}: {
  festival?: any;
  hi: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(upsertFestivalAction, {});

  return (
    <section className="rounded-xl border border-amber-300 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-slate-900">
        {festival ? (hi ? 'उत्सव संपादित करें' : 'Edit festival') : (hi ? 'नया उत्सव जोड़ें' : 'Add festival')}
      </h3>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input type="hidden" name="id" value={festival?.id ?? ''} />
        <FestivalField label={hi ? 'नाम (हिंदी)' : 'Name (Hindi)'}>
          <input name="nameHi" required minLength={2} defaultValue={festival?.nameHi ?? ''} className="festival-input" />
        </FestivalField>
        <FestivalField label={hi ? 'नाम (अंग्रेज़ी)' : 'Name (English)'}>
          <input name="nameEn" required minLength={2} defaultValue={festival?.nameEn ?? ''} className="festival-input" />
        </FestivalField>
        <FestivalField label={hi ? 'स्थिति' : 'Status'}>
          <select name="status" defaultValue={festival?.status ?? 'draft'} className="festival-input">
            <option value="draft">{hi ? 'निष्क्रिय / ड्राफ़्ट' : 'Inactive / Draft'}</option>
            <option value="active">{hi ? 'सक्रिय' : 'Active'}</option>
            <option value="completed">{hi ? 'पूर्ण' : 'Completed'}</option>
          </select>
        </FestivalField>
        <FestivalField label={hi ? 'बुकिंग शुरू होने की तारीख' : 'Booking start date'}>
          <input name="startDate" type="date" required defaultValue={dateValue(festival?.startDate)} className="festival-input" />
        </FestivalField>
        <FestivalField label={hi ? 'बुकिंग कटऑफ़ तारीख' : 'Booking cutoff date'}>
          <input name="cutoffDate" type="date" required defaultValue={dateValue(festival?.cutoffDate)} className="festival-input" />
        </FestivalField>
        <FestivalField label={hi ? 'वितरण शुरू होने की तारीख' : 'Distribution start date'}>
          <input name="distributionStartDate" type="date" required defaultValue={dateValue(festival?.distributionStartDate)} className="festival-input" />
        </FestivalField>
        <FestivalField label={hi ? 'वितरण समाप्ति तारीख' : 'Distribution end date'}>
          <input name="distributionEndDate" type="date" required defaultValue={dateValue(festival?.distributionEndDate)} className="festival-input" />
        </FestivalField>
        <FestivalField label={hi ? 'प्रति बुकिंग अधिकतम किलो' : 'Max kg per booking'}>
          <input name="maxKgPerBooking" type="number" min="0.1" step="0.1" required defaultValue={festival?.maxKgPerBooking ?? 25} className="festival-input" />
        </FestivalField>
        <FestivalField label={hi ? 'मित्र की डिफ़ॉल्ट क्रेडिट सीमा' : 'Default Mitra credit limit'}>
          <input name="defaultMitraCreditLimit" type="number" min="1" step="1" required defaultValue={festival?.defaultMitraCreditLimit ?? 25000} className="festival-input" />
        </FestivalField>

        {state.error && (
          <div className="flex items-center gap-2 text-sm text-rose-700 sm:col-span-2 lg:col-span-3">
            <AlertCircle size={15} />
            {state.error}
          </div>
        )}
        {state.ok && (
          <p role="status" className="text-sm font-semibold text-emerald-700 sm:col-span-2 lg:col-span-3">
            {hi ? 'उत्सव सहेजा गया।' : 'Festival saved.'}
          </p>
        )}
        <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {hi ? 'बंद करें' : 'Close'}
          </button>
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
            {pending && <Loader2 size={14} className="animate-spin" />}
            {festival ? (hi ? 'बदलाव सहेजें' : 'Save changes') : (hi ? 'उत्सव जोड़ें' : 'Create festival')}
          </button>
        </div>
      </form>
    </section>
  );
}

function FestivalCard({ festival, hi, onEdit }: { festival: any; hi: boolean; onEdit: () => void }) {
  const [toggleState, toggleAction, togglePending] = useActionState<AdminActionState, FormData>(toggleFestivalActiveAction, {});
  const [deleteState, deleteAction, deletePending] = useActionState<AdminActionState, FormData>(deleteFestivalAction, {});
  const isActive = festival.status === 'active';

  return (
    <article className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Star size={16} className={isActive ? 'text-emerald-600' : 'text-amber-600'} />
            <h3 className="font-bold text-slate-900">{hi ? festival.nameHi : festival.nameEn}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-emerald-100 text-emerald-800' : festival.status === 'completed' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'}`}>
              {festival.status === 'active' ? (hi ? 'सक्रिय' : 'Active') : festival.status === 'completed' ? (hi ? 'पूर्ण' : 'Completed') : (hi ? 'ड्राफ़्ट' : 'Draft')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">{hi ? 'आईडी' : 'ID'}: {festival.id}</p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-3">
            <DateDetail label={hi ? 'बुकिंग शुरू' : 'Booking starts'} value={festival.startDate} />
            <DateDetail label={hi ? 'बुकिंग कटऑफ़' : 'Booking cutoff'} value={festival.cutoffDate} />
            <DateDetail label={hi ? 'वितरण शुरू' : 'Distribution starts'} value={festival.distributionStartDate} />
            <DateDetail label={hi ? 'वितरण समाप्त' : 'Distribution ends'} value={festival.distributionEndDate} />
            <DateDetail label={hi ? 'अधिकतम किलो / बुकिंग' : 'Max kg / booking'} value={festival.maxKgPerBooking} />
            <DateDetail label={hi ? 'मित्र क्रेडिट सीमा' : 'Mitra credit limit'} value={`₹${Number(festival.defaultMitraCreditLimit).toLocaleString('en-IN')}`} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-50">
            <Pencil size={13} />
            {hi ? 'संपादित करें' : 'Edit'}
          </button>
          {festival.status !== 'completed' && (
            <form action={toggleAction}>
              <input type="hidden" name="id" value={festival.id} />
              <button type="submit" disabled={togglePending} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${isActive ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                {togglePending ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
                {isActive ? (hi ? 'निष्क्रिय करें' : 'Deactivate') : (hi ? 'सक्रिय करें' : 'Activate')}
              </button>
            </form>
          )}
          <form action={deleteAction} onSubmit={(event) => {
            if (!window.confirm(hi ? 'क्या आप इस उत्सव को हटाना चाहते हैं?' : `Delete festival “${festival.nameEn}”?`)) {
              event.preventDefault();
            }
          }}>
            <input type="hidden" name="id" value={festival.id} />
            <button type="submit" disabled={deletePending} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
              {deletePending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {hi ? 'हटाएँ' : 'Delete'}
            </button>
          </form>
        </div>
      </div>
      {(toggleState.error || deleteState.error) && (
        <p className="mt-3 text-xs text-rose-700">{toggleState.error ?? deleteState.error}</p>
      )}
    </article>
  );
}

function DateDetail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2">
      <CalendarDays size={13} className="mt-0.5 shrink-0 text-amber-700" />
      <p className="min-w-0 break-words text-slate-700"><span className="font-semibold">{label}:</span> {value}</p>
    </div>
  );
}

function FestivalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function dateValue(value?: string | Date) {
  if (!value) return '';
  return typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}
