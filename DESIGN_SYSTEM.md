# Coltek Academy — Design System

The source of truth for how Coltek Academy looks and behaves. Read it before any UI change (see [CLAUDE.md](CLAUDE.md)).

**Status legend used throughout**

- **Existing** — already in the code today ([app/globals.css](app/globals.css), [components/ui/](components/ui/)).
- **Proposed** — to be implemented in the design-foundation stage. Not in the code yet.
- **Confirm** — needs a decision from the project owner before use.

Stack: Tailwind CSS v4 tokens in `@theme inline` ([app/globals.css](app/globals.css)) + shadcn/ui ("new-york") + lucide-react. Tokens are referenced as Tailwind utilities (`bg-primary`, `text-muted-foreground`, …). Never hard-code the values below in components.

---

## 1. Design principles

Coltek Academy should feel like a **serious technology academy**, not a template.

| Principle | In practice |
|---|---|
| Professional | Restrained palette, consistent components, no gimmicks |
| Modern | Clean type, generous whitespace, crisp imagery |
| Technical | Precise alignment, structured information (curriculum, schedules, prices) |
| Educational | Content first; readable line lengths; clear learning outcomes |
| Trustworthy | Real data only, consistent facts across pages, clear policies |
| Practical | Every page leads to a concrete next step |
| Accessible | WCAG 2.1 AA as the floor |
| Clean | One idea per section; few, purposeful visual devices |
| Confident | Strong headings, decisive single primary CTA |
| Human | Real people (leadership photos, real testimonials), plain language |

---

## 2. Brand

| Asset | File | Notes |
|---|---|---|
| Logo (wordmark + icon row) | `public/Coltek Academy.png` | 8880×3238 PNG, 488 KB. **Must be exported** to an SVG or ≤ 600 px-wide PNG/WebP before redesign use. Keep clear space ≥ the height of the "A" in ACADEMY. Do not recolor, stretch or place on busy imagery. |
| Favicon | `public/fav-16x16.png`, `public/fav-32x32.png` | Apple touch icon currently reuses 32×32 — a 180×180 export is needed. |
| Theme color | `themeColor: "#0A2463"` in [app/layout.tsx](app/layout.tsx) | Browser chrome color. |
| Typeface | **Inter** (sans), Geist Mono (mono) via `next/font/google` | Inter for everything; Geist Mono only for codes (certificate IDs, payment references). |

**Logo colors (sampled from the PNG):**

| Name | Hex | Where |
|---|---|---|
| Logo teal | `#32BBB1` | Gradient start |
| Logo mid teal | `#207890` | Gradient middle |
| Logo navy | `#193E72` | Gradient end and "ACADEMY" wordmark |

The website's existing `--primary` (`#003B75`) is visually the same navy as the logo (contrast between them ≈ 1.05). **The site palette has no teal today** — teal exists only in the logo. See §3.3.

---

## 3. Color system

### 3.1 Current source colors (Existing — documented, not changed)

Light theme, from `:root` in [app/globals.css](app/globals.css). Hex values are sRGB conversions for reference.

| Token | Value | ≈ Hex | Role today |
|---|---|---|---|
| `--background` | `oklch(0.99 0.005 240)` | `#F9FCFF` | Page background (very light blue-white) |
| `--foreground` | `oklch(0.15 0.03 250)` | `#030C17` | Body text |
| `--card` / `--popover` | `oklch(1 0 0)` | `#FFFFFF` | Cards, menus |
| `--primary` | `oklch(0.35 0.12 250)` | `#003B75` | **Brand navy** — buttons, links, footer, stats band |
| `--primary-foreground` | `oklch(0.98 0 0)` | `#F8F8F8` | Text on primary |
| `--secondary` | `oklch(0.93 0.02 240)` | `#DCEAF4` | Pale blue fills |
| `--secondary-foreground` | `oklch(0.25 0.06 250)` | `#06233D` | Text on secondary |
| `--muted` | `oklch(0.96 0.01 240)` | `#ECF3F8` | Subtle fills, skeletons |
| `--muted-foreground` | `oklch(0.45 0.03 250)` | `#495766` | Secondary text |
| `--accent` | `oklch(0.55 0.15 240)` | `#0079BF` | Bright blue highlight, gradients, ring |
| `--accent-foreground` | `oklch(0.98 0 0)` | `#F8F8F8` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#E7000B` | Errors |
| `--border` | `oklch(0.9 0.02 240)` | `#D3E0EA` | Borders |
| `--input` | `oklch(0.92 0.015 240)` | `#DCE6EE` | Input borders |
| `--ring` | `oklch(0.55 0.15 240)` | `#0079BF` | Focus ring |
| `--chart-1…5` | blues/cyans | — | Admin charts |
| `--radius` | `0.625rem` | 10 px | Radius base |

A `.dark` theme is defined but **unreachable** (no theme provider is mounted). Light theme only until the owner decides otherwise (**Confirm**).

**Raw colors currently used outside tokens** (to be migrated): `bg-gray-50`, `text-gray-900`, `bg-white` (courses page, admin), `green/yellow/red-100/800` (level badges), `amber-*` (upcoming, warnings), `green-*` (success panels), `fill-yellow-400` (testimonial stars), `blue-50/200/700/800` (dev notices), `#25D366` (WhatsApp — allowed), Google/GitHub brand colors (allowed).

**Measured contrast of existing pairs:**

| Pair | Ratio | Verdict |
|---|---|---|
| foreground on background | 19.1 | ✅ |
| muted-foreground on background | 7.2 | ✅ |
| muted-foreground on muted | 6.6 | ✅ |
| primary on background | 10.9 | ✅ |
| primary-foreground on primary | 10.6 | ✅ |
| primary-foreground/80 on primary | 7.3 | ✅ |
| primary-foreground/70 on primary | 6.0 | ✅ |
| primary-foreground/60 on primary | 4.8 | ✅ (minimum — do not go lower) |
| accent on background (as text) | 4.53 | ⚠️ passes AA barely — ok for links/labels ≥ 14 px medium |
| **accent-foreground on accent** | **4.40** | ❌ fails AA for normal text — accent fills may carry **only large/bold text (≥ 18.7 px bold) or icons** |
| destructive on background | 4.63 | ✅ |
| border on background | 1.31 | Decorative only — never the sole indicator of a control |

### 3.2 Semantic tokens (target set)

Existing values are kept. New tokens fill the gaps the audit found (no status colors, no hover token, no surface naming).

| Semantic token | Tailwind utility | Value | Status | Use |
|---|---|---|---|---|
| Background | `bg-background` | `--background` | Existing | Page canvas |
| Foreground | `text-foreground` | `--foreground` | Existing | Body + headings |
| Surface | `bg-card` | `--card` (#FFF) | Existing (alias name) | Cards, panels, form containers |
| Elevated surface | `bg-popover` + `shadow-md` | `--popover` (#FFF) | Existing (alias name) | Menus, popovers, sticky purchase card |
| Section alternate | `bg-muted` | `--muted` | Existing | Alternating page sections (replaces ad-hoc `bg-secondary/30`, `bg-muted/30`) |
| Primary | `bg-primary` / `text-primary` | `--primary` #003B75 | Existing | Primary actions, links, brand bands |
| Primary foreground | `text-primary-foreground` | `--primary-foreground` | Existing | Text/icons on primary |
| **Primary hover** | `hover:bg-primary-hover` | `oklch(0.30 0.11 250)` ≈ `#002D62` | **Proposed** | Darker hover for primary fills (today `bg-primary/90` lightens toward the background) |
| Secondary | `bg-secondary` | `--secondary` | Existing | Secondary buttons, soft fills |
| Secondary foreground | `text-secondary-foreground` | `--secondary-foreground` | Existing | |
| Accent | `bg-accent` / `text-accent` | `--accent` #0079BF | Existing | Small highlights, eyebrows, active indicators, focus ring. **Not** for filled buttons with small text (4.40:1). |
| Muted | `bg-muted` | `--muted` | Existing | Subtle fills, skeletons |
| Muted foreground | `text-muted-foreground` | `--muted-foreground` | Existing | Secondary text, captions |
| Border | `border-border` | `--border` | Existing | Dividers, card borders |
| Input | `border-input` | `--input` | Existing | Form control borders |
| Ring | `ring-ring` | `--ring` | Existing | Focus rings |
| **Success** | `text-success`, `bg-success` | `oklch(0.52 0.13 155)` ≈ `#007E46` | **Proposed** | Success text/icons; 5.0:1 on background, white on it 5.2:1 |
| **Success subtle** | `bg-success-subtle` | `oklch(0.96 0.03 155)` ≈ `#E3F8E9` | **Proposed** | Success panels/badges (with `text-success`) |
| **Warning** | `text-warning`, `bg-warning` | `oklch(0.55 0.13 70)` ≈ `#A16100` | **Proposed** | Warnings, "Coming soon"; 4.8:1 on background, white on it 5.0:1 |
| **Warning subtle** | `bg-warning-subtle` | `oklch(0.96 0.04 85)` ≈ `#FEF0D4` | **Proposed** | Warning panels/badges |
| **Error** | `text-destructive`, `bg-destructive` | `--destructive` #E7000B | Existing (named "destructive") | Errors, destructive actions |
| **Error subtle** | `bg-destructive-subtle` | `oklch(0.96 0.02 27)` ≈ `#FFEDEB` | **Proposed** | Error panels |
| **Info** | `text-info`, `bg-info` | `oklch(0.50 0.13 240)` ≈ `#006AA5` | **Proposed** | Informational notices; 5.7:1 on background |
| **Info subtle** | `bg-info-subtle` | `oklch(0.96 0.02 240)` ≈ `#E6F4FE` | **Proposed** | Info panels |

Each proposed status color also needs a `-foreground` (white `oklch(0.99 0 0)`) for solid fills.

### 3.3 Brand teal (Confirm)

| Token | Value | Contrast | Allowed use |
|---|---|---|---|
| `--brand-teal` | `#32BBB1` | 2.3:1 on background, 4.7:1 on primary | Decorative only: icon accents on navy, illustration, thin rules, logo-matching highlights on dark bands. **Never body text on light backgrounds.** |
| `--brand-teal-strong` | `#207890` | 4.9:1 on background | Text-safe teal if the owner wants teal in UI (eyebrows, small highlights). |

Adopting teal in the UI is a brand decision. Until confirmed, the palette stays navy/blue as today.

### 3.4 Implementation sketch (Proposed — not yet applied)

```css
:root {
  --primary-hover: oklch(0.30 0.11 250);
  --success: oklch(0.52 0.13 155);  --success-foreground: oklch(0.99 0 0);  --success-subtle: oklch(0.96 0.03 155);
  --warning: oklch(0.55 0.13 70);   --warning-foreground: oklch(0.99 0 0);  --warning-subtle: oklch(0.96 0.04 85);
  --info:    oklch(0.50 0.13 240);  --info-foreground:    oklch(0.99 0 0);  --info-subtle:    oklch(0.96 0.02 240);
  --destructive-subtle: oklch(0.96 0.02 27);
}
@theme inline {
  --color-primary-hover: var(--primary-hover);
  --color-success: var(--success); --color-success-foreground: var(--success-foreground); --color-success-subtle: var(--success-subtle);
  --color-warning: var(--warning); --color-warning-foreground: var(--warning-foreground); --color-warning-subtle: var(--warning-subtle);
  --color-info: var(--info);       --color-info-foreground: var(--info-foreground);       --color-info-subtle: var(--info-subtle);
  --color-destructive-subtle: var(--destructive-subtle);
}
```

### 3.5 Color usage rules

- One filled primary action per view region. Navy is the brand; blue accent is seasoning.
- Text never uses opacity below `/60` on primary or `/70`-equivalent on light backgrounds — use `text-muted-foreground` instead of `text-foreground/60`.
- Status is never color-only: pair with an icon or text ("Coming soon", "Completed").
- Third-party brand colors (Google, GitHub, WhatsApp `#25D366`, Paystack) stay in their own buttons only.
- Gradients: at most **one** subtle gradient per page (e.g. the home hero background `from-primary/5`). No primary→accent gradient bands by default.

---

## 4. Typography

**Family:** Inter (`font-sans`) for all UI and content. Geist Mono (`font-mono`) only for codes/IDs/references. Weights used: **400, 500, 600, 700** only.

| Style | Classes (mobile → desktop) | Size (px) | Weight | Line height | Use |
|---|---|---|---|---|---|
| Display | `text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-balance` | 36 → 48 → 60 | 700 | 1.25 | Home hero H1 only |
| H1 | `text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-balance` | 30 → 36 → 48 | 700 | 1.25 | One per page (page hero) |
| H2 | `text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight` | 24 → 30 → 36 | 700 | 1.25 | Section headings |
| H3 | `text-xl sm:text-2xl font-semibold leading-snug` | 20 → 24 | 600 | 1.375 | Sub-sections, course detail blocks |
| H4 | `text-lg font-semibold leading-snug` | 18 | 600 | 1.375 | Card titles, feature titles |
| Eyebrow | `text-sm font-semibold text-accent` | 14 | 600 | 1.5 | Optional label above H1/H2 (sentence case, no all-caps blocks) |
| Body large (lead) | `text-lg leading-relaxed text-muted-foreground` | 18 | 400 | 1.625 | Hero/section intros, max 2–3 lines |
| Body | `text-base leading-relaxed` | 16 | 400 | 1.625 | Default content |
| Body small | `text-sm leading-normal` | 14 | 400 | 1.5 | Card descriptions, meta, footer links |
| Caption | `text-xs leading-normal text-muted-foreground` | 12 | 400/500 | 1.5 | Fine print, timestamps — never for essential info |
| Label | `text-sm font-medium leading-none` | 14 | 500 | 1 | Form labels, button text |

Rules:

- Exactly one `h1` per page; never skip heading levels (current `h4`-after-`h2` cases must be fixed when touched).
- Reading width: body copy `max-w-prose` / `max-w-3xl`; leads `max-w-2xl`.
- `text-balance` on headings; `text-pretty` allowed on leads.
- Numbers in stats: H2-scale or `text-4xl lg:text-5xl font-bold`, label = body small.
- Do not use raw sizes like `text-[17px]`.

---

## 5. Spacing

Tailwind 4 px scale. Use these steps only.

| Context | Mobile | Tablet | Desktop | Classes |
|---|---|---|---|---|
| Page section (standard) | 64 | 80 | 96 | `py-16 md:py-20 lg:py-24` |
| Page section (compact: stats band, CTA band, sub-sections) | 48 | 64 | 64 | `py-12 md:py-16` |
| Page hero (interior) | 48 | 64 | 80 | `py-12 md:py-16 lg:py-20` |
| Section header → content | 40 | 48 | 48 | `mb-10 md:mb-12` |
| Heading → lead | 16 | | | `mt-4` |
| Card padding | 24 | | | `p-6` (compact cards `p-5`; feature panels `p-8`) |
| Card grid gap | 24 | | 24–32 | `gap-6 lg:gap-8` |
| Content block stack | 24 | | | `space-y-6` |
| Form: label → control | 8 | | | `space-y-2` |
| Form: field → field | 20 | | | `space-y-5` / `gap-5` |
| Form actions top margin | 32 | | | `mt-8` |
| Button group gap | 12 | | 16 | `gap-3 sm:gap-4` |
| Navigation height | 64 | | | `h-16` |
| Inline icon → text | 8 | | | `gap-2` |

---

## 6. Containers

| Container | Classes | Width |
|---|---|---|
| Page (default) | `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` | 1280 px max; padding 16 / 24 / 32 px (Existing — keep) |
| Narrow content (articles, legal, FAQ, course body) | `mx-auto max-w-3xl px-4 sm:px-6 lg:px-8` | 768 px |
| Text intro | `max-w-2xl` | 672 px |
| Forms (single column wizard, contact) | `max-w-2xl` | 672 px |
| Auth cards | `max-w-md` | 448 px |

Do not use the bare `container` class (legal pages use it today — migrate). No horizontal scroll at any width.

---

## 7. Border radius

Base `--radius: 0.625rem` (Existing). Allowed scale and purpose:

| Class | px | Purpose |
|---|---|---|
| `rounded-md` | 8 | Controls: buttons, inputs, selects, badges, small chips |
| `rounded-lg` | 10 | Nested panels inside cards (curriculum rows, alerts, order summary, radio cards) |
| `rounded-xl` | 14 | **Cards and standalone panels** (shadcn `Card` default) |
| `rounded-2xl` | 18 | Large media only (hero image, feature image) |
| `rounded-full` | — | Avatars, icon circles, pills, step indicators |

Not allowed in new UI: bare `rounded` (4 px), `rounded-sm` outside primitives, `rounded-3xl`, arbitrary radii. Cards are always `rounded-xl` — no mixing `lg`/`xl`/`2xl` for the same kind of card.

---

## 8. Shadows

| Level | Class | Use |
|---|---|---|
| None | — | Default for sections, feature cards, static content |
| XS | `shadow-xs` | Inputs, outline buttons (shadcn default — Existing) |
| Small | `shadow-sm` | Resting cards (shadcn `Card` default) |
| Medium | `shadow-md` | Hover state of interactive cards; dropdowns; popovers |
| Large | `shadow-lg` | Dialogs, sheets, sticky purchase card |

Not allowed: `shadow-xl`, `shadow-2xl`, colored shadows, stacked shadows on nested elements.

---

## 9. Buttons

Built on [components/ui/button.tsx](components/ui/button.tsx) (`cva`). Change the shared component, never patch per call site (e.g. the repeated `bg-transparent` overrides must go).

**Sizes**

| Size | Height | Padding | Text | Use |
|---|---|---|---|---|
| `sm` | 32 px (`h-8`) | `px-3` | `text-sm font-medium` | Dense tables, admin, inline actions |
| `default` | 40 px (`h-10`) — **Proposed** (today `h-9`) | `px-4` | `text-sm font-medium` | Standard |
| `lg` | 48 px (`h-12`) — **Proposed** (today `h-10`) | `px-6` | `text-base font-semibold` | Hero and primary page CTAs; mobile primary actions |
| `icon` | 40×40 (`size-10`) | — | — | Icon-only, must have `aria-label`. 44×44 hit area on mobile. |

Radius `rounded-md` for all. Icons 16 px (`size-4`), 20 px in `lg`.

**Variants**

| Variant | Rest | Hover | Active | Focus | Disabled |
|---|---|---|---|---|---|
| Primary (`default`) | `bg-primary text-primary-foreground` | `bg-primary-hover` (Proposed; today `bg-primary/90`) | `bg-primary-hover` | `focus-visible:ring-[3px] ring-ring/50 border-ring` (Existing) | `opacity-50 pointer-events-none` + `disabled` / `aria-disabled` |
| Secondary | `bg-secondary text-secondary-foreground` | `bg-secondary/80` | same | same | same |
| Outline | `border border-input bg-background text-foreground shadow-xs` | `bg-muted` (**Proposed**; today `hover:bg-accent` turns bright blue) | same | same | same |
| Ghost | transparent, `text-foreground` | `bg-muted` | same | same | same |
| Link | `text-primary underline-offset-4` | `underline` | — | same | same |
| Destructive | `bg-destructive text-white` | `bg-destructive/90` | same | `ring-destructive/40` | same |
| On-dark primary (**Proposed**) | `bg-background text-primary` | `bg-background/90` | same | ring visible on navy | same |
| On-dark outline (**Proposed**) | `border-primary-foreground/60 text-primary-foreground bg-transparent` | `bg-primary-foreground/10` | same | same | same |

**Loading:** keep the button width stable, show `Loader2` (`animate-spin`, `aria-hidden`) + a verb ("Sending…", "Processing payment…"), set `disabled` and `aria-busy="true"`. Never show success until the server confirms.

**Hierarchy:** one primary button per region; secondary action uses outline or ghost. Do not place two filled primaries side by side.

---

## 10. Cards

**Base card** ([components/ui/card.tsx](components/ui/card.tsx) — Existing): `bg-card text-card-foreground border border-border rounded-xl shadow-sm`. Standard padding `p-6`. Use `Card`/`CardHeader`/`CardContent`/`CardFooter` instead of hand-built `div.bg-card…` blocks.

**Hover:** only when the whole card is interactive — `transition-shadow duration-200 hover:shadow-md hover:border-primary/30`. Static cards have no hover effect.

| Special case | Spec |
|---|---|
| **Course card** | See §11. |
| **Feature card** (benefits, values, how-it-works) | No shadow (`shadow-none`), `border`, `p-6`. Icon in `size-10 rounded-lg bg-primary/10 text-primary` (icon `size-5`, `aria-hidden`). Title H4, body small `text-muted-foreground`. Max ~25 words of body. Prefer 3 or 4 per row, never 6 identical boxes when a list would do. |
| **Testimonial card** | `p-6`, quote in body text (no oversized decorative quote marks), then avatar (`size-10 rounded-full`, real photo or initials), name (`font-semibold`), role (`text-sm text-muted-foreground`). Star rating only if the testimonial record has a real admin-entered rating; stars use `text-warning` + an `sr-only` "Rated 5 out of 5". Only Firestore-published testimonials — never placeholders. |
| **Stat card / stat item** | Inside the stats band: no card chrome. Number `text-4xl lg:text-5xl font-bold`, label body small. Values come only from Firestore (`/api/stats`). Show "—" while loading/unavailable, never a guessed number. |

---

## 11. Course card

Single shared component ([components/course-card.tsx](components/course-card.tsx)). Communicates, in this order:

1. **Image** — `aspect-video`, `object-cover`, top of card, `next/image` with `sizes`. Hover `scale-[1.03]` max, disabled under reduced motion.
2. **Availability** — only when not open: `Coming soon` badge (warning-subtle) over the image's top-left. Available courses need no badge.
3. **Category** — eyebrow text (`text-sm font-medium text-accent`), not a badge.
4. **Title** — H4, `line-clamp-2`, is the card's link (stretched link so the whole card is clickable, one focus stop).
5. **Short description** — body small, `text-muted-foreground`, `line-clamp-2`.
6. **Meta row** — duration and level with icons (`Clock`, `BarChart` style), body small muted. Level is plain text or a neutral badge — **no green/yellow/red difficulty coding**.
7. **Footer** (`border-t`, `px-6 py-4`) — price `text-lg font-bold` as `GH₵150` (or "Free" when 0 and available; "Coming soon" when upcoming) + one CTA: `View course` (outline `sm`). The CTA duplicates the title link, so it is `aria-hidden` / `tabIndex={-1}` or the title link is the only link.

Do **not** show: ratings, review counts, seeded student counts, instructor names, more than one badge, or more than one CTA. Enrolled-student counts may be shown only if they come from real enrollments and the owner wants them (**Confirm**).

Layout: `h-full flex flex-col` so footers align across a grid. Grid: 1 col mobile, 2 cols `sm`, 3 cols `lg` (catalogue), 3–4 cols featured on home.

---

## 12. Page hero

**Interior page hero** (courses, about, contact, course detail, legal, dashboard):

- Background: `bg-muted` (or `bg-background` with `border-b`). No gradients except the home page.
- Container: page container; padding `py-12 md:py-16 lg:py-20`.
- Breadcrumb (shadcn `Breadcrumb`, `aria-label="Breadcrumb"`, `aria-current="page"` on the last item) on nested pages: course detail, legal, dashboard sub-pages.
- Optional eyebrow → H1 → lead (`max-w-2xl`) → at most **two** CTAs (primary + outline).
- Left-aligned by default; centered allowed for short marketing pages (about, contact).

**Home hero:** Display heading, lead, primary CTA + one secondary, optional real proof points (only verified facts), image visible on all breakpoints (stacked below text on mobile, not hidden). One subtle background gradient allowed.

Every hero answers: where am I, what is this page for.

---

## 13. Section headers

Shared pattern (to become a `SectionHeader` component):

- Optional eyebrow (`text-sm font-semibold text-accent`)
- H2
- Optional lead (`mt-4 text-lg text-muted-foreground max-w-2xl`)
- Optional trailing action (e.g. "View all courses" link-style or outline button), aligned right on `md+`, below on mobile.
- Alignment: **left** by default; **center** only for standalone marketing sections (benefits, testimonials, FAQ).
- Spacing: `mb-10 md:mb-12` before content.

---

## 14. Forms

Built from shadcn `Label`, `Input`, `Select`, `Textarea`, `Checkbox`, `RadioGroup` (Existing). Prefer the shadcn `Form` / `Field` primitives for new forms.

| Element | Spec |
|---|---|
| Label | Above the control, `Label` (text-sm, medium). Required fields marked with `*` **and** `aria-required` / `required`. Placeholders are hints, never labels; no real people's names as placeholders. |
| Input / Select trigger | `h-10` (**Proposed**; today `h-9`), `rounded-md`, `border-input`, `bg-background`, `px-3`, `text-base md:text-sm` (16 px on mobile prevents iOS zoom). |
| Textarea | Same as input, `min-h-28`, `py-2`. |
| Checkbox / Radio | Control `size-4`; the whole row is clickable via `<Label htmlFor>`; mobile row height ≥ 44 px. Radio choices with descriptions use "radio cards": `border rounded-lg p-4`, selected `border-primary bg-primary/5`. |
| Focus | Existing shadcn: `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`. Never remove outlines. |
| Field error | `aria-invalid="true"` + `aria-describedby="<id>-error"` on the control; message `<p id="<id>-error" class="text-sm text-destructive">` directly below. Border turns `border-destructive` (shadcn `aria-invalid` styles do this). |
| Form error (server/network) | Above the submit button, `role="alert"`, `text-sm text-destructive` (or an error-subtle panel for longer text). |
| Success | Inline success panel (`bg-success-subtle text-success`, `role="status"`) or a toast — **only after the server confirms**. |
| Loading | Disable submit, spinner + verb, keep inputs readable; don't clear inputs until success. |
| Layout | Single column; pair short related fields (first/last name) in `sm:grid-cols-2 gap-5`. |
| Validation | Validate on submit, then on change for touched fields. Client validation mirrors server validation; the server is authoritative. |

---

## 15. Navigation

**Desktop** (from `lg` — **Proposed**; today switches at `md`, which crowds 768 px):

- `sticky top-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur` (the only permitted blur).
- Logo left, height 32–40 px, links to `/`, `alt="Coltek Academy"`.
- Links: `text-sm font-medium text-muted-foreground hover:text-foreground`. **Active:** `text-foreground` + `aria-current="page"` + 2 px `bg-primary` underline indicator.
- Right: ghost "Log in" + primary "Get started" when signed out. Signed in: a user menu (avatar/initials → Dashboard, Certificates, Log out). Never print the raw email in the bar.
- Focus: visible ring on every link and button.

**Mobile/tablet** (below `lg`):

- Menu button `size-11` (44 px), `aria-label="Open menu"`, `aria-expanded`, `aria-controls`.
- shadcn `Sheet` from the right: focus trapped, closes on Esc, overlay click and route change.
- Links as 48 px rows, active state as desktop; primary CTA full width at the bottom.

---

## 16. Footer

- Background `bg-primary`, text `text-primary-foreground`. Body links `text-primary-foreground/80 hover:text-primary-foreground` (7.3:1); never below `/70` for text.
- Column headings `text-base font-semibold`.
- Columns (lg: 4, sm: 2, mobile: 1): **Brand** (logo on light/navy-safe version, one-line description, social icons) · **Programmes** (categories) · **Academy** (About, Contact, FAQ, Login) · **Contact** (email, phone, hours, location — from the contact page facts).
- Social icons `size-5` inside a 40 px hit area, `aria-label` with the platform name, `target="_blank" rel="noopener noreferrer"`. lucide has no X logo; use an accessible label "X (Twitter)" until a brand icon is added.
- **Newsletter: none** until a real newsletter integration exists. The contact column replaces it.
- Bottom bar: `border-t border-primary-foreground/20`, copyright + Terms + Privacy, `text-sm text-primary-foreground/70`.

---

## 17. FAQ

- shadcn `Accordion`, `type="single" collapsible` (Existing).
- Layout: narrow container (`max-w-3xl`), items separated by `border-b` (a list, not a stack of cards).
- Trigger: `text-base font-medium py-4`, hover `text-primary` (no underline), chevron `size-4` rotates 180° in 200 ms.
- Content: `text-muted-foreground leading-relaxed pb-4`.
- Keyboard and ARIA come from Radix — do not replace with custom divs.
- Answers must be factual and consistent with Terms/Privacy (refunds, payment methods, access). Unknown answers are omitted, not invented.

---

## 18. CTA sections

| Type | Spec | Use |
|---|---|---|
| **Primary CTA band** | `bg-primary`, compact section padding, centered H2 (`text-primary-foreground`), lead `/80`, one on-dark primary button + optional on-dark outline. Solid navy — no primary→accent gradient. | Once per page, at the end of marketing pages |
| **Inline CTA panel** | `bg-muted rounded-xl p-8`, H3 + one sentence + one button | Mid-page prompts (e.g. "Not sure which course? Contact us") |
| **Contextual CTA** | Course detail: sticky purchase card on desktop (`lg:sticky lg:top-24`, elevated surface, `shadow-lg`); on mobile a fixed bottom bar with price + "Enroll" (safe-area padding). | Transactional pages |

Hierarchy depends on context: a page has one dominant CTA; don't repeat the same full-width band multiple times.

---

## 19. Tables

shadcn `Table` (Existing). Wrapper: `overflow-x-auto rounded-xl border border-border bg-card`.

- Header row: `bg-muted`, cells `text-sm font-medium text-muted-foreground`, `px-4 h-11`.
- Body cells: `px-4 py-3 text-sm`, rows `border-b last:border-0 hover:bg-muted/50` when rows are interactive.
- Numbers/prices right-aligned, `tabular-nums`.
- Status via badges (§20). Row actions in a trailing column (ghost `icon` buttons with `aria-label`) or a dropdown.
- Mobile: horizontal scroll for ≤ 5 columns; above that, render rows as stacked cards.
- Always include a `<caption>` (visually hidden if needed) or an `aria-label`.

---

## 20. Badges

shadcn `Badge` (Existing): `rounded-md px-2 py-0.5 text-xs font-medium`.

| Badge | Style | Notes |
|---|---|---|
| Course category | Prefer eyebrow text; if a badge, `variant="secondary"` | Neutral |
| Course level | `variant="outline"` neutral | Replaces green/yellow/red (yellow-on-yellow fails contrast) |
| Available | Usually omitted; if needed `bg-success-subtle text-success` | |
| Upcoming / Coming soon | `bg-warning-subtle text-warning` | |
| Status — active / in progress | `bg-info-subtle text-info` | Enrollments |
| Status — completed / issued | `bg-success-subtle text-success` | Enrollments, certificates |
| Status — cancelled / revoked | `bg-destructive-subtle text-destructive` | |

Max **two** badges per card; badges are labels, not buttons.

---

## 21. Icons

- **lucide-react only** (Existing). No mixing icon sets; third-party logos (Google, GitHub, WhatsApp) as inline SVG in their buttons.
- Sizes: 16 px (`size-4`) inline/buttons, 20 px (`size-5`) nav/large buttons/social, 24 px (`size-6`) feature icons. Default stroke width.
- Color: `currentColor`, `text-primary`, or `text-muted-foreground`.
- Decorative icons: `aria-hidden="true"`. Icon-only buttons/links: `aria-label`. Icons never carry meaning alone.

---

## 22. Animation

| Token | Duration | Easing | Use |
|---|---|---|---|
| Fast | 150 ms | `ease-out` | Color, background, border on hover/focus |
| Base | 200 ms | `ease-out` | Shadow on card hover, chevrons, accordion |
| Slow | 300 ms | `ease-out` | Sheet/dialog enter (tw-animate / Radix) |

Allowed: hover color/shadow, accordion expand, sheet/dialog transitions, course-image hover scale ≤ 1.03, skeleton shimmer while loading real data, spinner in loading buttons.

Not allowed: scroll-triggered reveals on every section, parallax, auto-playing carousels, infinite pulsing/pinging decorations (the current `animate-ping` loader), artificial minimum loading times.

Reduced motion: add `motion-reduce:transition-none motion-reduce:transform-none` to transforms, and a global rule (**Proposed**):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

---

## 23. Responsive design

Breakpoints: Tailwind defaults — `sm` 640, `md` 768, `lg` 1024, `xl` 1280. Mobile-first classes. Test at 360, 390, 430, 768, 1024, ≥1280 px.

| | Mobile (< 640) | Tablet (640–1023) | Desktop (≥ 1024) |
|---|---|---|---|
| Navigation | Menu button + Sheet | Menu button + Sheet | Full nav |
| Grids | 1 column | 2 columns | 3–4 columns |
| Hero | Text first, image below (smaller), full-width primary CTA | Text + image stacked or side by side | Side by side |
| Course catalogue filters | Sheet triggered by "Filters" button; single sort control | Same | Sidebar |
| Course detail purchase | Fixed bottom bar | Fixed bottom bar | Sticky side card |
| Forms | Single column, 16 px input text | Paired short fields | Paired short fields |
| Tables | Scroll or stacked cards | Scroll | Full |

Design mobile intentionally: reorder content by priority, shorten leads, keep one primary CTA in view. Never hide essential content (prices, CTAs, images that carry meaning) on mobile.

---

## 24. Accessibility requirements

- **Contrast:** WCAG 2.1 AA — 4.5:1 text, 3:1 large text (≥ 24 px or ≥ 18.7 px bold) and UI components/focus indicators. Use the measured table in §3.1; `accent` fills carry large text/icons only.
- **Focus:** every interactive element shows `:focus-visible` (shadcn ring). Never `outline-none` without a replacement.
- **Keyboard:** all functionality reachable and operable; logical tab order; Esc closes overlays; no keyboard traps except intentional modal focus traps.
- **Skip link:** "Skip to main content" as the first focusable element (**Proposed**), targeting `<main id="main">`.
- **Landmarks:** `header`/`nav` (labelled), `main`, `footer`; one `h1`; ordered headings.
- **Screen readers:** decorative icons/images `aria-hidden` / `alt=""`; meaningful images have descriptive `alt`; status updates via `role="status"`/`aria-live="polite"`; errors via `role="alert"`.
- **Forms:** see §14 (labels, `aria-invalid`, `aria-describedby`, announced errors).
- **Motion:** respect `prefers-reduced-motion` (§22).
- **Touch targets:** ≥ 44×44 px on touch devices; ≥ 8 px between adjacent targets.
- **Language & content:** `<html lang="en">`; link text describes the destination (no bare "click here").

---

## 25. Design anti-patterns

Avoid (with examples from the current site to retire):

- Random colors — raw `gray/green/yellow/amber/blue` classes instead of tokens.
- Excessive gradients — primary→accent CTA band, gradient overlays on every hero.
- Glass effects — beyond the navbar's subtle blur.
- Excessive rounded cards — mixing `rounded-lg/xl/2xl` for the same kind of card.
- Excessive shadows — `shadow-2xl` hero images, shadows on static content.
- Huge decorative shapes — blurred circles behind hero images.
- Too many competing CTAs — "Get Started", "Register Now", "Enroll Now", "Explore Courses", "Browse Courses" all at once.
- Dead CTAs — "Watch Demo", "Add to Wishlist" with no behavior.
- Generic stock layouts — six identical benefit boxes, generic "Transform your future" copy.
- Fake statistics, fake testimonials, fake guarantees, seeded ratings.
- Overuse of animation — ping loaders, minimum-duration overlays.
- Dense information blocks — walls of text without hierarchy.
- Inconsistent buttons — per-call-site overrides like `bg-transparent`.
- Inconsistent card designs — hand-built `div` cards next to `Card`.
- Placeholder content in production — "Interactive map would go here".

---

## 26. Page design principle

Every page must answer, within the first screen:

1. **Where am I?** — clear H1, active nav item, breadcrumb when nested.
2. **What is this page for?** — one-sentence lead.
3. **What information do I need?** — the essential facts (for courses: what, who, how long, how it's delivered, price) before secondary content.
4. **What should I do next?** — one clear primary action.

---

## 27. Implementation rule

This document is the source of truth for UI.

When an existing component conflicts with it:

1. Identify the conflict (and note it in the stage report).
2. Prefer improving the **shared** component over styling call sites.
3. Never create a one-off visual solution.
4. Preserve functionality.

Known conflicts in the current code (to resolve in the foundation/shared-component stages, not ad hoc):

| Conflict | Where | Target |
|---|---|---|
| Button default `h-9`, `lg` `h-10` | `components/ui/button.tsx` | `h-10` / `h-12` (§9) |
| Outline hover `bg-accent` (bright blue) | `components/ui/button.tsx` | `hover:bg-muted` (§9) |
| Primary hover `bg-primary/90` | `components/ui/button.tsx` | `bg-primary-hover` token (§3.2) |
| `bg-transparent` overrides on outline buttons (~12) | many call sites | Remove after the variant fix |
| Input/select `h-9` | `components/ui/input.tsx`, select | `h-10` (§14) |
| No success/warning/info tokens | `app/globals.css` | Add (§3.4) |
| Level badges green/yellow/red | `course-card.tsx`, `course-hero.tsx` | Neutral outline (§20) |
| Raw grays on `/courses`, admin | `app/courses/page.tsx`, admin | Tokens (§3.5) |
| Primary→accent gradient CTA band | `components/home/cta-section.tsx` | Solid primary band (§18) |
| Hand-built cards with mixed radii | home/about/contact sections | `Card` + `rounded-xl` (§10) |
| Breadcrumb hand-rolled | `course-hero.tsx` | shadcn `Breadcrumb` (§12) |
| Nav switches at `md`, no active state, raw email | `components/navbar.tsx` | §15 |
| Ping loader + 800 ms overlay | `components/ui/loader.tsx`, `route-loader.tsx` | Remove/skeletons (§22) |
| Legal pages use `container` + unstyled `prose` | `app/privacy`, `app/terms` | Narrow container + typography scale (§6, §4) |
| Logo PNG 8880×3238 | `public/Coltek Academy.png` | Optimized export (§2) |

Do not redesign individual pages while establishing the system; pages are redesigned in their own stages using these rules.
