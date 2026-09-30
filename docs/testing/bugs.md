# Sahakar Bharati — Bug Report

**Project:** Sahakar Bharati Sweet Pre-Booking & Sale-Center Platform  
**Version:** 1.0.0  
**Report Date:** September 2026  
**Reporter:** Kiro QA Agent

---

## BUG-001 — Webpack Runtime Error Blocks Mitra Registration Page

**Severity:** CRITICAL  
**Area:** Mitra Registration / Frontend  
**Status:** Open  
**Test Case:** TC-MITRA-001, TC-SECURITY-008

**Environment:** localhost:3001 (Next.js 15.5.26 dev)

**Precondition:** App running. Any user navigates to the Mitra apply page.

**Steps to Reproduce:**
1. Navigate to `http://localhost:3001/hi/mitra/apply`
2. Wait for page to load
3. Observe browser console

**Expected Result:** Mitra registration form renders with city dropdown, personal info fields, distribution center selector.

**Actual Result:** Page returns HTTP 200 but triggers:
```
TypeError: __webpack_modules__[moduleId] is not a function
digest: 3660310167
```
The page is blank or fails to hydrate. Confirmed via Next.js dev server logs.

**Root Cause (identified):**
`components/LanguageToggle.tsx` imports `switchLocaleInPath` from `@/src/lib/locale`:
```typescript
import { switchLocaleInPath } from '@/src/lib/locale';
```
`middleware.ts` imports `stripLocale` and `withLocale` from `./src/lib/locale`.

None of these three functions are exported from `src/lib/locale.ts`. The file exports only `DEFAULT_LOCALE`, `isLocale`, `type Locale`, and `type SupportedLocale`. The webpack module graph fails to resolve the missing exports at runtime.

**Business Impact:**
- **No new Mitra can register** — the registration page is completely inaccessible
- All TC-MITRA-001 through TC-MITRA-006 are BLOCKED
- This is the entry point for every new Sahakar Mitra — the entire user acquisition flow is broken

**Fix Required:**
Option A: Export the missing functions from `src/lib/locale.ts`:
```typescript
export function switchLocaleInPath(path: string, newLocale: string): string { ... }
export function stripLocale(path: string): { locale: string | null; rest: string } { ... }
export function withLocale(locale: string, rest: string): string { ... }
```
Option B: Remove `LanguageToggle` from the mitra apply page if locale switching is not needed there.

---

## BUG-002 — City Management is Read-Only in Super Admin Dashboard

**Severity:** HIGH  
**Area:** Super Admin — City/Organization Management  
**Status:** Open  
**Test Case:** TC-ADMIN-005  
**Tasks.md Reference:** ADMIN-001

**Environment:** Super Admin dashboard at `/hi/super-admin`

**Precondition:** Logged in as super_admin.

**Steps to Reproduce:**
1. Navigate to Super Admin dashboard
2. Click the Cities tab
3. Look for "Add City", "Edit", or "Activate/Deactivate" controls

**Expected Result:** Super Admin can add new cities, edit city details (name, admin name/phone, state), and toggle cities active/inactive.

**Actual Result:** The Cities tab renders a read-only grid of cities (name, state, admin, status). There are no action buttons. `SuperAdminClient.tsx` has no form or Server Action for city CRUD.

**Business Impact:**
- Adding a new Sahakar Bharati branch (city/organization) requires direct database access
- A non-technical admin cannot expand the network without developer support
- `upsertCityAction` and `toggleCityActiveAction` Server Actions do not exist

**Fix Required:**
- Add `upsertCityAction` and `toggleCityActiveAction` to `lib/actions/admin.ts`
- Add "+ New City" button and inline `CityForm` to the Cities tab in `SuperAdminClient.tsx`
- Add per-row edit and toggle controls

---

## BUG-003 — Booking Item Detail Not Shown in Mitra Portal

**Severity:** MEDIUM  
**Area:** Mitra Portal — Booking History  
**Status:** Open  
**Test Case:** TC-BOOKING-010  
**Tasks.md Reference:** SHOP-004

**Environment:** Mitra portal at `/hi/mitra/portal` → Bookings tab

**Precondition:** Logged in as mitra with at least one confirmed booking.

**Steps to Reproduce:**
1. Login as mitra
2. Navigate to `/hi/mitra/portal`
3. Click on the Bookings tab
4. Click on a booking row

**Expected Result:** Expandable detail panel shows:
- Items table: sweet name, variant, quantity, unit price, line total
- DC name and address
- OTP (highlighted)
- Festival name, pickup date

**Actual Result:** Booking row shows only aggregate data: booking ID, OTP, customer name, total kg, total amount, payment method, status badge. There is no expand/click interaction. The `items` JSONB is loaded in the server query but is never rendered in `MitraPortalClient.tsx`.

**Business Impact:**
- Mitras cannot verify the contents of their own bookings
- Disputes about what was ordered cannot be self-served
- Mitras must contact admin to confirm booking details

**Fix Required:**
- Add `selectedBookingId` state to `MitraPortalClient.tsx`
- On row click, toggle inline expansion showing items table with sweet name, variant, qty, unit price, line total
- Include DC name/address, festival name, pickup date

---

## BUG-004 — Super Admin Has No Bookings Management Tab

**Severity:** HIGH  
**Area:** Super Admin — Booking Management  
**Status:** Open  
**Test Case:** TC-ADMIN-006  
**Tasks.md Reference:** ADMIN-002

**Environment:** Super Admin dashboard at `/hi/super-admin`

**Precondition:** Logged in as super_admin. Bookings exist in database.

**Steps to Reproduce:**
1. Navigate to Super Admin dashboard
2. Look for a Bookings tab or booking management section

**Expected Result:**
- Bookings tab visible with all bookings across all organizations
- Filter by city, status
- Click booking to see item-level detail

**Actual Result:** No Bookings tab in `SuperAdminClient.tsx`. The page server component (`page.tsx`) does load all bookings from DB and passes them as a prop, but the client component never renders them. Data is loaded but invisible.

**Business Impact:**
- Super Admin cannot monitor national booking activity
- Cannot identify issues with specific orders without DB access
- Cannot generate reports on booking volumes

**Fix Required:**
- Add Bookings tab to `SuperAdminClient.tsx`
- Table: booking ID, city, DC, mitra name, customer name, total kg, total amount, payment method, status, date
- Row expansion for item-level detail (same pattern as SHOP-004)
- Filter by city and status

---

## BUG-005 — No Mitras Management Tab in Super Admin Dashboard

**Severity:** MEDIUM  
**Area:** Super Admin — Mitra Management  
**Status:** Open  
**Test Case:** TC-MITRA-010  
**Tasks.md Reference:** ADMIN-003

**Environment:** Super Admin dashboard at `/hi/super-admin`

**Precondition:** Logged in as super_admin.

**Steps to Reproduce:**
1. Navigate to Super Admin dashboard
2. Look for a Mitras tab or Mitra Applications section

**Expected Result:** Super Admin sees all Mitra applications with ability to filter by status and approve/reject.

**Actual Result:** No Mitras tab in Super Admin dashboard. Super Admin must navigate to `/hi/city-admin` to manage Mitra applications. The page does load `mitraApplications` data — it is passed as prop but not rendered.

**Note:** The role hierarchy (`super_admin` rank ≥ `city_admin`) means `approveMitraAction` and `rejectMitraAction` already work for super_admin at the server action level. Only the UI entry point is missing.

**Business Impact:**
- Super Admin must use the City Admin panel for a core administrative function
- Fragmented admin experience — no single panel shows complete system state

**Fix Required:**
- Add Mitras tab to `SuperAdminClient.tsx`
- Filter: All / Pending / Approved / Rejected
- Table: application ID, name, phone, city, DC, status, date
- Approve/Reject buttons for pending applications
- Expand row for: address, pincode, agreed_to_center

---

## BUG-006 — No Distribution Center Management UI in Any Admin Panel

**Severity:** HIGH  
**Area:** Admin — Distribution Center Management  
**Status:** Open  
**Test Case:** TC-ADMIN-009  
**Tasks.md Reference:** ADMIN-004

**Environment:** City Admin and Super Admin dashboards

**Precondition:** Logged in as city_admin or super_admin.

**Steps to Reproduce:**
1. Navigate to city-admin or super-admin dashboard
2. Look for Distribution Center management

**Expected Result:**
- City Admin: Ability to add, edit, toggle DCs under their sale centers
- Super Admin: Ability to view all DCs and manage them

**Actual Result:** No DC management UI in any admin panel. The `app/api/distribution-centers/` REST endpoints exist (GET, POST, PUT, DELETE) but are not wired to any admin form. Neither `upsertDistributionCenterAction` nor `toggleDistributionCenterAction` Server Actions exist.

**Business Impact:**
- All 9 current distribution centers were added directly to the database
- Adding a new pickup location (a common business operation) requires developer intervention
- The Mitra registration DC dropdown can only show existing DB entries — no new DCs can be added through the admin UI

**Fix Required:**
- Add `upsertDistributionCenterAction` and `toggleDistributionCenterAction` to `lib/actions/admin.ts`
- Add DC management tab/section to `CityAdminClient.tsx`
- Add DC view with add/edit capability to `SuperAdminClient.tsx`

---

## BUG-007 — No Duplicate Phone Check in Mitra Registration

**Severity:** MEDIUM  
**Area:** Mitra Registration — Validation  
**Status:** Open  
**Test Case:** TC-MITRA-007

**Environment:** `lib/actions/mitra.ts` — `submitMitraApplicationAction`

**Precondition:** A Mitra application already exists for a given phone number.

**Steps to Reproduce:**
1. Register as Mitra with phone `9876543210` → application created
2. Register again with the same phone `9876543210`

**Expected Result:** Error returned: "An application with this phone number already exists."

**Actual Result:** A second `mitra_applications` row is inserted with the same phone number. No uniqueness check is performed on the phone field in `submitMitraApplicationAction`. The `mitra_applications` table has no unique constraint on `phone`.

**Partial Mitigation:** On approval, `approveMitraAction` checks the `users` table for existing phone before inserting — so no duplicate user is created. But two pending application records exist, causing confusion.

**Business Impact:**
- Admin sees duplicate applications for the same person
- Confusion during Mitra approval process
- Potential for the same person to get approved twice from two different applications

**Fix Required:**
```typescript
// In submitMitraApplicationAction, before insert:
const existing = await db.select().from(schema.mitraApplications)
  .where(eq(schema.mitraApplications.phone, d.phone)).limit(1);
if (existing.length > 0) {
  return { error: 'इस मोबाइल नंबर से पहले से आवेदन किया जा चुका है।' };
}
```

---

## BUG-008 — Super Admin Cannot Manage Sale Centers or Pricing

**Severity:** HIGH  
**Area:** Super Admin — Sale Center & Pricing Management  
**Status:** Open  
**Test Case:** TC-ADMIN-010  
**Tasks.md Reference:** ADMIN-005

**Environment:** Super Admin dashboard at `/hi/super-admin`

**Precondition:** Logged in as super_admin.

**Steps to Reproduce:**
1. Navigate to Super Admin dashboard
2. Look for Sale Center creation or per-center pricing management

**Expected Result:** Super Admin can create sale centers for any city and set per-center sweet pricing.

**Actual Result:** Sale center creation and pricing management exist only in City Admin panel (`CityAdminClient.tsx`). Super Admin dashboard has no equivalent. Super Admin must use the City Admin panel for these operations.

**Note:** The Server Actions (`createSaleCenterAction`, `upsertSweetPricingAction`) work for `super_admin` due to role hierarchy. Only the UI is missing from the Super Admin panel.

**Business Impact:**
- Super Admin managing multiple cities has to switch between City Admin panel context
- No national overview of pricing across all sale centers
- Adding a new sale center for any city requires City Admin panel navigation

**Fix Required:**
- Expand Cities tab in `SuperAdminClient.tsx` to include sale center management per city
- Add per-sale-center pricing table (reuse existing Server Actions)
- Load `saleCenterSweets` in `super-admin/page.tsx`

---

## Bug Summary

| Bug ID | Severity | Area | Status |
|---|---|---|---|
| BUG-001 | CRITICAL | Mitra Registration / Locale | Open |
| BUG-002 | HIGH | Super Admin — City Management | Open |
| BUG-003 | MEDIUM | Mitra Portal — Booking Detail | Open |
| BUG-004 | HIGH | Super Admin — Booking Management | Open |
| BUG-005 | MEDIUM | Super Admin — Mitra Management UI | Open |
| BUG-006 | HIGH | DC Management UI | Open |
| BUG-007 | MEDIUM | Mitra Registration — Duplicate Phone | Open |
| BUG-008 | HIGH | Super Admin — Sale Center & Pricing | Open |

**Fix Order (recommended):**
1. BUG-001 — Critical blocker, fix immediately
2. BUG-006 — DC management required for onboarding new locations
3. BUG-002 — City management needed for expansion
4. BUG-004 / BUG-008 — Admin visibility and pricing management
5. BUG-005 — Convenience, already works via City Admin
6. BUG-003 — Mitra UX improvement
7. BUG-007 — Data quality
