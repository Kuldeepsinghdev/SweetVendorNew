'use client';

import { useActionState, useState } from 'react';
import { AlertCircle, Loader2, MapPin, Pencil, Plus, Power } from 'lucide-react';
import {
  toggleCityActiveAction,
  upsertCityAction,
  type AdminActionState,
} from '@/lib/actions/admin';
import type { City, TabContentProps } from '@/lib/admin/dashboard-tabs';

export default function CityNetworkTab({ data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const cities = data.allCities || data.cities || [];
  const [isCreating, setIsCreating] = useState(false);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-800">
          {hi ? 'शहर' : 'Cities'} <span className="text-slate-500">({cities.length})</span>
        </h2>
        <button
          type="button"
          onClick={() => {
            setEditingCityId(null);
            setIsCreating((value) => !value);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700"
        >
          <Plus size={16} />
          {hi ? 'नया शहर' : 'Add city'}
        </button>
      </div>

      {isCreating && <CityForm hi={hi} onCancel={() => setIsCreating(false)} />}

      {cities.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-white p-8 text-center text-sm text-slate-500">
          <MapPin size={28} className="mx-auto mb-2 opacity-50" />
          {hi ? 'कोई शहर नहीं।' : 'No cities have been added.'}
        </div>
      ) : (
        <div className="space-y-2">
          {cities.map((city) => editingCityId === city.id ? (
            <CityForm
              key={`edit-${city.id}`}
              city={city}
              hi={hi}
              onCancel={() => setEditingCityId(null)}
            />
          ) : (
            <CityCard
              key={city.id}
              city={city}
              hi={hi}
              onEdit={() => {
                setIsCreating(false);
                setEditingCityId(city.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CityForm({
  city,
  hi,
  onCancel,
}: {
  city?: City;
  hi: boolean;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(upsertCityAction, {});

  return (
    <section className="rounded-xl border border-amber-300 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-slate-900">
        {city ? (hi ? 'शहर संपादित करें' : 'Edit city') : (hi ? 'नया शहर जोड़ें' : 'Add city')}
      </h3>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <Field label={hi ? 'शहर आईडी' : 'City ID'}>
          <input
            name="id"
            required
            readOnly={Boolean(city)}
            defaultValue={city?.id ?? ''}
            placeholder="e.g. jaipur"
            className="city-input read-only:bg-slate-100"
          />
        </Field>
        <Field label={hi ? 'नाम (हिंदी)' : 'Name (Hindi)'}>
          <input name="nameHi" required minLength={2} defaultValue={city?.nameHi ?? ''} className="city-input" />
        </Field>
        <Field label={hi ? 'नाम (अंग्रेज़ी)' : 'Name (English)'}>
          <input name="nameEn" required minLength={2} defaultValue={city?.nameEn ?? ''} className="city-input" />
        </Field>
        <Field label={hi ? 'राज्य (हिंदी)' : 'State (Hindi)'}>
          <input name="stateHi" required minLength={2} defaultValue={city?.stateHi ?? ''} className="city-input" />
        </Field>
        <Field label={hi ? 'राज्य (अंग्रेज़ी)' : 'State (English)'}>
          <input name="stateEn" defaultValue={city?.stateEn ?? ''} className="city-input" />
        </Field>
        <Field label={hi ? 'ज़िला' : 'District'}>
          <input name="districtHi" defaultValue={city?.districtHi ?? ''} className="city-input" />
        </Field>
        <Field label={hi ? 'व्यवस्थापक का नाम' : 'Administrator name'}>
          <input name="adminName" required minLength={2} defaultValue={city?.adminName ?? ''} className="city-input" />
        </Field>
        <Field label={hi ? 'व्यवस्थापक का मोबाइल' : 'Administrator mobile'}>
          <input
            name="adminPhone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            required
            defaultValue={city?.adminPhone ?? ''}
            className="city-input"
          />
        </Field>
        <Field label={hi ? 'स्थिति' : 'Status'}>
          <select name="isActive" defaultValue={city?.isActive === false ? 'false' : 'true'} className="city-input">
            <option value="true">{hi ? 'सक्रिय' : 'Active'}</option>
            <option value="false">{hi ? 'निष्क्रिय' : 'Inactive'}</option>
          </select>
        </Field>

        {state.error && (
          <div className="flex items-center gap-2 text-sm text-rose-700 sm:col-span-2">
            <AlertCircle size={15} />
            {state.error}
          </div>
        )}
        {state.ok && (
          <p role="status" className="text-sm font-semibold text-emerald-700 sm:col-span-2">
            {hi ? 'शहर सहेजा गया।' : 'City saved.'}
          </p>
        )}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {hi ? 'बंद करें' : 'Close'}
          </button>
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
            {pending && <Loader2 size={14} className="animate-spin" />}
            {city ? (hi ? 'बदलाव सहेजें' : 'Save changes') : (hi ? 'शहर जोड़ें' : 'Create city')}
          </button>
        </div>
      </form>
    </section>
  );
}

function CityCard({ city, hi, onEdit }: { city: City; hi: boolean; onEdit: () => void }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(toggleCityActiveAction, {});

  return (
    <article className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">{hi ? city.nameHi : city.nameEn}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${city.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {city.isActive ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'निष्क्रिय' : 'Inactive')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {city.nameHi} · {city.nameEn} · {city.id}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {[city.districtHi, city.stateHi, city.stateEn].filter(Boolean).join(', ')}
          </p>
          <p className="mt-2 text-xs text-slate-700">
            {hi ? 'व्यवस्थापक' : 'Administrator'}: {city.adminName} · {city.adminPhone}
          </p>
          {city.adminUserId && <p className="mt-1 break-all font-mono text-[10px] text-slate-500">Admin user ID: {city.adminUserId}</p>}
          {state.error && <p className="mt-2 text-xs text-rose-700">{state.error}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-50">
            <Pencil size={13} />
            {hi ? 'संपादित करें' : 'Edit'}
          </button>
          <form action={formAction}>
            <input type="hidden" name="id" value={city.id} />
            <button type="submit" disabled={pending} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${city.isActive ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
              {city.isActive ? (hi ? 'निष्क्रिय करें' : 'Deactivate') : (hi ? 'सक्रिय करें' : 'Activate')}
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}