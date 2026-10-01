# Mitra Portal Redesign: 2-Column Sidebar Layout

**Task:** Redesign the Mitra portal dashboard (`/mitra/portal`) from a centered tab-based layout to a clean 2-column sidebar + main content layout, matching a modern SaaS admin dashboard aesthetic.

**Status:** Planning complete. Ready for implementation.

---

## Current State (Before)

- **File:** `/app/(authenticated)/mitra/portal/page.tsx` + `/app/(authenticated)/mitra/portal/MitraPortalClient.tsx`
- **Layout:** Centered max-w-4xl container with tabbed navigation (Dashboard, My Bookings, New Booking)
- **Styling:** Amber/orange gradient background (dark amber-950 to amber-950/90), tab-based UI with banner header
- **Navigation:** Tabs managed by local state (useState `tab`)
- **Wrapping:** Currently wrapped in SiteHeader and SiteFooter

---

## Design Requirements (After)

### 1. Layout Structure
- **Two-column layout:**
  - **Left Column (Sidebar):** Fixed width (~240px on desktop), dark charcoal (bg-slate-900, text-slate-100)
    - Logo/brand area at top
    - Navigation items with icons
    - User info + logout at bottom
    - Collapsible/drawer on mobile
  - **Right Column (Main Content):** Light background (bg-slate-50)
    - Minimal top header with page title + udhar badge
    - Dashboard/bookings content below

### 2. Navigation Order (Fixed)
1. **Browse Catalog** (ShoppingBag icon) → Links to `/` (navigates away)
2. **Dashboard** (LayoutDashboard icon) → Shows dashboard stats + recent bookings
3. **My Booking** (BookOpen icon) → Shows full bookings list with filter/expand

**Default State:** "Browse Catalog" should appear as the active nav item visually, but since it links to `/`, the first actual "active" state will be Dashboard when returning to the portal.

### 3. Visual Style
- **Sidebar:** bg-slate-900, text-slate-100, subtle border-right (1px slate-800)
- **Main Content:** bg-slate-50
- **Cards:** bg-white, rounded-xl, border-1 border-slate-200, shadow-sm
- **Active Nav Item:** bg-amber-600 or similar, text-white, clear visual distinction
- **Hover Nav Item:** bg-slate-800, subtle transition
- **Accent Color:** Amber-600 for interactive elements (matches existing palette)
- **Typography:** Clear hierarchy, muted grays for secondary text
- **Spacing:** Generous but consistent (12–16px internal padding, 24px between sections)

### 4. Responsive Design
- **Desktop (1280px+):** Fixed sidebar + scrollable main content
- **Tablet (768px+):** Sidebar remains visible but narrower, or collapsible
- **Mobile (375px+):** Sidebar becomes a drawer/offcanvas, triggered by hamburger button in header

### 5. Preserve All Functionality
- ✅ All booking data display (stats, recent bookings, detail expansion)
- ✅ Booking filter (all/udhar/delivered)
- ✅ Expand/collapse booking rows
- ✅ Locale (hi/en) switching
- ✅ Udhar outstanding calculation
- ✅ All props from page.tsx (session, bookings, festivals, cities, checkoutHref, assignedDcNameHi/En)
- ✅ Logout action
- ✅ All navigation links and user interactions

---

## Files to Create

### 1. `/components/MitraPortalSidebar.tsx`
**Purpose:** Reusable sidebar component for the 2-column layout.

**Props Interface:**
```typescript
interface MitraPortalSidebarProps {
  locale: Locale;
  session: {
    sub: string;
    name: string;
    phone: string;
    centerId?: string | null;
    cityId?: string | null;
  };
  assignedDcNameHi?: string | null;
  assignedDcNameEn?: string | null;
  cities: any[];
  activeTab: Tab; // 'dashboard' | 'bookings' | 'new_booking'
  onTabChange: (tab: Tab) => void;
  onLogout?: () => void;
}
```

**Component Structure:**
- Fixed-width container (~240px on desktop, collapsible on mobile)
- Dark sidebar styling (bg-slate-900, text-slate-100)
- Top section: Logo / brand
- Middle section: Navigation links (3 items: Browse Catalog, Dashboard, My Booking)
  - Each with icon (from lucide-react)
  - Active state styling (bg-amber-600 or similar)
  - Hover states
- Bottom section:
  - User info block (name, phone, DC)
  - Logout button (form action)
- Responsive toggle: hamburger menu on mobile, full sidebar on desktop

**Key Implementation Details:**
- Use Next.js Link for navigation (except logout, which is a form action)
- Browse Catalog is a regular Link to "/" — not part of tab state
- Dashboard and My Booking manage tab state locally via onTabChange
- Sidebar should be sticky/fixed height, not scroll with content
- Icons: from lucide-react (already installed)

---

### 2. `/components/MitraPortalHeader.tsx`
**Purpose:** Minimal top header for the main content area.

**Props Interface:**
```typescript
interface MitraPortalHeaderProps {
  locale: Locale;
  title: string; // e.g., "Dashboard", "My Bookings"
  titleHi: string; // e.g., "डैशबोर्ड"
  udharOutstanding: number;
  festivalName?: string;
  festivalNameHi?: string;
}
```

**Component Structure:**
- Minimal bar at top of main content
- Page title (left)
- Udhar outstanding badge (right) showing amount and color-coded status
- Small festival indicator if active
- Subtle border-bottom (1px slate-200)

**Key Implementation Details:**
- Only 40–50px tall
- Integrates with main content area, not full-width
- Used in dashboard and bookings views
- Not used in new booking view (that gets its own centered card layout)

---

## Files to Modify

### 1. `/app/(authenticated)/mitra/portal/page.tsx`
**Changes:**
- Remove SiteHeader and SiteFooter wrapping for this page only
- Remove the dark amber gradient background
- Replace with a full-height 2-column flex layout
- Pass new props to MitraPortalClient: `sidebar` component integration

**Specific Edits:**
1. Delete imports: `import { SiteHeader } from '@/components/SiteHeader'` and `import { SiteFooter } from '@/components/SiteFooter'`
2. Replace the outer div and wrapper structure:
   - Old: `<div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-950 to-amber-950/90">`
   - New: `<div className="min-h-screen flex">`
3. Remove SiteHeader + SiteFooter JSX, keep MitraPortalClient
4. Ensure the page renders as a full-height flex container for the sidebar + main layout

**Preserved:**
- All data fetching logic (bookings, festivals, cities, distributionCenters)
- Session validation
- Props passed to MitraPortalClient (unchanged)

---

### 2. `/app/(authenticated)/mitra/portal/MitraPortalClient.tsx`
**Changes:**
- Integrate the new sidebar and header components
- Restructure the layout from `max-w-4xl mx-auto px-4` to `flex` with sidebar + content area
- Remove the old tab navigation (inline button group)
- Remove the "Identity banner" — move user info to sidebar
- Keep all tab content rendering (dashboard, bookings, new booking)
- Keep all data calculations and business logic unchanged

**Specific Edits:**

1. **Import additions:**
   - Import MitraPortalSidebar and MitraPortalHeader
   - Keep existing lucide-react icons

2. **Remove from JSX:**
   - Delete the `max-w-4xl mx-auto px-4 py-6 space-y-6` wrapper
   - Delete the "Identity banner" div (the gradient banner with user name, city, DC, logout, udhar badge)
   - Delete the old tab navigation buttons (the flex with bg-white p-1.5 rounded-lg)

3. **New top-level structure:**
   ```
   <div className="flex h-screen w-full">
     <MitraPortalSidebar {...props} activeTab={tab} onTabChange={setTab} />
     <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
       <MitraPortalHeader {...headerProps} />
       <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
         {/* Tab content here */}
       </main>
     </div>
   </div>
   ```

4. **Tab content rendering:**
   - Dashboard tab: Keep stat cards, recent bookings table
   - Bookings tab: Keep filter buttons, booking list with expand/collapse
   - New Booking tab: Keep centered card layout (no changes)

5. **State management:**
   - Keep useState for `tab`, `bookingFilter`, `expandedBookingId`
   - Tab state now connected to sidebar via `onTabChange`

6. **Props that change:**
   - All other props remain: `locale`, `session`, `bookings`, `festivals`, `cities`, etc.

**Preserved:**
- All business logic (calculating udharOutstanding, filtering bookings, etc.)
- All event handlers (expand/collapse, logout, filter)
- All UI content for each tab
- All locale-aware strings (hi/en)
- Data display format (INR, status badges, etc.)

---

## Component Interfaces Summary

### MitraPortalSidebar.tsx
```typescript
interface MitraPortalSidebarProps {
  locale: Locale;
  session: {
    sub: string;
    name: string;
    phone: string;
    centerId?: string | null;
    cityId?: string | null;
  };
  assignedDcNameHi?: string | null;
  assignedDcNameEn?: string | null;
  cities: any[];
  activeTab: 'dashboard' | 'bookings'; // excludes 'new_booking' for default behavior
  onTabChange: (tab: 'dashboard' | 'bookings') => void;
  onLogout?: () => void;
}

export function MitraPortalSidebar({ ... }: MitraPortalSidebarProps) { ... }
```

### MitraPortalHeader.tsx
```typescript
interface MitraPortalHeaderProps {
  locale: Locale;
  title: string;
  titleHi: string;
  udharOutstanding: number;
  festivalName?: string;
  festivalNameHi?: string;
}

export function MitraPortalHeader({ ... }: MitraPortalHeaderProps) { ... }
```

### Updated MitraPortalClient.tsx Signature
```typescript
interface MitraPortalClientProps {
  locale: Locale;
  session: {
    sub: string;
    name: string;
    phone: string;
    centerId?: string | null;
    cityId?: string | null;
  };
  bookings: any[];
  festivals: any[];
  cities: any[];
  checkoutHref: string;
  assignedDcNameHi?: string | null;
  assignedDcNameEn?: string | null;
}

export function MitraPortalClient({ ... }: MitraPortalClientProps) { ... }
```

---

## Design Decisions & Rationale

### 1. Sidebar vs. Top Navigation
**Decision:** Left sidebar (not top navbar).
**Rationale:**
- Matches the reference image (2-column SaaS layout)
- Better vertical space utilization on desktop
- Standard pattern for admin dashboards
- Easier responsive toggle (drawer on mobile)

### 2. Tab Management Location
**Decision:** Tab state remains in MitraPortalClient, passed down to sidebar via `activeTab` prop.
**Rationale:**
- MitraPortalClient is already the state container
- Sidebar becomes a presentational component (dumb)
- Cleaner separation of concerns
- Easier to test and maintain

### 3. Browse Catalog as Navigation Item
**Decision:** Browse Catalog is a `<Link>` to `/`, not a tab.
**Rationale:**
- It navigates away from the portal, not a local tab switch
- No internal tab state needed for it
- Visual distinction in sidebar (still part of nav, but behaves differently)
- When user returns from catalog, Dashboard becomes the active tab again

### 4. Remove SiteHeader & SiteFooter from /mitra/portal
**Decision:** Strip them from this page only.
**Rationale:**
- The 2-column dashboard layout becomes the full viewport experience
- SiteHeader/Footer are still used on other pages (catalog, checkout, admin)
- This keeps the portal experience focused and full-featured
- Sidebar replaces header functions (logo, logout, user info)

### 5. User Info in Sidebar Bottom
**Decision:** Move user name, phone, DC from banner to sidebar bottom.
**Rationale:**
- Keeps sidebar complete and self-contained
- Reduces visual clutter in main content area
- Standard pattern (user info in sidebar footer)
- Easier responsive handling on mobile

### 6. Mobile Responsiveness
**Decision:** Sidebar collapses into a drawer; hamburger toggle in header.
**Rationale:**
- Full sidebar + content doesn't fit on mobile widths
- Drawer is a proven mobile pattern
- Hamburger is familiar and accessible
- Can use Radix or custom CSS for toggle

---

## Concerns & Mitigations

### Concern 1: Tab State on Page Navigation
**Issue:** If user clicks Browse Catalog (which goes to `/`) and then navigates back to `/mitra/portal`, which tab should be active?
**Mitigation:** On MitraPortalClient mount, default to `tab = 'dashboard'`. This is safe because Dashboard is the main view. If more complex tab persistence is needed later, store tab state in URL query params or localStorage.

### Concern 2: Mobile Sidebar Drawer Implementation
**Issue:** CSS/JS complexity for drawer toggle.
**Mitigation:** Start with a simple CSS-based toggle (hidden input + label hack, or Radix Dialog). Keeps implementation minimal and leverages existing dependencies.

### Concern 3: Preserving All Existing Data & Functionality
**Issue:** Restructuring layout could accidentally break data binding or event handlers.
**Mitigation:**
- Keep all state variables and calculations intact (udharOutstanding, filteredBookings, etc.)
- Keep all event handlers unchanged (onTabChange, onFilter, onExpand)
- Keep all JSX for each tab identical to current version
- Only the container and wrapper structure changes

### Concern 4: Testing After Redesign
**Issue:** Need to verify all functional and visual aspects still work.
**Mitigation:**
- Run `npm run typecheck` to catch TS errors
- Run `npm run build` to catch build errors
- Manual testing at multiple breakpoints (375px, 768px, 1280px)
- Verify navigation, bookings display, filters, expand/collapse all work
- Verify logout action works
- Test both hi and en locales

---

## Implementation Checklist

### Phase 1: Component Creation
- [ ] Create `components/MitraPortalSidebar.tsx` with full implementation
- [ ] Create `components/MitraPortalHeader.tsx` with full implementation
- [ ] Verify both components export correctly and have proper TypeScript interfaces

### Phase 2: Page & Client Modifications
- [ ] Remove SiteHeader/SiteFooter from `page.tsx`
- [ ] Update page.tsx wrapper to use flex layout
- [ ] Update MitraPortalClient.tsx to import and use new sidebar + header
- [ ] Replace old tab nav with sidebar integration
- [ ] Replace identity banner with header component
- [ ] Update main container to accommodate 2-column layout

### Phase 3: Responsive Design
- [ ] Add mobile hamburger toggle in sidebar
- [ ] Test desktop view (1280px+)
- [ ] Test tablet view (768px)
- [ ] Test mobile view (375px)
- [ ] Verify navigation order is: Browse Catalog, Dashboard, My Booking

### Phase 4: Verification
- [ ] Run `npm run typecheck` — no TS errors
- [ ] Run `npm run build` — builds successfully
- [ ] Run `npm run dev` and test /mitra/portal manually
  - [ ] Browse Catalog link navigates to `/`
  - [ ] Dashboard tab active by default shows stats and recent bookings
  - [ ] My Booking tab shows full bookings with filter and expand
  - [ ] New Booking tab shows centered card
  - [ ] Logout button works
  - [ ] Locale toggle works
  - [ ] Responsive layout works on mobile/tablet/desktop
  - [ ] All existing data displays correctly

### Phase 5: Testing & Review
- [ ] Verify all business logic intact (data calculations, filtering, etc.)
- [ ] Check visual polish (spacing, colors, alignment match reference image)
- [ ] Ensure no regressions in other pages (SiteHeader/Footer still work elsewhere)
- [ ] Run tests if applicable
- [ ] Commit changes with clear message

---

## Verification Commands

```bash
# Type checking
npm run typecheck

# Build
npm run build

# Dev server
npm run dev
# Then navigate to http://localhost:3000/mitra/portal

# Run tests (if applicable)
npm run test:run
```

---

## Files Summary

| File | Action | Status |
|------|--------|--------|
| `components/MitraPortalSidebar.tsx` | Create | Pending |
| `components/MitraPortalHeader.tsx` | Create | Pending |
| `app/(authenticated)/mitra/portal/page.tsx` | Modify | Pending |
| `app/(authenticated)/mitra/portal/MitraPortalClient.tsx` | Modify | Pending |

---

## Notes

- **No new dependencies:** lucide-react and Tailwind CSS already installed.
- **Locale support:** Both components support hi/en locales.
- **Accessibility:** Use semantic HTML (nav, main, aside) and ARIA labels where needed.
- **Performance:** All components are already client-side (MitraPortalClient is 'use client'), no additional hydration concerns.
- **Browser support:** Tailwind + modern CSS flexbox, works on all modern browsers.

---

**Plan Status:** ✅ Complete and ready for implementation.
