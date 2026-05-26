# Firestore → Convex migration

## Migrated to Convex

| Domain | Convex module | Client / Admin |
|--------|---------------|----------------|
| Auth roles | `convex/users.ts` | `AuthContext` |
| Products | `convex/products.ts` | `ProductContext`, `/admin/products` |
| Orders | `convex/orders.ts` | `OrderContext`, `/admin/orders` |
| Abandoned carts | `convex/abandonedCarts.ts` | `CartContext`, `/admin/abandoned` |
| Blogs | `convex/blogs.ts` | `BlogContext`, `/admin/blog` |
| Promo codes | `convex/promoCodes.ts` | `PromoCodeContext`, `/admin/promos` |
| Events & stores | `convex/events.ts` | `LocalSceneContext`, `/admin/events` |
| Bundles | `convex/bundles.ts` | `BundleContext`, `/admin/bundles` |
| Wishlists | `convex/wishlists.ts` | `WishlistContext` |
| User profiles | `convex/userProfiles.ts` | `UserProfileContext` |
| Inventory | `convex/inventory.ts` | `InventoryContext`, `/admin/inventory` |
| Reviews | `convex/reviews.ts` | `ReviewContext`, `/admin/reviews` |
| Loyalty | `convex/loyalty.ts` | `LoyaltyContext`, `/admin/loyalty` |
| Pricing rules | `convex/pricingRules.ts` | `DynamicPricingContext`, `/admin/pricing` |
| Newsletter | `convex/newsletter.ts` | `NewsletterContext`, `/admin/newsletter` |
| Design voting | `convex/designContests.ts` | `DesignVotingContext`, `/admin/design-voting` |
| Achievements / spin / stock alerts / measurements | `convex/userExtras.ts` | respective contexts |
| Style agent catalog | `convex/products.list` | `src/lib/server-products.ts` |
| Analytics | `convex/analytics.ts` | `AnalyticsContext`, `/api/analytics`, admin analytics tab |
| Customer behavior | `convex/customerBehavior.ts` | `CustomerBehaviorContext` |
| Live activity | `convex/liveActivity.ts` | `LiveActivityContext` |
| Influencers | `convex/influencers.ts` | `InfluencerContext`, `/admin/influencers` |
| Email campaign logs | `convex/emailCampaigns.ts` | `/api/email-campaign` |

## Storage

- **Convex file storage** — `convex/files.ts` + `src/lib/uploadImage.ts` (authenticated uploads)
- **Bulk re-upload** — `convex/imageMigration.ts` + `scripts/migrateFirebaseImagesToConvex.ts`
- **User ID remap** — `convex/adminCli.ts` + `scripts/remapFirebaseUserIds.ts` (Firebase UID → Better Auth id)
- **Admin CLI** — `npm run set-admin` / `set-admin:prod` → `adminCli:setAdminByEmail`
- **One-off scripts** may still use `firebase-admin` + `scripts/serviceAccountKey.json` for Firestore imports only

## Auth (server)

- **Better Auth + Convex only** — `src/lib/api-auth.ts` (no Firebase Admin fallback)

## Import data

```bash
npm run migrate:convex          # dev deployment
npm run migrate:convex:prod-only # production only (glorious-trout-382)
npm run migrate:images          # re-upload Firebase images → Convex (dev)
npm run migrate:images:prod     # same for production
npm run remap:users             # remap Firebase UIDs → Better Auth ids (dev)
npm run remap:users:prod        # same for production
npm run set-admin               # grant admin in Convex (dev)
npm run set-admin:prod          # grant admin in production
```

**Production:** `glorious-trout-382` (Vercel `NEXT_PUBLIC_CONVEX_URL`). **Dev:** `canny-porcupine-52`.

After schema changes:

```bash
npx convex dev --once   # dev
npx convex deploy --yes # prod
```
