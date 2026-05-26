import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { requireAdmin, requireIdentity } from "./lib/auth";

const orderItem = v.object({
  productId: v.string(),
  name: v.string(),
  price: v.number(),
  quantity: v.number(),
  size: v.string(),
  image: v.string(),
  color: v.optional(v.string()),
});

const shippingAddress = v.object({
  firstName: v.string(),
  lastName: v.string(),
  email: v.string(),
  phone: v.string(),
  street: v.string(),
  city: v.string(),
  state: v.string(),
  zip: v.string(),
  country: v.string(),
});

function publicOrderId(doc: { _id: Id<"orders">; legacyId?: string }) {
  return doc.legacyId ?? doc._id;
}

function docToClientOrder(doc: {
  _id: Id<"orders">;
  legacyId?: string;
  userId: string;
  userEmail?: string;
  items: unknown[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  shippingAddress: unknown;
  paymentMethod: string;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: publicOrderId(doc),
    userId: doc.userId,
    userEmail: doc.userEmail ?? "",
    items: doc.items,
    subtotal: doc.subtotal,
    shipping: doc.shipping,
    tax: doc.tax,
    total: doc.total,
    status: doc.status as
      | "pending"
      | "confirmed"
      | "processing"
      | "shipped"
      | "delivered"
      | "cancelled",
    shippingAddress: doc.shippingAddress,
    paymentMethod: doc.paymentMethod,
    createdAt:
      typeof doc.createdAt === "number" ? doc.createdAt : Date.parse(String(doc.createdAt)),
    updatedAt:
      typeof doc.updatedAt === "number" ? doc.updatedAt : Date.parse(String(doc.updatedAt)),
  };
}

type OrderCtx = QueryCtx | MutationCtx;

async function findOrderByPublicId(
  ctx: OrderCtx,
  publicId: string
): Promise<Doc<"orders"> | null> {
  const byLegacy = await ctx.db
    .query("orders")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", publicId))
    .first();
  if (byLegacy) return byLegacy;
  try {
    return (await ctx.db.get(publicId as Id<"orders">)) ?? null;
  } catch {
    return null;
  }
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const docs = await ctx.db
      .query("orders")
      .withIndex("by_user_created", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    return docs.map(docToClientOrder);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const email = identity.email?.toLowerCase();
    const ADMIN_EMAILS = new Set(["karthik.nishanth06@gmail.com"]);
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", identity.subject))
      .first();
    const isAdmin =
      (email && ADMIN_EMAILS.has(email)) || user?.role === "admin";
    if (!isAdmin) return [];

    const docs = await ctx.db
      .query("orders")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    return docs.map(docToClientOrder);
  },
});

export const create = mutation({
  args: {
    items: v.array(orderItem),
    subtotal: v.number(),
    shipping: v.number(),
    tax: v.number(),
    total: v.number(),
    status: v.string(),
    shippingAddress: shippingAddress,
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const now = Date.now();
    const _id = await ctx.db.insert("orders", {
      userId: identity.subject,
      userEmail: identity.email,
      items: args.items,
      subtotal: args.subtotal,
      shipping: args.shipping,
      tax: args.tax,
      total: args.total,
      status: args.status,
      shippingAddress: args.shippingAddress,
      paymentMethod: args.paymentMethod,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(_id, { legacyId: _id });
    return publicOrderId({ _id, legacyId: _id });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.string(),
    status: v.string(),
  },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx);
    const doc = await findOrderByPublicId(ctx, id);
    if (!doc) throw new Error("Order not found");
    await ctx.db.patch(doc._id, { status, updatedAt: Date.now() });
    return true;
  },
});

export const importBatch = mutation({
  args: {
    orders: v.array(
      v.object({
        legacyId: v.string(),
        userId: v.string(),
        userEmail: v.optional(v.string()),
        items: v.array(v.any()),
        subtotal: v.number(),
        shipping: v.number(),
        tax: v.number(),
        total: v.number(),
        status: v.string(),
        shippingAddress: v.any(),
        paymentMethod: v.string(),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { orders }) => {
    await requireAdmin(ctx);
    const imported = await Promise.all(
      orders.map(async (o) => {
        const existing = await ctx.db
          .query("orders")
          .withIndex("by_legacy_id", (q) => q.eq("legacyId", o.legacyId))
          .first();
        const now = Date.now();
        const data = {
          legacyId: o.legacyId,
          userId: o.userId,
          userEmail: o.userEmail,
          items: o.items,
          subtotal: o.subtotal,
          shipping: o.shipping,
          tax: o.tax,
          total: o.total,
          status: o.status,
          shippingAddress: o.shippingAddress,
          paymentMethod: o.paymentMethod,
          createdAt: o.createdAt ?? now,
          updatedAt: o.updatedAt ?? now,
        };
        if (existing) {
          await ctx.db.patch(existing._id, data);
        } else {
          await ctx.db.insert("orders", data);
        }
      })
    ).then(() => orders.length);
    return { imported };
  },
});
