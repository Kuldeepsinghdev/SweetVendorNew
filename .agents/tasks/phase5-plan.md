# Phase 5 — shadcn/ui Component Migration Plan

## Overview
This plan outlines the migration of custom/native HTML form components to shadcn/ui components across 8 primary files and 2 secondary files. The goal is to replace `<button>`, `<input>`, `<label>`, `<select>`, and custom modal divs with their shadcn/ui equivalents while preserving all business logic, form submissions, validation, and state management.

**Key Principles:**
- Preserve all Server Action calls, form submissions, and event handlers
- Maintain all validation logic, error states, and loading states
- Keep existing prop names and accessibility attributes
- Do not change styling unless visually inconsistent with the existing design
- Migrate incrementally by logical component group
- Run verification after each major file change

---

## File-by-File Migration Plan

### 1. CustomerLoginForm.tsx
**File:** `/Users/aanchal/Documents/Gitlab/Sweet Vendor -Nextjs/app/(auth)/login/CustomerLoginForm.tsx`

**Current Structure:**
- Tab toggle buttons (phone vs email method) using raw `<button>`
- Form inputs for phone, PIN, email, password using raw `<input>`
- Error/success alerts using raw `<div role="alert">`
- Submit button with custom styling

**Migration Steps:**

1. **Tab buttons (lines 48-55):**
   - Replace phone/email toggle buttons with shadcn Button components
   - Use `variant="default"` for active tab, `variant="outline"` for inactive
   - Preserve `aria-pressed` attribute for accessibility
   - Keep onClick handlers unchanged

2. **Inputs for phone method (lines 67-85):**
   - Replace `<input id="phone">` with shadcn Input at line 73
   - Replace `<input id="pin">` with shadcn Input at line 81
   - Add Label component for both using shadcn Label
   - Preserve `name`, `id`, `required`, `maxLength`, `autoComplete`, `placeholder`, `type` attributes

3. **Inputs for email method (lines 87-105):**
   - Replace `<input id="email">` with shadcn Input at line 93
   - Replace `<input id="password">` with shadcn Input at line 101
   - Add Label component for both
   - Preserve all attributes

4. **Error alert (lines 58-63):**
   - Replace raw `<div role="alert">` with shadcn Alert component
   - Use Alert, AlertTitle, AlertDescription
   - Keep existing layout and styling logic

5. **Submit button (lines 106-116):**
   - Replace with shadcn Button
   - Use `variant="default"` (maps to --primary/orange-600)
   - Keep pending state spinner and disabled logic
   - Preserve onClick and form integration

**Verification:** `npm run typecheck` and visual check of login form at `/login`

---

### 2. MitraApplyForm.tsx
**File:** `/Users/aanchal/Documents/Gitlab/Sweet Vendor -Nextjs/app/(auth)/mitra/apply/MitraApplyForm.tsx`

**Current Structure:**
- Success screen with custom div styling
- Multi-section form with fieldsets
- Error alert div
- Select dropdowns for city and distribution center
- Text inputs for name, phone, email
- Textarea for address
- Checkbox for agreement
- Submit button

**Migration Steps:**

1. **Success screen (lines 64-81):**
   - Replace custom success div with shadcn Card component
   - Use Card, CardHeader, CardContent, CardFooter
   - Keep CheckCircle2 icon
   - Keep all text content and bilingual strings

2. **Error alert (lines 91-98):**
   - Replace raw alert div with shadcn Alert + AlertDescription
   - Keep existing styling logic

3. **City/DC selects (lines 105-140):**
   - Replace `<select id="cityId">` with shadcn Select (or keep as custom `<select>` if Select wrapper is too complex for now)
   - Replace `<select id="centerId">` with shadcn Select
   - Add shadcn Label for both
   - Preserve onChange handler and all attributes
   - **Note:** shadcn Select requires more refactoring; alternative: keep native select but wrap with Label component

4. **Text inputs (lines 149-189):**
   - Replace `<input id="fullName">` with shadcn Input + Label
   - Replace `<input id="phone">` with shadcn Input + Label
   - Replace `<input id="email">` with shadcn Input + Label
   - Replace `<input id="address">` with shadcn Input + Label (or Textarea if needed)
   - Replace `<input id="pincode">` with shadcn Input + Label
   - Preserve all attributes: name, type, required, minLength, maxLength, placeholder

5. **Address textarea (lines 181-189):**
   - Keep as native `<textarea>` or use shadcn Textarea if available (not yet in components/ui/)
   - Add shadcn Label
   - Preserve rows and other attributes

6. **Checkbox (lines 193-201):**
   - Replace with shadcn Checkbox or keep native with Label
   - Use shadcn Label to wrap checkbox + text
   - Preserve name, value, defaultChecked

7. **Submit button (lines 203-216):**
   - Replace with shadcn Button
   - Use `variant="default"` (primary/amber-to-orange gradient effect if possible, else default)
   - Keep pending spinner and disabled state
   - Preserve form submission

8. **Login link at bottom (lines 218-227):**
   - Keep as Link component (already Next.js link)
   - Can optionally wrap text with shadcn Button as variant="link"

**Verification:** `npm run typecheck` and test Mitra apply form flow

**WARNING:** This is a complex form. Test thoroughly:
- City dropdown updates distribution center list correctly
- Form submission with all fields filled
- Validation errors
- Success screen displays application ID correctly

---

### 3. AddNoteForm.tsx
**File:** `/Users/aanchal/Documents/Gitlab/Sweet Vendor -Nextjs/app/(dashboard)/dashboard/AddNoteForm.tsx`

**Current Structure:**
- Simple inline form
- Single text input
- Submit button
- Error/success messages

**Migration Steps:**

1. **Label (line 22):**
   - Replace raw `<label>` with shadcn Label
   - Preserve htmlFor and text

2. **Input (lines 23-30):**
   - Replace `<input id="note">` with shadcn Input
   - Preserve all attributes: id, name, type, maxLength, required, placeholder

3. **Submit button (lines 31-37):**
   - Replace with shadcn Button
   - Use `variant="default"` (amber-500 → maps to secondary or create custom)
   - Keep pending state
   - Preserve disabled logic

4. **Error message (lines 38-41):**
   - Keep as-is or wrap with shadcn Alert if needed
   - Simple inline text is fine

5. **Success message (lines 42-44):**
   - Keep as-is or use shadcn Alert

**Verification:** `npm run typecheck` and test adding an audit note

---

### 4. CheckoutShell.tsx
**File:** `/Users/aanchal/Documents/Gitlab/Sweet Vendor -Nextjs/app/(authenticated)/checkout/CheckoutShell.tsx`

**Current Structure:**
- Wrapper component, minimal UI changes needed
- No direct buttons/inputs to migrate

**Action:** No direct component changes required. CheckoutClient.tsx should be checked separately for any form elements.

**Note:** This file is mostly a data provider wrapper. Review CheckoutClient.tsx if there are form elements there.

---

### 5. FooterPolicyModals.tsx
**File:** `/Users/aanchal/Documents/Gitlab/Sweet Vendor -Nextjs/components/FooterPolicyModals.tsx`

**Current Structure:**
- Modal implemented with raw `<div>` backdrop and overlay
- Policy links as button list
- Close button (X icon)
- Info modal dialogs

**Migration Steps:**

1. **Policy link buttons (lines 55-66):**
   - Replace with shadcn Button components
   - Use `variant="ghost"` or `variant="outline"` for link-like appearance
   - Keep onClick handlers
   - Preserve accessibility

2. **Modal dialog (lines 68-142):**
   - Replace raw backdrop div structure with shadcn Dialog component
   - Use Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
   - Migrate the fixed-position overlay to Dialog's built-in backdrop
   - Keep all modal content (policy text) unchanged
   - Preserve modal state management (activeModal state)

3. **Close button (line 80):**
   - Replace raw button with shadcn Button or use Dialog's built-in close functionality
   - Preserve onClick={close}

4. **Modal content buttons (line 139):**
   - Replace close button at bottom with shadcn Button
   - Use `variant="default"` or appropriate variant

**Verification:** `npm run typecheck` and test opening/closing policy modals

---

### 6. SuperAdminClient.tsx
**File:** `/Users/aanchal/Documents/Gitlab/Sweet Vendor -Nextjs/app/(dashboard)/super-admin/SuperAdminClient.tsx`

**Current Structure:**
- Complex dashboard with 8 tabs
- Tab buttons
- Multiple forms (festivals, cities, master sweets, pricing)
- Modal dialogs for editing
- Inline action buttons

**Migration Steps:**

1. **Tab buttons (lines 84-109):**
   - Replace with shadcn Button components
   - Use `variant="default"` for active tab, `variant="outline"` or `variant="ghost"` for inactive
   - Preserve onClick handlers and active state styling
   - Keep badge notification for pending mitras

2. **Alert messages in forms:**
   - Replace raw `<div role="alert">` with shadcn Alert
   - Examples: FestivalForm (line ~261), CityForm (line ~352)

3. **Form inputs across all tabs:**
   - FestivalForm inputs (lines 230-250): Replace with shadcn Input + Label
   - CityForm inputs (lines 354-385): Replace with shadcn Input + Label + Select
   - MasterSweetForm inputs: Replace with shadcn Input + Label (note: file is truncated)
   - PricingTab inputs: Replace with shadcn Input

4. **Buttons for editing/creating:**
   - "New Festival" button: Use shadcn Button `variant="default"` or `variant="secondary"`
   - "Edit" buttons: Keep as small action buttons
   - "Save" buttons: Use `variant="default"`
   - "Cancel" buttons: Use `variant="outline"` or `variant="ghost"`

5. **Select elements:**
   - Status/Type selects: Keep native select or migrate to shadcn Select (complex, may defer)
   - For now, wrap with Label

6. **Modals (edit dialogs):**
   - FestivalForm modal div: Consider shadcn Dialog wrapper if not already using Dialog
   - CityForm modal div: Same
   - MasterSweetForm modal div: Same
   - Note: These are currently rendered as conditional `{showForm && <Form />}`. Can optionally wrap with Dialog if UI requires backdrop.

**Verification:** `npm run typecheck` and test each tab's functionality (create/edit/delete)

**WARNING:** This file is complex. Focus on:
- Tab switching still works
- Form submissions for each tab
- Edit/approve/reject flows for Mitras tab
- City toggle active/inactive
- Pricing updates

---

### 7. CityAdminClient.tsx
**File:** `/Users/aanchal/Documents/Gitlab/Sweet Vendor -Nextjs/app/(dashboard)/city-admin/CityAdminClient.tsx`

**Current Structure:**
- 6 tabs (dashboard, mitra, center, dc, pricing, discounts)
- Tab buttons
- Multiple forms
- Action buttons
- Inline inputs and selects

**Migration Steps:**

1. **Tab buttons (lines 60-85):**
   - Replace with shadcn Button components
   - Use `variant="default"` for active, `variant="outline"` for inactive
   - Keep pending app badge

2. **Dashboard StatCards:**
   - Keep existing StatCard component (not migrating custom components)
   - Replace any button elements within if any

3. **Mitra Apps Tab:**
   - MitraAppCard buttons (lines 167-178): Replace with shadcn Button
   - Approve/Reject buttons: Use `variant="default"` and `variant="destructive"` respectively
   - Preserve onClick and form actions

4. **Create Center Tab (CreateCenterTab):**
   - All form inputs: Replace with shadcn Input + Label
   - Select for type: Keep native or migrate to shadcn Select
   - Submit button: shadcn Button `variant="default"`

5. **Pricing Tab (PricingTab):**
   - Select dropdown for sale center: Keep native or shadcn Select
   - SweetPricingRow inputs: Replace with shadcn Input
   - Save button: shadcn Button

6. **Discounts Tab (DiscountsTab):**
   - All form inputs: Replace with shadcn Input + Label
   - Checkboxes: Keep native or use shadcn Checkbox
   - Select dropdowns: Keep native or shadcn Select
   - Save/Cancel buttons: shadcn Button

7. **Distribution Centers Tab (DistributionCentersTab):**
   - DcForm inputs: Replace with shadcn Input + Label
   - All select dropdowns: Keep native or migrate to shadcn Select
   - Save/Cancel buttons: shadcn Button
   - Toggle buttons for activate/deactivate: shadcn Button

**Verification:** `npm run typecheck` and test each admin flow (approve mitra, create center, set pricing, manage discounts)

**WARNING:**
- Ensure DC assignment dropdown in Mitra approval works correctly
- Pricing saves for each sweet
- Discount CRUD operations

---

### 8. KendraClient.tsx
**File:** `/Users/aanchal/Documents/Gitlab/Sweet Vendor -Nextjs/app/(dashboard)/kendra/KendraClient.tsx`

**Current Structure:**
- 4 tabs
- Tab buttons
- Search input in OTP Delivery tab
- Form inputs for OTP entry
- Action buttons

**Migration Steps:**

1. **Tab buttons (lines 52-68):**
   - Replace with shadcn Button components
   - Use `variant="default"` for active, `variant="outline"` for inactive

2. **Search input (OTPDeliveryTab, line ~246):**
   - Replace `<input type="text">` with shadcn Input
   - Preserve placeholder and onChange

3. **OTP input field (lines ~330):**
   - Replace with shadcn Input
   - Keep type="text", placeholder, className for monospace styling
   - Preserve maxLength

4. **Action buttons:**
   - "Complete Delivery" button (line ~355): shadcn Button `variant="default"`
   - "Next Delivery" button (line ~305): shadcn Button
   - Search result buttons: Keep as clickable divs or convert to Button
   - Filter buttons (lines 207-218): shadcn Button, use `variant="default"` for active

5. **Cancel button (line ~416):**
   - Replace with shadcn Button `variant="ghost"` or `variant="outline"`

**Verification:** `npm run typecheck` and test OTP delivery flow

---

## Migration Order

1. **Phase 5a — Simple Forms First**
   - CustomerLoginForm.tsx (foundation for all auth)
   - AddNoteForm.tsx (minimal, quick win)

2. **Phase 5b — Complex Forms**
   - MitraApplyForm.tsx (bilingual, complex selects)
   - FooterPolicyModals.tsx (modal dialogs)

3. **Phase 5c — Admin Dashboards**
   - CityAdminClient.tsx (most forms per file)
   - SuperAdminClient.tsx (complex multi-tab)
   - KendraClient.tsx (OTP/delivery workflow)

4. **Phase 5d — Verification**
   - CheckoutShell.tsx + CheckoutClient.tsx (if needed)
   - Full integration tests

---

## Common Patterns to Follow

### Button Migration
```tsx
// OLD:
<button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg">Save</button>

// NEW:
<Button variant="default">Save</Button>
```

### Input Migration
```tsx
// OLD:
<input id="name" name="name" type="text" placeholder="Your name" className="px-4 py-2 border rounded-lg" />

// NEW:
<Input id="name" name="name" type="text" placeholder="Your name" />
```

### Label Migration
```tsx
// OLD:
<label htmlFor="name" className="block text-sm font-bold">Name</label>

// NEW:
<Label htmlFor="name">Name</Label>
```

### Select (defer for now)
Keep native `<select>` for now; migrate to shadcn Select in Phase 6 if complexity permits.

### Error Alert
```tsx
// OLD:
<div role="alert" className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700">
  Error message
</div>

// NEW:
<Alert variant="destructive">
  <AlertDescription>Error message</AlertDescription>
</Alert>
```

### Modals/Dialogs
```tsx
// OLD: Conditional render of raw overlay div
{activeModal && (
  <div className="fixed inset-0 z-50 bg-slate-950/80">...</div>
)}

// NEW: shadcn Dialog
<Dialog open={activeModal === 'key'} onOpenChange={(open) => !open && close()}>
  <DialogContent>...</DialogContent>
</Dialog>
```

---

## Imports to Add

Add to each migrated file:
```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
```

---

## Testing Strategy

After each file migration:

1. **TypeScript check:** `npm run typecheck` — must pass
2. **Visual inspection:** Check UI appearance matches existing design
3. **Form submission:** Test at least one form submission end-to-end
4. **Validation:** Test invalid input handling
5. **Loading states:** Test disabled/pending states during form submission
6. **Error states:** Verify error messages display correctly
7. **Responsive:** Test on mobile (375px), tablet (768px), desktop (1280px)

---

## Risk Areas & Mitigations

| Risk | Mitigation |
|------|-----------|
| Form submission breaks | Keep all name/id attributes unchanged; don't modify form action logic |
| Select dropdowns lose functionality | Keep native `<select>` for Phase 5; migrate to shadcn Select in Phase 6 |
| Modal state management breaks | Use conditional rendering as fallback; don't force Dialog until fully tested |
| Styling inconsistency | Use shadcn variants that map to existing colors; test visually |
| Accessibility issues | Preserve id/htmlFor/aria-* attributes; test with keyboard navigation |
| Multi-tab state loss | Preserve useState and tab switching logic; only replace UI elements |

---

## Definition of Done

A file migration is complete when:
- [ ] All applicable `<button>` elements replaced with shadcn Button (or kept if decorative)
- [ ] All form `<input>` elements replaced with shadcn Input
- [ ] All form `<label>` elements replaced with shadcn Label
- [ ] All alerts replaced with shadcn Alert (if role="alert" present)
- [ ] All modals replaced with shadcn Dialog (if applicable)
- [ ] All custom card-like divs replaced with shadcn Card (if applicable)
- [ ] TypeScript build passes: `npm run typecheck`
- [ ] Visual inspection confirms UI matches existing design
- [ ] At least one primary user flow tested end-to-end
- [ ] No console errors or warnings related to the migrated components
- [ ] All form submissions still work
- [ ] Bilingual text (Hindi/English) preserved
- [ ] Loading and error states display correctly

---

## Notes

- **Textarea:** shadcn does not yet have a Textarea component in the ready list. Keep native `<textarea>` for now or check components/ui/ for custom implementation.
- **Select:** Native `<select>` is simpler for now. shadcn Select requires significant refactoring; consider Phase 6.
- **Checkboxes:** shadcn Checkbox exists; migrate if already available or keep native with Label.
- **Responsive:** Most shadcn components are mobile-responsive by default. Verify on test devices.
- **Bilingual:** Preserve all Hindi/English strings exactly as-is. No translations are being changed.
- **Server Actions:** All form `action={formAction}` and Server Action calls remain unchanged.
- **Validation:** All Zod schemas and field validation remains unchanged.

---

## Git Workflow Reminder

All work must be on branch: `ui/shadcn-migration`

1. Before starting: `git checkout ui/shadcn-migration` (or create if not exists)
2. After each file migration: Commit with message like `chore: migrate CustomerLoginForm to shadcn/ui`
3. Do NOT push to main/master
4. Remain on `ui/shadcn-migration` at end of Phase 5
