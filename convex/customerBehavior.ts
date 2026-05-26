import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const doc = await ctx.db
      .query("behaviorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return doc?.profile ?? null;
  },
});

export const upsertProfile = mutation({
  args: { userId: v.string(), profile: v.any() },
  handler: async (ctx, { userId, profile }) => {
    const existing = await ctx.db
      .query("behaviorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { profile, updatedAt: now });
    } else {
      await ctx.db.insert("behaviorProfiles", { userId, profile, updatedAt: now });
    }
  },
});

export const upsertSession = mutation({
  args: {
    sessionId: v.string(),
    userId: v.optional(v.string()),
    status: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("behaviorSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    const now = Date.now();
    const row = {
      sessionId: args.sessionId,
      userId: args.userId,
      status: args.status,
      data: args.data,
      updatedAt: now,
    };
    if (existing) await ctx.db.patch(existing._id, row);
    else await ctx.db.insert("behaviorSessions", row);
  },
});

export const logBehaviorEvent = mutation({
  args: { category: v.string(), payload: v.any() },
  handler: async (ctx, { category, payload }) => {
    await ctx.db.insert("analyticsEvents", {
      category: `behavior:${category}`,
      payload,
      createdAt: Date.now(),
    });
  },
});

export const listProfiles = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const docs = await ctx.db.query("behaviorProfiles").collect();
    return docs.map((d) => d.profile);
  },
});

export const listCompletedSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    await requireAdmin(ctx);
    const docs = await ctx.db
      .query("behaviorSessions")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .take(limit);
    return docs.map((d) => d.data);
  },
});
