/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'common' | 'mitra' | 'customer' | 'kendra' | 'city_admin' | 'super_admin' | 'profile';

export type Language = 'hi' | 'en';

export type BookingStatus = 'draft' | 'payment_pending' | 'confirmed' | 'frozen' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cash' | 'udhar';
export type PickupMode = 'self' | 'mitra';

export type PaymentStatus = 'pending' | 'paid' | 'udhar_outstanding';

export type KendraType = 'standalone' | 'mitra_kendra';

export interface WeightVariant {
  label: string; // '250g' | '500g' | '1kg' | '500g (आधा किलो)' | '1 kg (एक किलो)'
  weightInKg: number; // 0.25, 0.5, 1.0, etc.
  price?: number; // fixed price for this variant if non-linear (e.g. 360 for 500g)
}

export interface MasterSweet {
  id: string;
  nameHi: string;
  nameEn: string;
  category: 'dry' | 'bengali' | 'traditional' | 'gift' | 'mawa';
  hsnCode: string;
  gstPercent: number;
  descriptionHi: string;
  descriptionEn: string;
  imageUrl: string;
  images?: string[];
  basePrice?: number;
  discountPercent?: number;
  shelfLifeDays?: number;
  packSizeInfo?: string;
  variants: WeightVariant[];
  isPureVeg: boolean;
  ingredientsHi?: string;
  ingredientsEn?: string;
  packSizeInfoEn?: string;
}

/** @deprecated City-level sweet pricing. Superseded by SaleCenterSweet (pricing
 *  moved to the sale-centre level). Kept for backward compatibility only. */
export interface CitySweet {
  sweetId: string;
  pricePerKg: number; // e.g. 1150
  isActive: boolean;
}

/** Per-sale-centre sweet availability and price. A sweet is offered by a sale
 *  centre only when a row exists; its distribution centres inherit this menu. */
export interface SaleCenterSweet {
  saleCenterId: string; // FK -> sale_centers.id
  sweetId: string;      // FK -> master_sweets.id
  pricePerKg: number;
  isActive: boolean;
}

export interface City {
  id: string;
  nameHi: string;
  nameEn: string;
  stateHi: string;
  stateEn: string;
  districtHi: string;
  districtEn?: string;
  adminName: string;
  adminPhone: string;
  adminUserId?: string; // FK -> users.id
  isActive: boolean;
  /** @deprecated Pricing moved to sale_center_sweets. Retained for back-compat. */
  sweets: CitySweet[];
}

export interface SaleCenter {
  id: string;
  cityId: string;
  nameHi: string;
  nameEn: string;
  type: KendraType;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerUserId?: string; // FK -> users.id
  addressHi: string;
  addressEn: string;
  pincode: string;
  timing: string; // e.g. '10:00 AM - 8:00 PM'
  mapUrl?: string;
  isActive: boolean;
  gstin?: string;
}

export interface DistributionCenter {
  id: string;
  saleCenterId: string; // FK -> sale_centers.id (parent grouping layer)
  cityId: string; // FK -> cities.id (denormalized for filtering)
  nameHi: string;
  nameEn: string;
  addressHi: string;
  addressEn: string;
  pincode: string;
  timing: string; // e.g. '10:00 AM - 8:00 PM'
  phone: string;
  contactPerson?: string; // optional contact person name
  isActive: boolean;
}

export interface MitraApplication {
  id: string; // e.g. 'SM-JPR-1042'
  cityId: string;
  centerId?: string;
  cityNameHi: string;
  fullName: string;
  phone: string;
  email: string;
  pincode: string;
  address: string;
  agreedToCenter: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  createdAt: string;
  tempPassword?: string;
  creditLimit: number; // Max Udhar allowed, e.g., 25000
  creditUsed?: number; // Udhar consumed against the limit (0 when unset)
}

export interface Festival {
  id: string;
  nameHi: string;
  nameEn: string;
  status: 'active' | 'draft' | 'completed';
  startDate: string; // '2026-10-10'
  cutoffDate: string; // '2026-11-02' (T-5 days)
  distributionStartDate: string; // '2026-11-07'
  distributionEndDate: string; // '2026-11-09'
  maxKgPerBooking: number; // e.g. 10 kg
  defaultMitraCreditLimit: number; // e.g. 25000
}

export interface CartItem {
  sweetId: string;
  sweetNameHi: string;
  sweetNameEn: string;
  variantLabel: string;
  variantKg: number;
  pricePerKg: number;
  quantity: number; // Number of units (e.g. 2 packs of 1kg or 3 packs of 500g)
  unitPrice: number; // price for this variant
  totalAmount: number;
  imageUrl?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  pincode?: string;
  address?: string;
}

export interface Booking {
  id: string; // e.g. '#PB-4471'
  festivalId: string;
  festivalNameHi: string;
  festivalNameEn?: string;
  cityId: string;
  cityNameHi: string;
  cityNameEn?: string;
  centerId: string; // now references a distribution centre (pickup point)
  saleCenterId?: string; // parent sale centre of the pickup distribution centre (grouping/reporting)
  centerNameHi: string;
  centerNameEn?: string;
  centerAddressHi: string;
  centerAddressEn?: string;
  centerPhone: string;
  bookedByRole: 'customer' | 'mitra';
  mitraId?: string;
  mitraName?: string;
  mitraUserId?: string; // FK -> users.id
  pickupMode?: PickupMode;
  pickupMitraId?: string;
  pickupMitraName?: string;
  pickupMitraUserId?: string; // FK -> users.id
  customerUserId?: string; // FK -> users.id
  customer: CustomerInfo;
  items: CartItem[];
  totalKg: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  pickupDate: string; // '2026-11-08'
  deliveryOtp: string; // '4471'
  createdAt: string;
  deliveredAt?: string;
  invoiceId?: string; // e.g. 'INV-JPR-000871'
  subtotalAmount?: number; // original cart total before discount
  discountCode?: string; // e.g. 'SAHAKAR50'
  discountAmount?: number; // e.g. 50
  zohoPaymentId?: string; // e.g. 'zpay_txn_8941294819'
  zohoPaymentSessionId?: string; // e.g. 'zpay_sess_1740981928'
  zohoOrderId?: string; // e.g. 'ZORD-918239'
  zohoPaymentMode?: string; // 'upi' | 'card' | 'netbanking'
}

export interface DiscountCoupon {
  id: string; // e.g. 'COUP-JPR-101'
  code: string; // e.g. 'SAHAKAR50'
  titleHi: string; // e.g. 'सहकार विशेष छूट'
  titleEn: string; // e.g. 'Sahakar Special Discount'
  descriptionHi?: string; // e.g. '₹500 से अधिक के ऑर्डर पर ₹50 की विशेष छूट'
  descriptionEn?: string; // optional English description
  cityId: string; // 'all' or city ID e.g. 'jaipur'
  centerId?: string; // 'all' or specific sale center ID
  discountType: 'percentage' | 'flat'; // 'percentage' | 'flat'
  discountValue: number; // e.g. 10 (for 10%) or 50 (for ₹50)
  minOrderAmount: number; // e.g. 500
  maxDiscountAmount?: number; // e.g. 150 for percentage cap
  startDate?: string;
  expiryDate?: string;
  usageLimit?: number;
  timesUsed: number;
  isActive: boolean;
  createdAt: string;
}

export interface ZohoPaymentSessionRequest {
  amount: number;
  currency?: string;
  orderId?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  description?: string;
  metadata?: Record<string, any>;
}

export interface ZohoPaymentSessionResponse {
  success: boolean;
  payment_session_id: string;
  account_id: string;
  domain: string;
  amount: number;
  currency: string;
  order_id: string;
  mode: 'live' | 'test';
  message?: string;
}

export interface ZohoPaymentVerificationRequest {
  payment_session_id: string;
  payment_id: string;
  order_id: string;
  payment_mode: string;
  booking_data?: any;
}

export interface AuditLog {
  id: string;
  actor: string; // e.g. 'विनोद कुमार (शहर एडमिन)'
  actionHi: string;
  timestamp: string;
}

export interface UserSession {
  role: UserRole;
  name: string;
  phone: string;
  id?: string;
  userId?: string; // FK -> users.id (authoritative identity once migrated)
  email?: string | null; // editable profile contact
  address?: string | null; // editable profile address
  cityId?: string | null; // assigned city (city_admin, kendra, mitra scoping)
  centerId?: string | null; // assigned sale center (kendra scoping)
  detail?: string;
}

/** Dedicated users-table record — single source of truth for a person. */
export interface User {
  id: string; // e.g. usr_cust_9414011223
  name: string;
  phone: string; // normalized 10-digit
  email?: string | null;
  role: Exclude<UserRole, 'common' | 'profile'>;
  cityId?: string | null;
  distributionCenterId?: string | null;
  pincode?: string | null;
  address?: string | null;
  mustResetPin?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface NotificationTemplate {
  id: string;
  eventHi: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  templateTextHi: string;
  dltApproved: boolean;
}
