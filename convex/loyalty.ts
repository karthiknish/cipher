import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const doc = await ctx.db
      .query("loyalty")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    return doc?.profile ?? null;
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const doc = await ctx.db
      .query("loyalty")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return doc?.profile ?? null;
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("loyalty").collect();
    return docs.map((d) => d.profile);
  },
});

export const upsert = mutation({
  args: { profile: v.any() },
  handler: async (ctx, { profile }) => {
    const identity = await requireIdentity(ctx);
    const userId = profile.userId ?? identity.subject;
    const existing = await ctx.db
      .query("loyalty")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { profile, updatedAt: now });
    } else {
      await ctx.db.insert("loyalty", { userId, profile, updatedAt: now });
    }
    return true;
  },
});

export const getByReferralCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const docs = await ctx.db.query("loyalty").collect();
    const match = docs.find(
      (d) =>
        (d.profile as { referralCode?: string })?.referralCode?.toUpperCase() ===
        code.toUpperCase()
    );
    return match?.profile ?? null;
  },
});
