# CIPHER UI/UX Audit

Based on [frontend-design skill](.agents/skills/frontend-design/SKILL.md) review — May 2026.

**Live site:** https://cipher-omega-three.vercel.app

---

## Executive summary

CIPHER has a **coherent black/white streetwear direction** on key pages (home hero, shop, login, 404), but **design tokens are thin**, **typography is inconsistent**, **global overlays compete for attention**, and several flows **look finished while backend behavior is stubbed** — a serious UX trust gap.

---

## 1. Design system & visual identity

| Gap | Severity | Detail |
|-----|----------|--------|
| **Font conflict** | High | `layout.tsx` loads Geist; `globals.css` sets `body { font-family: Arial }` — brand typography never applies globally. |
| **Generic stack** | Medium | Geist + Arial matches “default AI storefront” per frontend-design skill; no distinctive display face for headlines. |
| **No design tokens** | Medium | Only `--background` / `--foreground` in CSS; spacing, radii, and shadows are ad hoc per page. |
| **Radius inconsistency** | Low | Login uses `rounded-xl`; shop/admin use sharp corners + `tracking-wider` — feels like two products. |

**Recommendation:** Pick one streetwear direction (e.g. editorial minimal: sharp type + wide letter-spacing). Define tokens in `globals.css` (`@theme`), remove Arial override, use Geist or a paired display font consistently.

---

## 2. Typography

| Area | Issue |
|------|--------|
| Headings | Strong on marketing pages (`font-light tracking-tight`) |
| Body | Falls back to Arial — undermines premium positioning |
| Admin | Dense tables/forms; readable but same patterns as storefront without hierarchy system |
| Blog editor | Separate TipTap prose styles — disconnected from site scale |

---

## 3. Motion & interaction

| Strength | Gap |
|----------|-----|
| Hero parallax, page transitions, 404 animation | **No `prefers-reduced-motion`** — scroll/loop animations ignore accessibility settings |
| Search overlay locks body scroll | Chatbot + SpinWheel + ActivityTicker all global — **overlay fatigue** |
| | Shop “Quick Add” on hover — **no clear mobile/touch path** on product cards |

**Files:** `src/components/home/HeroSection.tsx`, `src/components/Chatbot.tsx`, `src/components/SpinWheel.tsx`, `src/components/ActivityTicker.tsx`, `src/app/layout.tsx`

---

## 4. Accessibility

| Issue | Location |
|-------|----------|
| Labels without `htmlFor` / `id` pairing | `src/app/login/page.tsx` |
| Sparse `aria-label` (only some navbar controls) | `src/components/Navbar.tsx` |
| No skip-to-content link | `src/app/layout.tsx` |
| `outline-none` on many inputs | Admin forms, blog editor |
| Search results not announced | Navbar search overlay |
| Emoji in chatbot welcome | May confuse screen readers |

---

## 5. Trust & deceptive UX (critical)

| Flow | What user sees | What actually happens |
|------|----------------|------------------------|
| **Contact** | Success toast + “Message sent” | `setTimeout(1500)` only — `src/app/contact/page.tsx` |
| **Checkout payment** | Card form + “Payment failed/success” | `setTimeout(2000)` — no Stripe — `src/app/checkout/page.tsx` |
| **Email campaigns** | Admin “sent” counts | Fixed: now Resend (verify `RESEND_API_KEY` on Vercel) |
| **Admin achievements/challenges** | Full admin nav links | Placeholder copy: “placeholder for the full implementation” |

These break user trust even when visuals are polished.

---

## 6. Page-level gaps

### Storefront

| Page | Gap |
|------|-----|
| **Shop** | Spinner-only loading; no skeleton grid; empty catalog state weak if Firebase empty |
| **Shop** | `placehold.co` images → try-on errors; need catalog quality guardrails in admin |
| **PDP** | Rich features (reviews, compare, try-on) — ensure mobile stacking and sticky CTA tested |
| **Cart / checkout** | Guest vs auth flow OK visually; payment step misleads |
| **Challenges** | Sample/in-memory data — UI implies real community |
| **Bundles / events** | May show mock or stale data depending on context |

### Auth

| Page | Gap |
|------|-----|
| **Login** | Polished; Google OAuth depends on env + redirect URIs |
| | No visible “session expired” messaging elsewhere |

### Admin

| Page | Gap |
|------|-----|
| **Achievements / Challenges** | Placeholder admin pages |
| **Dense nav** | 15+ tabs — consider grouping (Commerce / Marketing / Content) |
| **CustomersTab** | Complex CLV UI — verify mobile/tablet |

---

## 7. Global chrome

| Component | UX note |
|-----------|---------|
| **Navbar** | Search UX strong; mobile menu needs audit for focus trap |
| **Footer** | Solid IA; missing social links if brand expects them |
| **Chatbot** | Always available — good for support; consider collapse default on checkout |
| **ActivityTicker** | Social proof — can feel spammy; dismissed state is good |
| **SpinWheel** | Gamification — conflicts with premium tone; gate behind login (partially done) |

---

## 8. Responsive & performance

| Gap | Detail |
|-----|--------|
| Hero separate mobile/desktop images | Good |
| Product grid `grid-cols-2` on mobile | OK for fashion |
| Many full-screen modals | Test small viewports (iPhone SE) |
| No image blur placeholders consistency | Some pages use `bg-gray-100` only |

---

## 9. Priority fix matrix

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Fix `globals.css` font override; use design tokens | Small |
| P0 | Checkout: label as demo OR integrate Stripe; remove fake card UX | Medium |
| P0 | Contact: real API or honest “not wired” state | Small |
| P1 | Wire `adminFetch` callers (done in API pass) | Done |
| P1 | Add `prefers-reduced-motion` in `globals.css` / motion lib | Small |
| P1 | Form labels: `htmlFor` + ids on login/checkout | Small |
| P1 | Reduce global widgets on checkout route | Small |
| P2 | Skeleton loaders on shop/admin tables | Medium |
| P2 | Complete admin achievements/challenges or hide nav items | Medium |
| P2 | Distinctive typography (display + body pair) | Medium |
| P3 | Design system doc + shared `Button`, `Input` components | Large |

---

## 10. Skill installed

**frontend-design** is available at:

`.agents/skills/frontend-design/SKILL.md`

Use when building or refactoring UI so outputs avoid generic AI aesthetics and commit to a bold, cohesive direction.
