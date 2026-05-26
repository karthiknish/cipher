# API ↔ Frontend Integration Fix Plan

## Phase 1 — Admin auth wiring (done)

| File | Route | Change |
|------|-------|--------|
| `src/components/BlogEditor.tsx` | `/api/blog-ai-assist` | `adminFetch` + Bearer JWT |
| `src/app/admin/design-voting/page.tsx` | `/api/generate-design-details` | `adminFetch` |
| `src/app/admin/components/customers/CustomersTab.tsx` | `/api/email-campaign` | `adminFetch` |
| `src/context/AbandonedCartContext.tsx` | `/api/cart-reminder` | `adminFetch` |

Shared helper: `src/lib/admin-api.ts` → `getSessionBearerToken()` (Better Auth / Convex).

## Phase 2 — Real email delivery (done)

| Item | Change |
|------|--------|
| `src/app/api/email-campaign/route.ts` | Resend (same as cart-reminder), no simulated send |
| Campaign logging | `email_campaigns` Firestore collection |
| GET stats | Aggregates from Firestore |

Requires `RESEND_API_KEY` + `RESEND_FROM_EMAIL` on Vercel.

## Phase 3 — Identity & data (next)

- Map Better Auth `userId` → Firestore docs (or migrate collections to Convex).
- Load products/orders from one source of truth.
- Update Storage rules for Better Auth sessions.

## Phase 4 — Firestore-backed features (next)

- `LocalSceneContext`: load `events` / `stores` from Firestore (not samples only).
- `BundleContext` / `PromoCodeContext`: read `bundles` / `promoCodes` collections.
- Contact form + checkout payments (Stripe or similar).

## Phase 5 — Convex migration (next)

- `convex/products.ts` queries; migrate `ProductContext`.
- `buildStyleAgentCatalog` from Convex when products live there.
- Retire duplicate Firebase Admin paths where possible.

## Phase 6 — API hygiene (next)

- Unified `{ success, error? }` response envelope on all routes.
- Optional Zod validation at route boundaries.
- Redis/shared rate limiter for serverless.
