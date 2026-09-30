# Sahakar Bharati - Design System & Styling Standards

## Overview

Sahakar Bharati uses a warm, inviting design system optimized for the Indian sweet distribution market. The design emphasizes trust, celebration, and accessibility through a carefully curated color palette, typography, and component library built on **Tailwind CSS 4**.

---

## Color Palette

### Primary Theme: Orange & Amber (Festival Warmth)

Used for headers, CTAs, and positive actions. Evokes celebration and warmth.

```
Primary Orange:
  orange-600: #ea580c (bright, primary action)
  orange-700: #c2410c (hover state)
  orange-900: #78350f (dark variant)

Primary Amber:
  amber-400: #fbbf24 (highlights, accents)
  amber-500: #f59e0b (medium emphasis)
  amber-700: #b45309 (darker variant)
  amber-950: #78350f (darkest, backgrounds)
```

**Usage**:
- Header gradient: `from-orange-600 via-orange-700 to-amber-700`
- Primary buttons: `bg-orange-600 hover:bg-orange-700`
- Highlights: `bg-amber-400` text: `text-amber-400`
- Borders: `border-amber-400`

### Custom Theme Colors (app/globals.css)

**Saffron** (Indian cultural significance)
```
Saffron-600: #ea580c
Saffron-700: #c2410c
Saffron-800: #9a3412
Saffron-900: #7c2d12
Saffron-50:  #fff7ed
```

**Mustard** (complementary warm tone)
```
Mustard-400: #f59e0b
Mustard-500: #d97706
Mustard-100: #fef3c7
Mustard-50:  #fffbeb
```

**Coop Blue** (trust, reliability)
```
Coop-Blue-900: #0f2c59
Coop-Blue-800: #1a365d
Coop-Blue-700: #1d4ed8
```

### Secondary Colors

**Slate** (Neutral background, text)
```
slate-50:   #f8fafc (lightest, backgrounds)
slate-300:  #cbd5e1 (borders)
slate-700:  #334155 (text, borders)
slate-800:  #1e293b (dark backgrounds)
slate-950:  #0f172a (darkest text)
```

**Rose** (Errors, destructive actions)
```
rose-50:    #fff1f2 (light background)
rose-200:   #fecdd3 (light text)
rose-500:   #f43f5e (icon/border)
rose-950:   #4c0519 (dark background)
```

**Green** (Success, confirmations)
```
green-100:  #dcfce7 (light background)
green-600:  #16a34a (text/border)
green-800:  #166534 (dark text)
```

**Teal/Cyan** (Info, secondary actions)
```
cyan-50:    #ecf9ff
cyan-400:   #22d3ee
```

### Color Usage Guidelines

| Purpose | Colors | Examples |
|---------|--------|----------|
| **Headers & Navigation** | orange-600 to amber-700 (gradient) | SiteHeader |
| **Primary Buttons** | amber-500 hover:amber-600 | Submit buttons, CTAs |
| **Success States** | green-100 bg, green-600 text | Confirmation messages |
| **Error/Alerts** | rose-50 bg, rose-200 text, rose-500 borders | Error messages |
| **Backgrounds** | slate-50, amber-50, amber-50/30 | Page backgrounds |
| **Text** | slate-950 (dark), slate-600 (medium), slate-400 (light) | Various text levels |
| **Borders** | amber-200, amber-400, slate-200 | Form inputs, cards |
| **Disabled State** | opacity-60, cursor-not-allowed | Disabled buttons/inputs |

### Color Accessibility

- ✓ All text meets WCAG AA contrast ratios
- ✓ Amber-400 on white has 8.5:1 contrast
- ✓ Don't rely on color alone to convey information (use icons, text)
- ✓ Use text descriptions for color-coded elements

---

## Typography

### Font Stack

```css
--font-sans: 'Mukta', 'Outfit', 'IBM Plex Sans', 'Noto Sans Devanagari', system-ui, -apple-system, sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, monospace;
```

**Primary Font**: Mukta
- Ideal for Hindi/English bilingual content
- Modern, clean, excellent readability
- Loaded from Google Fonts

**Fallbacks**: Outfit → IBM Plex Sans → Noto Sans Devanagari → system-ui
- Ensures fallback for regional scripts
- Uses system fonts as last resort for performance

**Monospace Font**: IBM Plex Mono
- Used for: phone numbers, codes, reference numbers
- Example: PIN display, phone fields

### Typography Scale

```
Font Size   | Tailwind Class | Usage                              | Example
------------|----------------|----------------------------------|----------
12px        | text-xs        | Smallest labels, hints, metadata  | (optional), captions
14px        | text-sm        | Body text, form labels, nav items | Form labels, descriptions
16px        | text-base      | Default body text                | Paragraph content
18px        | text-lg        | Larger emphasis                  | Section subtitles
20px        | text-xl        | Headers, large emphasis          | Modal titles
24px        | text-2xl       | Page titles, hero text           | Page h1
28px        | text-3xl       | Section headers                  | Major sections
32px        | text-4xl       | Large titles (rare)              | Homepage hero
```

### Font Weights

```
Weight  | Tailwind Class | Usage                              | Example
--------|----------------|----------------------------------|----------
400     | font-normal    | Body text                        | Paragraph content
500     | font-medium    | Slightly emphasized text         | Form labels
600     | font-semibold  | Buttons, callouts                | CTA text
700     | font-bold      | Emphasis, headers                | Section titles
800     | font-extrabold | Strong emphasis, special titles  | Page headers
900     | font-black     | Maximum emphasis, brand          | Logo, hero titles
```

### Line Height

```
Tailwind Class | Usage
---------------|----------------------------------
leading-tight  | Headings (1.25)
leading-normal | Default body text (1.5)
leading-relaxed| Lists, descriptive text (1.625)
leading-loose  | Large text blocks (2)
```

### Letter Spacing

Global default: `letter-spacing: 0.01em` (slight tracking)

For headings: `tracking-tight` or `tracking-wide` when needed

### Typography Examples

#### Headers
```html
<!-- Page Title (h1) -->
<h1 className="text-3xl sm:text-4xl font-black text-slate-950">
  {hi ? 'सहकार भारती' : 'Sahakar Bharati'}
</h1>

<!-- Section Title (h2) -->
<h2 className="text-xl sm:text-2xl font-bold text-slate-900">
  {hi ? 'मिठाइयाँ चुनें' : 'Select Sweets'}
</h2>

<!-- Fieldset Legend -->
<legend className="text-sm font-extrabold text-amber-900 uppercase tracking-wide">
  {hi ? 'स्थान' : 'Location'}
</legend>
```

#### Body Text
```html
<!-- Standard paragraph -->
<p className="text-sm text-slate-600 leading-relaxed">
  {description}
</p>

<!-- Form label -->
<label className="block text-xs font-bold text-slate-700">
  {hi ? 'पूरा नाम *' : 'Full Name *'}
</label>

<!-- Small caption/hint -->
<span className="text-xs text-slate-400">
  {hi ? '10 अंकों का नंबर' : '10-digit number'}
</span>
```

---

## Spacing & Sizing

### Spacing Scale

Uses Tailwind's default scale (4px unit):

```
Tailwind | Pixels | Usage
---------|--------|----------------------------------
p-1      | 4px    | Micro spacing (inside badges)
p-1.5    | 6px    | Tight spacing (buttons, small components)
p-2      | 8px    | Form elements, small gaps
p-3      | 12px   | Form fields, medium spacing
p-4      | 16px   | Section padding, large gaps
p-6      | 24px   | Large spacing, card padding
p-8      | 32px   | Extra large section spacing
p-12     | 48px   | Hero sections
```

### Gap/Margin Scale

```
Tailwind | Pixels | Usage
---------|--------|----------------------------------
gap-1    | 4px    | Tight icon+text spacing
gap-2    | 8px    | Form labels, badges
gap-3    | 12px   | Form sections
gap-4    | 16px   | Component groups
gap-6    | 24px   | Major sections
gap-8    | 32px   | Page sections
```

### Container Widths

```
Tailwind     | Pixels | Breakpoint | Usage
-------------|--------|------------|----------------------------------
max-w-full   | 100%   | All        | Full width
max-w-sm     | 384px  | All        | Small containers (sidebars)
max-w-md     | 448px  | All        | Medium (forms, modals)
max-w-lg     | 512px  | All        | Large (cards)
max-w-2xl    | 672px  | All        | Extra large (main content)
max-w-7xl    | 80rem  | lg+        | Full page width (main wrapper)
```

### Responsive Spacing

Mobile-first approach:

```html
<!-- Base (mobile): 16px, small screens: 24px, medium+: 32px -->
<div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
  Content
</div>

<!-- Flexible spacing that adjusts -->
<div className="gap-2 sm:gap-3 md:gap-4">
  Items
</div>
```

---

## Borders & Corners

### Border Radius

```
Tailwind    | Pixels | Usage
------------|--------|----------------------------------
rounded-lg  | 8px    | Subtle, default for inputs
rounded-xl  | 12px   | Primary style (buttons, cards, inputs)
rounded-2xl | 16px   | Larger emphasis (modals, sections)
rounded-3xl | 24px   | Special emphasis, hero cards
rounded-full | 9999px | Circles, badges
```

### Border Width & Style

```
Tailwind     | Width | Usage
-------------|-------|----------------------------------
border       | 1px   | Default (form inputs, cards)
border-2     | 2px   | Emphasis (important containers)
border-4     | 4px   | Strong emphasis (headers, highlights)
border-dashed|       | Accent borders
```

### Border Colors

Primary borders by context:

```html
<!-- Form inputs (default) -->
<input className="border border-amber-200 ..." />

<!-- Form inputs (focused) -->
<input className="focus:border-amber-400 focus:ring-amber-400" />

<!-- Cards & containers -->
<div className="border border-amber-200 rounded-2xl" />

<!-- Alerts/Status -->
<div className="border border-rose-200" />  <!-- Error -->
<div className="border border-green-200" /> <!-- Success -->

<!-- Dividers -->
<hr className="border-amber-100" />
```

### Shadow Scale

```
Tailwind   | Usage
-----------|----------------------------------
shadow-xs  | Subtle (buttons, small elements)
shadow-sm  | Light (cards)
shadow-md  | Medium emphasis (modals, overlays)
shadow-lg  | Strong emphasis (hero sections)
shadow     | Default depth
```

### Example: Card Component

```html
<div className="rounded-2xl border-2 border-amber-200 bg-white p-6 sm:p-8 shadow-md space-y-6">
  <!-- Card content -->
</div>
```

---

## Components & Patterns

### Buttons

#### Primary Button (CTA)
```html
<button className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3.5 text-sm font-black text-white shadow-md hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
  {label}
  <ArrowRight className="w-4 h-4" />
</button>
```

**Key features**:
- Gradient background
- Icon + text
- Active scale effect (0.98)
- Disabled state with opacity
- Smooth transitions

#### Secondary Button
```html
<button className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs bg-amber-950/80 hover:bg-orange-900/90 text-amber-100 hover:text-white border border-amber-400/60">
  {label}
  <Icon className="w-3.5 h-3.5 text-amber-300" />
</button>
```

**Key features**:
- Dark background
- Small, compact
- Border accent
- Icon support
- Icon color different from text

#### Ghost Button
```html
<button className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline transition-colors">
  {label}
</button>
```

### Form Inputs

#### Text Input
```html
<input
  type="text"
  placeholder="placeholder text"
  className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
/>
```

**Key features**:
- Light background (bg-amber-50/50)
- Border and ring on focus
- Clear placeholder styling
- 2.5 padding (py-2.5)

#### Text Area
```html
<textarea
  placeholder="Enter text..."
  rows={3}
  className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
/>
```

#### Select Dropdown
```html
<select className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400">
  <option>Choose...</option>
</select>
```

#### Checkbox
```html
<input
  type="checkbox"
  className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-400 accent-amber-600 shrink-0 cursor-pointer"
/>
```

#### Form Label
```html
<label className="block text-xs font-bold text-slate-700">
  {hi ? 'लेबल *' : 'Label *'}
</label>
```

### Cards & Containers

#### Standard Card
```html
<div className="rounded-2xl border-2 border-amber-200 bg-white p-6 sm:p-8 shadow-md">
  {content}
</div>
```

#### Info/Alert Card
```html
<div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-4">
  {content}
</div>
```

#### Error Alert
```html
<div role="alert" className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
  <span className="shrink-0 mt-0.5 text-rose-500">⚠</span>
  <span>{message}</span>
</div>
```

### Section Spacing

#### Section with Title
```html
<fieldset className="space-y-4">
  <legend className="text-sm font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
    <Icon className="w-4 h-4 text-amber-600" />
    {title}
  </legend>
  
  {/* Fields go here with space-y-4 */}
</fieldset>

<hr className="border-amber-100" />
```

### Typography Components

#### Page Title
```html
<h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight">
  {title}
</h1>
```

#### Section Title
```html
<h2 className="text-xl font-bold text-slate-900">
  {title}
</h2>
```

#### Subsection Title
```html
<h3 className="text-lg font-semibold text-slate-800">
  {title}
</h3>
```

---

## Icons

### Icon Library: Lucide React

Icons used throughout the project:

```
Import: import { IconName } from 'lucide-react';

Common Icons:
  MapPin       - Location, address
  Phone/PhoneCall - Contact
  Mail         - Email
  User         - Profile, login
  Shield       - Admin, security
  Users        - Mitra, groups
  Heart        - Favorite, wishlist
  ShoppingBag  - Cart, shopping
  Plus/Minus   - Add, remove quantities
  ArrowRight   - Next, CTA
  ArrowLeft    - Back
  ChevronDown  - Dropdown
  Search       - Search input
  Clock        - Time, delivery
  AlertTriangle - Warnings
  CheckCircle2  - Success
  XCircle      - Error
  Building2    - Store, kendra
  Calendar     - Dates
  DollarSign   - Pricing
  Languages    - Language toggle
```

### Icon Sizing

```
Tailwind  | Pixels | Usage
----------|--------|----------------------------------
w-3 h-3   | 12px   | Inline icons (text)
w-3.5 h-3.5 | 14px | Form labels, badges
w-4 h-4   | 16px   | Standard icon size
w-5 h-5   | 20px   | Navigation items
w-6 h-6   | 24px   | Section icons
w-8 h-8   | 32px   | Large icons (logo)
w-12 h-12 | 48px   | Hero icons
```

### Icon + Text Pairing

```html
<!-- Icon before text -->
<button className="flex items-center gap-1.5">
  <MapPin className="w-4 h-4" />
  {label}
</button>

<!-- Icon after text -->
<button className="flex items-center gap-2">
  {label}
  <ArrowRight className="w-4 h-4" />
</button>

<!-- Standalone icon -->
<Icon className="w-6 h-6 text-amber-600" />
```

### Icon Colors

Icons inherit text color by default, or specify explicitly:

```html
<MapPin className="w-4 h-4 text-amber-600" />           <!-- Amber -->
<Shield className="w-3.5 h-3.5 text-amber-300" />      <!-- Lighter -->
<AlertTriangle className="w-5 h-5 text-rose-500" />    <!-- Error -->
<CheckCircle2 className="w-5 h-5 text-green-600" />    <!-- Success -->
```

---

## Animations & Transitions

### Transition Utilities

```
Tailwind Class     | Duration | Usage
-------------------|----------|----------------------------------
transition         | 150ms    | Default smooth changes
transition-all     | 150ms    | All properties changing
transition-colors  | 150ms    | Color changes only
transition-transform| 150ms    | Scale/translate changes
```

### Common Animations

#### Hover Scale (Interactive Feedback)
```html
<!-- Button feedback -->
<button className="transition-transform hover:scale-105 active:scale-95">
  {label}
</button>
```

#### Smooth Color Transition
```html
<a className="text-orange-600 hover:text-orange-700 transition-colors">
  {label}
</a>
```

#### Loading Spinner
```html
<span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
```

#### Fade In/Out
```html
<!-- Using motion library (imported) -->
import { motion } from 'motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  Content
</motion.div>
```

### Duration Presets

```
Use consistent timing:
  - Fast feedback: 150-200ms (hover, active)
  - Medium transition: 300-500ms (page changes)
  - Slow transition: 1000ms+ (intro animations)
```

### Easing

```
Default (ease-out): Smooth deceleration
Use:
  ease-in-out  - For smooth, natural motion
  ease-out     - For UI feedback (preferred)
  ease-in      - For animations that exit
```

---

## Responsive Design

### Breakpoints (Tailwind Standard)

```
Breakpoint | Pixels | Device           | Prefix
-----------|--------|------------------|----------
mobile     | <640px | Phone, small     | (none)
sm         | ≥640px | Tablet portrait  | sm:
md         | ≥768px | Tablet landscape | md:
lg         | ≥1024px| Small desktop    | lg:
xl         | ≥1280px| Desktop          | xl:
2xl        | ≥1536px| Large desktop    | 2xl:
```

### Mobile-First Approach

**Always start with mobile, then enhance**:

```html
<!-- Mobile: 1 column, small padding -->
<!-- Tablet (sm:): 2 columns, medium padding -->
<!-- Desktop (md:): 3 columns, large padding -->
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-6 md:px-8">
  {items}
</div>
```

### Common Responsive Patterns

#### Hidden on Mobile
```html
<!-- Hide on mobile, show on sm: and above -->
<div className="hidden sm:block md:hidden">
  Visible on tablet only
</div>
```

#### Different Spacing
```html
<!-- 16px on mobile, 24px on sm:, 32px on md: -->
<div className="px-4 sm:px-6 md:px-8">
  Content
</div>
```

#### Different Sizes
```html
<!-- Small on mobile, large on desktop -->
<img className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" alt="" />
```

#### Different Text Size
```html
<!-- 18px on mobile, 20px on sm:, 24px on md: -->
<h1 className="text-lg sm:text-xl md:text-2xl">
  {title}
</h1>
```

### Responsive Grid Examples

#### 2-Column on Desktop, 1 on Mobile
```html
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
  {items}
</div>
```

#### 3-Column on Desktop, 2 on Tablet, 1 on Mobile
```html
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
  {items}
</div>
```

---

## Accessibility Guidelines

### Text Alternatives
- All images have `alt` attributes
- Icons are decorative (don't need description) or have labels
- Use `aria-label` for icon-only buttons

### Color Contrast
- Text: Minimum 4.5:1 contrast ratio (WCAG AA)
- Large text (14pt+): Minimum 3:1 contrast ratio
- Don't rely on color alone

### Form Accessibility
- All inputs have associated `<label>` elements
- Error messages linked to fields with `aria-describedby`
- Required fields marked with `*` AND in label text
- Form grouping with `<fieldset>` and `<legend>`

### Interactive Elements
- Buttons have descriptive text or `aria-label`
- Links have purpose (not "click here")
- Focus indicators visible (tailwind `focus:ring`)
- Tab order logical (left-to-right, top-to-bottom)

### ARIA Attributes Used

```html
<!-- Alert/error messages -->
<div role="alert" aria-live="polite">
  {message}
</div>

<!-- Disabled state -->
<button disabled aria-disabled="true">
  {label}
</button>

<!-- Active/selected state -->
<button aria-pressed={isActive}>
  {label}
</button>

<!-- Expandable sections -->
<button aria-expanded={isOpen}>
  {label}
</button>

<!-- Hidden decorative elements -->
<span aria-hidden="true">❍</span>

<!-- Field description -->
<input aria-describedby="hint-id" />
<span id="hint-id">{hint}</span>
```

---

## Coding Standards & Patterns

### Class Organization

Always organize Tailwind classes consistently:

```html
<!-- Layout → Spacing → Sizing → Colors → Effects -->
<div className="
  flex items-center justify-between
  gap-4
  p-6
  rounded-xl border border-amber-200
  bg-white
  shadow-md
  transition-all hover:shadow-lg
">
```

### Responsive Class Order

Always: base → sm: → md: → lg: → xl:

```html
<!-- ✓ Correct -->
<div className="text-sm sm:text-base md:text-lg">

<!-- ✗ Wrong -->
<div className="md:text-lg sm:text-base text-sm">
```

### Conditional Classes (Template Literals)

```tsx
// ✓ Good
const buttonClass = isActive
  ? 'bg-amber-500 text-slate-950'
  : 'bg-slate-800 text-slate-300';

<button className={`px-4 py-2 rounded-xl ${buttonClass}`} />

// Or use variable
const tabClass = `flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
  isActive ? 'bg-amber-500' : 'bg-slate-800'
}`;
```

### Avoiding Long Classnames

For repeated patterns, extract to variables:

```tsx
// ✓ Better
const inputClass = 'w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400';

<input className={inputClass} />
<input className={inputClass} />
```

### Utility-First Principle

Use Tailwind utilities, not custom CSS:

```html
<!-- ✓ Good - Tailwind utility -->
<div className="flex gap-4 p-6 rounded-2xl shadow-md">

<!-- ✗ Avoid - Custom CSS -->
<style>
  .custom-card {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
</style>
<div className="custom-card">
```

---

## Print Styles

Print stylesheet (`@media print`) configured in `globals.css`:

```css
/* Print uses white background and black text */
@media print {
  body {
    background-color: #ffffff !important;
    color: #000000 !important;
  }

  .no-print {
    display: none !important; /* Hide non-print elements */
  }

  .printable-area {
    visibility: visible !important; /* Show only print area */
  }
}
```

---

## Scrollbar Styling

Hidden globally (no scrollbars visible):

```css
::-webkit-scrollbar {
  width: 0px;
  height: 0px;
  background: transparent;
}
```

Can be re-enabled per component with `no-scrollbar` class if needed.

---

## Performance Considerations

### Image Optimization
- Use `<Image>` component (from Next.js)
- Always include `alt` text
- Use `CachedImage` wrapper for additional optimization
- Lazy load below-fold images

### CSS-in-JS
- Tailwind generates only used classes
- No custom CSS unless absolutely necessary
- Production CSS minified and optimized

### Animation Performance
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`/`height`
- Limit simultaneous animations

### Dark Mode
- Not implemented (light-only theme)
- If needed in future, use Tailwind's `dark:` prefix

---

## Component Examples

### Example 1: Login Form Tab Component

```tsx
const tabBase =
  'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all';
const tabActive = 'bg-amber-500 text-slate-950 shadow';
const tabInactive = 'bg-slate-800 text-slate-300 hover:bg-slate-700';

<div className="flex gap-2 p-1 bg-slate-800/60 rounded-2xl">
  <button
    className={`${tabBase} ${method === 'phone' ? tabActive : tabInactive}`}
    onClick={() => setMethod('phone')}
  >
    <Smartphone className="w-3.5 h-3.5" />
    Mobile + PIN
  </button>
  <button
    className={`${tabBase} ${method === 'email' ? tabActive : tabInactive}`}
    onClick={() => setMethod('email')}
  >
    <Mail className="w-3.5 h-3.5" />
    Email + Password
  </button>
</div>
```

### Example 2: Error Alert

```tsx
<div
  role="alert"
  className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700"
>
  <span className="shrink-0 mt-0.5 text-rose-500">⚠</span>
  <span>{errorMessage}</span>
</div>
```

### Example 3: Header Navigation Button

```tsx
<Link
  href="/mitra"
  className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs bg-amber-950/80 hover:bg-orange-900/90 text-amber-100 hover:text-white border border-amber-400/60"
>
  <Users className="w-3.5 h-3.5 text-amber-300" />
  <span>Mitra</span>
</Link>
```

### Example 4: Hero Section

```tsx
<div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 to-orange-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-24">
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 leading-tight">
      {title}
    </h1>
    <p className="mt-4 text-lg text-slate-700 max-w-2xl">
      {description}
    </p>
  </div>
</div>
```

---

## Checklist for New Features

When adding new components or pages:

- [ ] Use established color palette (orange, amber, slate)
- [ ] Follow typography scale (use text-xs to text-4xl)
- [ ] Mobile-first responsive design (sm:, md:, lg: prefixes)
- [ ] Proper spacing and padding (p-4, gap-4, etc.)
- [ ] Rounded corners for modern look (rounded-xl, rounded-2xl)
- [ ] Smooth transitions (transition-all, hover: states)
- [ ] Icons from lucide-react library
- [ ] Accessible form labels and ARIA attributes
- [ ] Focus indicators for keyboard navigation
- [ ] Error/success states with proper colors
- [ ] Contrast ratios meet WCAG AA minimum
- [ ] No hardcoded colors (use Tailwind classes)
- [ ] Bilingual text support (hi/en toggle)
- [ ] Test on mobile (< 640px) and desktop (≥ 1024px)

---

## References

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/
- **WCAG Accessibility**: https://www.w3.org/WAI/WCAG21/quickref/
- **Next.js Styling**: https://nextjs.org/docs/app/building-your-application/styling

---

## Summary

The Sahakar Bharati design system prioritizes:
1. **Warmth & Trust** - Orange/amber primary colors
2. **Clarity** - Clean typography, proper contrast
3. **Accessibility** - WCAG AA compliance, keyboard navigation
4. **Responsiveness** - Mobile-first, multiple breakpoints
5. **Consistency** - Reusable patterns and components
6. **Performance** - Optimized images, minimal CSS

Follow these standards to maintain a cohesive, professional, and accessible user experience.
