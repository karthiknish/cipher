import { v } from "convex/values";
import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { patchMatchingDocs } from "./lib/parallelDb";
/** CLI: grant admin role by email. */
export const setAdminByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();

    const allUsers = await ctx.db.query("users").collect();
    const existing = allUsers.find(
      (u) => u.email?.toLowerCase() === normalized
    );

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { role: "admin", updatedAt: now });
      return {
        ok: true,
        userId: existing.legacyId,
        message: `Updated ${normalized} to admin`,
      };
    }

    await ctx.db.insert("users", {
      legacyId: `pending_${normalized}`,
      email: normalized,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    return {
      ok: true,
      userId: `pending_${normalized}`,
      message: `Admin role staged for ${normalized}. Reconciles on next sign-in.`,
    };
  },
});

/** CLI: list app users (for Firebase UID remap). */
export const listAppUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return (await ctx.db.query("users").collect()).map((u) => ({
      legacyId: u.legacyId,
      email: u.email ?? null,
      role: u.role,
    }));
  },
});

/** CLI: per-user docs keyed by unknown user IDs. */
export const listOrphanedUserIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const known = new Set(
      (await ctx.db.query("users").collect()).map((u) => u.legacyId)
    );
    const orphaned = new Set<string>();

    const track = (userId: string | undefined) => {
      if (userId && !known.has(userId) && !userId.startsWith("pending_")) {
        orphaned.add(userId);
      }
    };

    for (const doc of await ctx.db.query("wishlists").collect()) track(doc.userId);
    for (const doc of await ctx.db.query("userProfiles").collect()) track(doc.userId);
    for (const doc of await ctx.db.query("userAchievements").collect()) track(doc.userId);
    for (const doc of await ctx.db.query("loyalty").collect()) track(doc.userId);
    for (const doc of await ctx.db.query("userMeasurements").collect()) track(doc.userId);
    for (const doc of await ctx.db.query("stockNotifications").collect()) track(doc.userId);
    for (const doc of await ctx.db.query("spinWheelResults").collect()) track(doc.userId);
    for (const doc of await ctx.db.query("analyticsUserProfiles").collect()) track(doc.userId);
    for (const doc of await ctx.db.query("behaviorProfiles").collect()) track(doc.userId);

    return { orphaned: [...orphaned], knownCount: known.size };
  },
});

const mapping = v.object({
  fromUserId: v.string(),
  toUserId: v.string(),
});

const singleUserTables = [
  "userProfiles",
  "userAchievements",
  "loyalty",
  "userMeasurements",
  "stockNotifications",
  "spinWheelResults",
  "analyticsUserProfiles",
  "behaviorProfiles",
] as const;

async function remapOneUserId(
  ctx: MutationCtx,
  fromUserId: string,
  toUserId: string
): Promise<number> {
  if (fromUserId === toUserId) return 0;

  let updated = 0;
  updated += await patchMatchingDocs(ctx, "orders", "userId", fromUserId, toUserId);
  updated += await patchMatchingDocs(ctx, "abandonedCarts", "userId", fromUserId, toUserId);
  updated += await patchMatchingDocs(ctx, "reviews", "userId", fromUserId, toUserId);
  updated += await patchMatchingDocs(ctx, "reviewVotes", "userId", fromUserId, toUserId);
  updated += await patchMatchingDocs(ctx, "liveActivities", "userId", fromUserId, toUserId);
  updated += await patchMatchingDocs(ctx, "designContests", "createdBy", fromUserId, toUserId);
  updated += await patchMatchingDocs(ctx, "behaviorSessions", "userId", fromUserId, toUserId);
  updated += await patchMatchingDocs(ctx, "influencers", "userId", fromUserId, toUserId);
  updated += await patchMatchingDocs(
    ctx,
    "influencerApplications",
    "userId",
    fromUserId,
    toUserId
  );

  const [fromWishlist, toWishlist] = await Promise.all([
    ctx.db
      .query("wishlists")
      .withIndex("by_user", (q) => q.eq("userId", fromUserId))
      .first(),
    ctx.db
      .query("wishlists")
      .withIndex("by_user", (q) => q.eq("userId", toUserId))
      .first(),
  ]);

  if (fromWishlist) {
    if (toWishlist) {
      await ctx.db.patch(toWishlist._id, {
        items: [...toWishlist.items, ...fromWishlist.items],
        updatedAt: Date.now(),
      });
      await ctx.db.delete(fromWishlist._id);
    } else {
      await ctx.db.patch(fromWishlist._id, { userId: toUserId });
    }
    updated++;
  }

  const singleUserUpdates = await Promise.all(
    singleUserTables.map(async (table) => {
      const fromDoc = await ctx.db
        .query(table)
        .withIndex("by_user", (q) => q.eq("userId", fromUserId))
        .first();
      if (!fromDoc) return 0;

      const toDoc = await ctx.db
        .query(table)
        .withIndex("by_user", (q) => q.eq("userId", toUserId))
        .first();

      if (toDoc) {
        await ctx.db.delete(fromDoc._id);
      } else {
        await ctx.db.patch(fromDoc._id, { userId: toUserId });
      }
      return 1;
    })
  );
  updated += singleUserUpdates.reduce<number>((sum, n) => sum + n, 0);

  const staleUser = await ctx.db
    .query("users")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", fromUserId))
    .first();
  if (staleUser) {
    await ctx.db.delete(staleUser._id);
  }

  return updated;
}

/** CLI: re-key per-user rows from Firebase UID → Better Auth subject. */
export const remapUserIds = internalMutation({
  args: { mappings: v.array(mapping) },
  handler: async (ctx, { mappings }) => {
    const counts = await Promise.all(
      mappings.map(({ fromUserId, toUserId }) => remapOneUserId(ctx, fromUserId, toUserId))
    );
    const updated = counts.reduce((sum, n) => sum + n, 0);
    return { updated, mappingCount: mappings.length };
  },
});
