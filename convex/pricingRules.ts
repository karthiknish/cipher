import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";

type Ctx = QueryCtx | MutationCtx;

async function findRule(ctx: Ctx, id: string) {
  const byLegacy = await ctx.db
    .query("pricingRules")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
    .first();
  if (byLegacy) return byLegacy;
  try {
    return (await ctx.db.get(id as Id<"pricingRules">)) ?? null;
  } catch {
    return null;
  }
}

function docToRule(doc: {
  _id: Id<"pricingRules">;
  legacyId?: string;
  type: string;
  productId?: string;
  category?: string;
  discountPercent?: number;
  discountAmount?: number;
  multiplier?: number;
  minQuantity?: number;
  startTime?: number;
  endTime?: number;
  isActive: boolean;
  priority: number;
  conditions?: unknown;
}) {
  return {
    id: doc.legacyId ?? doc._id,
    type: doc.type,
    productId: doc.productId,
    category: doc.category,
    discountPercent: doc.discountPercent,
    discountAmount: doc.discountAmount,
    multiplier: doc.multiplier,
    minQuantity: doc.minQuantity,
    startTime: doc.startTime,
    endTime: doc.endTime,
    isActive: doc.isActive,
    priority: doc.priority,
    conditions: doc.conditions,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("pricingRules").collect();
    return docs
      .map(docToRule)
      .sort((a, b) => b.priority - a.priority);
  },
});

const ruleInput = {
  type: v.string(),
  productId: v.optional(v.string()),
  category: v.optional(v.string()),
  discountPercent: v.optional(v.number()),
  discountAmount: v.optional(v.number()),
  multiplier: v.optional(v.number()),
  minQuantity: v.optional(v.number()),
  startTime: v.optional(v.number()),
  endTime: v.optional(v.number()),
  isActive: v.boolean(),
  priority: v.number(),
  conditions: v.optional(v.any()),
};

export const create = mutation({
  args: ruleInput,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const _id = await ctx.db.insert("pricingRules", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return _id;
  },
});

export const update = mutation({
  args: { id: v.string(), patch: v.object(ruleInput) },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const doc = await findRule(ctx, id);
    if (!doc) throw new Error("Rule not found");
    await ctx.db.patch(doc._id, { ...patch, updatedAt: Date.now() });
    return true;
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findRule(ctx, id);
    if (!doc) throw new Error("Rule not found");
    await ctx.db.delete(doc._id);
    return true;
  },
});

export const toggle = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findRule(ctx, id);
    if (!doc) throw new Error("Rule not found");
    await ctx.db.patch(doc._id, {
      isActive: !doc.isActive,
      updatedAt: Date.now(),
    });
    return true;
  },
});
