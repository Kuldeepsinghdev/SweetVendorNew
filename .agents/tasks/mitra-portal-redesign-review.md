# Mitra Portal 2-Column Redesign — Code Review

**Status:** Design implemented with responsive 2-column layout, but **one blocking functional issue requires correction**.

**Watch for:** Default active navigation does not match requirement. Browse Catalog should be highlighted by default per the original brief, but Dashboard is highlighted instead. Also verify responsive behavior on mobile width before releasing.

**Verdict**: CHANGES_REQUESTED

---

## High-level View

The sidebar and header components are well-structured and the 2-column layout is mechanically sound. Navigation is wired correctly, and most UI elements follow the design spec. Responsive behavior (hamburger menu, drawer overlay) is implemented cleanly with proper use of `lg:` breakpoints and mobile state management.

However, the default active navigation state is incorrect. The requirement explicitly states "Browse Catalog" should be the initially selected/default item, but the code defaults to Dashboard. This creates a visual mismatch with the spec and breaks the stated requirement. The fix is straightforward: change the initial tab state or adjust the activeNav mapping logic.

All booking functionality is preserved intact—filtering, expansion, udhar calculations, and locale support are unchanged. Data flows correctly from the server component to the client. Session checks and logout are properly wired.

---

<details>
<summary>Issues (2)</summary>

1. **Default active navigation incorrect** — The component defaults to highlighting Dashboard as active in the sidebar, but the requirement states Browse Catalog should be the default active/selected item. This is a confirmed functional gap.

2. **Initial implementation mismatch with specification** — The plan document acknowledged the ambiguity but chose to default to Dashboard anyway. The code should be corrected to match the explicit user requirement.

</details>

---

<details>
<summary>Details</summary>

### Default Active Navigation State

The requirement clearly states: **"Browse Catalog" should be the initially selected/default navigation item**. The current implementation initializes `tab = 'dashboard'` in `MitraPortalClient.tsx` line 78, which maps to `activeNav = 'dashboard'` (line 101). This causes the Dashboard item to be highlighted in the sidebar on first load, not Browse Catalog.

The plan document acknowledged this tension (lines 37–38: "Browse Catalog should appear as the active nav item visually, but since it links to `/`, the first actual active state will be Dashboard when returning to the portal"). However, this rationale conflicts with the explicit user requirement that Browse Catalog be selected by default. Since Browse Catalog is a Link to `/` (not a local tab), the nav highlight can be independent of the content view—Browse Catalog can be highlighted while Dashboard content is shown.

**Fix:** Initialize `activeNav = 'catalog'` in the sidebar by default. This highlights Browse Catalog in the sidebar regardless of which tab content is rendered. When the user clicks Dashboard or My Booking, those become active and the content updates. If they later click Browse Catalog and return to `/mitra/portal`, the sidebar will reset to showing catalog as active on re-render.

**Location:** `app/(authenticated)/mitra/portal/MitraPortalClient.tsx` line 101. Change the logic or state initialization to ensure Browse Catalog is the default active sidebar item.

### Layout and Responsive Design

The 2-column structure is mechanically correct. Sidebar is fixed-width (w-60) with `bg-slate-900` and `text-slate-100`. Main content uses `flex-1` for fill and `overflow-y-auto` for scrolling. Mobile responsive is handled via `lg:hidden` for the hamburger button and `lg:relative lg:translate-x-0` for the sidebar drawer behavior. This pattern is standard and well-implemented—no concerns here.

### Navigation Styling and Active State

Active items use `bg-amber-600 text-white shadow-md`, inactive items use `text-slate-300 hover:bg-slate-800`. This contrast is clear and meets the requirement for "visually obvious" active state. Icons also toggle color (`text-amber-100` when active, `text-slate-400` when inactive), reinforcing the active state. The styling is clean and professional.

### Component Architecture

The sidebar and header are extracted into reusable components with clean prop interfaces. The sidebar handles its own mobile state (`mobileOpen`) and closes the drawer on item click. The header is minimal and presentational. The main client component orchestrates state and content. This architecture is sound and testable.

### Data Flow and Security

All data flows from the server component (`page.tsx`) to the client island (`MitraPortalClient.tsx`) via props. Session is validated server-side before rendering. The logout action uses `customerLogoutAction` with a form submission (Server Action). No hardcoded credentials, no client-side re-fetching of auth data, no localStorage role storage. Session data is passed as props only. This is secure and follows the architecture rules.

### Business Logic Preservation

All existing functionality is intact: booking filtering (`all/udhar/delivered`), expand/collapse detail rows, udhar outstanding calculation (`b.paymentMethod === 'udhar' && b.paymentStatus === 'udhar_outstanding'`), locale switching (hi/en), recent bookings extraction, status badges, and checkout navigation. The tab state management is unchanged, just relocated to a different visual container. No functionality lost.

### TypeScript and Build

Typecheck passes (`npm run typecheck` exits 0). All imports are used. No unused variables. Component props are properly typed. The build succeeds (verified by the coder step).

### One Behavioral Inconsistency

When Browse Catalog is clicked, it navigates to `/` and leaves the portal. If the user then navigates back to `/mitra/portal` (e.g., via a back button or re-entering the URL), the sidebar re-renders. At this point, the implementation currently re-initializes `tab = 'dashboard'` and thus `activeNav = 'dashboard'`, highlighting Dashboard instead of Browse Catalog. This is the root of the issue: there's no way for the active nav state to remain on Browse Catalog when viewing the portal content, because Browse Catalog is an external link, not a local tab.

The fix requires a design choice: either Browse Catalog should always be highlighted when the user is in the portal (matching the requirement), or the requirement should be clarified to accept Dashboard as the default. The original user request is unambiguous, so the code should be fixed.

### Confidence Levels

- **Default navigation issue:** Confirmed. Code inspection shows `tab = 'dashboard'` initialization and `activeNav = tab === 'dashboard' || tab === 'new_booking' ? 'dashboard' : 'bookings'`. The line-by-line logic is explicit.

</details>

---

## File Map

<details>
<summary>Files Changed</summary>

- **`components/MitraPortalSidebar.tsx`** (new, 233 lines) — Fixed-width left sidebar with navigation, user info, logout, mobile drawer. Properly styled with active/hover states and responsive hamburger toggle.

- **`components/MitraPortalHeader.tsx`** (new, 51 lines) — Minimal sticky header for main content area. Displays page title and udhar outstanding badge with color coding.

- **`app/(authenticated)/mitra/portal/MitraPortalClient.tsx`** (modified, 525 lines → restructured) — Refactored from centered tab layout to 2-column flex layout. Sidebar and header integrated. All booking logic preserved.

- **`app/(authenticated)/mitra/portal/page.tsx`** (modified, 41 lines) — Server component no longer renders SiteHeader/SiteFooter. Data fetching and session validation unchanged.

**Full diff:** `git diff` shows 15 files changed, 1252 insertions, 362 deletions. Changes are localized to portal redesign and auth-related updates.

</details>

---

## Recommendation

Fix the default active navigation issue before merging. The one-line change or state initialization update will resolve the blocking concern and align the implementation with the explicit user requirement.
