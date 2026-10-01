# Phase 6 — Complex Component Migration Plan

**Files:** CatalogBrowser.tsx (948 lines), CheckoutClient.tsx (701 lines)

## Overview

Migrate two critical user-facing components to shadcn/ui while preserving all business logic and form submission behavior.

## CatalogBrowser.tsx Scope

### Current Pattern
- Client component with complex state management
- Buttons: Add-to-cart CTAs, quantity adjustment (±), filters, navigation
- Inputs: quantity spinners, search/filters, city/center selectors

### Migration
1. Button components for CTAs (primary, secondary, action)
2. Quantity adjustment buttons (icon style)
3. Keep filter/selection logic unchanged
4. Keep state management intact

### Risk: MEDIUM
- Large component with many interactive pieces
- Quantity behavior must be exactly preserved
- Add-to-cart flow must work perfectly

## CheckoutClient.tsx Scope  

### Current Pattern
- Client component with Server Actions integration
- Buttons: Submit (Place Booking), Cancel, Apply Coupon, Clear
- Inputs: name, phone, coupon code, promo code
- Radio buttons, select for payment/delivery options

### Migration
1. All buttons → shadcn Button (variants based on purpose)
2. Text inputs → shadcn Input
3. Keep form submission and validation
4. Keep payment method and delivery center selection as-is (for now)

### Risk: LOW-MEDIUM
- Server-side form validation (secure)
- Button changes are straightforward
- Input changes don't affect submission logic

##Migration Steps

1. **Add imports** to both files (Button, Input already imported in admin components)
2. **Systematically replace** buttons and inputs by category
3. **Test TypeScript build** after each file
4. **Verify form functionality** manually
5. **Run full build** and E2E tests
6. **Commit:** `feat: migrate CatalogBrowser and CheckoutClient to shadcn/ui (Phase 6)`

## Definition of Done
- TypeScript compilation passes (0 errors)
- Full Next.js build succeeds
- Manual testing: Cart flow works
- Manual testing: Checkout form submits correctly
- All form validations work
- No console errors
- Git committed
