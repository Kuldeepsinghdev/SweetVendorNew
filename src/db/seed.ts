import { db } from './index';
import * as schema from './schema';
import {
  INITIAL_MASTER_SWEETS,
  INITIAL_CITIES,
  INITIAL_SALE_CENTERS,
  INITIAL_FESTIVALS,
  INITIAL_MITRAS,
  INITIAL_BOOKINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_DISCOUNTS
} from '../data/initialData';

export async function seedDatabase(forceClean = true) {
  try {
    console.log('Seeding and syncing database with latest data...');

    if (forceClean) {
      // Clear old dummy data in order
      try {
        await db.delete(schema.bookings);
        await db.delete(schema.mitraApplications);
        await db.delete(schema.saleCenters);
        await db.delete(schema.cities);
        await db.delete(schema.masterSweets);
        await db.delete(schema.festivals);
        await db.delete(schema.auditLogs);
        await db.delete(schema.notificationTemplates);
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
      }).onConflictDoUpdate({
        target: schema.masterSweets.id,
        set: {
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
        }
      });
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
      }).onConflictDoUpdate({
        target: schema.cities.id,
        set: {
          nameHi: city.nameHi,
          nameEn: city.nameEn,
          stateHi: city.stateHi,
          stateEn: city.stateEn,
          districtHi: city.districtHi,
          adminName: city.adminName,
          adminPhone: city.adminPhone,
          isActive: city.isActive,
          sweets: city.sweets,
        }
      });
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
      }).onConflictDoUpdate({
        target: schema.saleCenters.id,
        set: {
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
        }
      });
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
      }).onConflictDoUpdate({
        target: schema.festivals.id,
        set: {
          nameHi: festival.nameHi,
          nameEn: festival.nameEn,
          status: festival.status,
          startDate: festival.startDate,
          cutoffDate: festival.cutoffDate,
          distributionStartDate: festival.distributionStartDate,
          distributionEndDate: festival.distributionEndDate,
          maxKgPerBooking: festival.maxKgPerBooking,
          defaultMitraCreditLimit: festival.defaultMitraCreditLimit,
        }
      });
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
      }).onConflictDoUpdate({
        target: schema.mitraApplications.id,
        set: {
          cityId: m.cityId,
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
        }
      });
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
      }).onConflictDoUpdate({
        target: schema.bookings.id,
        set: {
          festivalId: b.festivalId,
          festivalNameHi: b.festivalNameHi,
          cityId: b.cityId,
          cityNameHi: b.cityNameHi,
          centerId: b.centerId,
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
        }
      });
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
      }).onConflictDoUpdate({
        target: schema.notificationTemplates.id,
        set: {
          eventHi: n.eventHi,
          smsEnabled: n.smsEnabled,
          emailEnabled: n.emailEnabled,
          templateTextHi: n.templateTextHi,
          dltApproved: n.dltApproved,
        }
      });
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
      }).onConflictDoUpdate({
        target: schema.discounts.id,
        set: {
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
          isActive: d.isActive,
        }
      });
    }

    console.log('Database seeding & sync complete for Sawai Madhopur!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
