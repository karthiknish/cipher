import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";
import {
  docToClientProduct,
  publicProductId,
  type ProductDoc,
} from "./lib/products";

const colorVariant = v.object({
  name: v.string(),
  hex: v.string(),
  image: v.string(),
  inStock: v.boolean(),
});

const sizeStock = v.object({
  size: v.string(),
  stock: v.number(),
});

const productFields = {
  name: v.string(),
  price: v.number(),
  comparePrice: v.optional(v.number()),
  category: v.string(),
  description: v.string(),
  shortDescription: v.optional(v.string()),
  image: v.string(),
  images: v.optional(v.array(v.string())),
  sizes: v.optional(v.array(v.string())),
  sizeStock: v.optional(v.array(sizeStock)),
  colors: v.optional(v.array(colorVariant)),
  inStock: v.optional(v.boolean()),
  sku: v.optional(v.string()),
  weight: v.optional(v.number()),
  material: v.optional(v.string()),
  careInstructions: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  featured: v.optional(v.boolean()),
  isNew: v.optional(v.boolean()),
};

type ProductCtx = QueryCtx | MutationCtx;

async function findProductByPublicId(
  ctx: ProductCtx,
  publicId: string
): Promise<ProductDoc | null> {
  const byLegacy = await ctx.db
    .query("products")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", publicId))
    .first();
  if (byLegacy) return byLegacy;

  try {
    return (await ctx.db.get(publicId as Id<"products">)) ?? null;
  } catch {
    return null;
  }
}

/** Live catalog for shop + admin (replaces Firestore onSnapshot). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("products")
      .withIndex("by_created_at")
      .order("desc")
      .collect();
    return docs.map(docToClientProduct);
  },
});

export const getByPublicId = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const doc = await findProductByPublicId(ctx, id);
    return doc ? docToClientProduct(doc) : null;
  },
});

export const create = mutation({
  args: productFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const _id = await ctx.db.insert("products", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(_id, { legacyId: _id });
    const doc = await ctx.db.get(_id);
    if (!doc) throw new Error("Failed to create product");
    return publicProductId(doc);
  },
});

const productPatch = v.object({
  name: v.optional(v.string()),
  price: v.optional(v.number()),
  comparePrice: v.optional(v.number()),
  category: v.optional(v.string()),
  description: v.optional(v.string()),
  shortDescription: v.optional(v.string()),
  image: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  sizes: v.optional(v.array(v.string())),
  sizeStock: v.optional(v.array(sizeStock)),
  colors: v.optional(v.array(colorVariant)),
  inStock: v.optional(v.boolean()),
  sku: v.optional(v.string()),
  weight: v.optional(v.number()),
  material: v.optional(v.string()),
  careInstructions: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  featured: v.optional(v.boolean()),
  isNew: v.optional(v.boolean()),
});

export const update = mutation({
  args: {
    id: v.string(),
    patch: productPatch,
  },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const doc = await findProductByPublicId(ctx, id);
    if (!doc) throw new Error("Product not found");
    await ctx.db.patch(doc._id, { ...patch, updatedAt: Date.now() });
    return true;
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findProductByPublicId(ctx, id);
    if (!doc) throw new Error("Product not found");
    await ctx.db.delete(doc._id);
    return true;
  },
});

/** Bulk import during Firestore → Convex migration (admin). */
export const importBatch = mutation({
  args: {
    products: v.array(
      v.object({
        legacyId: v.string(),
        ...productFields,
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { products }) => {
    await requireAdmin(ctx);
    const imported = await Promise.all(
      products.map(async (p) => {
        const existing = await ctx.db
          .query("products")
          .withIndex("by_legacy_id", (q) => q.eq("legacyId", p.legacyId))
          .first();
        const now = Date.now();
        const data = {
          legacyId: p.legacyId,
          name: p.name,
          price: p.price,
          comparePrice: p.comparePrice,
          category: p.category,
          description: p.description,
          shortDescription: p.shortDescription,
          image: p.image,
          images: p.images,
          sizes: p.sizes,
          sizeStock: p.sizeStock,
          colors: p.colors,
          inStock: p.inStock,
          sku: p.sku,
          weight: p.weight,
          material: p.material,
          careInstructions: p.careInstructions,
          tags: p.tags,
          featured: p.featured,
          isNew: p.isNew,
          createdAt: p.createdAt ?? now,
          updatedAt: p.updatedAt ?? now,
        };
        if (existing) {
          await ctx.db.patch(existing._id, data);
        } else {
          await ctx.db.insert("products", data);
        }
      })
    ).then(() => products.length);
    return { imported };
  },
});
