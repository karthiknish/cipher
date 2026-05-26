import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

export const getMeasurements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const doc = await ctx.db
      .query("userMeasurements")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    return doc?.measurements ?? null;
  },
});

export const setMeasurements = mutation({
  args: { measurements: v.any() },
  handler: async (ctx, { measurements }) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("userMeasurements")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { measurements, updatedAt: now });
    } else {
      await ctx.db.insert("userMeasurements", {
        userId: identity.subject,
        measurements,
        updatedAt: now,
      });
    }
  },
});

export const getStockNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const doc = await ctx.db
      .query("stockNotifications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    return doc?.subscriptions ?? [];
  },
});

export const setStockNotifications = mutation({
  args: { subscriptions: v.array(v.any()) },
  handler: async (ctx, { subscriptions }) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("stockNotifications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { subscriptions, updatedAt: now });
    } else {
      await ctx.db.insert("stockNotifications", {
        userId: identity.subject,
        subscriptions,
        updatedAt: now,
      });
    }
  },
});

export const getSpinResult = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const doc = await ctx.db
      .query("spinWheelResults")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    return doc?.result ?? null;
  },
});

export const setSpinResult = mutation({
  args: { result: v.any() },
  handler: async (ctx, { result }) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("spinWheelResults")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { result, updatedAt: now });
    } else {
      await ctx.db.insert("spinWheelResults", {
        userId: identity.subject,
        result,
        updatedAt: now,
      });
    }
  },
});

export const getAchievements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const doc = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    return doc?.data ?? null;
  },
});

export const setAchievements = mutation({
  args: { data: v.any() },
  handler: async (ctx, { data }) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { data, updatedAt: now });
    } else {
      await ctx.db.insert("userAchievements", {
        userId: identity.subject,
        data,
        updatedAt: now,
      });
    }
  },
});
