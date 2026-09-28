/**
 * Action permissions matrix for role-based access control.
 * 
 * This module defines which actions each role can perform.
 * Roles are hierarchical: super_admin > city_admin > kendra > mitra > customer
 */

import { UserRole } from '../types';

export type Action =
  // Booking actions
  | 'booking:create'
  | 'booking:view_own'
  | 'booking:view_all'
  | 'booking:cancel_own'
  | 'booking:cancel_all'
  | 'booking:deliver'
  | 'booking:print_receipt'
  | 'booking:print_invoice'
  
  // Sweet management
  | 'sweet:view'
  | 'sweet:create'
  | 'sweet:update'
  | 'sweet:delete'
  
  // City management
  | 'city:view'
  | 'city:create'
  | 'city:update'
  | 'city:delete'
  | 'city:manage_pricing'
  
  // Sale center management
  | 'center:view'
  | 'center:create'
  | 'center:update'
  | 'center:manage_qr'
  
  // Mitra management
  | 'mitra:view'
  | 'mitra:create'
  | 'mitra:approve'
  | 'mitra:reject'
  | 'mitra:set_credit_limit'
  | 'mitra:settle_dues'
  
  // Discount management
  | 'discount:view'
  | 'discount:create'
  | 'discount:update'
  | 'discount:delete'
  
  // Festival management
  | 'festival:view'
  | 'festival:create'
  | 'festival:update'
  | 'festival:toggle_status'
  
  // User management
  | 'user:view'
  | 'user:update'
  | 'user:deactivate'
  
  // Reports & Analytics
  | 'reports:view_city'
  | 'reports:view_all'
  | 'reports:export'
  
  // Settings
  | 'settings:toggle_booking'
  | 'settings:manage_all';

/**
 * Permission matrix: defines which roles can perform which actions.
 * true = allowed, false = denied
 */
const PERMISSION_MATRIX: Record<UserRole, Record<Action, boolean>> = {
  super_admin: {
    // Bookings
    'booking:create': true,
    'booking:view_own': true,
    'booking:view_all': true,
    'booking:cancel_own': true,
    'booking:cancel_all': true,
    'booking:deliver': true,
    'booking:print_receipt': true,
    'booking:print_invoice': true,
    
    // Sweets
    'sweet:view': true,
    'sweet:create': true,
    'sweet:update': true,
    'sweet:delete': true,
    
    // Cities
    'city:view': true,
    'city:create': true,
    'city:update': true,
    'city:delete': true,
    'city:manage_pricing': true,
    
    // Centers
    'center:view': true,
    'center:create': true,
    'center:update': true,
    'center:manage_qr': true,
    
    // Mitra
    'mitra:view': true,
    'mitra:create': false, // Mitras apply, not created directly
    'mitra:approve': true,
    'mitra:reject': true,
    'mitra:set_credit_limit': true,
    'mitra:settle_dues': true,
    
    // Discounts
    'discount:view': true,
    'discount:create': true,
    'discount:update': true,
    'discount:delete': true,
    
    // Festival
    'festival:view': true,
    'festival:create': true,
    'festival:update': true,
    'festival:toggle_status': true,
    
    // Users
    'user:view': true,
    'user:update': true,
    'user:deactivate': true,
    
    // Reports
    'reports:view_city': true,
    'reports:view_all': true,
    'reports:export': true,
    
    // Settings
    'settings:toggle_booking': true,
    'settings:manage_all': true,
  },
  
  city_admin: {
    // Bookings
    'booking:create': true,
    'booking:view_own': true,
    'booking:view_all': true,
    'booking:cancel_own': true,
    'booking:cancel_all': true,
    'booking:deliver': true,
    'booking:print_receipt': true,
    'booking:print_invoice': true,
    
    // Sweets
    'sweet:view': true,
    'sweet:create': false,
    'sweet:update': false,
    'sweet:delete': false,
    
    // Cities
    'city:view': true,
    'city:create': false,
    'city:update': false,
    'city:delete': false,
    'city:manage_pricing': true,
    
    // Centers
    'center:view': true,
    'center:create': true,
    'center:update': true,
    'center:manage_qr': true,
    
    // Mitra
    'mitra:view': true,
    'mitra:create': false,
    'mitra:approve': true,
    'mitra:reject': true,
    'mitra:set_credit_limit': true,
    'mitra:settle_dues': true,
    
    // Discounts
    'discount:view': true,
    'discount:create': true,
    'discount:update': true,
    'discount:delete': true,
    
    // Festival
    'festival:view': true,
    'festival:create': false,
    'festival:update': false,
    'festival:toggle_status': true,
    
    // Users
    'user:view': true,
    'user:update': false,
    'user:deactivate': false,
    
    // Reports
    'reports:view_city': true,
    'reports:view_all': false,
    'reports:export': true,
    
    // Settings
    'settings:toggle_booking': true,
    'settings:manage_all': false,
  },
  
  kendra: {
    // Bookings
    'booking:create': true,
    'booking:view_own': true,
    'booking:view_all': true,
    'booking:cancel_own': true,
    'booking:cancel_all': false,
    'booking:deliver': true,
    'booking:print_receipt': true,
    'booking:print_invoice': true,
    
    // Sweets
    'sweet:view': true,
    'sweet:create': false,
    'sweet:update': false,
    'sweet:delete': false,
    
    // Cities
    'city:view': true,
    'city:create': false,
    'city:update': false,
    'city:delete': false,
    'city:manage_pricing': false,
    
    // Centers
    'center:view': true,
    'center:create': false,
    'center:update': false,
    'center:manage_qr': true,
    
    // Mitra
    'mitra:view': true,
    'mitra:create': false,
    'mitra:approve': false,
    'mitra:reject': false,
    'mitra:set_credit_limit': false,
    'mitra:settle_dues': false,
    
    // Discounts
    'discount:view': true,
    'discount:create': false,
    'discount:update': false,
    'discount:delete': false,
    
    // Festival
    'festival:view': true,
    'festival:create': false,
    'festival:update': false,
    'festival:toggle_status': false,
    
    // Users
    'user:view': false,
    'user:update': false,
    'user:deactivate': false,
    
    // Reports
    'reports:view_city': false,
    'reports:view_all': false,
    'reports:export': false,
    
    // Settings
    'settings:toggle_booking': false,
    'settings:manage_all': false,
  },
  
  mitra: {
    // Bookings
    'booking:create': true,
    'booking:view_own': true,
    'booking:view_all': false,
    'booking:cancel_own': true,
    'booking:cancel_all': false,
    'booking:deliver': false,
    'booking:print_receipt': false,
    'booking:print_invoice': false,
    
    // Sweets
    'sweet:view': true,
    'sweet:create': false,
    'sweet:update': false,
    'sweet:delete': false,
    
    // Cities
    'city:view': true,
    'city:create': false,
    'city:update': false,
    'city:delete': false,
    'city:manage_pricing': false,
    
    // Centers
    'center:view': true,
    'center:create': false,
    'center:update': false,
    'center:manage_qr': false,
    
    // Mitra
    'mitra:view': false,
    'mitra:create': false,
    'mitra:approve': false,
    'mitra:reject': false,
    'mitra:set_credit_limit': false,
    'mitra:settle_dues': false,
    
    // Discounts
    'discount:view': true,
    'discount:create': false,
    'discount:update': false,
    'discount:delete': false,
    
    // Festival
    'festival:view': true,
    'festival:create': false,
    'festival:update': false,
    'festival:toggle_status': false,
    
    // Users
    'user:view': false,
    'user:update': false,
    'user:deactivate': false,
    
    // Reports
    'reports:view_city': false,
    'reports:view_all': false,
    'reports:export': false,
    
    // Settings
    'settings:toggle_booking': false,
    'settings:manage_all': false,
  },
  
  customer: {
    // Bookings
    'booking:create': true,
    'booking:view_own': true,
    'booking:view_all': false,
    'booking:cancel_own': true,
    'booking:cancel_all': false,
    'booking:deliver': false,
    'booking:print_receipt': false,
    'booking:print_invoice': false,
    
    // Sweets
    'sweet:view': true,
    'sweet:create': false,
    'sweet:update': false,
    'sweet:delete': false,
    
    // Cities
    'city:view': true,
    'city:create': false,
    'city:update': false,
    'city:delete': false,
    'city:manage_pricing': false,
    
    // Centers
    'center:view': true,
    'center:create': false,
    'center:update': false,
    'center:manage_qr': false,
    
    // Mitra
    'mitra:view': false,
    'mitra:create': false,
    'mitra:approve': false,
    'mitra:reject': false,
    'mitra:set_credit_limit': false,
    'mitra:settle_dues': false,
    
    // Discounts
    'discount:view': true,
    'discount:create': false,
    'discount:update': false,
    'discount:delete': false,
    
    // Festival
    'festival:view': true,
    'festival:create': false,
    'festival:update': false,
    'festival:toggle_status': false,
    
    // Users
    'user:view': false,
    'user:update': false,
    'user:deactivate': false,
    
    // Reports
    'reports:view_city': false,
    'reports:view_all': false,
    'reports:export': false,
    
    // Settings
    'settings:toggle_booking': false,
    'settings:manage_all': false,
  },
  
  // These are not real user roles but UI states
  common: {
    'booking:create': false,
    'booking:view_own': false,
    'booking:view_all': false,
    'booking:cancel_own': false,
    'booking:cancel_all': false,
    'booking:deliver': false,
    'booking:print_receipt': false,
    'booking:print_invoice': false,
    'sweet:view': true,
    'sweet:create': false,
    'sweet:update': false,
    'sweet:delete': false,
    'city:view': true,
    'city:create': false,
    'city:update': false,
    'city:delete': false,
    'city:manage_pricing': false,
    'center:view': true,
    'center:create': false,
    'center:update': false,
    'center:manage_qr': false,
    'mitra:view': false,
    'mitra:create': false,
    'mitra:approve': false,
    'mitra:reject': false,
    'mitra:set_credit_limit': false,
    'mitra:settle_dues': false,
    'discount:view': true,
    'discount:create': false,
    'discount:update': false,
    'discount:delete': false,
    'festival:view': true,
    'festival:create': false,
    'festival:update': false,
    'festival:toggle_status': false,
    'user:view': false,
    'user:update': false,
    'user:deactivate': false,
    'reports:view_city': false,
    'reports:view_all': false,
    'reports:export': false,
    'settings:toggle_booking': false,
    'settings:manage_all': false,
  },
  
  profile: {
    'booking:create': false,
    'booking:view_own': false,
    'booking:view_all': false,
    'booking:cancel_own': false,
    'booking:cancel_all': false,
    'booking:deliver': false,
    'booking:print_receipt': false,
    'booking:print_invoice': false,
    'sweet:view': true,
    'sweet:create': false,
    'sweet:update': false,
    'sweet:delete': false,
    'city:view': true,
    'city:create': false,
    'city:update': false,
    'city:delete': false,
    'city:manage_pricing': false,
    'center:view': true,
    'center:create': false,
    'center:update': false,
    'center:manage_qr': false,
    'mitra:view': false,
    'mitra:create': false,
    'mitra:approve': false,
    'mitra:reject': false,
    'mitra:set_credit_limit': false,
    'mitra:settle_dues': false,
    'discount:view': true,
    'discount:create': false,
    'discount:update': false,
    'discount:delete': false,
    'festival:view': true,
    'festival:create': false,
    'festival:update': false,
    'festival:toggle_status': false,
    'user:view': false,
    'user:update': false,
    'user:deactivate': false,
    'reports:view_city': false,
    'reports:view_all': false,
    'reports:export': false,
    'settings:toggle_booking': false,
    'settings:manage_all': false,
  },
};

/**
 * Check if a role has permission to perform an action.
 */
export function hasPermission(role: UserRole, action: Action): boolean {
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) return false;
  return rolePermissions[action] ?? false;
}

/**
 * Get all actions a role can perform.
 */
export function getAllowedActions(role: UserRole): Action[] {
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) return [];
  return Object.entries(rolePermissions)
    .filter(([_, allowed]) => allowed)
    .map(([action]) => action as Action);
}

/**
 * Get all roles that can perform an action.
 */
export function getRolesForAction(action: Action): UserRole[] {
  const roles: UserRole[] = [];
  for (const [role, permissions] of Object.entries(PERMISSION_MATRIX)) {
    if (permissions[action]) {
      roles.push(role as UserRole);
    }
  }
  return roles;
}

/**
 * Role display names in Hindi and English.
 */
export const ROLE_DISPLAY: Record<UserRole, { hi: string; en: string }> = {
  super_admin: { hi: 'राष्ट्रीय सुपर एडमिन', en: 'Super Admin' },
  city_admin: { hi: 'नगर एडमिन', en: 'City Admin' },
  kendra: { hi: 'बिक्री केंद्र प्रबंधक', en: 'Sale Center Manager' },
  mitra: { hi: 'सहकार मित्र', en: 'Sahakar Mitra' },
  customer: { hi: 'ग्राहक', en: 'Customer' },
  common: { hi: 'सामान्य', en: 'Guest' },
  profile: { hi: 'प्रोफ़ाइल', en: 'Profile' },
};
