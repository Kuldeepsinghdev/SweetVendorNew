import { pgTable, text, varchar, integer, real, boolean, jsonb, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
  // Primary login credential. Case-insensitive UNIQUE across non-null values,
  // enforced by the partial functional index `users_email_norm_uidx`
  // (see src/db/initDb.ts). Store normalized (trimmed + lowercased) via normEmail.
  email: text('email'),
  role: varchar('role', { length: 32 }).default('customer').notNull(),
  pinHash: text('pin_hash'),
  cityId: varchar('city_id', { length: 64 }),
  distributionCenterId: varchar('distribution_center_id', { length: 64 }),
  pincode: varchar('pincode', { length: 16 }),
  address: text('address'),
  mustResetPin: boolean('must_reset_pin').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
});

export const masterSweets = pgTable('master_sweets', {
  id: varchar('id', { length: 64 }).primaryKey(),
  nameHi: text('name_hi').notNull(),
  nameEn: text('name_en').notNull(),
  category: varchar('category', { length: 32 }).notNull(),
  hsnCode: varchar('hsn_code', { length: 32 }).notNull(),
  gstPercent: real('gst_percent').notNull(),
  descriptionHi: text('description_hi').notNull(),
  descriptionEn: text('description_en').notNull(),
  imageUrl: text('image_url').notNull(),
  images: jsonb('images').$type<string[]>(),
  basePrice: real('base_price'),
  discountPercent: real('discount_percent'),
  shelfLifeDays: integer('shelf_life_days'),
  packSizeInfo: text('pack_size_info'),
  variants: jsonb('variants').$type<{ label: string; weightInKg: number }[]>().notNull(),
  isPureVeg: boolean('is_pure_veg').default(true).notNull(),
  ingredientsHi: text('ingredients_hi'),
});

export const cities = pgTable('cities', {
  id: varchar('id', { length: 64 }).primaryKey(),
  nameHi: text('name_hi').notNull(),
  nameEn: text('name_en').notNull(),
  stateHi: text('state_hi').notNull(),
  stateEn: text('state_en').notNull(),
  districtHi: text('district_hi').notNull(),
  adminName: text('admin_name').notNull(),
  adminPhone: varchar('admin_phone', { length: 32 }).notNull(),
  adminUserId: varchar('admin_user_id', { length: 64 }),
  isActive: boolean('is_active').default(true).notNull(),
  sweets: jsonb('sweets').$type<{ sweetId: string; pricePerKg: number; isActive: boolean }[]>().notNull(),
});

export const saleCenters = pgTable('sale_centers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  cityId: varchar('city_id', { length: 64 }).notNull(),
  nameHi: text('name_hi').notNull(),
  nameEn: text('name_en').notNull(),
  type: varchar('type', { length: 32 }).notNull(),
  ownerName: text('owner_name').notNull(),
  ownerPhone: varchar('owner_phone', { length: 32 }).notNull(),
  ownerEmail: text('owner_email').notNull(),
  ownerUserId: varchar('owner_user_id', { length: 64 }),
  addressHi: text('address_hi').notNull(),
  addressEn: text('address_en').notNull(),
  pincode: varchar('pincode', { length: 16 }).notNull(),
  timing: text('timing').notNull(),
  mapUrl: text('map_url'),
  isActive: boolean('is_active').default(true).notNull(),
  gstin: varchar('gstin', { length: 32 }),
});

export const distributionCenters = pgTable('distribution_centers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  saleCenterId: varchar('sale_center_id', { length: 64 }).notNull(),
  cityId: varchar('city_id', { length: 64 }).notNull(),
  nameHi: text('name_hi').notNull(),
  nameEn: text('name_en').notNull(),
  addressHi: text('address_hi').notNull(),
  addressEn: text('address_en').notNull(),
  pincode: varchar('pincode', { length: 16 }).notNull(),
  timing: text('timing').notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
  contactPerson: text('contact_person'),
  isActive: boolean('is_active').default(true).notNull(),
});

// Per-sale-centre sweet availability and pricing. Replaces the city-level
// `cities.sweets` JSONB for the customer catalog. A sweet is offered by a sale
// centre only if a row exists here; its distribution centres inherit this menu.
export const saleCenterSweets = pgTable('sale_center_sweets', {
  saleCenterId: varchar('sale_center_id', { length: 64 }).notNull(),
  sweetId: varchar('sweet_id', { length: 64 }).notNull(),
  pricePerKg: real('price_per_kg').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.saleCenterId, t.sweetId] }),
}));

export const festivals = pgTable('festivals', {
  id: varchar('id', { length: 64 }).primaryKey(),
  nameHi: text('name_hi').notNull(),
  nameEn: text('name_en').notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  startDate: varchar('start_date', { length: 32 }).notNull(),
  cutoffDate: varchar('cutoff_date', { length: 32 }).notNull(),
  distributionStartDate: varchar('distribution_start_date', { length: 32 }).notNull(),
  distributionEndDate: varchar('distribution_end_date', { length: 32 }).notNull(),
  maxKgPerBooking: real('max_kg_per_booking').notNull(),
  defaultMitraCreditLimit: real('default_mitra_credit_limit').notNull(),
});

export const mitraApplications = pgTable('mitra_applications', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }),
  cityId: varchar('city_id', { length: 64 }).notNull(),
  centerId: varchar('center_id', { length: 64 }),
  cityNameHi: text('city_name_hi').notNull(),
  fullName: text('full_name').notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
  email: text('email').notNull(),
  pincode: varchar('pincode', { length: 16 }).notNull(),
  address: text('address').notNull(),
  agreedToCenter: boolean('agreed_to_center').notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  rejectionReason: text('rejection_reason'),
  createdAt: text('created_at').notNull(),
  tempPassword: text('temp_password'),
  creditLimit: real('credit_limit').notNull(),
});

export const bookings = pgTable('bookings', {
  id: varchar('id', { length: 64 }).primaryKey(),
  festivalId: varchar('festival_id', { length: 64 }).notNull(),
  festivalNameHi: text('festival_name_hi').notNull(),
  cityId: varchar('city_id', { length: 64 }).notNull(),
  cityNameHi: text('city_name_hi').notNull(),
  centerId: varchar('center_id', { length: 64 }).notNull(),
  saleCenterId: varchar('sale_center_id', { length: 64 }),
  centerNameHi: text('center_name_hi').notNull(),
  centerAddressHi: text('center_address_hi').notNull(),
  centerPhone: varchar('center_phone', { length: 32 }).notNull(),
  bookedByRole: varchar('booked_by_role', { length: 32 }).notNull(),
  mitraId: varchar('mitra_id', { length: 64 }),
  mitraName: text('mitra_name'),
  mitraUserId: varchar('mitra_user_id', { length: 64 }),
  pickupMode: varchar('pickup_mode', { length: 16 }),
  pickupMitraId: varchar('pickup_mitra_id', { length: 64 }),
  pickupMitraName: text('pickup_mitra_name'),
  pickupMitraUserId: varchar('pickup_mitra_user_id', { length: 64 }),
  customerUserId: varchar('customer_user_id', { length: 64 }),
  customer: jsonb('customer').$type<{ name: string; phone: string; email?: string; pincode?: string; address?: string }>().notNull(),
  items: jsonb('items').$type<any[]>().notNull(),
  totalKg: real('total_kg').notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 32 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  pickupDate: varchar('pickup_date', { length: 32 }).notNull(),
  deliveryOtp: varchar('delivery_otp', { length: 16 }).notNull(),
  createdAt: text('created_at').notNull(),
  deliveredAt: text('delivered_at'),
  invoiceId: varchar('invoice_id', { length: 64 }).references(() => invoices.id).unique(),
  subtotalAmount: real('subtotal_amount'),
  discountCode: varchar('discount_code', { length: 64 }),
  discountAmount: real('discount_amount'),
  zohoPaymentId: text('zoho_payment_id'),
  zohoPaymentSessionId: text('zoho_payment_session_id'),
  zohoOrderId: text('zoho_order_id'),
  zohoPaymentMode: text('zoho_payment_mode'),
});

export const discounts = pgTable('discounts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  titleHi: text('title_hi').notNull(),
  titleEn: text('title_en').notNull(),
  descriptionHi: text('description_hi'),
  cityId: varchar('city_id', { length: 64 }).notNull(),
  centerId: varchar('center_id', { length: 64 }).default('all'),
  discountType: varchar('discount_type', { length: 32 }).notNull(), // 'percentage' | 'flat'
  discountValue: real('discount_value').notNull(),
  minOrderAmount: real('min_order_amount').default(0).notNull(),
  maxDiscountAmount: real('max_discount_amount'),
  startDate: varchar('start_date', { length: 32 }),
  expiryDate: varchar('expiry_date', { length: 32 }),
  usageLimit: integer('usage_limit'),
  timesUsed: integer('times_used').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: text('created_at').notNull(),
});

export const invoices = pgTable('invoices', {
  id: varchar('id', { length: 64 }).primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 32 }).notNull().unique(),
  bookingId: varchar('booking_id', { length: 64 }).notNull(),

  // Customer info (denormalized for invoice immutability)
  customerName: text('customer_name').notNull(),
  customerPhone: varchar('customer_phone', { length: 32 }).notNull(),
  customerEmail: text('customer_email'),
  customerAddress: text('customer_address'),
  customerPincode: varchar('customer_pincode', { length: 16 }),

  // Mitra info (who created the booking)
  mitraName: text('mitra_name'),
  mitraUserId: varchar('mitra_user_id', { length: 64 }),

  // Order details
  festivalName: text('festival_name').notNull(),
  saleCenterName: text('sale_center_name').notNull(),
  pickupCenterName: text('pickup_center_name').notNull(),

  // Items (JSON array for flexibility)
  items: jsonb('items').$type<Array<{
    sweetId: string;
    sweetNameHi: string;
    sweetNameEn: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>>().notNull(),

  // Pricing
  subtotalAmount: real('subtotal_amount').notNull(),
  discountCode: varchar('discount_code', { length: 64 }),
  discountAmount: real('discount_amount').default(0).notNull(),
  totalAmount: real('total_amount').notNull(),

  // Tax info (if applicable)
  gstAmount: real('gst_amount').default(0).notNull(),

  // Payment & Dates
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 32 }).notNull(),

  // Invoice lifecycle
  invoiceDate: text('invoice_date').notNull(),
  dueDate: text('due_date'),
  status: varchar('status', { length: 32 }).default('active').notNull(),

  // Tracking
  createdAt: text('created_at').notNull(),
  cancelledAt: text('cancelled_at'),
  cancelledBy: varchar('cancelled_by', { length: 64 }),
});

export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  actor: text('actor').notNull(),
  actorUserId: varchar('actor_user_id', { length: 64 }),
  actionHi: text('action_hi').notNull(),
  timestamp: text('timestamp').notNull(),
});

// Self-serve password reset tokens. Each row is a single-use recovery token.
// We store only the SHA-256 hash of the raw token (never the token itself);
// the raw token travels only in the emailed reset link.
export const passwordResets = pgTable('password_resets', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at').notNull(),
});

export const notificationTemplates = pgTable('notification_templates', {
  id: varchar('id', { length: 64 }).primaryKey(),
  eventHi: text('event_hi').notNull(),
  smsEnabled: boolean('sms_enabled').notNull(),
  emailEnabled: boolean('email_enabled').notNull(),
  templateTextHi: text('template_text_hi').notNull(),
  dltApproved: boolean('dlt_approved').notNull(),
});

// OTP login flow — stores one-time passwords for Mitra authentication.
// Once verified (verified_at is set), the OTP becomes invalid. Other OTPs for the same user are invalidated.
export const loginOtps = pgTable('login_otps', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull(),
  emailAddress: text('email_address').notNull(),
  otpCode: varchar('otp_code', { length: 6 }).notNull(),
  method: varchar('method', { length: 32 }).default('email').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(5).notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  verifiedAt: text('verified_at'),
});
