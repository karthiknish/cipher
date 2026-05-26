import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";

function publicId(doc: { _id: Id<"bundles">; legacyId?: string }) {
  return doc.legacyId ?? doc._id;
}

function docToBundle(doc: {
  _id: Id<"bundles">;
  legacyId?: string;
  name: string;
  description: string;
  tagline: string;
  image: string;
  productIds: string[];
  discountPercent: number;
  featured: boolean;
  category: string;
  createdAt: number;
}) {
  return {
    id: publicId(doc),
    name: doc.name,
    description: doc.description,
    tagline: doc.tagline,
    image: doc.image,
    productIds: doc.productIds,
    discountPercent: doc.discountPercent,
    featured: doc.featured,
    category: doc.category,
    createdAt: doc.createdAt,
  };
}

type BundleCtx = QueryCtx | MutationCtx;

async function findBundle(ctx: BundleCtx, id: string) {
  const byLegacy = await ctx.db
    .query("bundles")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
    .first();
  if (byLegacy) return byLegacy;
  try {
    return (await ctx.db.get(id as Id<"bundles">)) ?? null;
  } catch {
    return null;
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("bundles").collect();
    return docs.map(docToBundle);
  },
});

const bundleInput = {
  name: v.string(),
  description: v.string(),
  tagline: v.string(),
  image: v.string(),
  productIds: v.array(v.string()),
  discountPercent: v.number(),
  featured: v.boolean(),
  category: v.string(),
};

export const create = mutation({
  args: bundleInput,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const _id = await ctx.db.insert("bundles", {
      ...args,
      createdAt: Date.now(),
    });
    return publicId({ _id });
  },
});

export const update = mutation({
  args: { id: v.string(), patch: v.object(bundleInput) },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const doc = await findBundle(ctx, id);
    if (!doc) throw new Error("Bundle not found");
    await ctx.db.patch(doc._id, patch);
    return true;
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findBundle(ctx, id);
    if (!doc) throw new Error("Bundle not found");
    await ctx.db.delete(doc._id);
    return true;
  },
});
