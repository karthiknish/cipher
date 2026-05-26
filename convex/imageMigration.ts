import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

function isLegacyFirebaseUrl(url: string): boolean {
  return (
    url.includes("firebasestorage.googleapis.com") ||
    url.includes("firebasestorage.app") ||
    (url.includes("storage.googleapis.com") && url.includes("cipher-c9c8b"))
  );
}

function collectFirebaseUrls(value: unknown, urls: Set<string>): void {
  if (typeof value === "string") {
    if (isLegacyFirebaseUrl(value)) urls.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectFirebaseUrls(item, urls);
    return;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectFirebaseUrls(nested, urls);
    }
  }
}

/** CLI-only: list documents that still reference Firebase Storage URLs. */
export const scanLegacyImageUrls = internalQuery({
  args: {},
  handler: async (ctx) => {
    const documents: Array<{
      table: string;
      id: string;
      patch: Record<string, unknown>;
    }> = [];
    const urls = new Set<string>();

    for (const p of await ctx.db.query("products").collect()) {
      const patch = {
        image: p.image,
        images: p.images,
        colors: p.colors,
      };
      const patchUrls = new Set<string>();
      collectFirebaseUrls(patch, patchUrls);
      if (patchUrls.size > 0) {
        documents.push({ table: "products", id: p._id, patch });
        for (const u of patchUrls) urls.add(u);
      }
    }

    for (const b of await ctx.db.query("blogs").collect()) {
      const patch = {
        coverImage: b.coverImage,
        author: b.author,
        content: b.content,
        excerpt: b.excerpt,
      };
      const patchUrls = new Set<string>();
      collectFirebaseUrls(patch, patchUrls);
      if (patchUrls.size > 0) {
        documents.push({ table: "blogs", id: b._id, patch });
        for (const u of patchUrls) urls.add(u);
      }
    }

    for (const bundle of await ctx.db.query("bundles").collect()) {
      const patch = { image: bundle.image };
      const patchUrls = new Set<string>();
      collectFirebaseUrls(patch, patchUrls);
      if (patchUrls.size > 0) {
        documents.push({ table: "bundles", id: bundle._id, patch });
        for (const u of patchUrls) urls.add(u);
      }
    }

    for (const e of await ctx.db.query("events").collect()) {
      const patch = { imageUrl: e.imageUrl };
      const patchUrls = new Set<string>();
      collectFirebaseUrls(patch, patchUrls);
      if (patchUrls.size > 0) {
        documents.push({ table: "events", id: e._id, patch });
        for (const u of patchUrls) urls.add(u);
      }
    }

    for (const s of await ctx.db.query("stores").collect()) {
      if (!s.imageUrl) continue;
      const patch = { imageUrl: s.imageUrl };
      const patchUrls = new Set<string>();
      collectFirebaseUrls(patch, patchUrls);
      if (patchUrls.size > 0) {
        documents.push({ table: "stores", id: s._id, patch });
        for (const u of patchUrls) urls.add(u);
      }
    }

    for (const r of await ctx.db.query("reviews").collect()) {
      const patch = { images: r.images, media: r.media };
      const patchUrls = new Set<string>();
      collectFirebaseUrls(patch, patchUrls);
      if (patchUrls.size > 0) {
        documents.push({ table: "reviews", id: r._id, patch });
        for (const u of patchUrls) urls.add(u);
      }
    }

    for (const a of await ctx.db.query("liveActivities").collect()) {
      if (!a.productImage) continue;
      const patch = { productImage: a.productImage };
      const patchUrls = new Set<string>();
      collectFirebaseUrls(patch, patchUrls);
      if (patchUrls.size > 0) {
        documents.push({ table: "liveActivities", id: a._id, patch });
        for (const u of patchUrls) urls.add(u);
      }
    }

    for (const i of await ctx.db.query("influencers").collect()) {
      const patch = { avatar: i.avatar, coverImage: i.coverImage };
      const patchUrls = new Set<string>();
      collectFirebaseUrls(patch, patchUrls);
      if (patchUrls.size > 0) {
        documents.push({ table: "influencers", id: i._id, patch });
        for (const u of patchUrls) urls.add(u);
      }
    }

    for (const c of await ctx.db.query("designContests").collect()) {
      const patch = { designA: c.designA, designB: c.designB };
      const patchUrls = new Set<string>();
      collectFirebaseUrls(patch, patchUrls);
      if (patchUrls.size > 0) {
        documents.push({ table: "designContests", id: c._id, patch });
        for (const u of patchUrls) urls.add(u);
      }
    }

    for (const w of await ctx.db.query("wishlists").collect()) {
      const patch = { items: w.items };
      const patchUrls = new Set<string>();
      collectFirebaseUrls(patch, patchUrls);
      if (patchUrls.size > 0) {
        documents.push({ table: "wishlists", id: w._id, patch });
        for (const u of patchUrls) urls.add(u);
      }
    }

    return {
      documents,
      urls: [...urls],
      documentCount: documents.length,
      urlCount: urls.size,
    };
  },
});

/** CLI-only: one-step upload URL for migration scripts. */
export const generateMigrationUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const getMigrationStorageUrl = internalMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Storage URL not available");
    return url;
  },
});

const tableName = v.union(
  v.literal("products"),
  v.literal("blogs"),
  v.literal("bundles"),
  v.literal("events"),
  v.literal("stores"),
  v.literal("reviews"),
  v.literal("liveActivities"),
  v.literal("influencers"),
  v.literal("designContests"),
  v.literal("wishlists")
);

/** CLI-only: patch a document after URLs were rewritten in the migration script. */
export const applyImagePatch = internalMutation({
  args: {
    table: tableName,
    id: v.string(),
    patch: v.any(),
  },
  handler: async (ctx, { table, id, patch }) => {
    const docId = id as Id<typeof table>;
    switch (table) {
      case "products": {
        const data = patch as {
          image?: string;
          images?: string[];
          colors?: Array<{
            name: string;
            hex: string;
            image: string;
            inStock: boolean;
          }>;
        };
        await ctx.db.patch(docId as Id<"products">, data);
        break;
      }
      case "blogs": {
        await ctx.db.patch(docId as Id<"blogs">, patch);
        break;
      }
      case "bundles": {
        await ctx.db.patch(docId as Id<"bundles">, patch);
        break;
      }
      case "events": {
        await ctx.db.patch(docId as Id<"events">, patch);
        break;
      }
      case "stores": {
        await ctx.db.patch(docId as Id<"stores">, patch);
        break;
      }
      case "reviews": {
        await ctx.db.patch(docId as Id<"reviews">, patch);
        break;
      }
      case "liveActivities": {
        await ctx.db.patch(docId as Id<"liveActivities">, patch);
        break;
      }
      case "influencers": {
        await ctx.db.patch(docId as Id<"influencers">, patch);
        break;
      }
      case "designContests": {
        await ctx.db.patch(docId as Id<"designContests">, patch);
        break;
      }
      case "wishlists": {
        await ctx.db.patch(docId as Id<"wishlists">, patch);
        break;
      }
      default: {
        const _exhaustive: never = table;
        throw new Error(`Unknown table: ${_exhaustive}`);
      }
    }
    return { ok: true };
  },
});
