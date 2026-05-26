import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

export const logEvent = mutation({
  args: {
    category: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, { category, payload }) => {
    await ctx.db.insert("analyticsEvents", {
      category,
      payload,
      createdAt: Date.now(),
    });
  },
});

export const bumpMetric = mutation({
  args: {
    metricType: v.string(),
    incrementBy: v.optional(v.number()),
  },
  handler: async (ctx, { metricType, incrementBy = 1 }) => {
    const date = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("analyticsMetrics")
      .withIndex("by_type_date", (q) =>
        q.eq("metricType", metricType).eq("date", date)
      )
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        count: existing.count + incrementBy,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("analyticsMetrics", {
        metricType,
        date,
        count: incrementBy,
        updatedAt: now,
      });
    }
  },
});

export const setUserProfile = mutation({
  args: { userId: v.string(), properties: v.any() },
  handler: async (ctx, { userId, properties }) => {
    const existing = await ctx.db
      .query("analyticsUserProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { properties, updatedAt: now });
    } else {
      await ctx.db.insert("analyticsUserProfiles", {
        userId,
        properties,
        updatedAt: now,
      });
    }
  },
});

export const getAdminDashboard = query({
  args: { since: v.number() },
  handler: async (ctx, { since }) => {
    await requireAdmin(ctx);
    const allRecent = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_created_at", (q) => q.gte("createdAt", since))
      .collect();

    const inRange = allRecent;

    const byCategory = (cat: string) =>
      inRange.filter((e) => e.category === cat);

    const pageviews = byCategory("pageviews");
    const ecommerce = byCategory("ecommerce");
    const searches = byCategory("searches");
    const errors = byCategory("errors");

    const pageCount: Record<string, number> = {};
    const deviceCount: Record<string, number> = {};
    for (const pv of pageviews) {
      const p = pv.payload as { path?: string; device?: string };
      if (p.path) pageCount[p.path] = (pageCount[p.path] ?? 0) + 1;
      if (p.device) deviceCount[p.device] = (deviceCount[p.device] ?? 0) + 1;
    }

    const topPages = Object.entries(pageCount)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalDevice = Object.values(deviceCount).reduce((a, b) => a + b, 0);
    const deviceBreakdown = Object.entries(deviceCount).map(
      ([device, count]) => ({
        device,
        count,
        percentage: totalDevice ? Math.round((count / totalDevice) * 100) : 0,
      })
    );

    const productViews = ecommerce.filter(
      (e) => (e.payload as { type?: string }).type === "view_item"
    ).length;
    const addToCart = ecommerce.filter(
      (e) => (e.payload as { type?: string }).type === "add_to_cart"
    ).length;
    const checkouts = ecommerce.filter(
      (e) => (e.payload as { type?: string }).type === "begin_checkout"
    ).length;
    const purchases = ecommerce.filter(
      (e) => (e.payload as { type?: string }).type === "purchase"
    ).length;

    const uniqueSessions = new Set(
      pageviews.map((pv) => (pv.payload as { sessionId?: string }).sessionId)
    ).size;

    const searchCounts: Record<string, number> = {};
    for (const s of searches) {
      const q = String((s.payload as { query?: string }).query ?? "");
      if (q) searchCounts[q] = (searchCounts[q] ?? 0) + 1;
    }
    const topSearches = Object.entries(searchCounts)
      .map(([query, count]) => ({ query, count, hasResults: true }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const errorCounts: Record<string, { count: number; path: string }> = {};
    for (const err of errors) {
      const e = err.payload as { error?: string; path?: string };
      const key = String(e.error ?? "unknown");
      if (!errorCounts[key]) errorCounts[key] = { count: 0, path: e.path ?? "" };
      errorCounts[key].count++;
    }

    return {
      pageViews: pageviews.length,
      uniqueVisitors: uniqueSessions,
      sessions: uniqueSessions,
      bounceRate: 0,
      avgSessionDuration: 0,
      topPages,
      deviceBreakdown,
      conversionFunnel: [
        { step: "Product Views", count: productViews, rate: 100 },
        {
          step: "Add to Cart",
          count: addToCart,
          rate: productViews ? Math.round((addToCart / productViews) * 100) : 0,
        },
        {
          step: "Checkout",
          count: checkouts,
          rate: addToCart ? Math.round((checkouts / addToCart) * 100) : 0,
        },
        {
          step: "Purchase",
          count: purchases,
          rate: checkouts ? Math.round((purchases / checkouts) * 100) : 0,
        },
      ],
      topSearches,
      recentErrors: Object.entries(errorCounts)
        .map(([error, data]) => ({ error, ...data }))
        .slice(0, 10),
    };
  },
});
