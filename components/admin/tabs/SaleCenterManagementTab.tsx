'use client';

import { useActionState, useState } from 'react';
import { Building2, CheckCircle, Loader2, PlusCircle, AlertCircle } from 'lucide-react';
import { createSaleCenterAction, type AdminActionState } from '@/lib/actions/admin';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

/**
 * Sale Center Management Tab Component
 * 
 * Displays and manages sale centers for city admin users.
 * Allows creating new sale centers and viewing existing ones.
 * 
 * Features:
 * - List existing sale centers with details
 * - Create new sale centers (standalone or mitra_kendra type)
 * - Edit sale center information
 * - Bilingual support (Hindi/English)
 * 
 * @requirements 23.1, 23.2, 23.3, 23.5, 13.5
 */
export default function SaleCenterManagementTab({ session, data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const saleCenters = data.saleCenters || [];
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {state.ok && (
        <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-6 text-center space-y-2">
          <CheckCircle size={40} className="mx-auto text-emerald-400" />
          <p className="text-emerald-200 font-bold">
            {hi ? 'बिक्री केंद्र सफलतापूर्वक बनाया गया!' : 'Sale centre created successfully!'}
          </p>
        </div>
      )}

      {/* Sale Centers List */}
      <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-amber-50 flex justify-between items-center border-b border-amber-200">
          <h3 className="text-sm font-bold text-amber-900">
            {hi ? 'बिक्री केंद्र' : 'Sale Centres'} ({saleCenters.length})
          </h3>
          <button
            onClick={() => {
              setEditingCenter(null);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            <PlusCircle size={14} /> {hi ? 'नया' : 'New'}
          </button>
        </div>

        {saleCenters.length === 0 ? (
          <div className="px-4 py-6 text-center text-amber-900">
            <Building2 size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">{hi ? 'कोई बिक्री केंद्र नहीं।' : 'No sale centres found.'}</p>
            <p className="text-xs text-amber-800 mt-1">
              {hi ? 'नीचे "+ नया" बटन क्लिक करके पहला केंद्र बनाएं।' : 'Click "+ New" button to create the first centre.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-amber-100">
            {saleCenters.map((center) => (
              <SaleCenterCard
                key={center.id}
                center={center}
                hi={hi}
                onEdit={(c) => {
                  setEditingCenter(c);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <SaleCenterForm
          center={editingCenter}
          cityId={myCityId}
          hi={hi}
          state={state}
          formAction={formAction}
          pending={pending}
          onClose={() => {
            setShowForm(false);
            setEditingCenter(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Card displaying sale center information
 */
function SaleCenterCard({
  center,
  hi,
  onEdit,
}: {
  center: any;
  hi: boolean;
  onEdit: (center: any) => void;
}) {
  return (
    <div className="px-4 py-3 hover:bg-amber-50/50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-amber-950">{center.nameHi || center.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              center.type === 'mitra_kendra'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {center.type === 'mitra_kendra'
                ? (hi ? 'मित्र केंद्र' : 'Mitra Kendra')
                : (hi ? 'स्वतंत्र' : 'Standalone')}
            </span>
          </div>
          <p className="text-xs text-amber-700 mt-1">
            {hi ? 'स्वामी: ' : 'Owner: '}{center.ownerName}
          </p>
          {center.ownerPhone && (
            <p className="text-xs text-amber-600">
              📞 {center.ownerPhone}
            </p>
          )}
          {center.addressHi && (
            <p className="text-xs text-amber-600 mt-1">
              📍 {center.addressHi}
            </p>
          )}
          {center.timing && (
            <p className="text-xs text-amber-600">
              🕐 {center.timing}
            </p>
          )}
        </div>
        <button
          onClick={() => onEdit(center)}
          className="text-xs text-amber-600 hover:text-orange-600 bg-amber-50 px-2 py-1 rounded shrink-0"
        >
          {hi ? 'संपादित' : 'Edit'}
        </button>
      </div>
    </div>
  );
}

/**
 * Form for creating or editing a sale center
 */
function SaleCenterForm({
  center,
  cityId,
  hi,
  state,
  formAction,
  pending,
  onClose,
}: {
  center: any | null;
  cityId: string;
  hi: boolean;
  state: AdminActionState;
  formAction: (formData: FormData) => void;
  pending: boolean;
  onClose: () => void;
}) {
  const isEditing = !!center;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h2 className="font-bold text-emerald-300 text-sm">
        {isEditing
          ? (hi ? 'बिक्री केंद्र संपादित करें' : 'Edit Sale Centre')
          : (hi ? 'नया बिक्री केंद्र' : 'New Sale Centre')}
      </h2>

      {state.error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/20 border border-red-900/40 rounded p-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="cityId" value={cityId} />
        {isEditing && <input type="hidden" name="id" value={center.id} />}

        <FormField label={hi ? 'केंद्र का नाम (हिंदी)' : 'Centre Name (Hindi)'}>
          <input
            type="text"
            name="nameHi"
            required
            defaultValue={center?.nameHi || ''}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </FormField>

        <FormField label={hi ? 'प्रकार' : 'Type'}>
          <select
            name="type"
            required
            defaultValue={center?.type || 'standalone'}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="standalone">{hi ? 'स्वतंत्र' : 'Standalone'}</option>
            <option value="mitra_kendra">{hi ? 'मित्र केंद्र' : 'Mitra Kendra'}</option>
          </select>
        </FormField>

        <FormField label={hi ? 'स्वामी का नाम' : 'Owner Name'}>
          <input
            type="text"
            name="ownerName"
            required
            defaultValue={center?.ownerName || ''}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </FormField>

        <FormField label={hi ? 'स्वामी का फ़ोन' : 'Owner Phone'}>
          <input
            type="tel"
            name="ownerPhone"
            maxLength={10}
            required
            defaultValue={center?.ownerPhone || ''}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </FormField>

        <FormField label={hi ? 'स्वामी का ईमेल' : 'Owner Email'}>
          <input
            type="email"
            name="ownerEmail"
            defaultValue={center?.ownerEmail || ''}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </FormField>

        <FormField label={hi ? 'पता (हिंदी)' : 'Address (Hindi)'}>
          <textarea
            name="addressHi"
            rows={2}
            defaultValue={center?.addressHi || ''}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </FormField>

        <FormField label={hi ? 'पिनकोड' : 'Pincode'}>
          <input
            type="text"
            name="pincode"
            maxLength={16}
            defaultValue={center?.pincode || ''}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </FormField>

        <FormField label={hi ? 'समय' : 'Timing'}>
          <input
            type="text"
            name="timing"
            placeholder="09:00 AM - 08:00 PM"
            defaultValue={center?.timing || ''}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </FormField>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
            {isEditing ? (hi ? 'अपडेट करें' : 'Update') : (hi ? 'बनाएं' : 'Create')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-lg text-sm"
          >
            {hi ? 'रद्द करें' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Reusable form field component
 */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-300">{label}</label>
      {children}
    </div>
  );
}
