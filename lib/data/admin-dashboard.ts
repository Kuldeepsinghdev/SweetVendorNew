import 'server-only';
import { unstable_cache } from 'next/cache';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import type { AdminRole } from '@/lib/auth/session';

/**
 * Server-side data loading for the unified admin dashboard.
 *
 * This module implements role-based data filtering with graceful error handling
 * and caching for catalog / configuration data to ensure fast load times.
 * All queries are filtered server-side based on the user's role to enforce data
 * isolation (Requirements 5.1-5.6, 12.1-12.3).
 *
 * Data isolation rules:
 * - kendra: Only data for their assigned sale center
 * - city_admin: Only data for sale centers/DCs in their assigned city
 * - super_admin: Nationwide data across all cities and centers
 */

// Type definitions for dashboard data
export type DashboardBooking = typeof schema.bookings.$inferSelect;
export type DashboardSaleCenter = typeof schema.saleCenters.$inferSelect;
export type DashboardFestival = typeof schema.festivals.$inferSelect;
export type DashboardMitraApplication = typeof schema.mitraApplications.$inferSelect;
export type DashboardDistributionCenter = typeof schema.distributionCenters.$inferSelect;
export type DashboardDiscount = typeof schema.discounts.$inferSelect;
export type DashboardCity = typeof schema.cities.$inferSelect;
export type DashboardMasterSweet = typeof schema.masterSweets.$inferSelect;
export type DashboardAuditLog = typeof schema.auditLogs.$inferSelect;
export type DashboardUser = typeof schema.users.$inferSelect;

/**
 * Dashboard data structure with optional fields based on role.
 * Fields are undefined when not accessible to the user's role.
 */
export interface DashboardData {
  // Kendra-level data (visible to all roles)
  bookings: DashboardBooking[];
  saleCenter?: DashboardSaleCenter;
  festivals: DashboardFestival[];
  
  // City admin data (visible to city_admin and super_admin)
  mitraApplications?: DashboardMitraApplication[];
  saleCenters?: DashboardSaleCenter[];
  distributionCenters?: DashboardDistributionCenter[];
  discounts?: DashboardDiscount[];
  cities?: DashboardCity[];
  
  // Super admin data (visible to super_admin only)
  masterSweets?: DashboardMasterSweet[];
  auditLogs?: DashboardAuditLog[];
  allCities?: DashboardCity[];
  allSaleCenters?: DashboardSaleCenter[];
}

/**
 * Error type for partial data load failures.
 * Used to track which data sections failed while allowing others to succeed.
 */
interface DataLoadError {
  section: string;
  error: Error;
}

// Cached queries for static / catalog / config data with 60-second TTL
export const getCachedFestivals = unstable_cache(
  async () => db.select().from(schema.festivals),
  ['admin-festivals'],
  { revalidate: 60, tags: ['festivals', 'admin-data'] }
);

export const getCachedCities = unstable_cache(
  async () => db.select().from(schema.cities),
  ['admin-cities'],
  { revalidate: 60, tags: ['cities', 'admin-data'] }
);

export const getCachedSaleCenters = unstable_cache(
  async () => db.select().from(schema.saleCenters),
  ['admin-sale-centers'],
  { revalidate: 60, tags: ['sale-centers', 'admin-data'] }
);

export const getCachedDistributionCenters = unstable_cache(
  async () => db.select().from(schema.distributionCenters),
  ['admin-distribution-centers'],
  { revalidate: 60, tags: ['distribution-centers', 'admin-data'] }
);

export const getCachedMasterSweets = unstable_cache(
  async () => db.select().from(schema.masterSweets),
  ['admin-master-sweets'],
  { revalidate: 60, tags: ['master-sweets', 'admin-data'] }
);

export const getCachedDiscounts = unstable_cache(
  async () => db.select().from(schema.discounts),
  ['admin-discounts'],
  { revalidate: 60, tags: ['discounts', 'admin-data'] }
);

export const getCachedUser = unstable_cache(
  async (userId: string) =>
    db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    }),
  ['admin-user-by-id'],
  { revalidate: 60, tags: ['users'] }
);

/**
 * Load dashboard data with role-based filtering and caching.
 *
 * @param role - The authenticated user's admin role
 * @param userId - The authenticated user's ID (for determining assigned entities)
 * @returns Pre-filtered dashboard data appropriate for the user's role
 */
export async function loadDashboardData(
  role: AdminRole,
  userId: string
): Promise<DashboardData> {
  const errors: DataLoadError[] = [];

  // Helper to safely execute queries with error tracking
  const safeQuery = async <T>(
    section: string,
    queryFn: () => Promise<T>,
    fallback: T
  ): Promise<T> => {
    try {
      return await queryFn();
    } catch (error) {
      console.error(`Dashboard data load failed [${section}]:`, error);
      errors.push({
        section,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return fallback;
    }
  };

  // Role-based data loading with server-side filtering
  switch (role) {
    case 'super_admin':
      // Super admin sees nationwide data without needing user table lookup
      return loadSuperAdminData(safeQuery);

    case 'kendra':
      return loadKendraData(userId, safeQuery);

    case 'city_admin':
      return loadCityAdminData(userId, safeQuery);

    default:
      console.error(`Unknown role: ${role}`);
      return {
        bookings: [],
        festivals: [],
      };
  }
}

/**
 * Load data for kendra role users.
 * Kendra users only see data for their assigned sale center:
 * - Bookings filtered by saleCenterId
 * - Their assigned sale center details
 * - Active festivals (needed for demand planning)
 */
async function loadKendraData(
  userId: string,
  safeQuery: <T>(section: string, fn: () => Promise<T>, fallback: T) => Promise<T>
): Promise<DashboardData> {
  // Parallel fetch: cached sale centers and cached festivals
  const [saleCenters, festivals] = await Promise.all([
    safeQuery('saleCenters', () => getCachedSaleCenters(), []),
    safeQuery('festivals', () => getCachedFestivals(), []),
  ]);

  let saleCenter = saleCenters.find((sc) => sc.ownerUserId === userId);
  if (!saleCenter) {
    // Fallback: direct query in case of fresh user assignment
    saleCenter = (await safeQuery(
      'saleCenter',
      () =>
        db.query.saleCenters.findFirst({
          where: eq(schema.saleCenters.ownerUserId, userId),
        }),
      undefined
    )) ?? undefined;
  }

  if (!saleCenter) {
    console.error(`Sale center not found for kendra user: ${userId}`);
    return {
      bookings: [],
      festivals,
    };
  }

  // Load only bookings for this sale center
  const bookings = await safeQuery(
    'bookings',
    () =>
      db.query.bookings.findMany({
        where: eq(schema.bookings.saleCenterId, saleCenter.id),
      }),
    []
  );

  return {
    bookings,
    saleCenter,
    festivals,
  };
}

/**
 * Load data for city_admin role users.
 * City admin users see data for their assigned city:
 * - Bookings filtered by cityId
 * - Sale centers in their city
 * - Distribution centers in their city
 * - Mitra applications for their city
 * - Discounts for their city
 * - City details
 * - Festivals
 */
async function loadCityAdminData(
  userId: string,
  safeQuery: <T>(section: string, fn: () => Promise<T>, fallback: T) => Promise<T>
): Promise<DashboardData> {
  const user = await safeQuery('user', () => getCachedUser(userId), null);

  const cityId = user?.cityId;
  if (!cityId) {
    console.error('City admin user has no assigned city');
    return {
      bookings: [],
      festivals: [],
    };
  }

  // Parallel data loading: cache hits for static data + parallel DB reads for dynamic tables
  const [
    allFestivals,
    allSaleCenters,
    allDistributionCenters,
    allDiscounts,
    allCities,
    bookings,
    mitraApplications,
  ] = await Promise.all([
    safeQuery('festivals', () => getCachedFestivals(), []),
    safeQuery('saleCenters', () => getCachedSaleCenters(), []),
    safeQuery('distributionCenters', () => getCachedDistributionCenters(), []),
    safeQuery('discounts', () => getCachedDiscounts(), []),
    safeQuery('cities', () => getCachedCities(), []),
    safeQuery(
      'bookings',
      () =>
        db.query.bookings.findMany({
          where: eq(schema.bookings.cityId, cityId),
        }),
      []
    ),
    safeQuery(
      'mitraApplications',
      () =>
        db.select({
          id: schema.mitraApplications.id,
          userId: schema.mitraApplications.userId,
          cityId: schema.mitraApplications.cityId,
          centerId: schema.mitraApplications.centerId,
          distributionCenterIds: schema.mitraApplications.distributionCenterIds,
          cityNameHi: schema.mitraApplications.cityNameHi,
          fullName: schema.mitraApplications.fullName,
          phone: schema.mitraApplications.phone,
          email: schema.mitraApplications.email,
          pincode: schema.mitraApplications.pincode,
          address: schema.mitraApplications.address,
          agreedToCenter: schema.mitraApplications.agreedToCenter,
          status: schema.mitraApplications.status,
          rejectionReason: schema.mitraApplications.rejectionReason,
          createdAt: schema.mitraApplications.createdAt,
          creditLimit: schema.mitraApplications.creditLimit,
          tempPassword: schema.mitraApplications.tempPassword,
          passwordHash: schema.mitraApplications.passwordHash,
        })
        .from(schema.mitraApplications)
        .where(eq(schema.mitraApplications.cityId, cityId)),
      []
    ),
  ]);

  // Fast in-memory filtering for city-assigned records
  const saleCenters = allSaleCenters.filter((sc) => sc.cityId === cityId);
  const distributionCenters = allDistributionCenters.filter((dc) => dc.cityId === cityId);
  const discounts = allDiscounts.filter((d) => !d.cityId || d.cityId === cityId);
  const cities = allCities.filter((c) => c.id === cityId);

  return {
    bookings,
    festivals: allFestivals,
    mitraApplications,
    saleCenters,
    distributionCenters,
    discounts,
    cities,
  };
}

/**
 * Load data for super_admin role users.
 * Super admin users see nationwide data across all entities.
 * Static/catalog data is cached, while dynamic transactional data (bookings, applications, logs)
 * is queried fresh in parallel.
 */
async function loadSuperAdminData(
  safeQuery: <T>(section: string, fn: () => Promise<T>, fallback: T) => Promise<T>
): Promise<DashboardData> {
  const [
    bookings,
    festivals,
    mitraApplications,
    saleCenters,
    distributionCenters,
    cities,
    masterSweets,
    auditLogs,
    discounts,
  ] = await Promise.all([
    safeQuery('bookings', () => db.select().from(schema.bookings), []),
    safeQuery('festivals', () => getCachedFestivals(), []),
    safeQuery('mitraApplications', () => 
      db.select({
        id: schema.mitraApplications.id,
        userId: schema.mitraApplications.userId,
        cityId: schema.mitraApplications.cityId,
        centerId: schema.mitraApplications.centerId,
        distributionCenterIds: schema.mitraApplications.distributionCenterIds,
        cityNameHi: schema.mitraApplications.cityNameHi,
        fullName: schema.mitraApplications.fullName,
        phone: schema.mitraApplications.phone,
        email: schema.mitraApplications.email,
        pincode: schema.mitraApplications.pincode,
        address: schema.mitraApplications.address,
        agreedToCenter: schema.mitraApplications.agreedToCenter,
        status: schema.mitraApplications.status,
        rejectionReason: schema.mitraApplications.rejectionReason,
        createdAt: schema.mitraApplications.createdAt,
        creditLimit: schema.mitraApplications.creditLimit,
        tempPassword: schema.mitraApplications.tempPassword,
        passwordHash: schema.mitraApplications.passwordHash,
      }).from(schema.mitraApplications), 
    []),
    safeQuery('saleCenters', () => getCachedSaleCenters(), []),
    safeQuery('distributionCenters', () => getCachedDistributionCenters(), []),
    safeQuery('cities', () => getCachedCities(), []),
    safeQuery('masterSweets', () => getCachedMasterSweets(), []),
    safeQuery(
      'auditLogs',
      () =>
        db
          .select()
          .from(schema.auditLogs)
          .orderBy(desc(schema.auditLogs.timestamp))
          .limit(100),
      []
    ),
    safeQuery('discounts', () => getCachedDiscounts(), []),
  ]);

  return {
    bookings,
    festivals,
    mitraApplications,
    saleCenters,
    distributionCenters,
    discounts,
    cities,
    masterSweets,
    auditLogs,
    allCities: cities,
    allSaleCenters: saleCenters,
  };
}

/**
 * Load minimal dashboard data for error scenarios.
 * Returns empty data structure to allow dashboard to render with error message.
 */
export function getEmptyDashboardData(): DashboardData {
  return {
    bookings: [],
    festivals: [],
  };
}
