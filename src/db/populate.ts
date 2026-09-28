/**
 * src/db/populate.ts
 * --------------------------------------------------------------------------
 * Server-side identity rehydration.
 *
 * After the users-table migration, the physical identity columns on bookings /
 * cities / sale_centers are being retired in favour of foreign keys into the
 * `users` table. To keep API responses (and therefore the whole client UI)
 * unchanged, GET endpoints run rows through these helpers, which repopulate the
 * legacy-shaped fields from the referenced user.
 *
 * This module is intentionally framework-agnostic and side-effect free: it takes
 * plain rows + a user lookup and returns new plain rows. It ports directly to a
 * Next.js route handler or server component with no changes.
 * --------------------------------------------------------------------------
 */

export interface UserLike {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  pincode?: string | null;
  address?: string | null;
}

/** Build an O(1) id -> user lookup from a users list. */
export function indexUsersById<T extends UserLike>(users: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const u of users) map.set(u.id, u);
  return map;
}

/**
 * Rehydrate a booking's `customer` object, `mitraName`, and `pickupMitraName`
 * from the referenced users. Falls back to whatever is already on the row (the
 * legacy column) when a FK is missing or the user isn't found, so this is safe
 * to run both before and after the physical columns are dropped.
 */
export function populateBooking<T extends Record<string, any>>(
  booking: T,
  usersById: Map<string, UserLike>,
): T {
  const customerUser = booking.customerUserId ? usersById.get(booking.customerUserId) : undefined;
  const mitraUser = booking.mitraUserId ? usersById.get(booking.mitraUserId) : undefined;
  const pickupMitraUser = booking.pickupMitraUserId ? usersById.get(booking.pickupMitraUserId) : undefined;

  const existingCustomer = booking.customer || {};

  const customer = customerUser
    ? {
        name: customerUser.name || existingCustomer.name || 'ग्राहक',
        phone: customerUser.phone || existingCustomer.phone || '',
        email: customerUser.email ?? existingCustomer.email ?? '',
        pincode: customerUser.pincode ?? existingCustomer.pincode ?? '',
        address: customerUser.address ?? existingCustomer.address ?? '',
      }
    : existingCustomer;

  return {
    ...booking,
    customer,
    mitraName: mitraUser?.name ?? booking.mitraName ?? null,
    pickupMitraName: pickupMitraUser?.name ?? booking.pickupMitraName ?? null,
  };
}

/** Rehydrate a city's `adminName` / `adminPhone` from the referenced admin user. */
export function populateCity<T extends Record<string, any>>(
  city: T,
  usersById: Map<string, UserLike>,
): T {
  const adminUser = city.adminUserId ? usersById.get(city.adminUserId) : undefined;
  if (!adminUser) return city;
  return {
    ...city,
    adminName: adminUser.name ?? city.adminName,
    adminPhone: adminUser.phone ?? city.adminPhone,
  };
}

/** Rehydrate a sale center's owner fields from the referenced owner user. */
export function populateSaleCenter<T extends Record<string, any>>(
  center: T,
  usersById: Map<string, UserLike>,
): T {
  const ownerUser = center.ownerUserId ? usersById.get(center.ownerUserId) : undefined;
  if (!ownerUser) return center;
  return {
    ...center,
    ownerName: ownerUser.name ?? center.ownerName,
    ownerPhone: ownerUser.phone ?? center.ownerPhone,
    ownerEmail: ownerUser.email ?? center.ownerEmail ?? '',
  };
}

/** Rehydrate a mitra application's identity fields from its linked user. */
export function populateMitraApplication<T extends Record<string, any>>(
  application: T,
  usersById: Map<string, UserLike>,
): T {
  const user = application.userId ? usersById.get(application.userId) : undefined;
  if (!user) return application;
  return {
    ...application,
    fullName: user.name ?? application.fullName,
    phone: user.phone ?? application.phone,
    email: user.email ?? application.email ?? '',
  };
}
