import { db } from './index';
import * as schema from './schema';
import {
  INITIAL_MASTER_SWEETS,
  INITIAL_CITIES,
  INITIAL_SALE_CENTERS,
  INITIAL_DISTRIBUTION_CENTERS,
  INITIAL_SALE_CENTER_SWEETS,
  INITIAL_FESTIVALS,
  INITIAL_MITRAS,
  INITIAL_BOOKINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_DISCOUNTS
} from '../data/initialData';
import bcrypt from 'bcryptjs';

/**
 * Seeds the database with the initial reference data.
 *
 * - forceClean = false (startup default via initDb): NEVER deletes and NEVER
 *   modifies existing rows. Every insert uses onConflictDoNothing, so only
 *   missing seed rows are added. Test/manual data is fully preserved.
 * - forceClean = true (explicit POST /api/seed or /api/reset-data): clears all
 *   tables first, then re-inserts the initial data from scratch.
 */
export async function seedDatabase(forceClean = true) {
  try {
    console.log(
      forceClean
        ? 'Force-reseeding database (clearing existing data)...'
        : 'Seeding database (insert-if-missing, existing rows untouched)...'
    );

    if (forceClean) {
      // Clear old data in dependency order
      try {
        await db.delete(schema.bookings);
        await db.delete(schema.mitraApplications);
        await db.delete(schema.saleCenterSweets);
        await db.delete(schema.distributionCenters);
        await db.delete(schema.saleCenters);
        await db.delete(schema.cities);
        await db.delete(schema.masterSweets);
        await db.delete(schema.festivals);
        await db.delete(schema.auditLogs);
        await db.delete(schema.notificationTemplates);
        await db.delete(schema.users);
      } catch (e) {
        console.warn('Error clearing tables during force seed:', e);
      }
    }

    // 1. Master Sweets
    for (const sweet of INITIAL_MASTER_SWEETS) {
      await db.insert(schema.masterSweets).values({
        id: sweet.id,
        nameHi: sweet.nameHi,
        nameEn: sweet.nameEn,
        category: sweet.category,
        hsnCode: sweet.hsnCode,
        gstPercent: sweet.gstPercent,
        descriptionHi: sweet.descriptionHi,
        descriptionEn: sweet.descriptionEn,
        imageUrl: sweet.imageUrl,
        images: sweet.images || [sweet.imageUrl],
        basePrice: sweet.basePrice || null,
        discountPercent: sweet.discountPercent || null,
        shelfLifeDays: sweet.shelfLifeDays || null,
        packSizeInfo: sweet.packSizeInfo || null,
        variants: sweet.variants,
        isPureVeg: sweet.isPureVeg ?? true,
        ingredientsHi: sweet.ingredientsHi || null,
      }).onConflictDoNothing();
    }

    // 2. Cities
    for (const city of INITIAL_CITIES) {
      await db.insert(schema.cities).values({
        id: city.id,
        nameHi: city.nameHi,
        nameEn: city.nameEn,
        stateHi: city.stateHi,
        stateEn: city.stateEn,
        districtHi: city.districtHi,
        adminName: city.adminName,
        adminPhone: city.adminPhone,
        isActive: city.isActive,
        sweets: city.sweets,
      }).onConflictDoNothing();
    }

    // 3. Sale Centers
    for (const center of INITIAL_SALE_CENTERS) {
      await db.insert(schema.saleCenters).values({
        id: center.id,
        cityId: center.cityId,
        nameHi: center.nameHi,
        nameEn: center.nameEn,
        type: center.type,
        ownerName: center.ownerName,
        ownerPhone: center.ownerPhone,
        ownerEmail: center.ownerEmail,
        addressHi: center.addressHi,
        addressEn: center.addressEn,
        pincode: center.pincode,
        timing: center.timing,
        mapUrl: center.mapUrl || null,
        isActive: center.isActive,
        gstin: center.gstin || null,
      }).onConflictDoNothing();
    }

    // 3b. Distribution Centers (children of sale centers; pickup points)
    for (const dc of INITIAL_DISTRIBUTION_CENTERS) {
      await db.insert(schema.distributionCenters).values({
        id: dc.id,
        saleCenterId: dc.saleCenterId,
        cityId: dc.cityId,
        nameHi: dc.nameHi,
        nameEn: dc.nameEn,
        addressHi: dc.addressHi,
        addressEn: dc.addressEn,
        pincode: dc.pincode,
        timing: dc.timing,
        phone: dc.phone,
        isActive: dc.isActive,
      }).onConflictDoNothing();
    }

    // 3c. Sale Centre Sweets (per-centre menu + pricing; child of sale_centers + master_sweets)
    for (const scs of INITIAL_SALE_CENTER_SWEETS) {
      await db.insert(schema.saleCenterSweets).values({
        saleCenterId: scs.saleCenterId,
        sweetId: scs.sweetId,
        pricePerKg: scs.pricePerKg,
        isActive: scs.isActive,
      }).onConflictDoNothing();
    }

    // 4. Festivals
    for (const festival of INITIAL_FESTIVALS) {
      await db.insert(schema.festivals).values({
        id: festival.id,
        nameHi: festival.nameHi,
        nameEn: festival.nameEn,
        status: festival.status,
        startDate: festival.startDate,
        cutoffDate: festival.cutoffDate,
        distributionStartDate: festival.distributionStartDate,
        distributionEndDate: festival.distributionEndDate,
        maxKgPerBooking: festival.maxKgPerBooking,
        defaultMitraCreditLimit: festival.defaultMitraCreditLimit,
      }).onConflictDoNothing();
    }

    // 5. Mitra Applications
    for (const m of INITIAL_MITRAS) {
      await db.insert(schema.mitraApplications).values({
        id: m.id,
        cityId: m.cityId,
        centerId: m.centerId || null,
        cityNameHi: m.cityNameHi,
        fullName: m.fullName,
        phone: m.phone,
        email: m.email,
        pincode: m.pincode,
        address: m.address,
        agreedToCenter: m.agreedToCenter,
        status: m.status,
        rejectionReason: m.rejectionReason || null,
        createdAt: m.createdAt,
        tempPassword: m.tempPassword || null,
        creditLimit: m.creditLimit,
      }).onConflictDoNothing();
    }

    // 6. Bookings
    for (const b of INITIAL_BOOKINGS) {
      await db.insert(schema.bookings).values({
        id: b.id,
        festivalId: b.festivalId,
        festivalNameHi: b.festivalNameHi,
        cityId: b.cityId,
        cityNameHi: b.cityNameHi,
        centerId: b.centerId,
        saleCenterId: b.saleCenterId || null,
        centerNameHi: b.centerNameHi,
        centerAddressHi: b.centerAddressHi,
        centerPhone: b.centerPhone,
        bookedByRole: b.bookedByRole,
        mitraId: b.mitraId || null,
        mitraName: b.mitraName || null,
        customer: b.customer,
        items: b.items,
        totalKg: b.totalKg,
        totalAmount: b.totalAmount,
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        status: b.status,
        pickupDate: b.pickupDate,
        deliveryOtp: b.deliveryOtp,
        createdAt: b.createdAt,
        deliveredAt: b.deliveredAt || null,
        invoiceId: b.invoiceId || null,
      }).onConflictDoNothing();
    }

    // 7. Audit Logs
    for (const log of INITIAL_AUDIT_LOGS) {
      await db.insert(schema.auditLogs).values({
        id: log.id,
        actor: log.actor,
        actionHi: log.actionHi,
        timestamp: log.timestamp,
      }).onConflictDoNothing();
    }

    // 8. Notification Templates
    for (const n of INITIAL_NOTIFICATION_TEMPLATES) {
      await db.insert(schema.notificationTemplates).values({
        id: n.id,
        eventHi: n.eventHi,
        smsEnabled: n.smsEnabled,
        emailEnabled: n.emailEnabled,
        templateTextHi: n.templateTextHi,
        dltApproved: n.dltApproved,
      }).onConflictDoNothing();
    }

    // 9. Discount Coupons
    for (const d of INITIAL_DISCOUNTS) {
      await db.insert(schema.discounts).values({
        id: d.id,
        code: d.code,
        titleHi: d.titleHi,
        titleEn: d.titleEn,
        descriptionHi: d.descriptionHi || null,
        cityId: d.cityId,
        centerId: d.centerId || 'all',
        discountType: d.discountType,
        discountValue: d.discountValue,
        minOrderAmount: d.minOrderAmount,
        maxDiscountAmount: d.maxDiscountAmount || null,
        startDate: d.startDate || null,
        expiryDate: d.expiryDate || null,
        usageLimit: d.usageLimit || null,
        timesUsed: d.timesUsed || 0,
        isActive: d.isActive,
        createdAt: d.createdAt,
      }).onConflictDoNothing();
    }

    // 10. Users — derive a single users row per person from the seeded identity
    //     sources (city admins, sale-center owners, mitras, booking customers,
    //     plus the HQ super admin). Mirrors scripts/2026_users_table_migration.sql.
    await seedUsersFromSeedData();

    console.log('Database seeding & sync complete for Sawai Madhopur!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

/** Role precedence: super_admin > city_admin > kendra > mitra > customer. */
const ROLE_RANK: Record<string, number> = {
  customer: 1,
  mitra: 2,
  kendra: 3,
  city_admin: 4,
  super_admin: 5,
};

const normPhone = (p?: string) => (p || '').replace(/\D/g, '').slice(-10);

async function seedUsersFromSeedData() {
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  // Collect candidates keyed by normalized phone; keep the highest-privilege role.
  const byPhone = new Map<string, {
    name: string; phone: string; email?: string | null; role: string;
    cityId?: string | null; pincode?: string | null; address?: string | null; mustResetPin?: boolean;
  }>();

  const consider = (c: { name: string; phone?: string; email?: string | null; role: string; cityId?: string | null; pincode?: string | null; address?: string | null; mustResetPin?: boolean }) => {
    const phone = normPhone(c.phone);
    if (phone.length !== 10) return;
    const existing = byPhone.get(phone);
    if (!existing || ROLE_RANK[c.role] > ROLE_RANK[existing.role]) {
      byPhone.set(phone, { ...c, phone, name: c.name || existing?.name || 'ग्राहक', email: c.email ?? existing?.email ?? null });
    } else {
      // keep higher role but fill missing fields
      existing.email = existing.email ?? c.email ?? null;
      existing.cityId = existing.cityId ?? c.cityId ?? null;
    }
  };

  // Customers from bookings
  for (const b of INITIAL_BOOKINGS) {
    if (b.customer?.phone) {
      consider({ name: b.customer.name, phone: b.customer.phone, email: (b.customer as any).email, role: 'customer', pincode: (b.customer as any).pincode, address: (b.customer as any).address });
    }
  }
  // Mitras
  for (const m of INITIAL_MITRAS) {
    consider({ name: m.fullName, phone: m.phone, email: m.email, role: 'mitra', cityId: m.cityId, pincode: m.pincode, address: m.address, mustResetPin: !!m.tempPassword });
  }
  // Sale-center owners
  for (const s of INITIAL_SALE_CENTERS) {
    consider({ name: s.ownerName, phone: s.ownerPhone, email: s.ownerEmail, role: 'kendra' });
  }
  // City admins
  for (const c of INITIAL_CITIES) {
    consider({ name: c.adminName, phone: c.adminPhone, role: 'city_admin', cityId: c.id });
  }
  // HQ super admin (matches the hardcoded admin login phone).
  consider({ name: 'राज्य मुख्यालय सुपर एडमिन', phone: '7737691749', role: 'super_admin' });

  for (const [phone, u] of byPhone) {
    const prefix = u.role === 'customer' ? 'cust' : u.role === 'mitra' ? 'mitra' : u.role === 'kendra' ? 'kendra' : u.role === 'city_admin' ? 'admin' : 'super_admin';
    const id = u.role === 'super_admin' ? 'usr_super_admin' : `usr_${prefix}_${phone}`;
    
    // Set default PIN hash for admin-level users (kendra, city_admin, super_admin)
    // Default PIN: 1000 (for demo/dev purposes - should be changed in production)
    let pinHash: string | null = null;
    const isAdminRole = u.role === 'kendra' || u.role === 'city_admin' || u.role === 'super_admin';
    if (isAdminRole) {
      // Hash the default PIN '1000'
      pinHash = await bcrypt.hash('1000', 10);
    }
    
    await db.insert(schema.users).values({
      id,
      name: u.name,
      phone,
      email: u.email || null,
      role: u.role,
      pinHash,
      cityId: u.cityId || null,
      pincode: u.pincode || null,
      address: u.address || null,
      mustResetPin: u.mustResetPin ?? false,
      isActive: true,
      createdAt: now,
      updatedAt: null,
    }).onConflictDoNothing();
  }
}
