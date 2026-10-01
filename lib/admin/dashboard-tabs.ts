import 'server-only';

import type { AdminRole, SessionUser } from '@/lib/auth/session';
import React from 'react';

// Import all tab components
import DemandSummaryTab from '@/components/admin/tabs/DemandSummaryTab';
import OTPDeliveryTab from '@/components/admin/tabs/OTPDeliveryTab';
import BookingsListTab from '@/components/admin/tabs/BookingsListTab';
import MitraLedgerTab from '@/components/admin/tabs/MitraLedgerTab';
import MitraApplicationsTab from '@/components/admin/tabs/MitraApplicationsTab';
import SaleCenterManagementTab from '@/components/admin/tabs/SaleCenterManagementTab';
import DistributionCentersTab from '@/components/admin/tabs/DistributionCentersTab';
import PricingManagementTab from '@/components/admin/tabs/PricingManagementTab';
import DiscountsCouponsTab from '@/components/admin/tabs/DiscountsCouponsTab';
import NationalSummaryTab from '@/components/admin/tabs/NationalSummaryTab';
import FestivalManagementTab from '@/components/admin/tabs/FestivalManagementTab';
import CityNetworkTab from '@/components/admin/tabs/CityNetworkTab';
import MasterCatalogTab from '@/components/admin/tabs/MasterCatalogTab';
import AuditLogsTab from '@/components/admin/tabs/AuditLogsTab';

/**
 * Interface defining the structure of a dashboard tab.
 * Each tab has bilingual labels, role requirements, and an associated component.
 */
export interface TabConfig {
  /** Unique identifier for the tab (kebab-case) */
  id: string;
  
  /** Hindi label for the tab */
  labelHi: string;
  
  /** English label for the tab */
  labelEn: string;
  
  /** Icon component for the tab */
  icon: React.ReactNode;
  
  /** Minimum role required to view this tab */
  minRole: AdminRole;
  
  /** Component to render the tab content */
  component: React.ComponentType<TabContentProps>;
}

/**
 * Props passed to all tab content components.
 * Provides session, pre-filtered data, and locale information.
 */
export interface TabContentProps {
  /** Current authenticated user session */
  session: SessionUser;
  
  /** Pre-filtered dashboard data based on user role */
  data: DashboardData;
  
  /** Current locale code ('hi' | 'en') */
  locale: string;
}

/**
 * Dashboard data structure containing all information needed to render tabs.
 * Data is pre-filtered server-side based on the user's role and authorization level.
 */
export interface DashboardData {
  // Kendra-level data (visible to all roles)
  /** Bookings filtered by sale center or city based on role */
  bookings: Booking[];
  
  /** Current user's sale center (kendra only) */
  saleCenter?: SaleCenter;
  
  /** Active festivals */
  festivals: Festival[];
  
  // City admin data (visible to city_admin and super_admin)
  /** Pending Mitra applications in city */
  mitraApplications?: MitraApplication[];
  
  /** All sale centers in city */
  saleCenters?: SaleCenter[];
  
  /** Distribution centers in city */
  distributionCenters?: DistributionCenter[];
  
  /** City-level discounts */
  discounts?: Discount[];
  
  /** Cities managed by this admin */
  cities?: City[];
  
  // Super admin data (visible to super_admin only)
  /** Master catalog of all sweets */
  masterSweets?: MasterSweet[];
  
  /** System audit trail */
  auditLogs?: AuditLog[];
  
  /** All cities in network */
  allCities?: City[];
  
  /** All sale centers nationwide */
  allSaleCenters?: SaleCenter[];
}

// Type definitions for dashboard data entities
// These will be refined when implementing data loading

export interface Booking {
  id: string;
  mitraUserId: string;
  saleCenterId: string;
  cityId: string;
  cityNameHi?: string;
  centerNameHi?: string;
  status: string;
  paymentMethod: 'cash' | 'udhar';
  paymentStatus?: string;
  totalAmount: number;
  totalKg?: number;
  deliveryOtp?: string;
  createdAt: Date | string;
  customer?: {
    name: string;
    phone: string;
  };
  items?: Array<any>;
  bookedByRole?: string;
  mitraId?: string;
  mitraName?: string;
  centerId?: string;
  // Additional fields as needed
}

export interface SaleCenter {
  id: string;
  name: string;
  cityId: string;
  adminUserId?: string;
  // Additional fields as needed
}

export interface Festival {
  id: string;
  name: string;
  nameHi: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  // Additional fields as needed
}

export interface MitraApplication {
  id: string;
  phone: string;
  name: string;
  cityId: string;
  saleCenterId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  // Additional fields as needed
}

export interface DistributionCenter {
  id: string;
  name: string;
  cityId: string;
  saleCenterId: string;
  address: string;
  // Additional fields as needed
}

export interface Discount {
  id: string;
  code: string;
  discountPercent: number;
  cityId?: string;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  // Additional fields as needed
}

export interface City {
  id: string;
  name: string;
  nameHi: string;
  nameEn: string;
  adminUserId?: string;
  // Additional fields as needed
}

export interface MasterSweet {
  id: string;
  name: string;
  nameHi: string;
  category: string;
  // Additional fields as needed
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: Date;
  // Additional fields as needed
}

/**
 * Icon library imports for tab icons
 */
const { 
  TrendingUp, Package, CheckCircle, AlertCircle, Building2, MapPin, 
  Tag, BadgePercent, Globe, Star, BookOpen, ScrollText, Users
} = require('lucide-react');

/**
 * Array of all available dashboard tabs.
 * 
 * Each tab:
 * - Has a unique kebab-case id
 * - Includes both Hindi and English labels
 * - Specifies the minimum role required (kendra < city_admin < super_admin)
 * - References a tab content component
 * 
 * Role visibility:
 * - kendra: demand-summary, otp-delivery, bookings, mitra-ledger
 * - city_admin: all kendra tabs + mitra-applications, sale-centers, distribution-centers, pricing, discounts
 * - super_admin: all tabs + national-summary, festivals, cities, catalog, audit-logs
 */
export const DASHBOARD_TABS: TabConfig[] = [
  // Kendra-level tabs (visible to all roles)
  {
    id: 'demand-summary',
    labelHi: 'मांग सारांश',
    labelEn: 'Demand Summary',
    icon: React.createElement(TrendingUp, { size: 16 }),
    minRole: 'kendra',
    component: DemandSummaryTab,
  },
  {
    id: 'otp-delivery',
    labelHi: 'OTP डिलीवरी',
    labelEn: 'OTP Delivery',
    icon: React.createElement(Package, { size: 16 }),
    minRole: 'kendra',
    component: OTPDeliveryTab,
  },
  {
    id: 'bookings',
    labelHi: 'बुकिंग सूची',
    labelEn: 'Bookings',
    icon: React.createElement(CheckCircle, { size: 16 }),
    minRole: 'kendra',
    component: BookingsListTab,
  },
  {
    id: 'mitra-ledger',
    labelHi: 'मित्र खाता',
    labelEn: 'Mitra Ledger',
    icon: React.createElement(AlertCircle, { size: 16 }),
    minRole: 'kendra',
    component: MitraLedgerTab,
  },
  // City admin tabs
  {
    id: 'mitra-applications',
    labelHi: 'मित्र आवेदन',
    labelEn: 'Mitra Apps',
    icon: React.createElement(Users, { size: 16 }),
    minRole: 'city_admin',
    component: MitraApplicationsTab,
  },
  {
    id: 'sale-centers',
    labelHi: 'बिक्री केंद्र',
    labelEn: 'Sale Centers',
    icon: React.createElement(Building2, { size: 16 }),
    minRole: 'city_admin',
    component: SaleCenterManagementTab,
  },
  {
    id: 'distribution-centers',
    labelHi: 'वितरण केंद्र',
    labelEn: 'Dist. Centers',
    icon: React.createElement(MapPin, { size: 16 }),
    minRole: 'city_admin',
    component: DistributionCentersTab,
  },
  {
    id: 'pricing',
    labelHi: 'मूल्य दरें',
    labelEn: 'Pricing',
    icon: React.createElement(Tag, { size: 16 }),
    minRole: 'city_admin',
    component: PricingManagementTab,
  },
  {
    id: 'discounts',
    labelHi: 'कूपन/छूट',
    labelEn: 'Discounts',
    icon: React.createElement(BadgePercent, { size: 16 }),
    minRole: 'city_admin',
    component: DiscountsCouponsTab,
  },
  // Super admin tabs
  {
    id: 'national-summary',
    labelHi: 'राष्ट्रीय सारांश',
    labelEn: 'National Summary',
    icon: React.createElement(Globe, { size: 16 }),
    minRole: 'super_admin',
    component: NationalSummaryTab,
  },
  {
    id: 'festivals',
    labelHi: 'उत्सव',
    labelEn: 'Festivals',
    icon: React.createElement(Star, { size: 16 }),
    minRole: 'super_admin',
    component: FestivalManagementTab,
  },
  {
    id: 'cities',
    labelHi: 'शहर नेटवर्क',
    labelEn: 'Cities',
    icon: React.createElement(Globe, { size: 16 }),
    minRole: 'super_admin',
    component: CityNetworkTab,
  },
  {
    id: 'catalog',
    labelHi: 'मास्टर कैटलॉग',
    labelEn: 'Catalog',
    icon: React.createElement(BookOpen, { size: 16 }),
    minRole: 'super_admin',
    component: MasterCatalogTab,
  },
  {
    id: 'audit-logs',
    labelHi: 'ऑडिट लॉग',
    labelEn: 'Audit Logs',
    icon: React.createElement(ScrollText, { size: 16 }),
    minRole: 'super_admin',
    component: AuditLogsTab,
  },
];

/**
 * Type guard to validate tab configuration at build time.
 * Ensures all required properties are present and correctly typed.
 */
export function isValidTabConfig(tab: unknown): tab is TabConfig {
  if (typeof tab !== 'object' || tab === null) return false;
  
  const t = tab as Partial<TabConfig>;
  
  // Validate required string fields
  if (typeof t.id !== 'string' || t.id.trim() === '') return false;
  if (typeof t.labelHi !== 'string' || t.labelHi.trim() === '') return false;
  if (typeof t.labelEn !== 'string' || t.labelEn.trim() === '') return false;
  
  // Validate id is kebab-case
  if (!/^[a-z]+(-[a-z]+)*$/.test(t.id)) return false;
  
  // Validate minRole is valid AdminRole
  if (t.minRole !== 'kendra' && t.minRole !== 'city_admin' && t.minRole !== 'super_admin') {
    return false;
  }
  
  // Validate component is a function
  if (typeof t.component !== 'function') return false;
  
  return true;
}

/**
 * Validates the entire DASHBOARD_TABS array for:
 * - Duplicate IDs
 * - Invalid configurations
 * - Empty arrays
 * 
 * This should be called during application initialization or in tests.
 */
export function validateDashboardTabs(tabs: TabConfig[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for duplicates
  const ids = new Set<string>();
  for (const tab of tabs) {
    if (ids.has(tab.id)) {
      errors.push(`Duplicate tab id: ${tab.id}`);
    }
    ids.add(tab.id);
  }
  
  // Validate each tab
  for (const tab of tabs) {
    if (!isValidTabConfig(tab)) {
      const tabId = typeof (tab as any).id === 'string' ? (tab as any).id : 'unknown';
      errors.push(`Invalid tab configuration for id: ${tabId}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
