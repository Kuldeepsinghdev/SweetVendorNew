# Phase 5d Plan — Admin Dashboard Form Buttons & Inputs

## Overview
Phase 5d migrates remaining form elements in the three admin dashboard components from custom styled HTML to shadcn/ui components. This includes form action buttons (Submit, Cancel, Edit, Delete, Approve, Reject), filter buttons, and toggle buttons.

## Scope

### SuperAdminClient (8 tabs)
Key buttons to migrate: New, Edit, Submit, Cancel, Filter toggles, Approve, Reject, Expand/collapse buttons across all 8 tabs.

### CityAdminClient (6 tabs)
Similar button patterns for: New, Edit, Delete, Submit, Cancel, Approve, Reject, filter toggles, and expand/collapse buttons.

### KendraClient (4 tabs)
Similar button patterns for OTP delivery workflow, form submit/cancel buttons, and expand/collapse buttons.

## Migration Strategy

### Button Variant Mapping
- Primary actions (Submit) → `<Button>` (default = orange-600)
- Secondary/Cancel → `<Button variant="outline">`
- Destructive (Delete/Reject) → `<Button variant="destructive">`
- Ghost/Text (Edit, Toggle) → `<Button variant="ghost" size="icon">`
- Filter active → `<Button variant="default">`
- Filter inactive → `<Button variant="outline">`

### Key Principles
1. Identify current button styling (color, size, layout)
2. Map to shadcn variant
3. Preserve onClick, type, disabled, and other event handlers
4. Keep title attributes for tooltips
5. Preserve loading indicators (icons, spinners, text changes)
6. Keep all form submission logic and Server Actions intact

### Step-by-Step Process
1. Update imports (Button already imported from Phase 5c)
2. Replace custom button elements with shadcn Button components
3. Apply appropriate variants based on button purpose
4. Preserve all onClick handlers and form behavior
5. Test TypeScript build and full application build
6. Manual testing of all admin dashboard tabs

## Challenges & Decisions

1. **Inline className styling for layout** — shadcn Button allows className for layout purposes
2. **Icon-only buttons with tooltips** — Use `<Button variant="ghost" size="icon" title="...">`
3. **Button groups/toggles (filters)** — Use `<Button variant={active ? "default" : "outline"}>`
4. **Disabled states** — shadcn Button handles disabled styling automatically

## Files to Modify
1. `/app/(dashboard)/super-admin/SuperAdminClient.tsx`
2. `/app/(dashboard)/city-admin/CityAdminClient.tsx`
3. `/app/(dashboard)/kendra/KendraClient.tsx`

## Definition of Done
- [ ] All custom button styles replaced with shadcn Button variants
- [ ] All button onClick handlers, types, and disabled states preserved
- [ ] TypeScript build passes
- [ ] Full Next.js build passes
- [ ] Manual testing: All admin dashboard tabs functional
- [ ] All Server Actions callable and working
- [ ] No console errors or warnings
- [ ] Git commit: `feat: migrate admin dashboard form buttons to shadcn/ui (Phase 5d)`
