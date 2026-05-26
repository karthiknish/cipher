import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";

type Ctx = QueryCtx | MutationCtx;

async function findSubscriber(ctx: Ctx, id: string) {
  const byLegacy = await ctx.db
    .query("newsletterSubscribers")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
    .first();
  if (byLegacy) return byLegacy;
  try {
    return (await ctx.db.get(id as Id<"newsletterSubscribers">)) ?? null;
  } catch {
    return null;
  }
}

async function findCampaign(ctx: Ctx, id: string) {
  const byLegacy = await ctx.db
    .query("newsletterCampaigns")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
    .first();
  if (byLegacy) return byLegacy;
  try {
    return (await ctx.db.get(id as Id<"newsletterCampaigns">)) ?? null;
  } catch {
    return null;
  }
}

export const listSubscribers = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("newsletterSubscribers").collect();
    return docs.map((d) => ({
      id: d.legacyId ?? d._id,
      email: d.email,
      source: d.source,
      status: d.status,
      subscribedAt: d.subscribedAt,
      unsubscribedAt: d.unsubscribedAt,
      tags: d.tags,
      firstName: d.firstName,
      lastName: d.lastName,
      promoCodeSent: d.promoCodeSent,
    }));
  },
});

export const listCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("newsletterCampaigns").collect();
    return docs.map((d) => ({
      id: d.legacyId ?? d._id,
      subject: d.subject,
      previewText: d.previewText,
      content: d.content,
      status: d.status,
      scheduledFor: d.scheduledFor,
      sentAt: d.sentAt,
      recipientCount: d.recipientCount,
      openCount: d.openCount,
      clickCount: d.clickCount,
      createdAt: d.createdAt,
      createdBy: d.createdBy,
      tags: d.tags,
    }));
  },
});

export const subscribe = mutation({
  args: {
    email: v.string(),
    source: v.string(),
    firstName: v.optional(v.string()),
  },
  handler: async (ctx, { email, source, firstName }) => {
    const normalized = email.toLowerCase();
    const existing = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    const now = Date.now();
    if (existing) {
      if (existing.status === "active") {
        return { success: false, message: "Already subscribed" };
      }
      await ctx.db.patch(existing._id, {
        status: "active",
        subscribedAt: now,
        unsubscribedAt: undefined,
        source,
        firstName,
      });
      return { success: true, message: "Welcome back!" };
    }
    await ctx.db.insert("newsletterSubscribers", {
      email: normalized,
      source,
      status: "active",
      subscribedAt: now,
      tags: [],
      firstName,
    });
    return { success: true, message: "Subscribed successfully" };
  },
});

export const unsubscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const doc = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();
    if (!doc) return false;
    await ctx.db.patch(doc._id, {
      status: "unsubscribed",
      unsubscribedAt: Date.now(),
    });
    return true;
  },
});

export const updateSubscriber = mutation({
  args: { id: v.string(), patch: v.any() },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const doc = await findSubscriber(ctx, id);
    if (!doc) throw new Error("Subscriber not found");
    await ctx.db.patch(doc._id, patch);
    return true;
  },
});

export const removeSubscriber = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findSubscriber(ctx, id);
    if (!doc) throw new Error("Subscriber not found");
    await ctx.db.delete(doc._id);
    return true;
  },
});

export const createCampaign = mutation({
  args: {
    subject: v.string(),
    previewText: v.string(),
    content: v.string(),
    status: v.string(),
    scheduledFor: v.optional(v.number()),
    recipientCount: v.number(),
    createdBy: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const _id = await ctx.db.insert("newsletterCampaigns", {
      ...args,
      openCount: 0,
      clickCount: 0,
      createdAt: Date.now(),
    });
    return _id;
  },
});

export const updateCampaign = mutation({
  args: { id: v.string(), patch: v.any() },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const doc = await findCampaign(ctx, id);
    if (!doc) throw new Error("Campaign not found");
    await ctx.db.patch(doc._id, patch);
    return true;
  },
});

export const removeCampaign = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findCampaign(ctx, id);
    if (!doc) throw new Error("Campaign not found");
    await ctx.db.delete(doc._id);
    return true;
  },
});
