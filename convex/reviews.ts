import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { isAdmin, requireIdentity } from "./lib/auth";

type Ctx = QueryCtx | MutationCtx;

async function findReview(ctx: Ctx, id: string) {
  const byLegacy = await ctx.db
    .query("reviews")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
    .first();
  if (byLegacy) return byLegacy;
  try {
    return (await ctx.db.get(id as Id<"reviews">)) ?? null;
  } catch {
    return null;
  }
}

function publicId(doc: { _id: Id<"reviews">; legacyId?: string }) {
  return doc.legacyId ?? doc._id;
}

function docToReview(doc: {
  _id: Id<"reviews">;
  legacyId?: string;
  productId: string;
  userId: string;
  userEmail: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  media?: unknown[];
  images?: string[];
  verifiedPurchase: boolean;
  helpful: number;
  notHelpful: number;
  adminReply?: unknown;
  featured: boolean;
  status: string;
  createdAt: number;
  updatedAt?: number;
}) {
  return {
    id: publicId(doc),
    productId: doc.productId,
    userId: doc.userId,
    userEmail: doc.userEmail,
    userName: doc.userName,
    rating: doc.rating,
    title: doc.title,
    comment: doc.comment,
    media: doc.media,
    images: doc.images,
    verifiedPurchase: doc.verifiedPurchase,
    helpful: doc.helpful,
    notHelpful: doc.notHelpful,
    adminReply: doc.adminReply,
    featured: doc.featured,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const listByProduct = query({
  args: { productId: v.string() },
  handler: async (ctx, { productId }) => {
    const [admin, docs] = await Promise.all([
      isAdmin(ctx),
      ctx.db
        .query("reviews")
        .withIndex("by_product", (q) => q.eq("productId", productId))
        .collect(),
    ]);
    const result = [];
    for (const d of docs) {
      if (admin || d.status === "approved") result.push(docToReview(d));
    }
    return result;
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const docs = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    return docs.map(docToReview);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("reviews").collect();
    return docs.map(docToReview);
  },
});

export const canUserReview = query({
  args: { productId: v.string() },
  handler: async (ctx, { productId }) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    if (existing.some((r) => r.productId === productId)) return false;
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    return orders.some((o) =>
      (o.items as { productId?: string }[]).some(
        (i) => i.productId === productId
      )
    );
  },
});

export const create = mutation({
  args: {
    productId: v.string(),
    rating: v.number(),
    title: v.string(),
    comment: v.string(),
    media: v.optional(v.array(v.any())),
    images: v.optional(v.array(v.string())),
    verifiedPurchase: v.boolean(),
    userEmail: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const now = Date.now();
    const _id = await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: identity.subject,
      userEmail: args.userEmail,
      userName: args.userName,
      rating: args.rating,
      title: args.title,
      comment: args.comment,
      media: args.media,
      images: args.images,
      verifiedPurchase: args.verifiedPurchase,
      helpful: 0,
      notHelpful: 0,
      featured: false,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    return publicId({ _id, legacyId: undefined });
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    patch: v.object({
      rating: v.optional(v.number()),
      title: v.optional(v.string()),
      comment: v.optional(v.string()),
      media: v.optional(v.array(v.any())),
    }),
  },
  handler: async (ctx, { id, patch }) => {
    const [identity, doc] = await Promise.all([requireIdentity(ctx), findReview(ctx, id)]);
    if (!doc || doc.userId !== identity.subject) throw new Error("Not found");
    await ctx.db.patch(doc._id, { ...patch, updatedAt: Date.now() });
    return true;
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const [identity, doc, admin] = await Promise.all([
      requireIdentity(ctx),
      findReview(ctx, id),
      isAdmin(ctx),
    ]);
    if (!doc) throw new Error("Not found");
    if (!admin && doc.userId !== identity.subject) throw new Error("Forbidden");
    await ctx.db.delete(doc._id);
    return true;
  },
});

export const vote = mutation({
  args: {
    reviewId: v.string(),
    isHelpful: v.boolean(),
  },
  handler: async (ctx, { reviewId, isHelpful }) => {
    const [identity, review] = await Promise.all([
      requireIdentity(ctx),
      findReview(ctx, reviewId),
    ]);
    if (!review) throw new Error("Review not found");
    const existing = await ctx.db
      .query("reviewVotes")
      .withIndex("by_user_review", (q) =>
        q.eq("userId", identity.subject).eq("reviewId", reviewId)
      )
      .first();
    let helpful = review.helpful;
    let notHelpful = review.notHelpful;
    if (existing) {
      if (existing.vote === "helpful") helpful--;
      else notHelpful--;
      await ctx.db.delete(existing._id);
    }
    const vote = isHelpful ? "helpful" : "not-helpful";
    await ctx.db.insert("reviewVotes", {
      userId: identity.subject,
      reviewId,
      vote,
    });
    if (isHelpful) helpful++;
    else notHelpful++;
    await ctx.db.patch(review._id, { helpful, notHelpful });
    return true;
  },
});

export const getUserVote = query({
  args: { reviewId: v.string() },
  handler: async (ctx, { reviewId }) => {
    const identity = await requireIdentity(ctx);
    const vote = await ctx.db
      .query("reviewVotes")
      .withIndex("by_user_review", (q) =>
        q.eq("userId", identity.subject).eq("reviewId", reviewId)
      )
      .first();
    if (!vote) return null;
    return vote.vote === "helpful" ? "helpful" : "not-helpful";
  },
});

export const moderate = mutation({
  args: {
    id: v.string(),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, { id, status }) => {
    const doc = await findReview(ctx, id);
    if (!doc) throw new Error("Not found");
    await ctx.db.patch(doc._id, { status, updatedAt: Date.now() });
    return true;
  },
});

export const setAdminReply = mutation({
  args: { id: v.string(), content: v.string(), authorName: v.string() },
  handler: async (ctx, { id, content, authorName }) => {
    const doc = await findReview(ctx, id);
    if (!doc) throw new Error("Not found");
    await ctx.db.patch(doc._id, {
      adminReply: {
        id: `reply-${Date.now()}`,
        content,
        authorName,
        createdAt: Date.now(),
      },
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const clearAdminReply = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const doc = await findReview(ctx, id);
    if (!doc) throw new Error("Not found");
    await ctx.db.patch(doc._id, { adminReply: undefined, updatedAt: Date.now() });
    return true;
  },
});

export const setFeatured = mutation({
  args: { id: v.string(), featured: v.boolean() },
  handler: async (ctx, { id, featured }) => {
    const doc = await findReview(ctx, id);
    if (!doc) throw new Error("Not found");
    await ctx.db.patch(doc._id, { featured, updatedAt: Date.now() });
    return true;
  },
});
