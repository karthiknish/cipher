import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const doc = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    return doc?.profile ?? null;
  },
});

export const upsert = mutation({
  args: { profile: v.any() },
  handler: async (ctx, { profile }) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    const now = Date.now();
    const data = { ...profile, updatedAt: now };
    if (existing) {
      await ctx.db.patch(existing._id, { profile: data, updatedAt: now });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: identity.subject,
        profile: data,
        updatedAt: now,
      });
    }
    return true;
  },
});
