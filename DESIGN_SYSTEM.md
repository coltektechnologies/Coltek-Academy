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
| **Logo (color)** | `public/coltek-academy-logo.svg` | Vector trace of the original artwork (9 KB, viewBox 2000×683, aspect ≈ 2.93:1). Per-glyph teal→navy gradients, "ACADEMY" solid navy. Use on light backgrounds. |
| **Logo (white)** | `public/coltek-academy-logo-white.svg` | Single-color white version for navy/dark backgrounds (footer, primary bands). |
| Logo (original raster) | `public/Coltek Academy.png` | 8880×3238 source PNG, kept as the master artwork. **Do not use in UI.** |
| Favicon | `public/fav-16x16.png`, `public/fav-32x32.png` | A 180×180 Apple touch icon is still needed (**Confirm** artwork). |
| Theme color | `themeColor: "#193E72"` in [app/layout.tsx](app/layout.tsx) | Logo navy. |
| Typeface | **Inter** (sans), Geist Mono (mono) via `next/font/google` | Inter for everything; Geist Mono only for codes (certificate IDs, payment references). |

Logo usage: render with `next/image`, `alt="Coltek Academy"`, fixed height and `w-auto` — navbar `h-10` (40 px), auth cards `h-12` (48 px), footer `h-10` (white version). Minimum height 24 px. Keep clear space ≥ the height of the "A" in ACADEMY. Do not recolor (other than the provided white version), stretch, add effects, or place on busy imagery.

**Logo colors (sampled from the artwork) — these are the website's brand colors:**

| Name | Hex | OKLCH | Role on the website |
|---|---|---|---|
| Logo navy | `#193E72` | `oklch(0.367 0.099 257.5)` | **Primary** |
| Logo teal (deep) | `#207890` | `oklch(0.533 0.087 220.6)` | **Accent** (text-safe) and focus ring |
| Logo teal (bright) | `#32BBB1` | `oklch(0.719 0.114 187.6)` | **Brand teal** — decorative only |

---

## 3. Color system

The palette is **derived from the logo** (owner decision): navy is the primary, teal is the accent. Tokens live in `:root` / `@theme inline` in [app/globals.css](app/globals.css). **Light theme only** — the unreachable `.dark` theme was removed; `dark:` utility classes remaining in components are inert.

### 3.1 Tokens (Existing)

| Semantic token | Utility | Value | ≈ Hex | Use |
|---|---|---|---|---|
| Background | `bg-background` | `oklch(0.99 0.005 220)` | `#F8FDFE` | Page canvas |
| Foreground | `text-foreground` | `oklch(0.18 0.04 255)` | `#051223` | Body text and headings |
| Surface | `bg-card` | `oklch(1 0 0)` | `#FFFFFF` | Cards, panels, form containers |
| Elevated surface | `bg-popover` + `shadow-md` | `oklch(1 0 0)` | `#FFFFFF` | Menus, popovers, sticky purchase card |
| Section alternate | `bg-muted` | `oklch(0.96 0.01 230)` | `#EBF3F7` | Alternating page sections |
| Primary | `bg-primary` / `text-primary` | `oklch(0.367 0.099 257.5)` | `#193E72` | Primary actions, links, brand bands, footer |
| Primary foreground | `text-primary-foreground` | `oklch(0.99 0 0)` | `#FCFCFC` | Text/icons on primary |
| Primary hover | `hover:bg-primary-hover` | `oklch(0.317 0.099 257.5)` | `#0B3063` | Hover/active for primary fills |
| Secondary | `bg-secondary` | `oklch(0.95 0.03 190)` | `#D9F5F3` | Pale teal fills, secondary buttons, soft highlights |
| Secondary foreground | `text-secondary-foreground` | `oklch(0.32 0.07 230)` | `#00394F` | Text on secondary |
| Accent | `bg-accent` / `text-accent` | `oklch(0.533 0.087 220.6)` | `#207890` | Eyebrows, links-on-light, active indicators, small highlights, teal buttons |
| Accent foreground | `text-accent-foreground` | `oklch(0.99 0 0)` | `#FCFCFC` | Text on accent |
| Brand teal | `bg-brand-teal` / `text-brand-teal` | `oklch(0.719 0.114 187.6)` | `#32BBB1` | **Decorative only**: icon accents and highlights on navy, rules, illustration |
| Muted | `bg-muted` | `oklch(0.96 0.01 230)` | `#EBF3F7` | Subtle fills, skeletons |
| Muted foreground | `text-muted-foreground` | `oklch(0.46 0.03 250)` | `#4C5A69` | Secondary text, captions |
| Border | `border-border` | `oklch(0.9 0.015 230)` | `#D5E0E6` | Dividers, card borders |
| Input | `border-input` | `oklch(0.86 0.02 230)` | `#C4D4DC` | Form control borders |
| Ring | `ring-ring` | `oklch(0.533 0.087 220.6)` | `#207890` | Focus rings |
| Success | `text-success` / `bg-success` | `oklch(0.52 0.13 155)` | `#007E46` | Success text/icons/fills |
| Success subtle | `bg-success-subtle` | `oklch(0.97 0.03 155)` | `#E8FAED` | Success panels/badges |
| Warning | `text-warning` / `bg-warning` | `oklch(0.52 0.12 70)` | `#985B00` | Warnings, "Coming soon" |
| Warning subtle | `bg-warning-subtle` | `oklch(0.97 0.035 85)` | `#FFF3DD` | Warning panels/badges |
| Error | `text-destructive` / `bg-destructive` | `oklch(0.52 0.21 27)` | `#C9000C` | Errors, destructive actions |
| Error subtle | `bg-destructive-subtle` | `oklch(0.97 0.02 27)` | `#FFF1EF` | Error panels |
| Info | `text-info` / `bg-info` | `oklch(0.5 0.11 235)` | `#006C98` | Informational notices |
| Info subtle | `bg-info-subtle` | `oklch(0.97 0.02 230)` | — | Info panels |
| Charts 1–5 | `chart-1…5` | navy, deep teal, bright teal, mid navy, pale teal | | Admin charts |

Each status color has a `-foreground` (white) for solid fills.

**Previous palette (before the logo-based palette, for reference):** primary `#003B75`, accent bright blue `#0079BF` (white text on it was 4.40:1 — failed AA), secondary pale blue `#DCEAF4`, background `#F9FCFF`.

### 3.2 Measured contrast

| Pair | Ratio | Verdict |
|---|---|---|
| foreground on background | 18.3 | ✅ |
| muted-foreground on background | 6.9 | ✅ |
| muted-foreground on muted | 6.3 | ✅ |
| primary on background | 10.4 | ✅ |
| primary-foreground on primary | 10.4 | ✅ |
| primary-foreground on primary-hover | 12.7 | ✅ |
| accent on background (text) | 4.93 | ✅ |
| accent-foreground on accent | 4.93 | ✅ (teal buttons are allowed) |
| secondary-foreground on secondary | 10.8 | ✅ |
| primary on secondary | 9.3 | ✅ |
| **accent on secondary** | **4.41** | ❌ — on pale-teal fills use `text-primary` or `text-secondary-foreground`, not `text-accent` |
| **brand-teal on primary** | 4.50 | ⚠️ minimum — large text, icons or highlights only |
| **brand-teal on background** | **2.31** | ❌ — never text on light backgrounds |
| success / warning / info / destructive on background | 5.0 / 5.5 / 5.7 / 6.0 | ✅ |
| success / warning / info / destructive on their `-subtle` fill | 4.8 / 5.2 / 5.4 / 5.6 | ✅ (verified with axe) |
| white on success / warning / info / destructive | 5.2 / 5.7 / 5.9 / 6.2 | ✅ |
| primary-foreground/80 on primary | ≈ 7 | ✅ (footer links) |
| primary-foreground/60 on primary | ≈ 4.7 | ✅ minimum — do not go lower |
| input border on background | 1.48 | Inputs also rely on fill/shape and focus ring; do not use borders as the only indicator of state |

### 3.3 Color usage rules

- **Navy leads, teal supports.** Navy for primary buttons, headings accents, footer and brand bands; teal for highlights, eyebrows, active indicators, focus, and occasional secondary actions.
- One filled primary action per view region.
- The **logo gradient** (bright teal `#32BBB1` → deep teal `#207890` → navy `#193E72`, left→right) is a brand device, available as the `bg-brand-gradient` utility ([app/globals.css](app/globals.css)). The application shell uses it as a fixed **4 px brand rule** (`h-1`) at the top of the header, the mobile menu, the footer and the admin sidebar — these rules are part of the shell and do not count against pages. Inside page content it is allowed **once per page at most** (e.g. a thin hero accent rule, the CTA band, or an icon tile) — never on body text and never as a background behind small text.
- **Teal must be visible, not just navy.** The logo is mostly teal; navy-only screens read as off-brand. Use `text-accent` for supporting icons and eyebrows on light surfaces, `bg-secondary` (pale teal) for icon tiles, hover fills and active rows, and `brand-teal` for icons, rules and hover fills on navy.
- Text never uses opacity below `/60` on primary; on light backgrounds use `text-muted-foreground` instead of opacity.
- Status is never color-only: pair with an icon or text ("Coming soon", "Completed").
- Third-party brand colors (Google, GitHub, WhatsApp `#25D366`, Paystack) stay in their own buttons only.
- No raw palette classes (`gray-*`, `blue-*`, `green-*`, `amber-*`, `white`) in new UI — use the tokens above.

**Raw colors:** migrated. The only remaining raw colors are third-party brand buttons (Google, GitHub, WhatsApp) and shadcn overlay scrims (`bg-black/50`) in `components/ui/`.

**Admin shell:** navy `bg-primary` sidebar with the white logo and brand rule; nav items `text-primary-foreground/80`, active `bg-primary-foreground/10 text-primary-foreground` with a `text-brand-teal` icon; content area `bg-muted`; page header `bg-card border-b` with a `text-primary` title.

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
| `default` | 40 px (`h-10`) | `px-4` | `text-sm font-medium` | Standard |
| `lg` | 48 px (`h-12`) | `px-6` | `text-base font-semibold` | Hero and primary page CTAs; mobile primary actions |
| `icon` / `icon-sm` / `icon-lg` | 40 / 32 / 48 px square | — | — | Icon-only, must have `aria-label`. |

Radius `rounded-md` for all. Icons 16 px (`size-4`), 20 px in `lg`.

**Variants**

| Variant | Rest | Hover | Active | Focus | Disabled |
|---|---|---|---|---|---|
| Primary (`default`) | `bg-primary text-primary-foreground` | `bg-primary-hover` | `bg-primary-hover` | `focus-visible:ring-[3px] ring-ring/50 border-ring` (Existing) | `opacity-50 pointer-events-none` + `disabled` / `aria-disabled` |
| Secondary | `bg-secondary text-secondary-foreground` | `bg-secondary/80` | same | same | same |
| Outline | `border border-input bg-background text-foreground shadow-xs` | `bg-muted` | same | same | same |
| Ghost | transparent, `text-foreground` | `bg-muted` | same | same | same |
| Link | `text-primary underline-offset-4` | `underline` | — | same | same |
| Destructive | `bg-destructive text-white` | `bg-destructive/90` | same | `ring-destructive/40` | same |
| On-dark primary (`inverse`) | `bg-background text-primary` | `bg-background/90` | same | ring visible on navy | same |
| On-dark outline (`outline-inverse`) | `border-primary-foreground/60 text-primary-foreground bg-transparent` | `bg-primary-foreground/10` | same | same | same |

**Loading:** `<Button loading>Processing payment…</Button>` — renders an `aria-hidden` spinner, disables the button and sets `aria-busy`. Use a verb in the label. Never show success until the server confirms. (`loading` is ignored with `asChild`.)

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
6. **Meta row** — level, duration and learning mode with icons, body small muted. Level is plain text or a neutral badge — **no green/yellow/red difficulty coding**. Duration and mode are **set by admins** in the course form (Course Details tab): duration as amount + unit (hours/days/weeks/months), stored as text like `"10 weeks"`; mode as `Online` or `In person`. Legacy bare-number durations are hidden until an admin re-saves them with a unit.
7. **Footer** (`border-t`, `px-6 py-4`) — price `text-lg font-bold` as `GH₵150` (or "Free" when 0 and available; "Coming soon" when upcoming) + one CTA: `View course` (outline `sm`). The CTA duplicates the title link, so it is `aria-hidden` / `tabIndex={-1}` or the title link is the only link.

Do **not** show: ratings, review counts, seeded student counts, instructor names, more than one badge, or more than one CTA. **Enrolled-student counts are shown** (owner-approved) — only the real count from `enrollments` (`Users` icon + number, body small muted).

Layout: `h-full flex flex-col` so footers align across a grid. Grid: 1 col mobile, 2 cols `sm`, 3 cols `lg` (catalogue), 3–4 cols featured on home.

### 11a. Programme card

`components/academy/programme-card.tsx`. A **programme area** that groups several courses (e.g. "Web Development"), linking to the filtered catalogue. Not for individual courses (use CourseCard).

Content: optional icon tile (`size-10 rounded-lg bg-primary/10 text-primary`), title (H4, the card's stretched link), short description, real course count (omit if unknown), "Explore →" affordance in `text-accent`. Feature-card styling: `p-6`, border, no resting shadow, hover shadow (interactive).

### 11b. Project card

`components/academy/project-card.tsx`. A real student project published by an admin at `/admin/projects` (Firestore `projects`, public via `/api/projects`, published only, links restricted to http(s)).

Content: screenshot (`aspect-video`, `object-top`), title (H4), "By {student} · {course/cohort}", description (`line-clamp-3`), technology badges (`outline`), optional "Live project" / "Source code" links (open in a new tab, announced as such). Sections that list projects must render nothing when none are published — never placeholders or sample projects.

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
| Input / Select trigger | `h-10`, `rounded-md`, `border-input`, `bg-background`, `px-3`, `text-base md:text-sm` (16 px on mobile prevents iOS zoom). |
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
- Logo left (`coltek-academy-logo.svg`, `h-10`), links to `/`, `alt="Coltek Academy"`.
- 4 px `bg-brand-gradient` rule across the top of the header (decorative, `aria-hidden`).
- Links: `text-sm font-medium text-muted-foreground hover:text-primary`. **Active:** `text-primary` + `aria-current="page"` + 2 px `bg-accent` underline indicator.
- Right: ghost "Log in" + primary "Get started" when signed out. Signed in: a user menu (avatar/initials → Dashboard, Certificates, Log out). Never print the raw email in the bar.
- Focus: visible ring on every link and button.

**Mobile/tablet** (below `lg`):

- Menu button `size-11` (44 px), `aria-label="Open menu"`, `aria-expanded`, `aria-controls`.
- shadcn `Sheet` from the right: focus trapped, closes on Esc, overlay click and route change.
- Sheet starts with the 4 px brand rule; its title is the colour logo (with an sr-only "Menu").
- Links as 48 px rows; active row `bg-secondary text-primary font-semibold`, hover `bg-secondary/60`; account icons `text-accent`; primary CTA full width at the bottom.

---

## 16. Footer

- Background `bg-primary`, text `text-primary-foreground`. Body links `text-primary-foreground/80 hover:text-primary-foreground` (7.3:1); never below `/70` for text.
- 4 px `bg-brand-gradient` rule along the top edge.
- Column headings `text-sm font-semibold uppercase tracking-wide` in white, each with a short `h-0.5 w-8 bg-brand-teal` rule beneath. Never set heading or link **text** in `brand-teal` on navy (4.50:1 is the bare minimum) — use it for icons, rules and hover fills.
- Contact icons `text-brand-teal`; social icons hover to `bg-brand-teal text-primary`.
- Columns (lg: 4, sm: 2, mobile: 1): **Brand** (`coltek-academy-logo-white.svg`, one-line description, social icons) · **Programmes** (categories) · **Academy** (About, Contact, FAQ, Login) · **Contact** (email, phone, hours, location — from the contact page facts).
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
| **Primary CTA band** | `bg-primary` — or the logo gradient as the page's single gradient device (§3.3) — compact section padding, centered H2 (`text-primary-foreground`), lead `/80`, one on-dark primary button + optional on-dark outline. | Once per page, at the end of marketing pages |
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

- **Contrast:** WCAG 2.1 AA — 4.5:1 text, 3:1 large text (≥ 24 px or ≥ 18.7 px bold) and UI components/focus indicators. Use the measured table in §3.2; bright brand teal is never text on light backgrounds.
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
- Excessive gradients — more than one gradient device per page, gradient overlays on every hero, gradients behind small text.
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

Conflicts resolved in the shared-components stage: button sizes/hover/outline variant, input/select heights, status tokens, level badge colors (neutral `outline`), skeleton color, dialog overlay/radius, accordion trigger, menu highlight color (`secondary`), ping loader, duplicate toast store, hand-built course card.

Remaining conflicts (resolve in page stages, not ad hoc):

| Conflict | Where | Target |
|---|---|---|
| `bg-transparent` overrides on outline buttons (~11) | many call sites | Remove when each page is redesigned |
| Raw grays on `/courses`, admin | `app/courses/page.tsx`, admin | Tokens (§3.3) |
| Home has two gradient devices (hero background + CTA band) | `hero-section.tsx`, `cta-section.tsx` | One per page (§3.3) |
| Section headings hand-built per section | home/about/contact sections | `SectionHeader` (§13) |
| Page heroes hand-built per page; hand-rolled breadcrumb | `about-hero`, `contact-hero`, `course-hero` | `PageHeader` (§12) |
| `LoadingFallback` redefined in 7 pages; full-screen spinners | `app/**/page.tsx` | `LoadingState` / skeletons (§28) |
| Hand-built cards with mixed radii | home/about/contact sections | `Card` + `rounded-xl` (§10) |
| Nav switches at `md`, no active state, raw email | `components/navbar.tsx` | §15 |
| 800 ms route overlay | `components/providers/route-loader.tsx` | Remove (§22) |
| Legal pages use `container` + unstyled `prose` | `app/privacy`, `app/terms` | Narrow container + typography scale (§6, §4) |
| Raw `green-*`/`blue-*` panels | `registration-success.tsx`, `payment-success`, `step-payment.tsx` (dev notices) | `Alert` variants (§28) |

Do not redesign individual pages while establishing the system; pages are redesigned in their own stages using these rules.

---

## 28. Loading, empty and error states

`components/academy/states.tsx` (built on `components/ui/empty`).

| Component | Use | Accessibility |
|---|---|---|
| `LoadingState` (`size="inline" \| "page"`) | Fetching data for a section or page area | `role="status"`, `aria-live="polite"`, spinner `aria-hidden`, honors reduced motion |
| Skeletons (`ui/skeleton`, `CourseCardSkeleton`) | Loading content with a known layout (grids) — preferred over spinners | Container `aria-hidden`; `bg-muted` pulse, no animation under reduced motion |
| `EmptyState` | No results / nothing yet — title, short guidance, one action | Plain content; dashed border card |
| `ErrorState` | Data failed to load — title, description, optional "Try again" (`onRetry`) and extra action | `role="alert"`; `bg-destructive-subtle` |
| `Alert` (`info`/`success`/`warning`/`destructive`) | Inline messages within forms/pages | `role="status"`, or `role="alert"` for `destructive` |
| `Button loading` | Pending form/payment actions | `aria-busy`, disabled |

Never use artificial minimum loading times, and never show a success state before the server confirms.

---

## 29. Component inventory

Use these before creating anything new (see CLAUDE.md §7).

| Need | Component | File |
|---|---|---|
| Button | `Button` (`default`, `secondary`, `outline`, `ghost`, `link`, `destructive`, `inverse`, `outline-inverse`; sizes `sm`/`default`/`lg`/`icon*`; `loading`) | `components/ui/button.tsx` |
| Card | `Card` (+ `interactive`), `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `components/ui/card.tsx` |
| Badge | `Badge` (`default`, `secondary`, `outline`, `success`, `warning`, `info`, `error`, `destructive`) | `components/ui/badge.tsx` |
| Form controls | `Input`, `Textarea`, `Select*`, `Checkbox`, `RadioGroup`, `Label`; layout/errors via `Field`, `FieldLabel`, `FieldDescription`, `FieldError` (`role="alert"`) | `components/ui/*.tsx`, `components/ui/field.tsx` |
| Modal | `Dialog*`, `AlertDialog*` (confirmations) | `components/ui/dialog.tsx`, `alert-dialog.tsx` |
| Accordion / FAQ | `Accordion*` | `components/ui/accordion.tsx` |
| Tabs | `Tabs*` | `components/ui/tabs.tsx` |
| Alerts | `Alert*` | `components/ui/alert.tsx` |
| Breadcrumb | `Breadcrumb*` (or via `PageHeader`) | `components/ui/breadcrumb.tsx` |
| Toasts | `useToast` + `<Toaster />` | `hooks/use-toast.ts` (`components/ui/use-toast.ts` re-exports it) |
| Course card | `CourseCard`, `CourseCardSkeleton` | `components/course-card.tsx`, `components/course-card-skeleton.tsx` |
| Programme card | `ProgrammeCard` | `components/academy/programme-card.tsx` |
| Section header | `SectionHeader` | `components/academy/section-header.tsx` |
| Page header / hero | `PageHeader` | `components/academy/page-header.tsx` |
| Stat | `StatCard` (inside a `<dl>`) | `components/academy/stat-card.tsx` |
| Testimonial | `TestimonialCard` | `components/academy/testimonial-card.tsx` |
| Student project | `ProjectCard` | `components/academy/project-card.tsx` |
| CTA | `CTASection` (`band` / `panel`, `gradient`) | `components/academy/cta-section.tsx` |
| States | `LoadingState`, `EmptyState`, `ErrorState` | `components/academy/states.tsx` |
| Course display rules | `isCourseUpcoming`, `formatCoursePrice`, `formatCourseDuration`, `getCourseMode` | `lib/course-display.ts` |

