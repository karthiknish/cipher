import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";

function publicId(doc: { _id: Id<"blogs">; legacyId?: string }) {
  return doc.legacyId ?? doc._id;
}

function docToBlog(doc: {
  _id: Id<"blogs">;
  legacyId?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: { name: string; avatar: string };
  status: "draft" | "published" | "scheduled";
  published: boolean;
  publishedAt?: number;
  scheduledFor?: number;
  readTime: number;
  views: number;
  likes: number;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: publicId(doc),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    content: doc.content,
    coverImage: doc.coverImage,
    category: doc.category,
    tags: doc.tags,
    author: doc.author,
    status: doc.status,
    publishedAt: doc.publishedAt ?? null,
    scheduledFor: doc.scheduledFor ?? null,
    readTime: doc.readTime,
    views: doc.views,
    likes: doc.likes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

type BlogCtx = QueryCtx | MutationCtx;

async function findBlog(ctx: BlogCtx, id: string) {
  const byLegacy = await ctx.db
    .query("blogs")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
    .first();
  if (byLegacy) return byLegacy;
  try {
    return (await ctx.db.get(id as Id<"blogs">)) ?? null;
  } catch {
    return null;
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("blogs")
      .withIndex("by_created_at")
      .order("desc")
      .collect();
    return docs.map(docToBlog);
  },
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("blogs").collect();
    return docs
      .filter((d) => d.status === "published")
      .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt))
      .map(docToBlog);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const doc = await ctx.db
      .query("blogs")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    return doc ? docToBlog(doc) : null;
  },
});

const blogInput = {
  title: v.string(),
  slug: v.string(),
  excerpt: v.string(),
  content: v.string(),
  coverImage: v.string(),
  category: v.string(),
  tags: v.array(v.string()),
  author: v.object({ name: v.string(), avatar: v.string() }),
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("scheduled")
  ),
  publishedAt: v.union(v.number(), v.null()),
  scheduledFor: v.union(v.number(), v.null()),
  readTime: v.number(),
};

export const create = mutation({
  args: blogInput,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const published = args.status === "published";
    const _id = await ctx.db.insert("blogs", {
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      content: args.content,
      coverImage: args.coverImage,
      category: args.category,
      tags: args.tags,
      author: args.author,
      status: args.status,
      published,
      publishedAt: args.publishedAt ?? undefined,
      scheduledFor: args.scheduledFor ?? undefined,
      readTime: args.readTime,
      views: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(_id, { legacyId: _id });
    const doc = await ctx.db.get(_id);
    if (!doc) throw new Error("Failed to create blog");
    return publicId(doc);
  },
});

const blogPatch = v.object({
  title: v.optional(v.string()),
  slug: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  content: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  category: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  author: v.optional(v.object({ name: v.string(), avatar: v.string() })),
  status: v.optional(
    v.union(v.literal("draft"), v.literal("published"), v.literal("scheduled"))
  ),
  publishedAt: v.optional(v.union(v.number(), v.null())),
  scheduledFor: v.optional(v.union(v.number(), v.null())),
  readTime: v.optional(v.number()),
  views: v.optional(v.number()),
  likes: v.optional(v.number()),
});

export const update = mutation({
  args: { id: v.string(), patch: blogPatch },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const doc = await findBlog(ctx, id);
    if (!doc) throw new Error("Blog not found");
    const published =
      patch.status !== undefined
        ? patch.status === "published"
        : doc.published;
    await ctx.db.patch(doc._id, {
      ...patch,
      published,
      publishedAt:
        patch.publishedAt === null
          ? undefined
          : patch.publishedAt ?? doc.publishedAt,
      scheduledFor:
        patch.scheduledFor === null
          ? undefined
          : patch.scheduledFor ?? doc.scheduledFor,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const publish = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findBlog(ctx, id);
    if (!doc) throw new Error("Blog not found");
    await ctx.db.patch(doc._id, {
      status: "published",
      published: true,
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const unpublish = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findBlog(ctx, id);
    if (!doc) throw new Error("Blog not found");
    await ctx.db.patch(doc._id, {
      status: "draft",
      published: false,
      publishedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findBlog(ctx, id);
    if (!doc) throw new Error("Blog not found");
    await ctx.db.delete(doc._id);
    return true;
  },
});

export const incrementViews = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const doc = await findBlog(ctx, id);
    if (!doc) return;
    await ctx.db.patch(doc._id, { views: doc.views + 1 });
  },
});

export const incrementLikes = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const doc = await findBlog(ctx, id);
    if (!doc) return;
    await ctx.db.patch(doc._id, { likes: doc.likes + 1 });
  },
});
