import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";

function publicId(doc: { _id: Id<"promoCodes">; legacyId?: string; code: string }) {
  return doc.legacyId ?? doc.code;
}

function docToPromo(doc: {
  _id: Id<"promoCodes">;
  legacyId?: string;
  code: string;
  type: "percentage" | "fixed" | "freeShipping";
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  validUntil: number;
  usageLimit?: number;
  usedCount: number;
  description: string;
  applicableCategories?: string[];
}) {
  return {
    code: doc.code,
    type: doc.type,
    value: doc.value,
    minPurchase: doc.minPurchase,
    maxDiscount: doc.maxDiscount,
    validUntil: doc.validUntil,
    usageLimit: doc.usageLimit,
    usedCount: doc.usedCount,
    description: doc.description,
    applicableCategories: doc.applicableCategories,
    id: publicId(doc),
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("promoCodes").collect();
    return docs.map(docToPromo);
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const docs = await ctx.db.query("promoCodes").collect();
    const active = [];
    for (const d of docs) {
      if (d.validUntil > now) active.push(docToPromo(d));
    }
    return active;
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const doc = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();
    return doc ? docToPromo(doc) : null;
  },
});

const promoInput = {
  code: v.string(),
  type: v.union(
    v.literal("percentage"),
    v.literal("fixed"),
    v.literal("freeShipping")
  ),
  value: v.number(),
  minPurchase: v.number(),
  maxDiscount: v.optional(v.number()),
  validUntil: v.number(),
  usageLimit: v.optional(v.number()),
  description: v.string(),
  applicableCategories: v.optional(v.array(v.string())),
};

export const create = mutation({
  args: promoInput,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const code = args.code.toUpperCase();
    const existing = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (existing) throw new Error("Promo code already exists");
    const _id = await ctx.db.insert("promoCodes", {
      ...args,
      code,
      usedCount: 0,
      legacyId: code,
    });
    return _id;
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    patch: v.object(promoInput),
  },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const doc =
      (await ctx.db
        .query("promoCodes")
        .withIndex("by_code", (q) => q.eq("code", id.toUpperCase()))
        .first()) ??
      (await ctx.db
        .query("promoCodes")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
        .first());
    if (!doc) throw new Error("Promo not found");
    const code = patch.code.toUpperCase();
    await ctx.db.patch(doc._id, { ...patch, code });
    return true;
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc =
      (await ctx.db
        .query("promoCodes")
        .withIndex("by_code", (q) => q.eq("code", id.toUpperCase()))
        .first()) ??
      (await ctx.db
        .query("promoCodes")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
        .first());
    if (!doc) throw new Error("Promo not found");
    await ctx.db.delete(doc._id);
    return true;
  },
});

export const incrementUsage = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const doc = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();
    if (!doc) return;
    await ctx.db.patch(doc._id, { usedCount: doc.usedCount + 1 });
  },
});
