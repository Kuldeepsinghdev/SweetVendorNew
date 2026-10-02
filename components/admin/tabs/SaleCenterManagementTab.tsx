'use client';

import {
  Building2,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react';
import type { TabContentProps } from '@/lib/admin/dashboard-tabs';

export default function SaleCenterManagementTab({ data, locale }: TabContentProps) {
  const hi = locale === 'hi';
  const saleCenters = data.saleCenters ?? [];
  const cities = data.allCities ?? data.cities ?? [];
  const distributionCenters = data.distributionCenters ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <h2 className="text-sm font-bold text-amber-950">{hi ? 'बिक्री केंद्र' : 'Sale Centers'}</h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-amber-200">
          {saleCenters.length} {hi ? 'कुल' : 'total'}
        </span>
      </div>

      {saleCenters.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          <Building2 size={30} className="mx-auto mb-2 text-amber-600 opacity-70" />
          {hi ? 'कोई बिक्री केंद्र नहीं मिला।' : 'No sale centers found.'}
        </div>
      ) : (
        <div className="space-y-3">
          {saleCenters.map((center) => {
            const city = cities.find((item) => item.id === center.cityId);
            const linkedPickupCenters = distributionCenters.filter(
              (item) => item.saleCenterId === center.id
            );
            const centerName = hi
              ? center.nameHi || center.nameEn || center.name
              : center.nameEn || center.nameHi || center.name;
            const address = hi
              ? center.addressHi || center.addressEn
              : center.addressEn || center.addressHi;
            const cityName = city
              ? (hi ? city.nameHi : city.nameEn) || city.nameHi || city.nameEn
              : center.cityId;

            return (
              <article key={center.id} className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white px-4 py-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                      <Building2 size={18} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-bold text-slate-950">{centerName}</h3>
                      <p className="mt-0.5 break-all font-mono text-xs text-slate-600">{center.id}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">
                      {center.type === 'mitra_kendra'
                        ? (hi ? 'मित्र केंद्र' : 'Mitra Kendra')
                        : center.type === 'standalone'
                          ? (hi ? 'मुख्य केंद्र' : 'Standalone')
                          : center.type || (hi ? 'अन्य प्रकार' : 'Other type')}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${center.isActive ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                      {center.isActive ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'निष्क्रिय' : 'Inactive')}
                    </span>
                  </div>
                </header>

                <div className="grid gap-4 p-4 md:grid-cols-2">
                  <section className="space-y-3">
                    <Detail icon={<MapPin size={15} />} label={hi ? 'शहर / राज्य' : 'City / state'}>
                      <span className="font-semibold text-slate-900">{cityName}</span>
                      {(hi ? city?.stateHi : city?.stateEn) && <span className="text-slate-600"> · {hi ? city?.stateHi : city?.stateEn}</span>}
                    </Detail>
                    <Detail icon={<MapPin size={15} />} label={hi ? 'पूरा पता' : 'Full address'}>
                      <span className="text-slate-800">{address || '—'}</span>
                    </Detail>
                    <Detail label={hi ? 'पिनकोड' : 'PIN code'}>
                      <span className="font-mono text-slate-800">{center.pincode || '—'}</span>
                    </Detail>
                    <Detail icon={<Clock3 size={15} />} label={hi ? 'समय' : 'Hours'}>
                      <span className="text-slate-800">{center.timing || '—'}</span>
                    </Detail>
                    {center.mapUrl && (
                      <Detail icon={<ExternalLink size={15} />} label={hi ? 'मानचित्र' : 'Map'}>
                        <a href={center.mapUrl} target="_blank" rel="noreferrer" className="break-all font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900">
                          {hi ? 'मानचित्र खोलें' : 'Open map'}
                        </a>
                      </Detail>
                    )}
                  </section>

                  <section className="space-y-3">
                    <Detail icon={<UserRound size={15} />} label={hi ? 'केंद्र प्रभारी' : 'Center owner'}>
                      <span className="text-slate-900">{center.ownerName || '—'}</span>
                    </Detail>
                    <Detail icon={<Phone size={15} />} label={hi ? 'फोन' : 'Phone'}>
                      {center.ownerPhone ? (
                        <a href={`tel:${center.ownerPhone}`} className="font-mono font-semibold text-slate-800 hover:text-orange-700">{center.ownerPhone}</a>
                      ) : '—'}
                    </Detail>
                    <Detail icon={<Mail size={15} />} label={hi ? 'ईमेल' : 'Email'}>
                      {center.ownerEmail ? (
                        <a href={`mailto:${center.ownerEmail}`} className="break-all text-slate-800 hover:text-orange-700">{center.ownerEmail}</a>
                      ) : '—'}
                    </Detail>
                    <Detail label={hi ? 'प्रभारी उपयोगकर्ता आईडी' : 'Owner user ID'}>
                      <span className="break-all font-mono text-xs text-slate-700">{center.ownerUserId || '—'}</span>
                    </Detail>
                    <Detail label="GSTIN">
                      <span className="font-mono text-slate-800">{center.gstin || '—'}</span>
                    </Detail>
                  </section>
                </div>

                <footer className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                  <p className="text-xs font-semibold text-slate-700">
                    {hi ? 'लिंक किए गए संग्रह केंद्र' : 'Linked pickup centers'}
                    <span className="ml-2 rounded-full bg-white px-2 py-0.5 font-mono text-slate-800 ring-1 ring-slate-200">
                      {linkedPickupCenters.length}
                    </span>
                  </p>
                  {linkedPickupCenters.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {linkedPickupCenters.map((pickupCenter) => (
                        <li key={pickupCenter.id} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                          {hi ? pickupCenter.nameHi || pickupCenter.name : pickupCenter.nameEn || pickupCenter.name}
                          <span className="ml-1 font-mono text-[10px] text-slate-500">{pickupCenter.id}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 shrink-0 text-amber-700">{icon}</span>}
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <div className="break-words text-sm">{children}</div>
      </div>
    </div>
  );
}