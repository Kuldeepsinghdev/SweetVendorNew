# Sahakar Bharati — QA Audit Report

**Project:** Sahakar Bharati Sweet Pre-Booking & Sale-Center Platform  
**Version:** 1.0.0  
**Audit Date:** September 2026  
**Auditor:** Kiro QA Agent  
**Audit Type:** Full scope — code analysis + DB inspection + live HTTP verification

---

## 1. Executive Summary

The Sahakar Bharati platform is a well-architected Next.js 15 application with strong security fundamentals. The authentication system, server-authoritative pricing, booking creation, and core authorization flows are correctly implemented and would pass production security requirements.

However, the application has **one critical runtime bug** that blocks the primary user onboarding flow (Mitra registration) and **five HIGH-severity missing features** that prevent administrators from managing the system without direct database access. Several key admin dashboards are partially built — data is loaded server-side but not exposed in the UI.

**Overall Health:** The security and data integrity layer is solid. The management UI is incomplete. The Mitra registration flow has a critical blocker that must be fixed before any new Mitras can be onboarded.

---

## 2. Test Environment

| Item | Value |
|---|---|
| Application URL | `http://localhost:3001` |
| Framework | Next.js 15.5.26 (App Router) |
| Database | Supabase PostgreSQL (ap-south-1) |
| Test Date | September 2026 |
| Test Method | Code review, Supabase DB inspection, live HTTP verification (curl) |
| Admin Credentials | Super Admin: phone `7737691749` |
| Test Data | 2 cities, 4 sale centers, 9 DCs, 11 sweets, 8 users, 1 active festival |
| Secrets Exposed | None — credentials referenced by role only |

---

## 3. Tests Executed

| Metric | Count |
|---|---|
| Total Test Cases | 65 |
| ✅ PASS | 42 |
| ❌ FAIL | 8 |
| 🔶 PARTIAL | 3 |
| ⛔ BLOCKED | 8 |
| 🔲 NOT TESTED | 4 |

**Pass Rate (of testable cases):** 80% (42 / 53 tested)

---

## 4. Feature Compliance

| Feature | Status | Notes |
|---|---|---|
| Mitra Registration | NON_COMPLIANT | Webpack runtime error blocks the page — BUG-001 |
| Mitra Approval (City Admin) | COMPLIANT | Fully working — approve, reject, DC assignment |
| Mitra Approval (Super Admin) | PARTIALLY_COMPLIANT | Works via role hierarchy but no Mitras tab in Super Admin UI |
| Mitra Login | COMPLIANT | Phone+PIN and email+password both work |
| Unapproved Mitra Blocked | COMPLIANT | `role !== 'mitra'` check on checkout page and booking action |
| Sweet Listing (Public) | COMPLIANT | Catalog visible to all visitors without login |
| Prices from DB | COMPLIANT | No hardcoded prices; all from `sale_center_sweets` |
| Cart (Mitra-only) | COMPLIANT | `isMitra` prop gates all cart controls; non-mitra sees login CTA |
| Cart Controls | COMPLIANT | Add, increase, decrease, remove all work |
| Checkout (Mitra gate) | COMPLIANT | `session.role !== 'mitra'` enforced server-side |
| Booking (server-priced) | COMPLIANT | `priceCart()` re-fetches from DB; client amounts never trusted |
| No Online Payment | COMPLIANT | `z.enum(['cash','udhar'])` in schema; no payment gateway |
| Booking History (Mitra) | COMPLIANT | Scoped query to `mitra_user_id = session.sub` |
| Booking Item Detail (Mitra) | MISSING | Items JSONB stored but not rendered in portal |
| Historical Price Preservation | COMPLIANT | JSONB snapshot at booking time; price changes don't retroact |
| Data Isolation (Mitra) | COMPLIANT | Server-scoped queries prevent cross-mitra data access |
| Super Admin Login | COMPLIANT | Role hierarchy enforced |
| Super Admin — Festival Mgmt | COMPLIANT | Full CRUD working |
| Super Admin — Sweet Mgmt | COMPLIANT | Full CRUD working |
| Super Admin — City Mgmt | NON_COMPLIANT | Read-only; no add/edit/toggle UI — ADMIN-001 |
| Super Admin — Mitra Mgmt | NON_COMPLIANT | No Mitras tab in Super Admin panel — ADMIN-003 |
| Super Admin — Booking View | NON_COMPLIANT | Data loaded but no Bookings UI tab — ADMIN-002 |
| Super Admin — Sale Center Mgmt | NON_COMPLIANT | Only in City Admin panel; Super Admin has no equivalent — ADMIN-005 |
| City Admin — Mitra Mgmt | COMPLIANT | Approve/reject/reason all working |
| City Admin — Sale Centers | COMPLIANT | Full CRUD working |
| City Admin — Pricing | COMPLIANT | WHERE clause bug (SECURITY-001) is fixed |
| City Admin — Discounts | COMPLIANT | Full CRUD with city/center scoping |
| Distribution Center Mgmt | NON_COMPLIANT | No UI in any admin panel — ADMIN-004 |
| Kendra Dashboard | COMPLIANT | Demand summary, OTP delivery, mitra ledger all working |
| Authorization (all routes) | COMPLIANT | All protected routes verified with 307 redirects |
| Session Security | COMPLIANT | httpOnly, secure, sameSite cookies; dual JWT system isolated |
| Security Headers | COMPLIANT | CSP, X-Frame-Options, etc. set by middleware |
| Price Manipulation Prevention | COMPLIANT | Server-only pricing architecture |
| DC Validation at Booking | COMPLIANT | Mismatch between sale center and DC rejected |

---

## 5. Critical Findings

### CRITICAL-001 — Mitra Registration Page Crashes (Webpack Runtime Error)

**Severity:** CRITICAL  
**Impact:** All new Mitra onboarding is completely blocked.

`/hi/mitra/apply` returns HTTP 200 but triggers a JavaScript runtime error: `TypeError: __webpack_modules__[moduleId] is not a function`. The page never renders for any user.

Root cause: `LanguageToggle.tsx` imports `switchLocaleInPath` from `@/src/lib/locale`. The middleware imports `stripLocale` and `withLocale` from the same module. None of these functions are exported from `src/lib/locale.ts` (which only exports `DEFAULT_LOCALE`, `isLocale`, and `Locale` type). The webpack module resolution fails at runtime.

The same root cause potentially affects other pages that use `LanguageToggle` — though currently only `mitra/apply` is confirmed broken.

**Fix Required:** Export `switchLocaleInPath`, `stripLocale`, and `withLocale` from `src/lib/locale.ts`, or remove the imports and inline the logic.

**Bug Reference:** BUG-001

---

## 6. High Priority Findings

### HIGH-001 — City Management is Read-Only in Super Admin

Super Admin cannot add new cities (organizations), edit city details, or toggle cities active/inactive through the UI. The Cities tab in `SuperAdminClient.tsx` is a read-only display grid. Any city changes require direct database access.

**Impact:** Adding new Sahakar Bharati branches requires direct DB manipulation.  
**Bug Reference:** BUG-002

---

### HIGH-002 — No Distribution Center Management UI

Neither Super Admin nor City Admin has a UI for creating, editing, or managing distribution centers. The `api/distribution-centers/` REST route exists but is not wired to any admin form. All 9 current DCs were added directly to the database.

**Impact:** Adding new pickup locations requires direct DB access. The business cannot add new collection points without developer intervention.  
**Bug Reference:** BUG-006

---

### HIGH-003 — Super Admin Has No Bookings Management Tab

The Super Admin page loads all bookings from the DB and passes them to `SuperAdminClient`, but the client component has no Bookings tab. There is no national booking view, no per-city booking filter, and no booking item-level detail in the Super Admin panel.

**Impact:** Super Admin cannot monitor national booking activity without direct DB access.  
**Bug Reference:** BUG-004

---

### HIGH-004 — Super Admin Cannot Manage Sale Centers or Pricing

Sale center creation and per-center sweet pricing management are only available in the City Admin panel. The Super Admin panel has no equivalent. For the current three-organization setup where one person manages all organizations, this means the Super Admin must use the City Admin panel for all pricing operations.

**Impact:** Fragmented admin experience; Super Admin has to use City Admin panel for pricing.  
**Bug Reference:** BUG-008

---

### HIGH-005 — No Mitras Tab in Super Admin Dashboard

Mitra application management (approve/reject) is only in the City Admin panel. The Super Admin dashboard has no Mitras tab. The role hierarchy does allow Super Admin to perform these actions server-side, but there is no UI entry point.

**Impact:** Super Admin must navigate to City Admin panel to manage Mitras.  
**Bug Reference:** BUG-005

---

## 7. Medium Priority Findings

### MEDIUM-001 — Booking Item Detail Not Visible to Mitra

Mitra portal booking history shows aggregate data (total amount, total kg) but not the item-level breakdown (which sweets, which variants, what quantities, what unit prices). The `items` JSONB is stored correctly in the DB but is never rendered.

**Impact:** Mitras cannot verify what they ordered. Disputes about booking contents cannot be resolved without admin DB access.  
**Bug Reference:** BUG-003

---

### MEDIUM-002 — No Booking Item Detail in Super Admin Either

Same gap as MEDIUM-001 — the Super Admin also has no booking item-level drilldown. The aggregate booking totals are loaded but individual items are not displayed.  
**Bug Reference:** BUG-004

---

### MEDIUM-003 — No Duplicate Phone Registration Check

`submitMitraApplicationAction` inserts a new `mitra_applications` row without checking whether an application with the same phone number already exists. This allows the same person to submit multiple applications.

The approval flow is idempotent (checks `users` table by phone before inserting), so no duplicate user is created on approval — but duplicate application records exist in the DB, causing confusion in the Mitras management tab.  
**Bug Reference:** BUG-007

---

### MEDIUM-004 — Existing Mitra User Missing `distribution_center_id`

The one existing mitra user in the DB (`usr_mitra_9875186011`, Dinesh Sharma) has `distribution_center_id = null`. This means the Mitra portal DC display feature, while correctly implemented in code, shows no DC for this user. This was either seeded without a DC or created before the DC assignment feature was implemented.

---

## 8. Low Priority Findings

### LOW-001 — Cart Not Cleared on Sale Center Switch

If a Mitra adds items from Sale Center A then switches to Sale Center B, the cart retains the old `saleCenterId`. The checkout will correctly filter pickup DCs to the original sale center's centers, which could confuse the user. No warning is shown.

---

### LOW-002 — LanguageToggle Import Chain Affects Multiple Pages

The `LanguageToggle.tsx` component imports a non-existent function. While only `mitra/apply` is confirmed broken, any other page that imports `LanguageToggle` may also be affected. A full audit of `LanguageToggle` usage is recommended once the fix is applied.

---

### LOW-003 — Admin Tables Likely Overflow on Mobile

Admin dashboard tables (sale centers, mitras, bookings) do not have confirmed `overflow-x-auto` wrappers, suggesting they may overflow horizontally on mobile viewports. This could not be verified without live browser testing.

---

## 9. Business Rule Violations

| Rule | Status | Detail |
|---|---|---|
| Rule 1: Only Mitra can purchase | ✅ COMPLIANT | `isMitra` gating in catalog + `role !== 'mitra'` at checkout + `requireCustomerRoleOrThrow('mitra')` in booking action |
| Rule 2: Mitra must register with city + DC | ⚠ PARTIALLY VIOLATED | DC selector exists in form but page is broken (BUG-001). DB schema supports it. |
| Rule 3: Mitra approval required | ✅ COMPLIANT | `mustResetPin` flag, `role: 'mitra'` only set on approval |
| Rule 4: Mitra login and portal access | ✅ COMPLIANT | Login works; portal role-gated |
| Rule 5: E-commerce cart flow | ✅ COMPLIANT | Browse→Add→Qty→Checkout→Confirm all implemented |
| Rule 6: No online payment | ✅ COMPLIANT | `z.enum(['cash','udhar'])` enforced at schema boundary |
| Rule 7: Super Admin manages master data | ⚠ PARTIALLY VIOLATED | Festivals and sweets managed; cities/DCs/sale centers not manageable without DB access |
| Rule 8: Historical price preservation | ✅ COMPLIANT | JSONB snapshot stored at booking time |
| Rule 9: Server-authoritative pricing | ✅ COMPLIANT | `priceCart()` re-fetches from DB; client prices are display-only |
| Rule 10: Data isolation | ✅ COMPLIANT | All queries scoped to `session.sub` |

---

## 10. Missing Features (vs. Documented Scope)

| Feature ID | Feature | Severity |
|---|---|---|
| ADMIN-001 | City/Organization add/edit/toggle in Super Admin UI | HIGH |
| ADMIN-002 | Booking detail drilldown (items) in Super Admin | HIGH |
| ADMIN-003 | Mitras management tab in Super Admin UI | HIGH |
| ADMIN-004 | Distribution Center CRUD in any admin panel | HIGH |
| ADMIN-005 | Sale Center and pricing management in Super Admin | HIGH |
| SHOP-004 | Booking item detail in Mitra portal | MEDIUM |

---

## 11. Regression Risks

| Change Area | Tests at Risk |
|---|---|
| `src/lib/locale` exports | TC-MITRA-001 through TC-MITRA-006, TC-RESPONSIVE-004 |
| Authentication (`lib/auth/`) | TC-AUTH-001 through TC-AUTH-010, TC-SECURITY-001 through TC-SECURITY-004 |
| Booking action (`lib/actions/booking.ts`) | TC-BOOKING-001 through TC-BOOKING-008 |
| Cart (`components/cart/CartProvider.tsx`) | TC-SHOP-004 through TC-SHOP-007, TC-BOOKING-001 |
| Pricing (`lib/data/pricing.ts`) | TC-BOOKING-004, TC-BOOKING-005, TC-SHOP-008 |
| Admin actions (`lib/actions/admin.ts`) | TC-ADMIN-007, TC-ADMIN-008, TC-ADMIN-011 |
| Mitra apply form / server action | TC-MITRA-001 through TC-MITRA-007 |

---

## 12. Recommended Development Tasks (Priority Order)

| Priority | Task ID | Description |
|---|---|---|
| 🔴 P0 | FIX-001 | Fix webpack runtime error on `/hi/mitra/apply` — export missing locale functions |
| 🔴 P1 | FIX-002 | Implement ADMIN-004: Distribution Center management UI |
| 🔴 P1 | FIX-003 | Implement ADMIN-001: City add/edit/toggle in Super Admin |
| 🔴 P1 | FIX-004 | Implement ADMIN-003: Mitras tab in Super Admin dashboard |
| 🔴 P1 | FIX-005 | Implement ADMIN-002: Booking detail drilldown in Super Admin |
| 🟠 P2 | FIX-006 | Implement SHOP-004: Booking item detail in Mitra portal |
| 🟠 P2 | FIX-007 | Implement ADMIN-005: Sale Center + pricing in Super Admin |
| 🟡 P3 | FIX-008 | Add duplicate phone check in `submitMitraApplicationAction` |
| 🟡 P3 | FIX-009 | Update existing mitra user's `distribution_center_id` in DB |
| 🟢 P4 | FIX-010 | Show cart-clear warning on sale center switch |
