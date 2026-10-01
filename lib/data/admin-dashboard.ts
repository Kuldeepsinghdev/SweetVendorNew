import 'server-only';
import { db, schema } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import type { AdminRole } from '@/lib/auth/session';

/**
 * Server-side data loading for the unified admin dashboard.
 *
 * This module implements role-based data filtering with graceful error handling.
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

/**
 * Load dashboard data with role-based filtering.
 * 
 * This function implements server-side data isolation by applying WHERE clauses
 * based on the user's role and assigned organization entities. Failed queries
 * return empty arrays to enable graceful degradation (Requirement 12.2).
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

  // Load user record to get assigned entities (sale center, city)
  const user = await safeQuery(
    'user',
    () => db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    }),
    null
  );

  if (!user) {
    console.error(`User not found: ${userId}`);
    // Return minimal data structure to allow dashboard to render with error message
    return {
      bookings: [],
      festivals: [],
    };
  }

  // Role-based data loading with server-side filtering
  switch (role) {
    case 'kendra':
      return loadKendraData(user, safeQuery);
    
    case 'city_admin':
      return loadCityAdminData(user, safeQuery);
    
    case 'super_admin':
      return loadSuperAdminData(user, safeQuery);
    
    default:
      // Should never happen due to TypeScript exhaustiveness check
      console.error(`Unknown role: ${role}`);
      return {
        bookings: [],
        festivals: [],
      };
  }
}

/**
 * Load data for kendra role users.
 * 
 * Kendra users only see data for their assigned sale center:
 * - Bookings filtered by saleCenterId
 * - Their assigned sale center details
 * - Active festivals (not filtered, needed for demand planning)
 *
 * Requirement 5.1: Kendra users only see data for their assigned sale center
 */
async function loadKendraData(
  user: DashboardUser,
  safeQuery: <T>(section: string, fn: () => Promise<T>, fallback: T) => Promise<T>
): Promise<DashboardData> {
  const saleCenterId = user.id; // Kendra user ID is the owner_user_id in sale_centers
  
  if (!saleCenterId) {
    console.error('Kendra user has no assigned sale center');
    return {
      bookings: [],
      festivals: [],
    };
  }

  // Load sale center to verify assignment
  const saleCenter = await safeQuery(
    'saleCenter',
    () => db.query.saleCenters.findFirst({
      where: eq(schema.saleCenters.ownerUserId, user.id),
    }),
    null
  );

  if (!saleCenter) {
    console.error(`Sale center not found for kendra user: ${user.id}`);
    return {
      bookings: [],
      festivals: [],
    };
  }

  // Parallel data loading with role-based filtering
  const [bookings, festivals] = await Promise.all([
    safeQuery(
      'bookings',
      () => db.query.bookings.findMany({
        where: eq(schema.bookings.saleCenterId, saleCenter.id),
      }),
      []
    ),
    safeQuery(
      'festivals',
      () => db.select().from(schema.festivals),
      []
    ),
  ]);

  return {
    bookings,
    saleCenter,
    festivals,
  };
}

/**
 * Load data for city_admin role users.
 * 
 * City admin users see data for all sale centers and DCs in their assigned city:
 * - Bookings filtered by cityId
 * - Sale centers in their city
 * - Distribution centers in their city
 * - Mitra applications for their city
 * - Discounts for their city
 * - Cities they manage (typically one, but supports multiple)
 * - Festivals (not filtered)
 *
 * Requirements 5.2, 5.5: City admin users only see data for their assigned city
 */
async function loadCityAdminData(
  user: DashboardUser,
  safeQuery: <T>(section: string, fn: () => Promise<T>, fallback: T) => Promise<T>
): Promise<DashboardData> {
  const cityId = user.cityId;
  
  if (!cityId) {
    console.error('City admin user has no assigned city');
    return {
      bookings: [],
      festivals: [],
    };
  }

  // Parallel data loading with city-based filtering
  const [
    bookings,
    festivals,
    mitraApplications,
    saleCenters,
    distributionCenters,
    discounts,
    cities,
  ] = await Promise.all([
    safeQuery(
      'bookings',
      () => db.query.bookings.findMany({
        where: eq(schema.bookings.cityId, cityId),
      }),
      []
    ),
    safeQuery(
      'festivals',
      () => db.select().from(schema.festivals),
      []
    ),
    safeQuery(
      'mitraApplications',
      () => db.query.mitraApplications.findMany({
        where: eq(schema.mitraApplications.cityId, cityId),
      }),
      []
    ),
    safeQuery(
      'saleCenters',
      () => db.query.saleCenters.findMany({
        where: eq(schema.saleCenters.cityId, cityId),
      }),
      []
    ),
    safeQuery(
      'distributionCenters',
      () => db.query.distributionCenters.findMany({
        where: eq(schema.distributionCenters.cityId, cityId),
      }),
      []
    ),
    safeQuery(
      'discounts',
      () => db.query.discounts.findMany({
        where: eq(schema.discounts.cityId, cityId),
      }),
      []
    ),
    safeQuery(
      'cities',
      () => db.query.cities.findMany({
        where: eq(schema.cities.id, cityId),
      }),
      []
    ),
  ]);

  return {
    bookings,
    festivals,
    mitraApplications,
    saleCenters,
    distributionCenters,
    discounts,
    cities,
  };
}

/**
 * Load data for super_admin role users.
 * 
 * Super admin users see nationwide data across all entities:
 * - All bookings (no filtering)
 * - All sale centers and distribution centers
 * - All mitra applications
 * - All cities
 * - Master catalog (master_sweets)
 * - Audit logs (last 100 entries)
 * - Festivals
 * - Discounts (all cities)
 *
 * Requirements 5.3, 5.6: Super admin users see all data nationwide
 */
async function loadSuperAdminData(
  user: DashboardUser,
  safeQuery: <T>(section: string, fn: () => Promise<T>, fallback: T) => Promise<T>
): Promise<DashboardData> {
  // Parallel data loading without filtering (nationwide access)
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
    safeQuery(
      'bookings',
      () => db.select().from(schema.bookings),
      []
    ),
    safeQuery(
      'festivals',
      () => db.select().from(schema.festivals),
      []
    ),
    safeQuery(
      'mitraApplications',
      () => db.select().from(schema.mitraApplications),
      []
    ),
    safeQuery(
      'saleCenters',
      () => db.select().from(schema.saleCenters),
      []
    ),
    safeQuery(
      'distributionCenters',
      () => db.select().from(schema.distributionCenters),
      []
    ),
    safeQuery(
      'cities',
      () => db.select().from(schema.cities),
      []
    ),
    safeQuery(
      'masterSweets',
      () => db.select().from(schema.masterSweets),
      []
    ),
    safeQuery(
      'auditLogs',
      () => db
        .select()
        .from(schema.auditLogs)
        .orderBy(desc(schema.auditLogs.timestamp))
        .limit(100),
      []
    ),
    safeQuery(
      'discounts',
      () => db.select().from(schema.discounts),
      []
    ),
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
    allCities: cities, // Super admin sees all cities
    allSaleCenters: saleCenters, // Super admin sees all sale centers
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
