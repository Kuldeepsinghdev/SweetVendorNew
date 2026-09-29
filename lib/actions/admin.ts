'use server';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
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
    // Allow admin override of DC via form field; fall back to what applicant selected.
    const dcOverride = String(formData.get('distributionCenterId') ?? '').trim();
    const assignedDcId = dcOverride || app.centerId || null;

    await db.insert(schema.users).values({
      id: mitraUserId,
      name: app.fullName,
      phone: app.phone,
      email: app.email || null,
      role: 'mitra',
      cityId: app.cityId,
      distributionCenterId: assignedDcId,
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

  // Send rich approval email (best-effort — no hard failure if mail is down).
  if (app.email) {
    try {
      const { sendMitraApprovalEmail } = await import('@/lib/email/sendMitraApprovalEmail');
      await sendMitraApprovalEmail({
        to: app.email,
        mitraName: app.fullName,
        applicationId: appId,
        cityNameHi: app.cityNameHi,
      });
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
      .where(
        and(
          eq(schema.saleCenterSweets.saleCenterId, saleCenterId),
          eq(schema.saleCenterSweets.sweetId, sweetId)
        )
      );
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

// ── Distribution center management (City Admin / Super Admin) ─────────────────

const DistributionCenterSchema = z.object({
  id: z.string().max(64).optional().or(z.literal('')),
  saleCenterId: z.string().min(1).max(64),
  cityId: z.string().min(1).max(64),
  nameHi: z.string().trim().min(2).max(200),
  nameEn: z.string().trim().max(200).optional().or(z.literal('')),
  addressHi: z.string().trim().max(500),
  addressEn: z.string().trim().max(500).optional().or(z.literal('')),
  pincode: z.string().trim().max(16),
  timing: z.string().trim().max(64),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit phone'),
  contactPerson: z.string().trim().max(120).optional().or(z.literal('')),
  isActive: z.boolean(),
});

export async function upsertDistributionCenterAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('city_admin');

  const parsed = DistributionCenterSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get('isActive') === 'true' || formData.get('isActive') === 'on',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const d = parsed.data;
  const isNew = !d.id;
  const id = d.id || `dc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const payload = {
    id,
    saleCenterId: d.saleCenterId,
    cityId: d.cityId,
    nameHi: d.nameHi,
    nameEn: d.nameEn || d.nameHi,
    addressHi: d.addressHi,
    addressEn: d.addressEn || d.addressHi,
    pincode: d.pincode,
    timing: d.timing,
    phone: d.phone,
    contactPerson: d.contactPerson || null,
    isActive: d.isActive,
  };

  if (isNew) {
    await db.insert(schema.distributionCenters).values(payload);
  } else {
    const { id: _id, ...updates } = payload;
    await db
      .update(schema.distributionCenters)
      .set(updates)
      .where(eq(schema.distributionCenters.id, id));
  }

  await writeAuditLog(
    `${user.name} (city_admin)`,
    `${isNew ? 'नया वितरण केंद्र' : 'वितरण केंद्र अद्यतन'} ${id} — ${d.nameHi}`,
    user.sub
  );
  revalidatePath('/[locale]/(dashboard)', 'layout');
  revalidatePath('/[locale]', 'page'); // refresh catalog
  return { ok: true };
}

export async function toggleDistributionCenterAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('city_admin');
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return { error: 'ID required.' };

  const rows = await db
    .select()
    .from(schema.distributionCenters)
    .where(eq(schema.distributionCenters.id, id))
    .limit(1);
  if (!rows[0]) return { error: 'Distribution center not found.' };

  const newState = !rows[0].isActive;
  await db
    .update(schema.distributionCenters)
    .set({ isActive: newState })
    .where(eq(schema.distributionCenters.id, id));

  await writeAuditLog(
    `${user.name} (city_admin)`,
    `वितरण केंद्र ${id} ${newState ? 'सक्रिय' : 'निष्क्रिय'} किया`,
    user.sub
  );
  revalidatePath('/[locale]/(dashboard)', 'layout');
  revalidatePath('/[locale]', 'page');
  return { ok: true };
}

// ── City / organization management (Super Admin) ─────────────────────────────

const CitySchema = z.object({
  id: z.string().min(1).max(64),
  nameHi: z.string().trim().min(2).max(150),
  nameEn: z.string().trim().min(2).max(150),
  stateHi: z.string().trim().min(2).max(100),
  stateEn: z.string().trim().max(100).optional().or(z.literal('')),
  districtHi: z.string().trim().max(100),
  adminName: z.string().trim().min(2).max(120),
  adminPhone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit phone'),
  isActive: z.boolean(),
});

export async function upsertCityAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('super_admin');

  const parsed = CitySchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get('isActive') === 'true' || formData.get('isActive') === 'on',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const d = parsed.data;

  const existing = await db
    .select()
    .from(schema.cities)
    .where(eq(schema.cities.id, d.id))
    .limit(1);

  const payload = {
    id: d.id,
    nameHi: d.nameHi,
    nameEn: d.nameEn,
    stateHi: d.stateHi,
    stateEn: d.stateEn || d.stateHi,
    districtHi: d.districtHi,
    adminName: d.adminName,
    adminPhone: d.adminPhone,
    isActive: d.isActive,
    sweets: (existing[0]?.sweets ?? []) as { sweetId: string; pricePerKg: number; isActive: boolean }[],
  };

  if (existing.length === 0) {
    await db.insert(schema.cities).values(payload);
  } else {
    const { id: _id, sweets: _sw, ...updates } = payload;
    await db.update(schema.cities).set(updates).where(eq(schema.cities.id, d.id));
  }

  await writeAuditLog(
    `${user.name} (super_admin)`,
    `${existing.length === 0 ? 'नया शहर' : 'शहर अद्यतन'} ${d.id} — ${d.nameHi}`,
    user.sub
  );
  revalidatePath('/[locale]/(dashboard)', 'layout');
  revalidatePath('/[locale]', 'page');
  return { ok: true };
}

export async function toggleCityActiveAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireRoleOrThrow('super_admin');
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return { error: 'City ID required.' };

  const rows = await db.select().from(schema.cities).where(eq(schema.cities.id, id)).limit(1);
  if (!rows[0]) return { error: 'City not found.' };

  const newState = !rows[0].isActive;
  await db.update(schema.cities).set({ isActive: newState }).where(eq(schema.cities.id, id));

  await writeAuditLog(
    `${user.name} (super_admin)`,
    `शहर ${id} (${rows[0].nameHi}) ${newState ? 'सक्रिय' : 'निष्क्रिय'} किया`,
    user.sub
  );
  revalidatePath('/[locale]/(dashboard)', 'layout');
  revalidatePath('/[locale]', 'page');
  return { ok: true };
}
