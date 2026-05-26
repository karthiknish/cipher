import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const doc = await ctx.db
      .query("wishlists")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    return doc?.items ?? [];
  },
});

export const setItems = mutation({
  args: { items: v.array(v.any()) },
  handler: async (ctx, { items }) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { items, updatedAt: now });
    } else {
      await ctx.db.insert("wishlists", {
        userId: identity.subject,
        items,
        updatedAt: now,
      });
    }
  },
});
