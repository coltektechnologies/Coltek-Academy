# CLAUDE.md — Coltek Academy

How to work on this repository. Read this before any change. For **how the site should look**, read [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — it is mandatory before touching UI.

---

## 1. Project goal

Turn the existing Coltek Academy website into a **professional, modern, consistent, responsive, accessible and trustworthy** technology-education platform.

Improve what exists; do not rebuild blindly. The working flows (auth, enrollment, Paystack, certificates, admin) are the product — the redesign wraps them, it does not replace them.

Coltek Academy is the training arm of **Coltek Technologies**, based in **Accra, Ghana**. Prices are in **Ghana cedi (GH₵)**.

---

## 2. Existing application (verified from the code — do not invent beyond this)

| Area | What exists |
|---|---|
| Framework | **Next.js 16** (App Router), **React 19**, **TypeScript** (`typescript.ignoreBuildErrors: true` in `next.config.mjs`) |
| Styling | **Tailwind CSS v4** via `@tailwindcss/postcss`. No `tailwind.config` — tokens live in `@theme inline` in [app/globals.css](app/globals.css). `tw-animate-css`. [styles/globals.css](styles/globals.css) is an unused stock copy — do not edit it. |
| Components | **shadcn/ui** ("new-york", lucide icons) in [components/ui/](components/ui/). Feature components in `components/{home,about,contact,courses,course-detail,register,auth,admin}`. |
| Fonts | Inter (sans) + Geist Mono via `next/font/google` in [app/layout.tsx](app/layout.tsx) |
| Brand | Palette derived from the logo: navy `#193E72` (primary), teal `#207890` (accent), bright teal `#32BBB1` (decorative). Logo: `public/coltek-academy-logo.svg` (color) and `public/coltek-academy-logo-white.svg` (on navy). Light theme only. |
| Layouts | Only the root layout. Each page imports `Navbar`/`Footer` itself. No route groups. |
| Rendering | Most public pages are `"use client"` and load sections with `dynamic(..., { ssr: false })`. Global `RouteLoaderProvider` shows an 800 ms overlay on every navigation. |
| Auth | **Firebase Authentication** (email/password, Google, GitHub popups) via `AuthProvider` in [hooks/use-auth.tsx](hooks/use-auth.tsx). `next-auth` is installed but **unused**. No middleware; route guards are client-side redirects. |
| Data | **Firestore**. Client SDK ([lib/firebase.ts](lib/firebase.ts)) is used in the browser **and** in most API routes. Firebase Admin ([lib/verify-firebase-token.ts](lib/verify-firebase-token.ts)) verifies ID tokens and checks admin status (`isUidAdminServer`). Collections: `courses`, `enrollments`, `users`, `adminUsers`, `certificates`, `certificateFiles`, `testimonials`, `activities`. |
| Course data | Firestore `courses` is the **source of truth**. Admins set `duration` (text, e.g. "10 weeks", via amount + unit) and `mode` (`Online` / `In person`) in [components/admin/CourseForm.tsx](components/admin/CourseForm.tsx); display rules are in [lib/course-display.ts](lib/course-display.ts). [lib/data.ts](lib/data.ts) is seed data only (pushed by `scripts/migrate-courses*.ts`). Two competing types: [lib/types.ts](lib/types.ts) (used by the UI) and [types/course.ts](types/course.ts) (admin form). |
| Payments | **Paystack** redirect checkout: `/api/paystack/initialize` (price read server-side) → Paystack → `/payment-success` → `/api/paystack/verify` (amount checked) → enrollment saved from the client via [lib/enrollment.ts](lib/enrollment.ts). `/api/paystack/webhook` verifies signatures but only logs. Free courses enroll directly. |
| Email | nodemailer over SMTP ([lib/mailer.ts](lib/mailer.ts)): `/api/register/send-confirmation` (auth required, sends to the signed-in user only) and `/api/contact`. |
| API routes | `/api/courses`, `/api/courses/[slug]`, `/api/courses/related`, `/api/stats`, `/api/testimonials`, `/api/contact`, `/api/paystack/{initialize,verify,webhook}`, `/api/register/send-confirmation`, `/api/certificates`, `/api/certificates/[id]/download`, `/api/files/[fileId]`, `/api/upload` (admin token), `/api/admin/auth-users`, legacy `/uploads/[...segments]` |
| Student area | `/dashboard` (enrolled courses), `/certificates` (preview/download), `/payment-success` |
| Public pages | `/`, `/courses`, `/courses/[slug]`, `/about`, `/contact`, `/login`, `/signup`, `/forgot-password`, `/register` (4-step enrollment wizard, login required), `/privacy`, `/terms` |
| Admin | `/admin/*` (dashboard, courses, enrollments, users, testimonials, certificates, settings, login). `/admin/register` is intentionally disabled — admins are provisioned via `scripts/create-admin-user.ts`. Admin UI checks `users/{uid}.role === 'admin'` on the client. |
| Analytics | `@vercel/analytics` |

Known pre-existing issues to keep in mind (not to fix opportunistically): `params` is not awaited in `/api/courses/[slug]` and `/api/certificates/[id]/download` (Next 16 expects a Promise; the course page retries with `?slug=`); [firestore.rules](firestore.rules) contains a development catch-all that allows all reads/writes; real certificate files are committed under `public/uploads/certificates/`.

---

## 3. Core development rule — work in stages

**Never redesign the whole application in one operation.**

Each stage must:

1. **Inspect** the relevant existing code first (and `DESIGN_SYSTEM.md` for UI work).
2. **Change only what the stage asks for.**
3. **Verify** (section 14).
4. **Report** what changed (files + behavior).
5. **List remaining issues** and anything needing a business decision.
6. **Stop** — wait for the next stage instead of making unrelated changes.

If you notice an unrelated problem, report it; do not fix it in the same stage unless it blocks the stage or is a security/data-integrity issue the owner would clearly want fixed (then call it out explicitly).

---

## 4. Preserve existing functionality

Unless a stage explicitly asks for it, do **not** break, rewrite, or change the behavior of:

- Firebase Authentication (email/password, Google, GitHub, password reset)
- Firestore reads/writes and collection shapes
- Courses, course slugs (referenced by enrollments and the sitemap — never rename), and the upcoming/available logic
- Course enrollment (`/register` wizard, free enrollment)
- Paystack initialize / verify / webhook and `/payment-success`
- Enrollment records, dashboard, certificates (issue, preview, download)
- Testimonials (Firestore-managed by admins)
- Admin functionality and existing API routes
- SMTP email and the WhatsApp student-group link

A visual redesign must not change backend behavior. If a UI change genuinely requires a backend change, say so and keep it minimal.

---

## 5. Content integrity

**Never invent**: statistics, student numbers, reviews, ratings, testimonials, partnerships, accreditations, employment/placement rates, salary outcomes, course outcomes, guarantees, refund policies, schedules, start dates, delivery formats.

Use only:

- data computed from Firestore (e.g. `/api/stats`, enrollment counts), or
- information explicitly provided by the project owner, or
- content already in the codebase that has been confirmed.

If information is missing, **leave a clearly marked gap and report it** — do not fill it with plausible copy.

Current known-unverified content (do not amplify; ask before reusing):

- Course `rating`, `reviewCount`, seeded `enrolledStudents`, and most seeded instructor names/bios (e.g. "Emma Thompson", "Former NSA") in Firestore — not displayed; keep it that way.
- "Lifetime access", "24/7 Support", "self-paced" claims.
- Refund policy: the Terms say fees are non-refundable; this is treated as authoritative pending owner confirmation.

---

## 6. Design system rule

**Always read [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) before modifying UI.** All new UI follows it. Do not introduce colors, type sizes, spacing, radii, shadows or component styles that are not defined there. If the design system lacks something you need, propose an addition to `DESIGN_SYSTEM.md` in your report rather than inventing a one-off.

---

## 7. Component reuse

Before creating a component:

1. Search the repo (`components/ui/`, feature folders) for an existing equivalent.
2. Reuse it if possible.
3. If it is close but not right, improve the **shared** component (without breaking other call sites).
4. Only create a new component when no reusable equivalent exists — and make it reusable.

The full component inventory is in [DESIGN_SYSTEM.md §29](DESIGN_SYSTEM.md). Shared academy components live in `components/academy/` (SectionHeader, PageHeader, StatCard, TestimonialCard, CTASection, ProgrammeCard, Loading/Empty/ErrorState); course display rules live in `lib/course-display.ts`.

Known duplication still to retire: the `upcomingSlugs` list in the course API routes and `lib/courses.ts` (frontend uses `lib/course-display.ts`); the team/instructor mapping (`course-hero.tsx`, `course-content.tsx`, `team-section.tsx`); `LoadingFallback` (redefined per page). shadcn primitives exist for pagination, carousel, form, etc. — use them instead of hand-rolling.

---

## 8. Color rules

Use **semantic tokens** (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, and the status tokens defined in `DESIGN_SYSTEM.md`).

Do **not** introduce `bg-gray-*`, `text-gray-*`, `bg-white`, `bg-blue-*`, `text-blue-*`, `bg-green-*`, `bg-amber-*`, arbitrary hex or rgb values — unless the color has a legitimate semantic or brand purpose that has a token, or is a **third-party brand color** (Google, GitHub, WhatsApp `#25D366`, Paystack) which may remain.

When touching a file that already contains raw palette classes, migrate them to tokens if it is in scope of the stage.

---

## 9. Responsive design

Every redesigned page is designed — not compressed — for mobile, tablet and desktop. Check at approximately **360, 390, 430, 768, 1024 px and ≥1280 px**. No horizontal page scroll at any width. Touch targets ≥ 44×44 px on mobile.

---

## 10. Accessibility

All new UI must handle: semantic HTML and landmarks, keyboard navigation, visible `:focus-visible` states, WCAG AA contrast (4.5:1 text, 3:1 large text/UI), accessible names/labels, form errors linked with `aria-invalid` + `aria-describedby`, ARIA only where native semantics are insufficient, `prefers-reduced-motion`, touch target size, and screen-reader behavior (decorative icons `aria-hidden`, status messages announced).

---

## 11. Performance

Avoid unnecessary client components, `dynamic(..., { ssr: false })`, artificial loading delays (do not add new ones; the 800 ms route overlay is slated for removal), oversized images (use the SVG logo, never the 8880×3238 PNG), duplicate API requests, and decorative animation. Prefer server components / server rendering for public marketing pages. Use `next/image` with explicit sizes.

---

## 12. SEO

Public marketing pages should have page `metadata` (title, description), Open Graph data, canonical URLs, structured data where appropriate (`EducationalOrganization`, `Course`), and content rendered on the server. Do not sacrifice crawlable content for visual effects. Keep existing course slugs.

---

## 13. No unnecessary redesign

Prefer strong hierarchy, whitespace, typography, clear CTAs, consistent components, good imagery, and subtle motion. Avoid excessive gradients, glassmorphism, animation, shadows, cards, decorative blobs, and generic AI-template layouts. Not every section needs to be "designed".

---

## 14. Verification

After each significant stage:

| Check | Command / method | Notes |
|---|---|---|
| Type check | `npx tsc --noEmit -p tsconfig.json` | ~17 pre-existing errors exist. Compare against the previous state: **no new errors** in touched files. |
| Lint | `npm run lint` | Currently **not runnable** — ESLint is not installed/configured. Report this rather than silently skipping. |
| Production build | `npm run build` | Must succeed. |
| App test | `npm start` (or `next start -p <port>`) and exercise the affected routes | On this machine `/snap/bin/node` cannot write stdout from background processes, which makes dynamic routes hang (EBADF loop). Start servers with `/snap/node/current/bin/node node_modules/next/dist/bin/next start -p <port>`. |
| Browser | Headless Chrome (`/usr/bin/google-chrome`) via CDP, or a real browser | Check console errors, failed requests, broken images, mobile widths. `/_vercel/insights/script.js` 404 locally is expected. |

Also check broken links, broken images, responsive behavior, and that existing functionality (section 4) still works. Do not send real emails, create real accounts, or start real Paystack transactions while testing without the owner's approval. Never write to production Firestore without explicit approval.

Report honestly: what was tested, what was not, and why.

---

## 15. Git

Commit after each major stage, one stage per commit, with descriptive messages, e.g.:

- `fix: stabilize payment, contact and data integrity`
- `refactor: establish academy design foundation`
- `refactor: standardize academy shared components`
- `redesign: academy homepage`

Do not mix unrelated stages in one commit. Only commit when the owner asks or when the stage instructions say to. Never commit secrets (`.env*` is gitignored — keep it that way).
