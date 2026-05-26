import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin, requireIdentity } from "./lib/auth";

type Ctx = QueryCtx | MutationCtx;

const TIER_RATES: Record<string, number> = {
  bronze: 10,
  silver: 12,
  gold: 15,
  platinum: 18,
};

function docToInfluencer(doc: {
  _id: Id<"influencers">;
  legacyId?: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage?: string;
  socialLinks: unknown;
  commissionRate: number;
  tier: string;
  isActive: boolean;
  isVerified: boolean;
  curatedProducts: string[];
  featuredProducts: string[];
  totalEarnings: number;
  pendingEarnings: number;
  totalSales: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  joinedAt: number;
  lastActiveAt: number;
  payoutInfo?: unknown;
  liveStreamUrl?: string;
  isLive: boolean;
  followers: number;
}) {
  return {
    id: doc.legacyId ?? doc._id,
    userId: doc.userId,
    username: doc.username,
    displayName: doc.displayName,
    bio: doc.bio,
    avatar: doc.avatar,
    coverImage: doc.coverImage,
    socialLinks: doc.socialLinks,
    commissionRate: doc.commissionRate,
    tier: doc.tier,
    isActive: doc.isActive,
    isVerified: doc.isVerified,
    curatedProducts: doc.curatedProducts,
    featuredProducts: doc.featuredProducts,
    totalEarnings: doc.totalEarnings,
    pendingEarnings: doc.pendingEarnings,
    totalSales: doc.totalSales,
    totalClicks: doc.totalClicks,
    totalConversions: doc.totalConversions,
    conversionRate: doc.conversionRate,
    joinedAt: doc.joinedAt,
    lastActiveAt: doc.lastActiveAt,
    payoutInfo: doc.payoutInfo,
    liveStreamUrl: doc.liveStreamUrl,
    isLive: doc.isLive,
    followers: doc.followers,
  };
}

async function findInfluencer(ctx: Ctx, id: string) {
  const byLegacy = await ctx.db
    .query("influencers")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
    .first();
  if (byLegacy) return byLegacy;
  try {
    return (await ctx.db.get(id as Id<"influencers">)) ?? null;
  } catch {
    return null;
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("influencers").collect();
    return docs.map(docToInfluencer);
  },
});

export const listSales = query({
  args: { influencerId: v.optional(v.string()) },
  handler: async (ctx, { influencerId }) => {
    const docs = influencerId
      ? await ctx.db
          .query("influencerSales")
          .withIndex("by_influencer", (q) => q.eq("influencerId", influencerId))
          .collect()
      : await ctx.db.query("influencerSales").collect();
    return docs.map((d) => ({
      id: d.legacyId ?? d._id,
      influencerId: d.influencerId,
      orderId: d.orderId,
      orderTotal: d.orderTotal,
      commission: d.commission,
      products: d.products,
      customerEmail: d.customerEmail,
      status: d.status,
      createdAt: d.createdAt,
      paidAt: d.paidAt,
    }));
  },
});

export const listApplications = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("influencerApplications").collect();
    return docs.map((d) => ({
      id: d.legacyId ?? d._id,
      userId: d.userId,
      email: d.email,
      name: d.name,
      username: d.username,
      bio: d.bio,
      socialLinks: d.socialLinks,
      followerCount: d.followerCount,
      reason: d.reason,
      status: d.status,
      submittedAt: d.submittedAt,
      reviewedAt: d.reviewedAt,
      reviewedBy: d.reviewedBy,
      notes: d.notes,
    }));
  },
});

export const patchInfluencer = mutation({
  args: { id: v.string(), patch: v.any() },
  handler: async (ctx, { id, patch }) => {
    const doc = await findInfluencer(ctx, id);
    if (!doc) throw new Error("Influencer not found");
    await ctx.db.patch(doc._id, { ...patch, lastActiveAt: Date.now() });
    return true;
  },
});

export const trackClick = mutation({
  args: {
    influencerId: v.string(),
    productId: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, { influencerId, productId, source }) => {
    const inf = await findInfluencer(ctx, influencerId);
    if (!inf) return;
    await ctx.db.insert("influencerClicks", {
      influencerId,
      productId,
      source,
      converted: false,
      createdAt: Date.now(),
    });
    await ctx.db.patch(inf._id, { totalClicks: inf.totalClicks + 1 });
  },
});

export const recordSale = mutation({
  args: {
    influencerId: v.string(),
    orderId: v.string(),
    orderTotal: v.number(),
    products: v.any(),
    customerEmail: v.string(),
    clickLegacyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const inf = await findInfluencer(ctx, args.influencerId);
    if (!inf) return;
    const commission = (args.orderTotal * inf.commissionRate) / 100;
    await ctx.db.insert("influencerSales", {
      influencerId: args.influencerId,
      orderId: args.orderId,
      orderTotal: args.orderTotal,
      commission,
      products: args.products,
      customerEmail: args.customerEmail,
      status: "pending",
      createdAt: Date.now(),
    });
    await ctx.db.patch(inf._id, {
      totalSales: inf.totalSales + 1,
      totalConversions: inf.totalConversions + 1,
      pendingEarnings: inf.pendingEarnings + commission,
    });
    if (args.clickLegacyId) {
      const click = await ctx.db
        .query("influencerClicks")
        .withIndex("by_influencer", (q) => q.eq("influencerId", args.influencerId))
        .first();
      if (click) {
        await ctx.db.patch(click._id, {
          converted: true,
          orderId: args.orderId,
        });
      }
    }
  },
});

export const apply = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    username: v.string(),
    bio: v.string(),
    socialLinks: v.any(),
    followerCount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const taken = await ctx.db
      .query("influencers")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .first();
    if (taken) throw new Error("Username already taken");
    await ctx.db.insert("influencerApplications", {
      ...args,
      username: args.username.toLowerCase(),
      status: "pending",
      submittedAt: Date.now(),
    });
    return true;
  },
});

export const approveApplication = mutation({
  args: { applicationId: v.string(), reviewedBy: v.optional(v.string()) },
  handler: async (ctx, { applicationId, reviewedBy }) => {
    await requireAdmin(ctx);
    const app =
      (await ctx.db
        .query("influencerApplications")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", applicationId))
        .first()) ??
      (await ctx.db.get(applicationId as Id<"influencerApplications">));
    if (!app) throw new Error("Application not found");
    const now = Date.now();
    await ctx.db.insert("influencers", {
      userId: app.userId,
      username: app.username,
      displayName: app.name,
      bio: app.bio,
      avatar: "",
      socialLinks: app.socialLinks,
      commissionRate: TIER_RATES.bronze,
      tier: "bronze",
      isActive: true,
      isVerified: false,
      curatedProducts: [],
      featuredProducts: [],
      totalEarnings: 0,
      pendingEarnings: 0,
      totalSales: 0,
      totalClicks: 0,
      totalConversions: 0,
      conversionRate: 0,
      joinedAt: now,
      lastActiveAt: now,
      isLive: false,
      followers: app.followerCount,
    });
    await ctx.db.patch(app._id, {
      status: "approved",
      reviewedAt: now,
      reviewedBy,
    });
    return true;
  },
});

export const rejectApplication = mutation({
  args: {
    applicationId: v.string(),
    notes: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
  },
  handler: async (ctx, { applicationId, notes, reviewedBy }) => {
    await requireAdmin(ctx);
    const app =
      (await ctx.db
        .query("influencerApplications")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", applicationId))
        .first()) ??
      (await ctx.db.get(applicationId as Id<"influencerApplications">));
    if (!app) throw new Error("Application not found");
    await ctx.db.patch(app._id, {
      status: "rejected",
      reviewedAt: Date.now(),
      reviewedBy,
      notes,
    });
    return true;
  },
});

export const markSalePaid = mutation({
  args: { saleId: v.string() },
  handler: async (ctx, { saleId }) => {
    await requireAdmin(ctx);
    const sale =
      (await ctx.db
        .query("influencerSales")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", saleId))
        .first()) ?? (await ctx.db.get(saleId as Id<"influencerSales">));
    if (!sale) throw new Error("Sale not found");
    const inf = await findInfluencer(ctx, sale.influencerId);
    if (!inf) throw new Error("Influencer not found");
    await ctx.db.patch(sale._id, { status: "paid", paidAt: Date.now() });
    await ctx.db.patch(inf._id, {
      pendingEarnings: Math.max(0, inf.pendingEarnings - sale.commission),
      totalEarnings: inf.totalEarnings + sale.commission,
    });
    return true;
  },
});

export const patchApplication = mutation({
  args: { id: v.string(), patch: v.any() },
  handler: async (ctx, { id, patch }) => {
    const doc =
      (await ctx.db
        .query("influencerApplications")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
        .first()) ?? (await ctx.db.get(id as Id<"influencerApplications">));
    if (!doc) throw new Error("Not found");
    await ctx.db.patch(doc._id, patch);
    return true;
  },
});
