# Test Accounts for Development

This document describes the test operator accounts available for development and testing of the Sahakar Bharati platform.

## ⚠️ SECURITY WARNING

**NEVER use these credentials in production!**

These test accounts are for local development and testing only. All credentials use:
- Obvious test phone numbers (9000000XXX pattern)
- Test-only email domain (`.local`)
- Simple, documented PINs for easy testing
- bcrypt-hashed PINs (never plaintext in environment variables)

## Test Account Overview

| Role | Phone | Email | PIN | Purpose |
|------|-------|-------|-----|---------|
| **Super Admin** | 9000000001 | superadmin@test.sahakarbharati.local | 1111 | Full system access, manage cities, admins, and all operations |
| **City Admin** | 9000000002 | cityadmin@test.sahakarbharati.local | 2222 | Manage a specific city (Jaipur), approve Mitras, view city bookings |
| **Kendra Owner** | 9000000003 | kendra@test.sahakarbharati.local | 3333 | Manage a specific sale center (Malviya Nagar), view center operations |
| **Mitra** | 9000000004 | mitra@test.sahakarbharati.local | 4444 | Place orders on behalf of customers, view own bookings |
| **Customer** | 9000000005 | customer@test.sahakarbharati.local | 5555 | Browse catalog, place orders (after approval) |

## Role Capabilities

### Super Admin (`super_admin`)
- Highest privilege level
- Create and manage cities
- Assign city admins
- View all bookings across all cities
- Manage festivals and system-wide settings
- Access: `/admin/dashboard` after login at `/admin`
- Session: `sahakar_session` cookie (admin JWT)

### City Admin (`city_admin`)
- Manage a specific city (assigned `cityId`)
- Approve/reject Mitra applications for their city
- View bookings for their city
- Manage sale centers and distribution centers
- Access: `/admin/dashboard` (city-scoped views)
- Session: `sahakar_session` cookie (admin JWT)

### Kendra Owner (`kendra`)
- Manage a specific sale center (assigned `centerId`)
- View bookings for their center
- Manage center-specific operations
- Limited to their own sale center's data
- Access: `/admin/dashboard` (center-scoped views)
- Session: `sahakar_session` cookie (admin JWT)

### Mitra (`mitra`)
- Browse catalog and place orders on behalf of customers
- View own booking history
- Assigned to a distribution center
- Access: `/mitra/portal` after login at `/login`
- Session: `sahakar_customer` cookie (customer JWT)
- **Important**: Must be created through the Mitra application workflow and approved by a City Admin

### Customer (`customer`)
- Browse catalog (public access in some flows)
- Place orders (requires login)
- View own order history
- Access: `/` and `/checkout` after login at `/login`
- Session: `sahakar_customer` cookie (customer JWT)

## Authentication Architecture

The system uses **two separate JWT session systems**:

### Admin Session (`sahakar_session`)
- Used by: Super Admin, City Admin, Kendra Owner
- Login URL: `/admin`
- Cookie: `sahakar_session` (httpOnly, secure, 8-hour expiry)
- Protected by: `requireAuth()` / `requireRole()` in `lib/auth/rbac.ts`

### Customer Session (`sahakar_customer`)
- Used by: Mitra, Customer
- Login URL: `/login`
- Cookie: `sahakar_customer` (httpOnly, secure, 14-day expiry)
- Protected by: `requireCustomerRoleOrThrow()` in `lib/auth/customerAuth.ts`

**Critical**: These sessions are isolated by design. A Mitra session cannot grant admin access, and vice versa.

## Using Test Accounts

### 1. Admin Login (Super Admin, City Admin, Kendra)

```
URL: http://localhost:3000/admin
Phone: 9000000001  (or respective test phone)
PIN: 1111  (or respective test PIN)
```

### 2. Customer/Mitra Login

```
URL: http://localhost:3000/login
Phone: 9000000004  (for Mitra)
PIN: 4444
```

OR

```
Email: mitra@test.sahakarbharati.local
OTP: (sent to email if SMTP configured, or check server console)
```

## Setting Up Test Data

Before using test accounts, ensure the database has the corresponding test data:

### 1. Create Test City

```sql
INSERT INTO cities (id, name_hi, name_en, state_hi, state_en, district_hi, admin_name, admin_phone, admin_user_id, is_active, sweets)
VALUES (
  'test-city-jaipur',
  'जयपुर',
  'Jaipur',
  'राजस्थान',
  'Rajasthan',
  'जयपुर',
  'Test City Admin',
  '9000000002',
  NULL, -- Will be set after user creation
  true,
  '[]'::jsonb
);
```

### 2. Create Test Sale Center

```sql
INSERT INTO sale_centers (id, city_id, name_hi, name_en, type, owner_name, owner_phone, owner_email, address_hi, address_en, pincode, timing, is_active)
VALUES (
  'test-center-malviya-nagar',
  'test-city-jaipur',
  'मालवीय नगर केंद्र',
  'Malviya Nagar Center',
  'kendra',
  'Test Kendra Owner',
  '9000000003',
  'kendra@test.sahakarbharati.local',
  'मालवीय नगर, जयपुर',
  'Malviya Nagar, Jaipur',
  '302017',
  '9:00 AM - 6:00 PM',
  true
);
```

### 3. Create Test Distribution Center

```sql
INSERT INTO distribution_centers (id, sale_center_id, city_id, name_hi, name_en, address_hi, address_en, pincode, timing, phone, is_active)
VALUES (
  'test-dc-malviya-nagar-1',
  'test-center-malviya-nagar',
  'test-city-jaipur',
  'मालवीय नगर डीसी 1',
  'Malviya Nagar DC 1',
  'सेक्टर 4, मालवीय नगर',
  'Sector 4, Malviya Nagar',
  '302017',
  '9:00 AM - 6:00 PM',
  '9000000099',
  true
);
```

### 4. Create Test Users

Run the seed script or manually create user records. Users should reference the IDs above.

## Generating New PIN Hashes

If you need to create additional test accounts or change PINs:

```bash
# Using Node.js
node -e "console.log(require('bcryptjs').hashSync('YOUR_PIN', 12))"

# Example for PIN "1111"
node -e "console.log(require('bcryptjs').hashSync('1111', 12))"
```

Then add the hash to your `.env` file.

## Testing Workflows

### Test Mitra Application Flow
1. Visit `/mitra/apply` (unauthenticated)
2. Fill form with test data
3. Login as City Admin (9000000002, PIN: 2222)
4. Go to Mitras management
5. Approve the application
6. Mitra can now login at `/login`

### Test Booking Flow
1. Login as Mitra (9000000004, PIN: 4444)
2. Browse catalog at `/mitra/catalog`
3. Add items to cart
4. Proceed to checkout
5. Complete booking
6. View booking in portal

### Test Admin Workflows
1. Login as Super Admin (9000000001, PIN: 1111)
2. Create new city
3. Assign city admin
4. View system-wide reports

## Troubleshooting

### Cannot login with test accounts
- Ensure user records exist in the `users` table
- Verify PIN hash matches in both `.env` and database
- Check that `SESSION_SECRET` is set in `.env`
- Verify bcrypt library is installed: `npm install bcryptjs`

### Mitra cannot place orders
- Verify Mitra application is approved (`status = 'approved'`)
- Check user has `role = 'mitra'` in the database
- Ensure `centerId` and `distributionCenterId` are set
- Verify sale center and DC exist and are active

### Admin redirects to login immediately
- Check `sahakar_session` cookie exists in browser
- Verify JWT is not expired (8-hour limit)
- Ensure `SESSION_SECRET` matches between sessions
- Check browser console for auth errors

## Environment Variables Reference

All test account credentials are stored in `.env` (gitignored):

```bash
# Super Admin
TEST_SUPER_ADMIN_PHONE="9000000001"
TEST_SUPER_ADMIN_EMAIL="superadmin@test.sahakarbharati.local"
TEST_SUPER_ADMIN_NAME="Test Super Admin"
TEST_SUPER_ADMIN_PIN_HASH="$2b$12$..."

# City Admin
TEST_CITY_ADMIN_PHONE="9000000002"
# ... etc
```

See `.env.example` for the complete structure.

## Production Deployment

**Before deploying to production:**

1. ❌ **Remove or disable** all `TEST_*` environment variables
2. ❌ **Never** commit `.env` to version control
3. ✅ Use proper secrets management (Vercel Env Vars, AWS Secrets Manager, etc.)
4. ✅ Generate strong, unique PINs for real admin accounts
5. ✅ Use real phone numbers and email addresses
6. ✅ Rotate `SESSION_SECRET` to a production-grade secret
7. ✅ Implement proper rate limiting on auth endpoints
8. ✅ Enable audit logging for all admin actions

---

**Last Updated**: January 2025  
**Version**: 1.0.0
