import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ACTIVE_MS = 2 * 60 * 1000;

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const since = Date.now() - 30 * 60 * 1000;
    const docs = await ctx.db
      .query("liveActivities")
      .withIndex("by_created_at", (q) => q.gte("createdAt", since))
      .order("desc")
      .take(20);
    return docs.map((d) => ({
      id: d._id,
      type: d.type,
      productId: d.productId,
      productName: d.productName,
      productImage: d.productImage,
      userName: d.userName,
      timestamp: d.createdAt,
    }));
  },
});

export const logActivity = mutation({
  args: {
    type: v.string(),
    productId: v.string(),
    productName: v.string(),
    productImage: v.optional(v.string()),
    userName: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("liveActivities", {
      type: args.type,
      productId: args.productId,
      productName: args.productName,
      productImage: args.productImage,
      userName: args.userName,
      userId: args.userId,
      createdAt: Date.now(),
    });
  },
});

export const pingViewer = mutation({
  args: { productId: v.string(), sessionId: v.string() },
  handler: async (ctx, { productId, sessionId }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("productViewers")
      .withIndex("by_product_session", (q) =>
        q.eq("productId", productId).eq("sessionId", sessionId)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { lastActive: now });
    } else {
      await ctx.db.insert("productViewers", {
        productId,
        sessionId,
        lastActive: now,
      });
    }
  },
});

export const leaveViewer = mutation({
  args: { productId: v.string(), sessionId: v.string() },
  handler: async (ctx, { productId, sessionId }) => {
    const existing = await ctx.db
      .query("productViewers")
      .withIndex("by_product_session", (q) =>
        q.eq("productId", productId).eq("sessionId", sessionId)
      )
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const getViewerCount = query({
  args: { productId: v.string() },
  handler: async (ctx, { productId }) => {
    const now = Date.now();
    const viewers = await ctx.db
      .query("productViewers")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .collect();
    return viewers.filter((v) => now - v.lastActive <= ACTIVE_MS).length;
  },
});

export const pruneStale = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const old = await ctx.db
      .query("liveActivities")
      .withIndex("by_created_at", (q) => q.lt("createdAt", cutoff))
      .take(50);
    await Promise.all(old.map((doc) => ctx.db.delete(doc._id)));

    const staleViewers = await ctx.db.query("productViewers").collect();
    const now = Date.now();
    const staleDeletes: Promise<void>[] = [];
    for (const v of staleViewers) {
      if (now - v.lastActive > ACTIVE_MS) staleDeletes.push(ctx.db.delete(v._id));
    }
    await Promise.all(staleDeletes);
    return { removed: old.length };
  },
});
