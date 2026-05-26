import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

const cartItem = v.object({
  productId: v.string(),
  name: v.string(),
  price: v.number(),
  quantity: v.number(),
  size: v.string(),
  color: v.union(v.string(), v.null()),
  image: v.string(),
});

/** Upsert abandoned cart snapshot (replaces Firestore abandonedCarts). */
export const upsert = mutation({
  args: {
    cartKey: v.string(),
    sessionId: v.string(),
    userId: v.union(v.string(), v.null()),
    email: v.union(v.string(), v.null()),
    items: v.array(cartItem),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("abandonedCarts")
      .withIndex("by_cart_key", (q) => q.eq("cartKey", args.cartKey))
      .first();

    if (args.items.length === 0) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }

    const payload = {
      cartKey: args.cartKey,
      sessionId: args.sessionId,
      userId: args.userId ?? undefined,
      email: args.email ?? undefined,
      items: args.items,
      total: args.total,
      recovered: false,
      updatedAt: now,
      abandonedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("abandonedCarts", {
        ...payload,
        remindersSent: 0,
        createdAt: now,
      });
    }
  },
});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Active abandoned carts for admin dashboard. */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const email = identity.email?.toLowerCase();
    const ADMIN_EMAILS = new Set(["karthik.nishanth06@gmail.com"]);
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", identity.subject))
      .first();
    const isAdmin =
      (email && ADMIN_EMAILS.has(email)) || user?.role === "admin";
    if (!isAdmin) return [];

    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const docs = await ctx.db.query("abandonedCarts").collect();

    return docs
      .filter((d) => !d.recovered && d.abandonedAt >= cutoff)
      .sort((a, b) => b.abandonedAt - a.abandonedAt)
      .map((d) => ({
        id: d.cartKey,
        sessionId: d.sessionId,
        userId: d.userId,
        email: d.email ?? "",
        items: d.items,
        total: d.total,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        abandonedAt: d.abandonedAt,
        remindersSent: d.remindersSent,
        lastReminderAt: d.lastReminderAt,
        recovered: d.recovered,
        recoveredAt: d.recoveredAt,
      }));
  },
});

export const recordReminder = mutation({
  args: { cartKey: v.string() },
  handler: async (ctx, { cartKey }) => {
    await requireAdmin(ctx);
    const doc = await ctx.db
      .query("abandonedCarts")
      .withIndex("by_cart_key", (q) => q.eq("cartKey", cartKey))
      .first();
    if (!doc) throw new Error("Cart not found");
    await ctx.db.patch(doc._id, {
      remindersSent: doc.remindersSent + 1,
      lastReminderAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { cartKey: v.string() },
  handler: async (ctx, { cartKey }) => {
    await requireAdmin(ctx);
    const doc = await ctx.db
      .query("abandonedCarts")
      .withIndex("by_cart_key", (q) => q.eq("cartKey", cartKey))
      .first();
    if (doc) await ctx.db.delete(doc._id);
  },
});

export const markRecovered = mutation({
  args: { cartKey: v.string() },
  handler: async (ctx, { cartKey }) => {
    const existing = await ctx.db
      .query("abandonedCarts")
      .withIndex("by_cart_key", (q) => q.eq("cartKey", cartKey))
      .first();
    if (!existing) return;
    await ctx.db.patch(existing._id, {
      recovered: true,
      recoveredAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
