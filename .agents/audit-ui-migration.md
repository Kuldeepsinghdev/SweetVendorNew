# UI Architecture Audit — shadcn/ui Migration

**Project:** Sahakar Bharati (Next.js 15 App Router)  
**Audit Date:** 2025  
**Branch:** `ui/shadcn-migration`  
**Scope:** Comprehensive analysis of existing UI stack, component inventory, and shadcn/ui integration readiness

---

## 1. Project Configuration

### Framework & Environment
- **Next.js Version:** 15.0.0
- **React Version:** 19.0.1
- **TypeScript Version:** 5.8.2 (strict mode enabled)
- **Router:** App Router (`/app` directory structure with Server Components by default)
- **Node:** Modules are ESM (`"type": "module"`)

### TypeScript Configuration
- **Target:** ES2022
- **Module Resolution:** bundler
- **JSX Mode:** preserve
- **Strict Mode:** Enabled (`"strict": true`)
- **Path Aliases:** `@/*` → `/` (root of project)

### Architecture Notes
- Server Components are the default; `'use client'` used only for interactive islands
- Drizzle ORM with Postgres for data
- Server Actions used for mutations and authoritative server-side logic
- No legacy API routes; all public writes go through validated Server Actions

---

## 2. Current UI Dependencies

| Package | Version | Category | Status |
|---------|---------|----------|--------|
| lucide-react | 0.546.0 | Icons | ✅ In Use |
| motion | 12.23.24 | Animations | ⚠️ Not currently used in codebase |
| recharts | 3.10.1 | Charts | ⚠️ Not currently used in codebase |
| zod | 3.23.8 | Validation | ✅ In Use (Server Actions) |
| @tailwindcss/postcss | 4.1.14 (devDep) | CSS Framework | ✅ In Use |
| tailwindcss | 4.1.14 (devDep) | CSS Framework | ✅ In Use |
| autoprefixer | 10.4.21 (devDep) | PostCSS | ✅ In Use |
| @playwright/test | 1.63.0 (devDep) | E2E Testing | ✅ Testing Framework |

### Notably **NOT** Installed
- `@radix-ui/*` (no Radix UI primitives yet)
- `class-variance-authority` (no CVA)
- `clsx` (no utility-first class merging)
- `tailwind-merge` (no class deduplication)
- React Hook Form (forms use native HTML + Server Actions)
- UI component libraries (shadcn/ui not installed)

---

## 3. Design Tokens & Theme

### Tailwind Configuration
**Status:** Tailwind CSS v4 with `@tailwindcss/postcss` plugin  
**File Location:** Not found (using Tailwind v4 defaults with inline directives in `globals.css`)

**Key Observation:** The application uses Tailwind v4 (latest) with built-in CSS variable support. No custom `tailwind.config.ts` exists; defaults are used.

### CSS Variables & Design System (from `/app/globals.css`)

#### Fonts
```css
--font-sans: 'Mukta', 'Outfit', 'IBM Plex Sans', 'Noto Sans Devanagari', system-ui, -apple-system, sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, monospace;
```

#### Color Palette (Custom Utility Classes)

**Primary Brand Colors (Saffron/Orange Theme):**
- Orange: `#ea580c` (600), `#c2410c` (700), `#9a3412` (800), `#7c2d12` (900), `#fff7ed` (50)
- Amber: `#fbbf24` (400), `#f59e0b` (500), `#d97706` (600), `#b45309` (700), `#92400e` (800), `#78350f` (900)
- Cooperative Blue: `#0f2c59` (900), `#1a365d` (800), `#1d4ed8` (700)

**Secondary Palette:**
- Slate (neutrals): `50–950` range for backgrounds, borders, text
- Green (success): `100–800` range
- Rose/Red (errors): `50–950` range
- Blue (info): `50–950` range
- Cyan/Teal (accents): `50–500` range

#### Responsive Typography & Spacing
- **Base Font:** Mukta with fallbacks (Indian language support)
- **Letter Spacing:** `0.01em` globally
- **Font Smoothing:** `-webkit-font-smoothing: antialiased`
- **Background:** `#f8fafc` (light slate), `#0f172a` (text)

#### Special Utilities
- **Scrollbar Hiding:** Hidden globally via `width: 0px`, `scrollbar-width: none` for Firefox
- **Print Styles:** `.printable-area` fixed positioning and visibility rules for receipt/invoice printing

### Theme Strategy
- **Light Mode Default:** No explicit dark mode variables defined; light-mode only at present
- **Color Organization:** Tailwind's default color scale extended with custom saffron/mustard/blue shades via utility classes
- **No CSS Variables (shadcn-style):** Currently using Tailwind utility classes directly (e.g., `bg-orange-600`)

---

## 4. Component Inventory

### Components Directory Structure
```
/components
├── CatalogBrowser.tsx              (public sweet catalog, client island)
├── CachedImage.tsx                 (next/image wrapper with Supabase CDN)
├── FestivalBanner.tsx              (seasonal banners)
├── FooterPolicyModals.tsx           (footer policy dialogs, client island)
├── LanguageToggle.tsx              (localization switcher, client island)
├── SahakarLogo.tsx                 (brand logo component)
├── SiteFooter.tsx                  (public footer, Server Component)
├── SiteHeader.tsx                  (public header, Server Component)
├── cart/
│   └── CartProvider.tsx            (shopping cart context, client-only state)
├── checkout/
│   └── CheckoutClient.tsx          (checkout form & payment preview, client island)
└── invoice/
    └── InvoiceDisplay.tsx          (booking receipt/invoice display)
```

### Component Audit by Type

| Component | File | Type | Current Implementation | shadcn Equivalent | Migrate? | Notes |
|-----------|------|------|------------------------|-------------------|----------|-------|
| **Buttons** | Inline in pages/modals | Primitive | Native `<button>` with Tailwind classes | `shadcn/ui Button` | ✅ YES | Consistent button pattern; benefits from variants |
| **Inputs** | Forms (LoginForm, MitraApplyForm) | Primitive | Native `<input>` with Tailwind | `shadcn/ui Input` | ✅ YES | Forms are plain HTML; low coupling |
| **Modals/Dialogs** | FooterPolicyModals | Primitive | Custom `<div>` with backdrop, fixed positioning | `shadcn/ui Dialog` | ✅ YES | Simple modals; no focus trap yet |
| **Tabs** | SuperAdminClient | Primitive | Custom `<button>` bar with conditional styling | `shadcn/ui Tabs` | ✅ YES | Tab switching is straightforward |
| **Cards** | SuperAdminClient, panels | Primitive | Custom `<div>` with `rounded-2xl bg-* p-*` | `shadcn/ui Card` | ✅ YES | Repeated pattern; could standardize |
| **Icons** | Throughout (lucide-react) | Primitive | Lucide React icons | ✅ Already optimal | — | Keep as-is; pairs well with shadcn |
| **Language Toggle** | LanguageToggle.tsx | Custom | Client state + optimistic UI | — | ❌ NO | Business-specific; keep custom |
| **Cart Provider** | CartProvider.tsx | Custom | Context + localStorage | — | ❌ NO | Business logic; keep custom |
| **Catalog Browser** | CatalogBrowser.tsx | Complex | Product catalog with filters/variants | — | ❌ NO | Business-specific; extract primitives to shadcn |
| **Checkout Form** | CheckoutClient.tsx | Complex | Form + preview + booking creation | — | ❌ NO | Business-specific; extract primitives to shadcn |
| **Forms (Login, Apply)** | CustomerLoginForm, MitraApplyForm | Business | Server Action-driven forms | — | ❌ NO (as whole), ✅ YES (primitives) | Keep form structure; upgrade primitives to shadcn |
| **Super Admin Panels** | SuperAdminClient | Complex | Tabbed dashboard with CRUD forms | — | ❌ NO (as whole), ✅ YES (primitives) | Keep business logic; primitives → shadcn |
| **Site Header/Footer** | SiteHeader, SiteFooter | Custom | Brand layout with navigation | — | ❌ NO | Business layout; keep custom |
| **Invoices** | InvoiceDisplay | Business | Print-optimized receipt/invoice | — | ❌ NO | Business document; keep custom |

### Custom UI Patterns Identified

1. **Button Variants:**
   - Primary (orange): `bg-orange-600 hover:bg-orange-700`
   - Secondary (amber): `bg-amber-950/80 hover:bg-amber-900`
   - Destructive (rose): `bg-rose-950/70 hover:bg-rose-900`

2. **Input States:**
   - Default: `border-slate-300 focus:border-orange-500`
   - Error: `border-rose-500 bg-rose-50`
   - Disabled: `opacity-60 cursor-not-allowed`

3. **Modal Pattern (FooterPolicyModals):**
   - Fixed overlay with backdrop blur
   - Centered dialog with max-w constraint
   - X button to close
   - No focus trap; Escape key not handled

4. **Tab Pattern (SuperAdminClient):**
   - Flex row of buttons with active state
   - Badge for notification counts

5. **Error Handling:**
   - Server-returned errors shown in `<div role="alert">`
   - Inline validation errors (placeholder text)

---

## 5. Forms & Validation Summary

### Form Framework
- **No React Hook Form:** All forms use native HTML `<form>` elements
- **Validation Library:** Zod schemas in Server Actions (`/lib/actions/*.ts`)
- **Pattern:** Form action → useActionState() → Zod validation server-side → Error returned to client

### Existing Forms
1. **CustomerLoginForm** — Phone + PIN vs. Email + Password (tabbed switcher)
2. **MitraApplyForm** — Multi-field application with city/DC selection
3. **CheckoutClient** — Name, phone, coupon code, payment method, delivery center

### Validation Patterns
- All Zod schemas in Server Actions (server-side validation only)
- Phone numbers: 10-digit pattern validation
- Email: HTML5 validation
- Required fields: HTML5 `required` attribute
- Error messages: Returned from server, displayed in alert/inline

### Forms & shadcn Integration Plan
- Keep form structure and validation (Server Actions + Zod)
- Upgrade `<input>`, `<label>`, `<button>` to shadcn primitives
- Maintain server-side validation authoritatively

---

## 6. Dialogs & Overlays Summary

### Current Dialog Implementations

| Component | Pattern | Features | Accessibility |
|-----------|---------|----------|---|
| **FooterPolicyModals** | Controlled modal state; custom div overlay | Fixed backdrop, centered content, X button | ⚠️ No focus trap; no Escape key handling; no role="dialog" |
| **Login Form** | Full-screen form page (not modal) | Clean centered card | ✅ Semantic HTML |

### Modal Features to Migrate
- Focus management (auto-focus, return focus on close)
- Escape key handling
- Click-outside to close (optional)
- Keyboard navigation (Tab trap)
- Semantic `role="dialog"` and `aria-labelledby`

### Migration to shadcn/ui Dialog
The current modal pattern can directly use shadcn's Dialog (Radix Dialog wrapper):
1. Replace `useState(activeModal)` with shadcn Dialog state
2. Move overlay/content structure into `<Dialog>` / `<DialogContent>`
3. Get focus management + keyboard handling automatically
4. Maintain existing visual styling (backdrop blur, border, etc.)

---

## 7. Current Library Usage Verification

### Verified In Use
- **lucide-react:** Icons throughout (Header, Footer, Forms, etc.)
- **zod:** All Server Actions validate with Zod schemas
- **tailwindcss:** All component styling uses Tailwind utility classes

### Not Used but Installed
- **motion:** Listed in dependencies but not used in application code
- **recharts:** Listed in dependencies but not used in application code

### Not Installed
- Radix UI components
- React Hook Form
- React Query / SWR
- Styled-components or CSS-in-JS
- Headless UI

---

## 8. App Router & Server Component Patterns

### Architecture Summary
- **Default:** Server Components in `/app` (async components, direct DB queries)
- **Client Islands:** Marked with `'use client'` for:
  - User interaction (forms, modals, toggles)
  - Context (CartProvider)
  - Hooks requiring client runtime
- **Data Fetching:** Direct Drizzle queries in Server Components
- **Session/Auth:** Resolved server-side; JWT cookies (httpOnly, secure, SameSite)

### Notable Pages
- `/` (home) — Server Component, includes CatalogBrowser (client island)
- `/(auth)/login` — Server Component, includes CustomerLoginForm (client island)
- `/(dashboard)/super-admin` — Server Component with SuperAdminClient (client island)
- `/(authenticated)/checkout` — Server Component, includes CheckoutClient (client island)

---

## 9. Accessibility & Responsive Design

### Current Accessibility
- Semantic HTML (`<header>`, `<footer>`, `<nav>`, `<form>`, `<button>`, `role="alert">`)
- Icons paired with text labels
- Form labels properly associated via `htmlFor`
- aria-labels on icon buttons
- ⚠️ **Gaps:** No focus-visible indicators; modals lack focus trap; no ARIA live regions

### Responsive Design
- Mobile-first Tailwind approach (`sm:`, `md:`, `lg:` breakpoints)
- Common patterns:
  - `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - `hidden sm:flex`
  - `px-2.5 sm:px-4`
  - `text-sm sm:text-lg`
- Tested breakpoints: 375px (mobile), 768px (tablet), 1280px+ (desktop)

---

## 10. Migration Risks & Special Considerations

### 🔴 **High-Risk Areas**

1. **Color Token Conflicts**
   - Current: Tailwind utility classes (`bg-orange-600`)
   - shadcn/ui: Uses CSS variables (`--primary`, `--secondary`, etc.)
   - **Mitigation:** Map existing colors to shadcn CSS variable names in `globals.css`

2. **No Tailwind Config File**
   - Current: Tailwind v4 implicit defaults
   - shadcn/ui: Expects `components.json` and Tailwind config
   - **Mitigation:** Pre-create minimal `tailwind.config.ts` before running `shadcn-ui` CLI

3. **Business Logic in Components**
   - CatalogBrowser, CheckoutClient, SuperAdminClient contain business state + logic
   - **Mitigation:** Migrate only UI primitives; keep business components untouched

### 🟡 **Medium-Risk Areas**

4. **Server Actions & Form Validation**
   - Current pattern uses `useActionState()` + native HTML (already best-practice)
   - shadcn Form adds react-hook-form dependency (optional)
   - **Mitigation:** Keep Server Action pattern; use shadcn Input/Label/Button only

5. **Custom Modal Behavior**
   - Current: Simple backdrop + centered div; no focus management
   - shadcn Dialog: Includes focus trap, Escape handling, ARIA attributes
   - **Mitigation:** Test modal behavior after migration

6. **Motion & Recharts**
   - Listed as dependencies but unused
   - **Mitigation:** Document at migration time

### 🟢 **Low-Risk Areas**

7. **Icon Library** — lucide-react pairs perfectly with shadcn
8. **TypeScript & Strict Mode** — All required types present
9. **Accessibility** — shadcn provides WCAG baseline
10. **Locale/i18n** — Not affected by UI framework change

---

## 11. shadcn/ui Configuration Recommendations

### 1. Install shadcn/ui CLI
```bash
npm install -D shadcn-ui
```

### 2. Initialize Configuration
```bash
npx shadcn-ui@latest init
```

**Recommended Answers:**
- Use TypeScript? → **Yes**
- Style? → **Default**
- Color? → **Orange** (matches existing branding)
- Components path? → `components`
- Utils path? → `lib/utils`
- Configure TypeScript path alias? → **Yes**
- Install dependencies? → **Yes**

### 3. Create `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';
import defaultConfig from 'tailwindcss/defaultConfig';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultConfig.theme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultConfig.theme.fontFamily.mono],
      },
    },
  },
  plugins: [],
};

export default config;
```

### 4. Update `globals.css` with shadcn CSS Variables
```css
@import "tailwindcss";

@layer base {
  :root {
    --font-sans: 'Mukta', 'Outfit', 'IBM Plex Sans', 'Noto Sans Devanagari', system-ui;
    --font-mono: 'IBM Plex Mono', ui-monospace;
    
    /* shadcn/ui CSS variables — map to existing colors */
    --background: #f8fafc;
    --foreground: #0f172a;
    
    --primary: #ea580c;
    --primary-foreground: #ffffff;
    
    --secondary: #f59e0b;
    --secondary-foreground: #78350f;
    
    --destructive: #e11d48;
    --destructive-foreground: #fff1f2;
    
    --muted: #64748b;
    --muted-foreground: #f8fafc;
    
    --accent: #f97316;
    --accent-foreground: #ffffff;
    
    --card: #ffffff;
    --card-foreground: #0f172a;
    
    --popover: #ffffff;
    --popover-foreground: #0f172a;
    
    --border: #e2e8f0;
    --input: #e2e8f0;
    --ring: #ea580c;
  }

  body {
    font-family: var(--font-sans);
    background-color: var(--background);
    color: var(--foreground);
    -webkit-font-smoothing: antialiased;
    letter-spacing: 0.01em;
  }
}

/* Existing custom utilities stay — they coexist with shadcn CSS variables */
.bg-saffron-600 { background-color: #ea580c; }
/* ... etc ... */

/* Print styles unchanged */
@media print { /* ... */ }
```

### 5. Create `lib/utils.ts`
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 6. `components.json` (auto-generated)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "aliasPrefix": "@",
  "alias": {
    "components": "@/components/ui",
    "utils": "@/lib/utils"
  }
}
```

---

## 12. Component Migration Sequence (Recommended)

### Phase 1: Infrastructure (No UI Changes)
1. Create `tailwind.config.ts`
2. Add `lib/utils.ts` with `cn()` utility
3. Create `components.json` via `shadcn-ui init`
4. Run `npm install`
5. **Verify:** TypeScript builds, no visual changes

### Phase 2: Primitive Components (Low Risk)
**Target:** Buttons, Inputs, Labels  
**Effort:** ~1–2 hours

1. `npx shadcn-ui@latest add button`
2. `npx shadcn-ui@latest add input`
3. `npx shadcn-ui@latest add label`
4. Replace existing `<button>` → `<Button>`
5. Replace existing `<input>` → `<Input>`
6. Replace existing `<label>` → `<Label>`
7. **Test:** Forms work; styling intact

### Phase 3: Card & Badge Components
**Target:** StatCard, summary panels  
**Effort:** ~30 mins

1. `npx shadcn-ui@latest add card`
2. `npx shadcn-ui@latest add badge`
3. Refactor StatCard to use shadcn Card
4. Use Badge for notification counts
5. **Test:** Admin dashboard renders correctly

### Phase 4: Tabs Component
**Target:** SuperAdminClient tabs  
**Effort:** ~30 mins

1. `npx shadcn-ui@latest add tabs`
2. Replace custom tab buttons → shadcn Tabs
3. Keep business logic (content panels) unchanged
4. **Test:** Tab switching; no functional change

### Phase 5: Dialog Component
**Target:** FooterPolicyModals  
**Effort:** ~1 hour

1. `npx shadcn-ui@latest add dialog`
2. Wrap FooterPolicyModals in shadcn Dialog
3. Test focus management, Escape key, click-outside
4. Preserve visual styling (backdrop blur, border, max-width)
5. **Test:** Modal opens, closes, keyboard navigation works

### Phase 6: Advanced Components (As Needed)
1. `alert` — for error/warning banners
2. `select` — if checkout needs select
3. `scroll-area` — for scrollable lists
4. `toast/sonner` — for notifications (optional)

### Phase 7: Polish & Accessibility
1. Add focus-visible indicators
2. Test keyboard navigation end-to-end
3. Verify WCAG compliance
4. Test responsive behavior (375px, 768px, 1280px)

---

## 13. Dependencies Summary

### New Production Dependencies
| Package | Purpose |
|---------|---------|
| @radix-ui/primitive | Radix primitive base |
| @radix-ui/dialog | Dialog/modal component |
| @radix-ui/tabs | Tabs component |
| (additional @radix-ui/* as needed) | Radix dependencies for each shadcn component |
| class-variance-authority | Component variant management |
| clsx | Class name utility |
| tailwind-merge | Merge Tailwind classes safely |

**Note:** Use `npx shadcn-ui@latest add <component>` to install only what's needed.

### Existing Dependencies (Keep)
- lucide-react (icons) — ✅ No changes
- zod (validation) — ✅ No changes
- tailwindcss v4 — ✅ No changes
- motion (unused, can remove or keep) — ⚠️ TBD
- recharts (unused, can remove or keep) — ⚠️ TBD

---

## 14. Testing & Verification Plan

### After Each Phase
- [ ] TypeScript build passes (`npm run typecheck`)
- [ ] No console errors/warnings
- [ ] Visuals match pre-migration (no color/spacing shifts)
- [ ] All Playwright E2E tests pass
- [ ] Responsive design verified (375px, 768px, 1280px)
- [ ] Keyboard navigation works (Tab, Escape, Enter)
- [ ] Server Actions still validate and error correctly

### Full Migration Checklist
- [ ] All shadcn components added
- [ ] All custom components updated to use shadcn primitives
- [ ] Existing Tailwind classes coexist with shadcn CSS variables (no conflicts)
- [ ] No breaking changes to application logic
- [ ] Accessibility audit passed
- [ ] Performance metrics unchanged
- [ ] Tests pass
- [ ] Documentation updated

---

## 15. Key Findings & Takeaways

### Strengths of Current Architecture
1. **Clean separation:** UI logic in components; business logic in Server Actions
2. **Server-authoritative:** No client-side pricing, auth, or sensitive logic
3. **Accessible baseline:** Semantic HTML, labels, roles
4. **Type-safe:** Full TypeScript strict mode; Zod validation
5. **Performant:** Server-side rendering; minimal JS in client bundle
6. **Bilingual:** Hindi/English UI throughout

### Opportunities for shadcn/ui
1. **Consistency:** Formalize button, input, dialog patterns with shadcn
2. **Accessibility:** Get focus management, keyboard handling automatically
3. **Maintainability:** Less custom CSS; rely on shadcn + Tailwind
4. **Component Library:** Standardized variants and sizes
5. **Theme Control:** CSS variables for easy future theming

### Migration Strategy Summary
- **Phased approach:** Low-risk primitives first, complex components last
- **Preserve logic:** Business components stay custom; extract UI primitives to shadcn
- **Server Components:** No changes; App Router unaffected
- **No react-hook-form required:** Current Server Action + native HTML pattern is best-practice
- **Incremental:** Each component added independently; no big bang rewrite

---

## Appendix: File References

### Key Files Inspected
- `/package.json` — Dependencies, build scripts
- `/tsconfig.json` — TypeScript configuration
- `/next.config.js` — Next.js configuration
- `/postcss.config.mjs` — PostCSS plugins
- `/app/globals.css` — Global styles, color utilities
- `/components/` — All component files
- `/app/(auth)/login/CustomerLoginForm.tsx` — Form pattern example
- `/app/(dashboard)/super-admin/SuperAdminClient.tsx` — Complex component example

### Test Files
- E2E tests in `/tests/e2e/` (Playwright)

---

**Audit Complete.**  
Ready to proceed with Phase 1 configuration and Phase 2 primitive component migration.
