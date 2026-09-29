'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db, schema } from '@/lib/db';
import { requireRoleOrThrow } from '@/lib/auth/rbac';

/**
 * Admin Server Actions (Task 10).
 *
 * All protected by requireRoleOrThrow at the appropriate level before any DB
 * access. Deny by default.
 */

function nowStamp() {
  return new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

async function writeAuditLog(actor: string, actionHi: string, actorUserId?: string) {
  try {
    await db.insert(schema.auditLogs).values({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      actor,
      actorUserId: actorUserId ?? null,
      actionHi,
      timestamp: nowStamp(),
    });
  } catch {
    // best-effort, never fatal
  }
}

// ── Mitra application approval / rejection (City Admin) ───────────────────────

export type AdminActionState = { ok?: boolean; error?: string };

export async function approveMitraAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('city_admin');

  const appId = String(formData.get('appId') ?? '').trim();
  if (!appId) return { error: 'Application ID required.' };

  const rows = await db
    .select()
    .from(schema.mitraApplications)
    .where(eq(schema.mitraApplications.id, appId))
    .limit(1);
  const app = rows[0];
  if (!app) return { error: 'Application not found.' };

  await db
    .update(schema.mitraApplications)
    .set({ status: 'approved' })
    .where(eq(schema.mitraApplications.id, appId));

  // Provision the mitra user (upsert by phone so re-approval is idempotent).
  const mitraUserId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.phone, app.phone))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(schema.users).values({
      id: mitraUserId,
      name: app.fullName,
      phone: app.phone,
      email: app.email || null,
      role: 'mitra',
      cityId: app.cityId,
      pincode: app.pincode,
      address: app.address,
      mustResetPin: true,
      isActive: true,
      createdAt: nowStamp(),
    });
  }

  // If the mitra agreed to create a sale-centre, provision one.
  if (app.agreedToCenter) {
    const centerId = `kendra_mitra_${appId.toLowerCase()}`;
    const existingCenter = await db
      .select()
      .from(schema.saleCenters)
      .where(eq(schema.saleCenters.id, centerId))
      .limit(1);
    if (existingCenter.length === 0) {
      await db.insert(schema.saleCenters).values({
        id: centerId,
        cityId: app.cityId,
        nameHi: `${app.fullName} सहकार मित्र केंद्र`,
        nameEn: `${app.fullName} Mitra Kendra`,
        type: 'mitra_kendra',
        ownerName: app.fullName,
        ownerPhone: app.phone,
        ownerEmail: app.email || '',
        ownerUserId: existing[0]?.id ?? mitraUserId,
        addressHi: app.address,
        addressEn: app.address,
        pincode: app.pincode,
        timing: '09:00 AM - 08:00 PM',
        isActive: true,
      });
    }
  }

  await writeAuditLog(
    `${user.name} (city_admin)`,
    `सहकार मित्र आवेदन ${appId} स्वीकृत — ${app.fullName}`,
    user.sub
  );

  // Send set-password email (best-effort — no hard failure if mail is down).
  if (app.email) {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/send-set-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: app.email }),
        }
      );
    } catch {
      // non-fatal
    }
  }

  revalidatePath('/[locale]/(dashboard)', 'layout');
  return { ok: true };
}

export async function rejectMitraAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('city_admin');

  const appId = String(formData.get('appId') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim() || 'अनुमोदन अस्वीकृत।';
  if (!appId) return { error: 'Application ID required.' };

  await db
    .update(schema.mitraApplications)
    .set({ status: 'rejected', rejectionReason: reason })
    .where(eq(schema.mitraApplications.id, appId));

  await writeAuditLog(
    `${user.name} (city_admin)`,
    `सहकार मित्र आवेदन ${appId} अस्वीकृत — कारण: ${reason}`,
    user.sub
  );
  revalidatePath('/[locale]/(dashboard)', 'layout');
  return { ok: true };
}

// ── Sale center creation / update (City Admin) ────────────────────────────────

const SaleCenterSchema = z.object({
  cityId: z.string().min(1).max(64),
  nameHi: z.string().trim().min(2).max(150),
  nameEn: z.string().trim().max(150).optional().or(z.literal('')),
  type: z.enum(['standalone', 'mitra_kendra']),
  ownerName: z.string().trim().min(2).max(120),
  ownerPhone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit phone'),
  ownerEmail: z.string().trim().email().max(254).or(z.literal('')),
  addressHi: z.string().trim().max(500),
  pincode: z.string().trim().max(16),
  timing: z.string().trim().max(64),
  gstin: z.string().trim().max(32).optional().or(z.literal('')),
});

export async function createSaleCenterAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('city_admin');

  const parsed = SaleCenterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const d = parsed.data;
  const id = `kendra_${Date.now()}`;

  await db.insert(schema.saleCenters).values({
    id,
    cityId: d.cityId,
    nameHi: d.nameHi,
    nameEn: d.nameEn || d.nameHi,
    type: d.type,
    ownerName: d.ownerName,
    ownerPhone: d.ownerPhone,
    ownerEmail: d.ownerEmail,
    addressHi: d.addressHi,
    addressEn: d.addressHi,
    pincode: d.pincode,
    timing: d.timing,
    isActive: true,
    gstin: d.gstin || null,
  });

  await writeAuditLog(
    `${user.name} (city_admin)`,
    `नया बिक्री केंद्र ${d.nameHi} (${id}) जोड़ा गया`,
    user.sub
  );
  revalidatePath('/[locale]/(dashboard)', 'layout');
  return { ok: true };
}

// ── Sale center sweet pricing (City Admin) ────────────────────────────────────

const PricingSchema = z.object({
  saleCenterId: z.string().min(1).max(64),
  sweetId: z.string().min(1).max(64),
  pricePerKg: z.coerce.number().positive(),
  isActive: z.boolean(),
});

export async function upsertSweetPricingAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('city_admin');

  const parsed = PricingSchema.safeParse({
    saleCenterId: formData.get('saleCenterId'),
    sweetId: formData.get('sweetId'),
    pricePerKg: formData.get('pricePerKg'),
    isActive: formData.get('isActive') === 'true' || formData.get('isActive') === 'on',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const { saleCenterId, sweetId, pricePerKg, isActive } = parsed.data;

  // Upsert: update existing or insert new.
  const existing = await db
    .select()
    .from(schema.saleCenterSweets)
    .where(eq(schema.saleCenterSweets.saleCenterId, saleCenterId))
    .limit(999);

  const found = existing.find((r) => r.sweetId === sweetId);
  if (found) {
    await db
      .update(schema.saleCenterSweets)
      .set({ pricePerKg, isActive })
      .where(eq(schema.saleCenterSweets.saleCenterId, saleCenterId));
  } else {
    await db.insert(schema.saleCenterSweets).values({ saleCenterId, sweetId, pricePerKg, isActive });
  }

  await writeAuditLog(
    `${user.name} (city_admin)`,
    `बिक्री केंद्र ${saleCenterId} में ${sweetId} का मूल्य ₹${pricePerKg} सेट किया`,
    user.sub
  );
  revalidatePath('/[locale]/(dashboard)', 'layout');
  return { ok: true };
}

// ── Discount / coupon (City Admin) ────────────────────────────────────────────

const DiscountSchema = z.object({
  id: z.string().max(64).optional().or(z.literal('')),
  code: z.string().trim().toUpperCase().min(2).max(64),
  titleHi: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().max(200).optional().or(z.literal('')),
  descriptionHi: z.string().trim().max(500).optional().or(z.literal('')),
  cityId: z.string().min(1).max(64),
  centerId: z.string().max(64).optional().or(z.literal('')),
  discountType: z.enum(['flat', 'percentage']),
  discountValue: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().min(0),
  maxDiscountAmount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  startDate: z.string().max(32).optional().or(z.literal('')),
  expiryDate: z.string().max(32).optional().or(z.literal('')),
  isActive: z.boolean(),
});

export async function upsertDiscountAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('city_admin');

  const parsed = DiscountSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get('isActive') === 'true' || formData.get('isActive') === 'on',
    discountValue: formData.get('discountValue'),
    minOrderAmount: formData.get('minOrderAmount'),
    maxDiscountAmount: formData.get('maxDiscountAmount') || undefined,
    usageLimit: formData.get('usageLimit') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const d = parsed.data;
  const isNew = !d.id;
  const id = d.id || `coup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const payload = {
    id,
    code: d.code.toUpperCase(),
    titleHi: d.titleHi,
    titleEn: d.titleEn || d.titleHi,
    descriptionHi: d.descriptionHi || null,
    cityId: d.cityId,
    centerId: d.centerId || 'all',
    discountType: d.discountType,
    discountValue: d.discountValue,
    minOrderAmount: d.minOrderAmount,
    maxDiscountAmount: d.maxDiscountAmount ?? null,
    usageLimit: d.usageLimit ?? null,
    startDate: d.startDate || null,
    expiryDate: d.expiryDate || null,
    isActive: d.isActive,
    timesUsed: 0,
    createdAt: nowStamp(),
  };

  if (isNew) {
    await db.insert(schema.discounts).values(payload);
  } else {
    const { timesUsed, createdAt, ...updates } = payload;
    await db.update(schema.discounts).set(updates).where(eq(schema.discounts.id, id));
  }

  await writeAuditLog(
    `${user.name} (city_admin)`,
    `${isNew ? 'नया' : 'अद्यतन'} कूपन ${id} (${d.code}) — ${d.cityId}`,
    user.sub
  );
  revalidatePath('/[locale]/(dashboard)', 'layout');
  return { ok: true };
}

// ── Festival management (Super Admin) ─────────────────────────────────────────

const FestivalSchema = z.object({
  id: z.string().max(64).optional().or(z.literal('')),
  nameHi: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  status: z.enum(['active', 'draft', 'completed']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  cutoffDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  distributionStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  distributionEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  maxKgPerBooking: z.coerce.number().positive(),
  defaultMitraCreditLimit: z.coerce.number().positive(),
});

export async function upsertFestivalAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('super_admin');

  const parsed = FestivalSchema.safeParse({
    ...Object.fromEntries(formData),
    maxKgPerBooking: formData.get('maxKgPerBooking'),
    defaultMitraCreditLimit: formData.get('defaultMitraCreditLimit'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const d = parsed.data;
  const isNew = !d.id;
  const id = d.id || `fest_${Date.now()}`;

  if (isNew) {
    await db.insert(schema.festivals).values({ id, ...d });
  } else {
    await db.update(schema.festivals).set(d).where(eq(schema.festivals.id, id));
  }

  await writeAuditLog(
    `${user.name} (super_admin)`,
    `${isNew ? 'नया उत्सव' : 'उत्सव अद्यतन'} ${id} — ${d.nameHi}`,
    user.sub
  );
  revalidatePath('/[locale]/(dashboard)', 'layout');
  return { ok: true };
}

// ── Master sweet add/update (Super Admin) ─────────────────────────────────────

const MasterSweetSchema = z.object({
  id: z.string().min(1).max(64),
  nameHi: z.string().trim().min(1).max(150),
  nameEn: z.string().trim().min(1).max(150),
  category: z.enum(['dry', 'bengali', 'traditional', 'gift', 'mawa']),
  hsnCode: z.string().trim().max(32),
  gstPercent: z.coerce.number().min(0).max(100),
  descriptionHi: z.string().trim().max(1000),
  descriptionEn: z.string().trim().max(1000).optional().or(z.literal('')),
  imageUrl: z.string().trim().max(500),
  basePrice: z.coerce.number().positive().optional(),
  shelfLifeDays: z.coerce.number().int().positive().optional(),
  ingredientsHi: z.string().trim().max(500).optional().or(z.literal('')),
  isPureVeg: z.boolean(),
  variants: z.string().min(2), // JSON string
});

export async function upsertMasterSweetAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('super_admin');

  const parsed = MasterSweetSchema.safeParse({
    ...Object.fromEntries(formData),
    gstPercent: formData.get('gstPercent'),
    basePrice: formData.get('basePrice') || undefined,
    shelfLifeDays: formData.get('shelfLifeDays') || undefined,
    isPureVeg: formData.get('isPureVeg') === 'true' || formData.get('isPureVeg') === 'on',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  let variants;
  try {
    variants = JSON.parse(parsed.data.variants);
  } catch {
    return { error: 'Variants must be valid JSON.' };
  }

  const d = parsed.data;

  // Check if exists.
  const existing = await db
    .select()
    .from(schema.masterSweets)
    .where(eq(schema.masterSweets.id, d.id))
    .limit(1);

  const payload = {
    id: d.id,
    nameHi: d.nameHi,
    nameEn: d.nameEn,
    category: d.category,
    hsnCode: d.hsnCode,
    gstPercent: d.gstPercent,
    descriptionHi: d.descriptionHi,
    descriptionEn: d.descriptionEn || d.descriptionHi,
    imageUrl: d.imageUrl,
    basePrice: d.basePrice ?? null,
    shelfLifeDays: d.shelfLifeDays ?? null,
    ingredientsHi: d.ingredientsHi || null,
    isPureVeg: d.isPureVeg,
    variants,
  };

  if (existing.length > 0) {
    await db.update(schema.masterSweets).set(payload).where(eq(schema.masterSweets.id, d.id));
  } else {
    await db.insert(schema.masterSweets).values(payload);
  }

  await writeAuditLog(
    `${user.name} (super_admin)`,
    `${existing.length > 0 ? 'मिठाई अद्यतन' : 'नई मिठाई'} ${d.id} — ${d.nameHi}`,
    user.sub
  );
  revalidatePath('/[locale]/(dashboard)', 'layout');
  return { ok: true };
}
