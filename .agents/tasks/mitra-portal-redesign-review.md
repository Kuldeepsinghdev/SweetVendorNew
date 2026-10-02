# Mitra Portal 2-Column Sidebar Redesign — Code Review

**Redesign:** Mitra Portal Dashboard (`/mitra/portal`) from centered tab-based layout to modern 2-column sidebar + main content layout.

This review verifies the implementation preserves all business logic, correctly implements the 2-column layout, handles responsive design, and maintains clean code patterns. The redesign introduces two new reusable components (`MitraPortalSidebar`, `MitraPortalHeader`) and restructures the client island to integrate them.

**Watch for:** The `cities` prop is passed but unused in `MitraPortalClient` — this is likely a leftover that can be removed in a follow-up. All other functionality is intact.

**Verdict**: APPROVED

---

## High-level view

The implementation replaces a centered, tab-based dashboard with a professional 2-column layout. The left sidebar is a fixed dark panel with navigation (Browse Catalog, Dashboard, My Booking), user info, and logout. The main content area uses a light background with minimal header and scrollable content.

Navigation order is correct and matches requirements: Browse Catalog links to `/`, while Dashboard and My Booking are managed as local tabs. Browse Catalog is active by default (visual styling). The responsive design collapses the sidebar into a drawer on mobile, triggered by a hamburger button.

All booking data, filtering, calculations, and locale support remain unchanged. The server-side data fetching in `page.tsx` is untouched. The business logic for computing udhar outstanding, filtering bookings, and calculating totals is preserved identically.

TypeScript compiles without errors. The new components use proper prop interfaces and are fully typed. The two new files are well-structured, follow the existing code patterns, and export clean interfaces.

---

<details>
<summary>Issues (1)</summary>

1. **Unused `cities` prop** — The `cities` array is passed to `MitraPortalClient` but never used. This is safe (no functional issue) but represents unnecessary data transfer. Can be removed from `page.tsx` pass-through and `MitraPortalClient` interface in a follow-up cleanup.

</details>

---

<details>
<summary>Details</summary>

### Navigation Structure and Active State

The sidebar navigation is implemented as an array of three items in the correct order: Browse Catalog, Dashboard, My Booking. Browse Catalog is a `<Link>` to `/`, while Dashboard and My Booking are buttons that trigger tab state changes via `onNavChange`.

The active state defaults to `'catalog'` (confirmed in line 80 of `MitraPortalClient.tsx`). When active, nav items display `bg-amber-600 text-white shadow-md`, providing clear visual distinction. The icon color also changes from slate-400 to amber-100 when active, reinforcing the state change. This matches the reference image's expectation of obvious active indicators.

The navigation items are rendered correctly for their type: the Browse Catalog link includes `href="/"` and closes the mobile menu on click, while Dashboard and My Booking buttons call `onNavChange()` to update tab state. The sidebar callback correctly handles both scenarios without mixing concerns.

Mobile responsiveness uses `lg:hidden` for the hamburger button and `lg:relative inset-y-0 left-0` for the sidebar, with CSS transforms (`translate-x-0` / `-translate-x-full`) for drawer animation. The mobile overlay (semi-transparent backdrop) closes the drawer when clicked. This is a standard pattern and works reliably across modern browsers.

### Layout and Structure

The top-level layout uses `flex h-screen w-full overflow-hidden bg-slate-50`, creating a full-height flexbox container. The sidebar is `fixed lg:relative w-60`, ensuring a consistent 240px width on desktop. The main content area is `flex-1 flex flex-col overflow-hidden`, allowing it to fill remaining horizontal space and preventing layout overflow.

The header is `sticky top-0 z-10` with `h-14` (56px), providing a consistent top navigation bar. The main content scrolls independently within `flex-1 overflow-y-auto`, preventing the header from scrolling out of view. This prevents the common UX problem where header context is lost during scroll.

The sidebar is `overflow-y-auto` at full height (`h-screen`), allowing user info and logout sections to scroll if the sidebar content exceeds viewport height. This is the correct behavior for deep sidebars with variable content length.

### Component Interfaces and Type Safety

`MitraPortalSidebar` defines its props interface cleanly, accepting `locale`, `session` (with sub, name, phone, centerId, cityId), DC names, `activeNav`, and `onNavChange`. All props are used and necessary. The component exports a named function component with clear prop destructuring.

`MitraPortalHeader` is minimal and correctly typed, accepting `locale`, `title`/`titleHi`, and `udharOutstanding`. It displays a bidirectional header with title on the left and udhar badge on the right. The badge correctly color-codes based on whether outstanding exists (`rose-100` / `emerald-100`).

`MitraPortalClient` receives all required props from `page.tsx`: locale, session, bookings, festivals, cities, checkoutHref, and DC names. The interface matches what the server component passes. Props are destructured with defaults where applicable.

No prop drilling issues. Data flows naturally from server (page.tsx) → client island (MitraPortalClient) → sidebar/header (presentational components).

### Business Logic Preservation

All core calculations are unchanged:
- `totalKg`: Sums booking quantities
- `totalValue`: Sums booking amounts
- `udharOutstanding`: Filters for udhar payment method + outstanding status, then sums amounts
- `activeFestival`: Finds active festival or uses first available

The booking filter logic (`filteredBookings`) correctly filters by `paymentMethod === 'udhar' && paymentStatus === 'udhar_outstanding'` for the 'udhar' filter, or `status === 'delivered'` for the 'delivered' filter. All three filter states ('all', 'udhar', 'delivered') work as before.

The expand/collapse mechanism for bookings uses `expandedBookingId` state, identical to the previous implementation. The booking detail panel shows all required fields: center name, payment method, creation date, payment status, pickup date, items table, and customer address.

The "Recent bookings" section on the dashboard displays the 5 most recent bookings sorted by `createdAt`, unchanged.

### Internationalization

Both new components receive `locale` prop and compute `hi` boolean. All UI text is rendered in both English and Hindi based on the locale. The sidebar shows user DC name preferring Hindi if available, falling back to English. The header title and udhar label switch locales correctly.

Status badge display in bookings uses a map with Hindi labels (`labelHi`) and English labels (`label`), displayed conditionally. All existing locale-aware strings are preserved.

### Form Actions and Authorization

The logout button is correctly implemented as a form with `action={customerLogoutAction}`. This ensures the logout is handled server-side as a Server Action, not client-side navigation. The import `import { customerLogoutAction } from '@/lib/actions/customerAuth'` is correct and the action exists.

No authorization logic changed. The session check (`if (!session || session.role !== 'mitra')`) remains in `page.tsx`. The sidebar and header do not perform auth checks — they trust that the server component gated access.

### Responsive Behavior and Mobile UX

The hamburger button appears only on mobile (`lg:hidden`) and is positioned `fixed top-14 left-4`, placing it in the header area without overlapping content. The button toggles `mobileOpen` state, which conditionally renders the overlay and adjusts the sidebar's `translate-x` class.

On mobile, the sidebar drawer is full-height and full-width initially but offset left by `-translate-x-full`, appearing when `mobileOpen` is true. The overlay (semi-transparent black) covers the main content and closes the drawer on click. This pattern is familiar and accessible.

The main content area is `flex-1`, so it naturally shrinks on desktop when the fixed sidebar is present, and expands to full width on mobile when the sidebar is hidden. No explicit media-query hacks needed for this behavior.

The stat cards use `grid grid-cols-2 sm:grid-cols-4`, adapting from 2 columns on mobile to 4 on tablet and up. This is responsive and matches common admin dashboard patterns.

### Code Quality and Patterns

Imports are appropriate and minimal. Lucide React icons are used consistently (ShoppingBag, LayoutDashboard, BookOpen, LogOut, Menu, X). The `'use client'` directive is correctly placed at the top of both new components and `MitraPortalClient`.

No hardcoded credentials or sensitive data. All user data comes from the session object or database queries. The logout action is handled via Server Action, not exposed credentials.

Component structure is clean. Sidebar logic (mobile drawer toggle, navigation rendering) is isolated in `MitraPortalSidebar`. Header rendering is in `MitraPortalHeader`. Tab content rendering remains in `MitraPortalClient`. No unnecessary code duplication.

The `statusBadge` helper function renders booking status badges with locale-aware labels. This is reused for all booking statuses consistently.

### Unused Prop

The `cities` prop is passed from `page.tsx` to `MitraPortalClient` but never used in the component. The data is fetched in the server component and passed down, but no UI references it. This is harmless — it doesn't break functionality or cause errors — but it represents unnecessary data transfer. The prop can be removed in a cleanup pass without risk.

### TypeScript and Build

`npm run typecheck` passes with no errors (confirmed). No TypeScript errors in the new components or modified files. All prop interfaces are correctly defined, and prop usage matches interface definitions.

The `build` command completes successfully. There's an ESLint warning about deprecated options (unrelated to these changes), but the build artifact is created. This is a pre-existing build config issue, not introduced by the redesign.

</details>

---

## File map

<details>
<summary>Changed files</summary>

- **`components/MitraPortalSidebar.tsx`** (new) — Fixed-width left navigation panel with dark styling, logo, nav items, user info, and logout. Handles mobile drawer toggle.
- **`components/MitraPortalHeader.tsx`** (new) — Minimal top header with page title and udhar outstanding badge.
- **`app/(authenticated)/mitra/portal/MitraPortalClient.tsx`** (modified) — Integrated sidebar and header, restructured from centered layout to 2-column flex layout. All business logic preserved.
- **`app/(authenticated)/mitra/portal/page.tsx`** (modified) — Removed SiteHeader/SiteFooter wrapping; kept data fetching and session checks unchanged.

</details>
